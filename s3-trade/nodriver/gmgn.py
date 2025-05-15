import nodriver as uc
import asyncio
import sqlite3
import re
import logging
from typing import List, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def close_modals(tab: uc.Tab) -> bool:
    """Close modals until the traders table is visible."""
    max_clicks = 6
    click_count = 0

    # Close .css-pt4g3d modal if present
    try:
        first_modal = await tab.select('.css-pt4g3d')
        if first_modal:
            await first_modal.click()
            await asyncio.sleep(1)
            logger.info('Closed .css-pt4g3d modal')
    except Exception as e:
        logger.debug(f'No .css-pt4g3d modal found or error: {e}')

    # Click button.pi-btn:nth-child(2) until table is visible or max clicks reached
    while click_count < max_clicks:
        try:
            table = await tab.select('table')
            if table:
                logger.info('Table is visible')
                return True
            second_modal_button = await tab.select('button.pi-btn:nth-child(2)')
            if second_modal_button:
                await second_modal_button.click()
                logger.info(f'Clicked pi-btn modal ({click_count + 1}/{max_clicks})')
                await asyncio.sleep(1)
                click_count += 1
            else:
                logger.info('pi-btn button not found')
                break
        except Exception as e:
            logger.debug(f'Error during modal closure: {e}')
            break

    logger.error('Table not visible after closing modals')
    return False

async def extract_traders(tab: uc.Tab) -> List[str]:
    """Extract Solana trader addresses from the table."""
    try:
        await tab.wait_for('table', timeout=10000)
        table_content = await tab.evaluate('''() => {
            const tables = document.querySelectorAll('table');
            return Array.from(tables).map(table => table.outerHTML);
        }''')
        if table_content is None:
            logger.error('Table content evaluation returned None')
            return []
        logger.debug(f'Table content: {table_content}')

        traders = await tab.evaluate('''() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows.map(row => {
                const addressCell = row.querySelector('td:first-child');
                return addressCell ? addressCell.textContent.trim() : null;
            }).filter(address => address && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address));
        }''')
        if traders is None:
            logger.error('Trader evaluation returned None')
            return []
        logger.info(f'Extracted {len(traders)} trader addresses')
        return traders
    except Exception as e:
        logger.error(f'Error extracting traders: {e}', exc_info=True)
        return []

def save_traders_to_db(traders: List[str], db_path: str = 'traders.db'):
    """Save trader addresses to SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS traders (
                address TEXT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        for address in traders:
            cursor.execute('INSERT OR IGNORE INTO traders (address) VALUES (?)', (address,))
        conn.commit()
        logger.info(f'Saved {len(traders)} trader addresses to database')
    except sqlite3.Error as e:
        logger.error(f'Database error: {e}')
    finally:
        conn.close()
        logger.info('Closed database')

async def capture_xhr_url(tab: uc.Tab) -> Optional[str]:
    """Capture the XHR URL used to fetch table data using request interception."""
    xhr_urls = []

    async def on_intercept(request):
        if request.resource_type in ('xhr', 'fetch'):
            xhr_urls.append(request.url)
            logger.debug(f'Captured XHR/fetch request: {request.url}')
            await request.continue_request()

    # Enable request interception
    try:
        logger.info('Enabling network interception')
        await tab.send(uc.cdp.network.enable())
        tab.intercept = on_intercept

        # Wait for table and extend wait for network requests
        await tab.wait_for('table', timeout=10000)
        logger.info('Table visible, waiting for XHR requests')
        await asyncio.sleep(15)  # Wait for at least one 12-second cycle

        # Fallback: Use JavaScript to capture requests and responses
        if not xhr_urls:
            logger.debug('No XHR URLs captured via interception, trying JavaScript fallback')
            network_data = await tab.evaluate('''() => {
                const requests = [];
                const originalFetch = window.fetch;
                window.fetch = async (...args) => {
                    const response = await originalFetch.apply(window, args);
                    try {
                        const cloned = response.clone();
                        const json = await cloned.json();
                        requests.push({ url: args[0], response: JSON.stringify(json) });
                    } catch (e) {
                        requests.push({ url: args[0], response: null });
                    }
                    return response;
                };
                const originalXhrOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {
                    const xhr = this;
                    xhr.addEventListener('load', () => {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            requests.push({ url: url, response: JSON.stringify(json) });
                        } catch (e) {
                            requests.push({ url: url, response: null });
                        }
                    });
                    return originalXhrOpen.apply(this, arguments);
                };
                return new Promise(resolve => setTimeout(() => resolve(requests), 15000));
            }''')
            if network_data is None:
                logger.error('JavaScript evaluation for network requests returned None')
                return None

            for item in network_data:
                if isinstance(item, dict) and 'url' in item and 'response' in item:
                    url = item['url']
                    response = item.get('response')
                    xhr_urls.append(url)
                    logger.debug(f'JS captured request: {url}')
                    # Check if response contains trader-like data
                    if response:
                        try:
                            json_data = eval(response)  # Safely parse JSON string
                            if isinstance(json_data, (list, dict)) and any(
                                isinstance(v, str) and re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', v)
                                for v in json_data.values() if isinstance(json_data, dict)
                                or v for v in json_data if isinstance(json_data, list)
                            ):
                                logger.info(f'Found trader data in response for URL: {url}')
                                return url
                        except Exception as e:
                            logger.debug(f'Error parsing response for {url}: {e}')

        # Filter for likely table data URLs if no trader data found
        for url in xhr_urls:
            if any(keyword in url.lower() for keyword in ['api', 'traders', 'trade']):
                logger.info(f'Likely table data XHR URL (keyword match): {url}')
                return url
        logger.warning(f'No relevant XHR URL found. Captured URLs: {xhr_urls}')
        return None
    except Exception as e:
        logger.error(f'Error in capture_xhr_url: {e}', exc_info=True)
        return None
    finally:
        try:
            await tab.send(uc.cdp.network.disable())
        except Exception as e:
            logger.debug(f'Error disabling network interception: {e}')

async def main():
    """Main function to orchestrate the scraping process."""
    browser = None
    tab = None
    
    try:
        logger.info('Starting Nodriver browser...')
        browser = await uc.start()
        
        logger.info('Navigating to gmgn.ai...')
        max_retries = 3
        for attempt in range(max_retries):
            try:
                tab = await browser.get('https://gmgn.ai/trade?chain=sol')
                await asyncio.sleep(2)  # Wait for page stabilization
                logger.info('Navigation successful')
                break
            except Exception as e:
                logger.warning(f'Navigation attempt {attempt + 1}/{max_retries} failed: {e}')
                if attempt == max_retries - 1:
                    raise Exception(f'Navigation failed after {max_retries} attempts')
                await asyncio.sleep(2)
        
        # Close modals and check if table is visible
        table_visible = await close_modals(tab)
        if not table_visible:
            raise Exception('Failed to make table visible')
        
        # Capture XHR URL
        xhr_url = await capture_xhr_url(tab)
        if xhr_url:
            logger.info(f'Found XHR URL for table data: {xhr_url}')
        else:
            logger.warning('Could not identify XHR URL for table data')
        
        # Extract and save trader addresses
        traders = await extract_traders(tab)
        if traders:
            save_traders_to_db(traders)
        else:
            logger.warning('No trader addresses extracted')
    
    except Exception as e:
        logger.error(f'Script failed: {e}', exc_info=True)
    
    finally:
        if tab:
            await tab.close()
            logger.info('Closed tab')
        if browser is not None:
            await browser.stop()
            logger.info('Closed browser')

if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main())
    finally:
        loop.run_until_complete(loop.shutdown_asyncgens())
        loop.close()