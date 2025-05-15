import nodriver as uc
import asyncio
import sqlite3
import re
import logging
from typing import List, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def close_modals(page: uc.Page) -> bool:
    """Close modals until the traders table is visible."""
    max_clicks = 6
    click_count = 0

    # Close .css-pt4g3d modal if present
    try:
        first_modal = await page.select('.css-pt4g3d')
        if first_modal:
            await first_modal.click()
            await asyncio.sleep(1)
            logger.info('Closed .css-pt4g3d modal')
    except Exception as e:
        logger.debug(f'No .css-pt4g3d modal found or error: {e}')

    # Click button.pi-btn:nth-child(2) until table is visible or max clicks reached
    while click_count < max_clicks:
        try:
            table = await page.select('table')
            if table:
                logger.info('Table is visible')
                return True
            second_modal_button = await page.select('button.pi-btn:nth-child(2)')
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

async def extract_traders(page: uc.Page) -> List[str]:
    """Extract Solana trader addresses from the table."""
    try:
        await page.wait_for('table', timeout=10000)
        traders = await page.evaluate('''() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows.map(row => {
                const addressCell = row.querySelector('td:first-child');
                return addressCell ? addressCell.textContent.trim() : null;
            }).filter(address => address && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address));
        }''')
        return traders
    except Exception as e:
        logger.error(f'Error extracting traders: {e}')
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

async def capture_xhr_url(page: uc.Page) -> Optional[str]:
    """Capture the XHR URL used to fetch table data."""
    xhr_urls = []
    
    def on_request(event):
        if event.resource_type == 'xhr':
            xhr_urls.append(event.url)
            logger.debug(f'Captured XHR request: {event.url}')
    
    page.on('request', on_request)
    
    # Wait for table to ensure XHR requests related to table data are captured
    try:
        await page.wait_for('table', timeout=10000)
        await asyncio.sleep(2)  # Additional wait to capture late XHRs
        # Filter for likely table data URLs (e.g., containing 'api', 'traders', or similar)
        for url in xhr_urls:
            if 'api' in url.lower() or 'traders' in url.lower():
                logger.info(f'Likely table data XHR URL: {url}')
                return url
        logger.warning('No relevant XHR URL found')
        return None
    except Exception as e:
        logger.error(f'Error capturing XHR URL: {e}')
        return None

async def main():
    """Main function to orchestrate the scraping process."""
    browser = None
    page = None
    
    try:
        logger.info('Starting Nodriver browser...')
        browser = await uc.start()
        
        logger.info('Navigating to gmgn.ai...')
        max_retries = 3
        for attempt in range(max_retries):
            try:
                page = await browser.get('https://gmgn.ai/trade?chain=sol')
                await asyncio.sleep(2)  # Wait for page stabilization
                logger.info('Navigation successful')
                break
            except Exception as e:
                logger.warning(f'Navigation attempt {attempt + 1}/{max_retries} failed: {e}')
                if attempt == max_retries - 1:
                    raise Exception(f'Navigation failed after {max_retries} attempts')
                await asyncio.sleep(2)
        
        # Close modals and check if table is visible
        table_visible = await close_modals(page)
        if not table_visible:
            raise Exception('Failed to make table visible')
        
        # Capture XHR URL
        xhr_url = await capture_xhr_url(page)
        if xhr_url:
            logger.info(f'Found XHR URL for table data: {xhr_url}')
        else:
            logger.warning('Could not identify XHR URL for table data')
        
        # Extract and save trader addresses
        traders = await extract_traders(page)
        if traders:
            save_traders_to_db(traders)
        else:
            logger.warning('No trader addresses extracted')
    
    except Exception as e:
        logger.error(f'Script failed: {e}', exc_info=True)
    
    finally:
        if page:
            await page.close()
            logger.info('Closed page')
        if browser:
            await browser.stop()
            logger.info('Closed browser')

if __name__ == '__main__':
    asyncio.run(main())