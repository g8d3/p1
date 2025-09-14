import streamlit as st
import pandas as pd
from datetime import datetime
import re
import traceback
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import NoSuchWindowException, WebDriverException

# Function to get driver attached to CDP
@st.cache_resource
def get_driver(debugger_address='127.0.0.1:9222'):
    try:
        service = Service(ChromeDriverManager().install())
        options = Options()
        options.add_experimental_option("debuggerAddress", debugger_address)
        driver = webdriver.Chrome(service=service, options=options)
        # Ensure at least one window is open
        if not driver.window_handles:
            driver.execute_script("window.open('about:blank');")
        driver.original_window = driver.window_handles[0]
        st.write(f"Connected to CDP. Original window handle: {driver.original_window}")
        return driver
    except Exception as e:
        st.error(f"Failed to connect to CDP: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        st.error("Ensure Chrome is running with --remote-debugging-port=9222 and at least one tab is open. See instructions below.")
        return None

# Function to fetch page content using CDP
def fetch_page_content(url, timeout=10):
    driver = get_driver()
    if not driver:
        return None
    try:
        # Check if there are any open windows
        if not driver.window_handles:
            st.error("No browser windows available. Please ensure Chrome is open with a tab.")
            return None
        
        # Store current window handles
        initial_windows = set(driver.window_handles)
        st.write(f"Opening new tab for {url}")
        
        # Open a new tab
        driver.execute_script("window.open('about:blank');")
        new_tab = driver.window_handles[-1]
        driver.switch_to.window(new_tab)
        st.write(f"Switched to new tab: {new_tab}")
        
        # Navigate to the URL in the new tab
        driver.get(url)
        WebDriverWait(driver, timeout).until(EC.visibility_of_element_located((By.TAG_NAME, "body")))
        content = driver.page_source
        
        # Close only the new tab
        driver.close()
        st.write(f"Closed scraping tab: {new_tab}")
        
        # Switch back to the original tab
        try:
            driver.switch_to.window(driver.original_window)
            st.write(f"Switched back to original tab: {driver.original_window}")
        except NoSuchWindowException:
            st.error("Original tab was closed. Switching to first available tab.")
            if driver.window_handles:
                driver.original_window = driver.window_handles[0]
                driver.switch_to.window(driver.original_window)
                st.write(f"New original tab: {driver.original_window}")
            else:
                st.error("No tabs available. Opening a new tab.")
                driver.execute_script("window.open('about:blank');")
                driver.original_window = driver.window_handles[0]
                driver.switch_to.window(driver.original_window)
        
        return content
    except NoSuchWindowException as e:
        st.error(f"Browser window closed unexpectedly: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None
    except WebDriverException as e:
        st.error(f"WebDriver error: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None
    except Exception as e:
        st.error(f"Failed to fetch page {url}: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None
    finally:
        # Ensure we only close the new tab if it still exists
        try:
            current_windows = set(driver.window_handles)
            new_tabs = current_windows - initial_windows
            for tab in new_tabs:
                if tab != driver.original_window:
                    driver.switch_to.window(tab)
                    driver.close()
            if driver.window_handles and driver.current_window_handle != driver.original_window:
                driver.switch_to.window(driver.original_window)
        except:
            pass

# Function to fetch and parse the trending page
def scrape_trending(url):
    try:
        content = fetch_page_content(url)
        if not content:
            raise ValueError("No content fetched from trending page")
        soup = BeautifulSoup(content, 'html.parser')
        table = soup.find('table')
        if not table:
            raise ValueError("No table found on trending page")
        headers = [th.text.strip() for th in table.find('thead').find_all('th')]
        rows = []
        for tr in table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            row = [cell.text.strip() for cell in cells]
            coin_link = tr.find('a', href=re.compile(r'/en/coins/'))
            if coin_link:
                row.append('https://www.coingecko.com' + coin_link['href'])
            else:
                row.append(None)
            rows.append(row)
        headers.append('Link')
        df = pd.DataFrame(rows, columns=headers)
        return df
    except Exception as e:
        st.error(f"Failed to scrape trending page: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None

# Function to scrape gainers and losers
def scrape_gainers_losers(url):
    try:
        content = fetch_page_content(url)
        if not content:
            raise ValueError("No content fetched from gainers/losers page")
        soup = BeautifulSoup(content, 'html.parser')
        tables = soup.find_all('table')
        if len(tables) < 2:
            raise ValueError("Expected at least two tables for gainers and losers")
        
        # Gainers table
        gainers_table = tables[0]
        gainers_headers = [th.text.strip() for th in gainers_table.find('thead').find_all('th')]
        gainers_rows = []
        for tr in gainers_table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            row = [cell.text.strip() for cell in cells]
            name_td = cells[1] if len(cells) > 1 else None
            if name_td:
                coin_link = name_td.find('a', href=re.compile(r'/en/coins/'))
                if coin_link:
                    row.append('https://www.coingecko.com' + coin_link['href'])
                else:
                    row.append(None)
            else:
                row.append(None)
            gainers_rows.append(row)
        gainers_headers.append('Link')
        gainers_df = pd.DataFrame(gainers_rows, columns=gainers_headers)
        
        # Losers table
        losers_table = tables[1]
        losers_headers = [th.text.strip() for th in losers_table.find('thead').find_all('th')]
        losers_rows = []
        for tr in losers_table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            row = [cell.text.strip() for cell in cells]
            name_td = cells[1] if len(cells) > 1 else None
            if name_td:
                coin_link = name_td.find('a', href=re.compile(r'/en/coins/'))
                if coin_link:
                    row.append('https://www.coingecko.com' + coin_link['href'])
                else:
                    row.append(None)
            else:
                row.append(None)
            losers_rows.append(row)
        losers_headers.append('Link')
        losers_df = pd.DataFrame(losers_rows, columns=losers_headers)
        
        return gainers_df, losers_df
    except Exception as e:
        st.error(f"Failed to scrape gainers/losers: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None, None

# Function to extract metrics from coin page
def extract_metrics(soup):
    try:
        metrics = {}
        stats_table = soup.select_one('#gecko-coin-page-container > div[class*="2lg:tw-row-span-2"] > div:nth-child(2) > table')
        if stats_table:
            for i, tr in enumerate(stats_table.find('tbody').find_all('tr'), start=1):
                th = tr.find('th')
                td = tr.find('td')
                if th and td:
                    label = th.text.strip()
                    value = td.text.strip()
                    metrics[label] = value
        
        contract_div = soup.select_one('#gecko-coin-page-container > div[class*="2lg:tw-row-span-2"] > div.tw-relative[class*="2lg:tw-mb-6"] > div:nth-child(1) > div.tw-my-auto')
        if contract_div:
            metrics['Contract'] = contract_div.text.strip()
        
        return metrics
    except Exception as e:
        st.error(f"Failed to extract metrics: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return {}

# Function to parse markets table
def parse_markets_page(content):
    try:
        soup = BeautifulSoup(content, 'html.parser')
        table = soup.find('table')
        if not table:
            raise ValueError("No markets table found")
        headers = [th.text.strip() for th in table.find('thead').find_all('th')]
        if '' in headers:
            headers[headers.index('')] = 'Type'
        rows = []
        for tr in table.find('tbody').find_all('tr'):
            cells = [td.text.strip() for td in tr.find_all('td')]
            rows.append(cells)
        df = pd.DataFrame(rows, columns=headers)
        return df
    except Exception as e:
        st.error(f"Failed to parse markets page: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None

# Function to fetch coin details
def fetch_coin_details(coin_url):
    try:
        content = fetch_page_content(coin_url)
        if not content:
            raise ValueError("No content fetched for coin page")
        soup = BeautifulSoup(content, 'html.parser')
        
        metrics = extract_metrics(soup)
        
        main_div = soup.select_one('body > div.container > main > div')
        coin_id = main_div.get('data-coin-id') if main_div else None
        
        spot_df = None
        perp_df = None
        if coin_id:
            spot_url = f"https://www.coingecko.com/en/coins/{coin_id}/markets/all/spot/rank_asc?items=100"
            spot_content = fetch_page_content(spot_url)
            if spot_content:
                spot_df = parse_markets_page(spot_content)
            
            perp_url = f"https://www.coingecko.com/en/coins/{coin_id}/markets/all/perpetuals/rank_asc?items=100"
            perp_content = fetch_page_content(perp_url)
            if perp_content:
                perp_df = parse_markets_page(perp_content)
        
        return metrics, spot_df, perp_df
    except Exception as e:
        st.error(f"Failed to fetch coin details for {coin_url}: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return {}, None, None

# Streamlit app
st.title("CoinGecko Crypto Scraper")

st.markdown(
    "# Instructions for Enabling CDP\n"
    "To use this app, you need to run your Chrome browser with remote debugging enabled. This allows the app to control your browser via the Chrome DevTools Protocol (CDP).\n\n"
    "## How to Run Chrome with CDP\n"
    "1. **Close all Chrome instances** to avoid port conflicts:\n"
    "   ```bash\n"
    "   pkill -f chrome\n"
    "   ```\n"
    "2. **Run Chrome from the command line** (Linux):\n"
    "   ```bash\n"
    "   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome_profile\n"
    "   ```\n"
    "   - Replace `/tmp/chrome_profile` with a temporary directory (e.g., `/home/vuos/temp/chrome_profile`).\n"
    "   - If port 9222 is in use, try another (e.g., 9223) and update `debugger_address` in the code.\n"
    "3. **Verify Chrome is running**:\n"
    "   - Check with `lsof -i :9222` to ensure the port is active.\n"
    "   - Confirm version with `google-chrome --version` (should be 139.0.7258.158).\n"
    "4. **Keep the browser open** with at least one tab (e.g., Streamlit app at http://localhost:8501). The app will open new tabs for scraping and close only those tabs.\n"
    "5. **Troubleshooting**:\n"
    "   - If connection fails, check port conflicts: `netstat -tuln | grep 9222`.\n"
    "   - Ensure firewall allows localhost connections: `sudo ufw status`.\n"
    "   - If Chrome updates, `webdriver-manager` should fetch the matching ChromeDriver.\n"
    "   - For persistent issues, download ChromeDriver 139 manually from https://chromedriver.storage.googleapis.com/index.html?path=139.0.7258.158/ and specify in `Service('/path/to/chromedriver')`.\n"
    "   - Do not close all browser tabs during scraping.\n\n"
    "**Note**: CDP must be enabled via command-line flags; it cannot be enabled from the browser UI. You’ll see new tabs open and close during scraping, but other tabs (including Streamlit) will remain open."
)

st.write(f"Data fetched on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

trending_url = "https://www.coingecko.com/en/highlights/trending-crypto"
gainers_losers_url = "https://www.coingecko.com/en/crypto-gainers-losers"

if st.button("Scrape Trending, Gainers, and Losers"):
    trending_df = scrape_trending(trending_url)
    if trending_df is not None:
        st.subheader("Trending Cryptocurrencies")
        st.dataframe(trending_df)
    
    gainers_df, losers_df = scrape_gainers_losers(gainers_losers_url)
    if gainers_df is not None:
        st.subheader("Top Gainers")
        st.dataframe(gainers_df)
    
    if losers_df is not None:
        st.subheader("Top Losers")
        st.dataframe(losers_df)
    
    all_coins = {}
    if trending_df is not None:
        for _, row in trending_df.iterrows():
            if pd.notna(row['Link']) and row['Link']:
                coin_name = row['Coin'] if 'Coin' in row else row.get('Name', 'Unknown')
                all_coins[coin_name] = row['Link']
    if gainers_df is not None:
        for _, row in gainers_df.iterrows():
            if pd.notna(row['Link']) and row['Link']:
                coin_name = row['Name'] if 'Name' in row else 'Unknown'
                all_coins[coin_name] = row['Link']
    if losers_df is not None:
        for _, row in losers_df.iterrows():
            if pd.notna(row['Link']) and row['Link']:
                coin_name = row['Name'] if 'Name' in row else 'Unknown'
                all_coins[coin_name] = row['Link']
    
    st.session_state['all_coins'] = all_coins

if 'all_coins' in st.session_state and st.session_state['all_coins']:
    selected_coin = st.selectbox("Select a coin to view details", list(st.session_state['all_coins'].keys()))
    
    if st.button("Fetch Details for Selected Coin"):
        coin_url = st.session_state['all_coins'][selected_coin]
        metrics, spot_df, perp_df = fetch_coin_details(coin_url)
        
        st.subheader(f"Details for {selected_coin}")
        
        if metrics:
            st.subheader("Key Metrics")
            metrics_df = pd.DataFrame(list(metrics.items()), columns=['Metric', 'Value'])
            st.dataframe(metrics_df)
        else:
            st.write("No metrics found.")
        
        if spot_df is not None:
            st.subheader("Spot Markets")
            st.dataframe(spot_df)
        else:
            st.write("No spot markets data.")
        
        if perp_df is not None:
            st.subheader("Perpetuals Markets")
            st.dataframe(perp_df)
        else:
            st.write("No perpetuals markets data.")