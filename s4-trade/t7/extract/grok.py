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

# Function to get driver attached to CDP
@st.cache_resource
def get_driver(debugger_address='127.0.0.1:9222'):
    try:
        # Automatically fetch the correct ChromeDriver version
        service = Service(ChromeDriverManager().install())
        options = Options()
        options.add_experimental_option("debuggerAddress", debugger_address)
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    except Exception as e:
        st.error(f"Failed to connect to CDP: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        st.error("Ensure Chrome is running with --remote-debugging-port=9222. See instructions below.")
        return None

# Function to fetch page content using CDP
def fetch_page_content(url, timeout=10):
    driver = get_driver()
    if not driver:
        return None
    try:
        driver.get(url)
        # Wait for body to be visible, handling potential challenges
        WebDriverWait(driver, timeout).until(EC.visibility_of_element_located((By.TAG_NAME, "body")))
        content = driver.page_source
        return content
    except Exception as e:
        st.error(f"Failed to fetch page {url}: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None

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

st.markdown("""
### Instructions for Enabling CDP:
To use this app, you need to run your Chrome browser with remote debugging enabled. This allows the app to control your browser via the Chrome DevTools Protocol (CDP).

#### How to Run Chrome with CDP:
1. **Close all Chrome instances** to avoid port conflicts.
2. **Run Chrome from the command line**:
   - On **Windows**:
     ```
     "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\temp\\chrome_profile"
     ```
   - On **macOS**:
     ```
     /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome_profile
     ```
   - On **Linux** (your system, based on error path):
     ```
     google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome_profile
     ```
   - Replace `--user-data-dir` path with a temporary directory to avoid affecting your main profile.
3. **Keep the browser open**. The app connects to it at `127.0.0.1:9222` (default; change in code if using another port).
4. **Verify Chrome Version**: Your Chrome is version 139.0.7258.158. Ensure no updates occur during use, as `webdriver-manager` will fetch a matching ChromeDriver.
5. **Troubleshooting**:
   - If connection fails, ensure no other Chrome instance uses port 9222 (`lsof -i :9222` on Linux).
   - Check firewall settings to allow localhost connections.
   - Run `google-chrome --version` to confirm your Chrome version.
   - If errors persist, try a different port (e.g., 9223) and update `debugger_address` in the code.

**Note**: You cannot enable CDP from the browser UI; it requires the command-line flag. The browser will remain open, and the app will navigate tabs as needed.
""")

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
