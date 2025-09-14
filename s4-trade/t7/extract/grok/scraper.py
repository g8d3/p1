import streamlit as st
import pandas as pd
import re
from bs4 import BeautifulSoup
import traceback
from driver import fetch_page_content

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
        
        # Define desired headers
        headers = ['Name', 'Symbol', 'Price', '1h', '24h', '7d', '24h Volume', 'Market Cap', 'Link']
        
        rows = []
        for tr in table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            if len(cells) < 10:  # Expect at least 10 columns based on previous output
                print(f"Skipping row with {len(cells)} columns, expected at least 10.")
                continue
            
            # Extract cell data
            row = [cell.text.strip() for cell in cells]
            
            # Split Column_4 (index 3) into Name and Symbol
            coin_data = row[3].split('\n')
            name = coin_data[0].strip() if coin_data else ''
            symbol = coin_data[1].strip() if len(coin_data) > 1 else ''
            
            # Extract link
            coin_link = tr.find('a', href=re.compile(r'/en/coins/'))
            link = 'https://www.coingecko.com' + coin_link['href'] if coin_link else None
            
            # Select relevant columns: skip Column_1 (0), # (1), Column_4 (3), Last 7 Days (10), Column_12 (11)
            # Map to: Name, Symbol, Price (4), 1h (5), 24h (6), 7d (7), 24h Volume (8), Market Cap (9), Link
            new_row = [name, symbol, row[4], row[5], row[6], row[7], row[8], row[9], link]
            
            # Ensure row length matches headers
            if len(new_row) < len(headers):
                print(f"Row has {len(new_row)} columns, expected {len(headers)}. Padding with None.")
                new_row.extend([None] * (len(headers) - len(new_row)))
            elif len(new_row) > len(headers):
                print(f"Row has {len(new_row)} columns, expected {len(headers)}. Truncating.")
                new_row = new_row[:len(headers)]
            
            rows.append(new_row)
        
        # Create DataFrame
        df = pd.DataFrame(rows, columns=headers)
        print(f"Trending headers: {headers}")
        return df
    except Exception as e:
        st.error(f"Failed to scrape trending page: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        print(f"Failed to scrape trending page: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
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
        gainers_headers = []
        for i, th in enumerate(gainers_table.find('thead').find_all('th')):
            text = th.text.strip()
            if not text:
                text = f"Column_{i+1}"  # e.g., Column_1, Column_2, etc.
            gainers_headers.append(text)
        gainers_headers.append('Link')  # Add Link column
        gainers_rows = []
        for tr in gainers_table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            row = [cell.text.strip() for cell in cells]
            name_td = cells[1] if len(cells) > 1 else None
            if name_td:
                coin_link = name_td.find('a', href=re.compile(r'/en/coins/'))
                row.append('https://www.coingecko.com' + coin_link['href'] if coin_link else None)
            else:
                row.append(None)
            # Pad or truncate row to match headers
            if len(row) < len(gainers_headers):
                print(f"Gainers row has {len(row)} columns, expected {len(gainers_headers)}. Padding with None.")
                row.extend([None] * (len(gainers_headers) - len(row)))
            elif len(row) > len(gainers_headers):
                print(f"Gainers row has {len(row)} columns, expected {len(gainers_headers)}. Truncating.")
                row = row[:len(gainers_headers)]
            gainers_rows.append(row)
        gainers_df = pd.DataFrame(gainers_rows, columns=gainers_headers)
        print(f"Gainers headers: {gainers_headers}")
        
        # Losers table
        losers_table = tables[1]
        losers_headers = []
        for i, th in enumerate(losers_table.find('thead').find_all('th')):
            text = th.text.strip()
            if not text:
                text = f"Column_{i+1}"  # e.g., Column_1, Column_2, etc.
            losers_headers.append(text)
        losers_headers.append('Link')  # Add Link column
        losers_rows = []
        for tr in losers_table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            row = [cell.text.strip() for cell in cells]
            name_td = cells[1] if len(cells) > 1 else None
            if name_td:
                coin_link = name_td.find('a', href=re.compile(r'/en/coins/'))
                row.append('https://www.coingecko.com' + coin_link['href'] if coin_link else None)
            else:
                row.append(None)
            # Pad or truncate row to match headers
            if len(row) < len(losers_headers):
                print(f"Losers row has {len(row)} columns, expected {len(losers_headers)}. Padding with None.")
                row.extend([None] * (len(losers_headers) - len(row)))
            elif len(row) > len(losers_headers):
                print(f"Losers row has {len(row)} columns, expected {len(losers_headers)}. Truncating.")
                row = row[:len(losers_headers)]
            losers_rows.append(row)
        losers_df = pd.DataFrame(losers_rows, columns=losers_headers)
        print(f"Losers headers: {losers_headers}")
        
        return gainers_df, losers_df
    except Exception as e:
        st.error(f"Failed to scrape gainers/losers: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        print(f"Failed to scrape gainers/losers: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
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
        print(f"Failed to extract metrics: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        return {}

# Function to parse markets table
def parse_markets_page(content):
    try:
        soup = BeautifulSoup(content, 'html.parser')
        table = soup.find('table')
        if not table:
            raise ValueError("No markets table found")
        headers = []
        for i, th in enumerate(table.find('thead').find_all('th')):
            text = th.text.strip()
            if not text:
                text = f"Column_{i+1}"
            headers.append(text)
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
        print(f"Failed to parse markets page: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
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
        print(f"Failed to fetch coin details for {coin_url}: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        return {}, None, None