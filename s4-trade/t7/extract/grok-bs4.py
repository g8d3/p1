import streamlit as st
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import re
import traceback

# Function to fetch and parse the trending page
def scrape_trending(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Check for HTTP errors
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table')
        if not table:
            raise ValueError("No table found on trending page")
        headers = [th.text.strip() for th in table.find('thead').find_all('th')]
        rows = []
        for tr in table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            row = [cell.text.strip() for cell in cells]
            # Find the link
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
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
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
            # Find the link in Name column
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
            # Find the link in Name column
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
        # Find the stats table
        stats_table = soup.select_one('#gecko-coin-page-container > div[class*="2lg:tw-row-span-2"] > div:nth-child(2) > table')
        if stats_table:
            for i, tr in enumerate(stats_table.find('tbody').find_all('tr'), start=1):
                th = tr.find('th')
                td = tr.find('td')
                if th and td:
                    label = th.text.strip()
                    value = td.text.strip()
                    metrics[label] = value
        
        # Contract address
        contract_div = soup.select_one('#gecko-coin-page-container > div[class*="2lg:tw-row-span-2"] > div.tw-relative[class*="2lg:tw-mb-6"] > div:nth-child(1) > div.tw-my-auto')
        if contract_div:
            metrics['Contract'] = contract_div.text.strip()
        
        return metrics
    except Exception as e:
        st.error(f"Failed to extract metrics: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return {}

# Function to parse markets table
def parse_markets_page(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table')
        if not table:
            raise ValueError("No markets table found")
        headers = [th.text.strip() for th in table.find('thead').find_all('th')]
        # Adjust headers for empty column
        if '' in headers:
            headers[headers.index('')] = 'Type'
        rows = []
        for tr in table.find('tbody').find_all('tr'):
            cells = [td.text.strip() for td in tr.find_all('td')]
            rows.append(cells)
        df = pd.DataFrame(rows, columns=headers)
        return df
    except Exception as e:
        st.error(f"Failed to parse markets page {url}: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return None

# Function to fetch coin details
def fetch_coin_details(coin_url):
    try:
        response = requests.get(coin_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get metrics
        metrics = extract_metrics(soup)
        
        # Get coin_id
        main_div = soup.select_one('body > div.container > main > div')
        coin_id = main_div.get('data-coin-id') if main_div else None
        
        spot_df = None
        perp_df = None
        if coin_id:
            spot_url = f"https://www.coingecko.com/en/coins/{coin_id}/markets/all/spot/rank_asc?items=100"
            spot_df = parse_markets_page(spot_url)
            
            perp_url = f"https://www.coingecko.com/en/coins/{coin_id}/markets/all/perpetuals/rank_asc?items=100"
            perp_df = parse_markets_page(perp_url)
        
        return metrics, spot_df, perp_df
    except Exception as e:
        st.error(f"Failed to fetch coin details for {coin_url}: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        return {}, None, None

# Streamlit app
st.title("CoinGecko Crypto Scraper")

st.write(f"Data fetched on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

trending_url = "https://www.coingecko.com/en/highlights/trending-crypto"
gainers_losers_url = "https://www.coingecko.com/en/crypto-gainers-losers"

if st.button("Scrape Trending, Gainers, and Losers"):
    # Scrape trending
    trending_df = scrape_trending(trending_url)
    if trending_df is not None:
        st.subheader("Trending Cryptocurrencies")
        st.dataframe(trending_df)
    
    # Scrape gainers and losers
    gainers_df, losers_df = scrape_gainers_losers(gainers_losers_url)
    if gainers_df is not None:
        st.subheader("Top Gainers")
        st.dataframe(gainers_df)
    
    if losers_df is not None:
        st.subheader("Top Losers")
        st.dataframe(losers_df)
    
    # Collect all unique coins and their links
    all_coins = {}
    if trending_df is not None:
        for _, row in trending_df.iterrows():
            if row['Link']:
                coin_name = row['Coin'] if 'Coin' in row else row.get('Name', 'Unknown')
                all_coins[coin_name] = row['Link']
    if gainers_df is not None:
        for _, row in gainers_df.iterrows():
            if row['Link']:
                coin_name = row['Name'] if 'Name' in row else 'Unknown'
                all_coins[coin_name] = row['Link']
    if losers_df is not None:
        for _, row in losers_df.iterrows():
            if row['Link']:
                coin_name = row['Name'] if 'Name' in row else 'Unknown'
                all_coins[coin_name] = row['Link']
    
    st.session_state['all_coins'] = all_coins

# If coins are scraped, allow selecting one
if 'all_coins' in st.session_state and st.session_state['all_coins']:
    selected_coin = st.selectbox("Select a coin to view details", list(st.session_state['all_coins'].keys()))
    
    if st.button("Fetch Details for Selected Coin"):
        coin_url = st.session_state['all_coins'][selected_coin]
        metrics, spot_df, perp_df = fetch_coin_details(coin_url)
        
        st.subheader(f"Details for {selected_coin}")
        
        # Display metrics
        if metrics:
            st.subheader("Key Metrics")
            metrics_df = pd.DataFrame(list(metrics.items()), columns=['Metric', 'Value'])
            st.dataframe(metrics_df)
        else:
            st.write("No metrics found.")
        
        # Display spot markets
        if spot_df is not None:
            st.subheader("Spot Markets")
            st.dataframe(spot_df)
        else:
            st.write("No spot markets data.")
        
        # Display perpetuals markets
        if perp_df is not None:
            st.subheader("Perpetuals Markets")
            st.dataframe(perp_df)
        else:
            st.write("No perpetuals markets data.")

