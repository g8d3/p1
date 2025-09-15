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
            
            # Extract coin name and symbol from the cell containing both (index 2)
            coin_cell = cells[2] if len(cells) > 2 else None
            name, symbol = '', ''
            if coin_cell:
                coin_text = coin_cell.text.strip()
                # Split on newlines or whitespace, accounting for variations
                coin_parts = re.split(r'\s*\n+\s*|\s{2,}', coin_text)
                coin_parts = [part.strip() for part in coin_parts if part.strip()]
                name = coin_parts[0] if coin_parts else ''
                symbol = coin_parts[1] if len(coin_parts) > 1 else ''
            
            # Extract link
            coin_link = tr.find('a', href=re.compile(r'/en/coins/'))
            link = 'https://www.coingecko.com' + coin_link['href'] if coin_link else None
            
            # Select relevant columns: Price (4), 1h (5), 24h (6), 7d (7), 24h Volume (8), Market Cap (9)
            row = [cell.text.strip() for cell in cells]
            new_row = [
                name,
                symbol,
                row[4] if len(row) > 4 else None,
                row[5] if len(row) > 5 else None,
                row[6] if len(row) > 6 else None,
                row[7] if len(row) > 7 else None,
                row[8] if len(row) > 8 else None,
                row[9] if len(row) > 9 else None,
                link
            ]
            
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
        
        # Define desired headers
        headers = ['#', 'Name', 'Symbol', 'Price', 'Volume', '24h', 'Link']
        
        # Gainers table
        gainers_table = tables[0]
        gainers_rows = []
        for tr in gainers_table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            if len(cells) < 6:  # Expect at least 6 columns
                print(f"Gainers: Skipping row with {len(cells)} columns, expected at least 6.")
                continue
            
            # Extract coin name and symbol from the cell containing both (index 1)
            name_cell = cells[1] if len(cells) > 1 else None
            name, symbol = '', ''
            if name_cell:
                name_text = name_cell.text.strip()
                # Split on newlines or whitespace
                name_parts = re.split(r'\s*\n+\s*|\s{2,}', name_text)
                name_parts = [part.strip() for part in name_parts if part.strip()]
                name = name_parts[0] if name_parts else ''
                symbol = name_parts[1] if len(name_parts) > 1 else ''
            
            # Extract link from name cell
            coin_link = name_cell.find('a', href=re.compile(r'/en/coins/')) if name_cell else None
            link = 'https://www.coingecko.com' + coin_link['href'] if coin_link else None
            
            # Select relevant columns: # (1), Price (3), Volume (4), 24h (5)
            row = [cell.text.strip() for cell in cells]
            new_row = [
                row[1] if len(row) > 1 else None,  # #
                name,
                symbol,
                row[3] if len(row) > 3 else None,  # Price
                row[4] if len(row) > 4 else None,  # Volume
                row[5] if len(row) > 5 else None,  # 24h
                link
            ]
            
            # Debug row data
            print(f"Gainers row data: {new_row}")
            
            # Ensure row length matches headers
            if len(new_row) < len(headers):
                print(f"Gainers row has {len(new_row)} columns, expected {len(headers)}. Padding with None.")
                new_row.extend([None] * (len(headers) - len(new_row)))
            elif len(new_row) > len(headers):
                print(f"Gainers row has {len(new_row)} columns, expected {len(headers)}. Truncating.")
                new_row = new_row[:len(headers)]
            
            gainers_rows.append(new_row)
        
        gainers_df = pd.DataFrame(gainers_rows, columns=headers)
        print(f"Gainers headers: {headers}")
        
        # Losers table
        losers_table = tables[1]
        losers_rows = []
        for tr in losers_table.find('tbody').find_all('tr'):
            cells = tr.find_all('td')
            if len(cells) < 6:  # Expect at least 6 columns
                print(f"Losers: Skipping row with {len(cells)} columns, expected at least 6.")
                continue
            
            # Extract coin name and symbol from the cell containing both (index 1)
            name_cell = cells[1] if len(cells) > 1 else None
            name, symbol = '', ''
            if name_cell:
                name_text = name_cell.text.strip()
                # Split on newlines or whitespace
                name_parts = re.split(r'\s*\n+\s*|\s{2,}', name_text)
                name_parts = [part.strip() for part in name_parts if part.strip()]
                name = name_parts[0] if name_parts else ''
                symbol = name_parts[1] if len(name_parts) > 1 else ''
            
            # Extract link from name cell
            coin_link = name_cell.find('a', href=re.compile(r'/en/coins/')) if name_cell else None
            link = 'https://www.coingecko.com' + coin_link['href'] if coin_link else None
            
            # Select relevant columns: # (1), Price (3), Volume (4), 24h (5)
            row = [cell.text.strip() for cell in cells]
            new_row = [
                row[1] if len(row) > 1 else None,  # #
                name,
                symbol,
                row[3] if len(row) > 3 else None,  # Price
                row[4] if len(row) > 4 else None,  # Volume
                row[5] if len(row) > 5 else None,  # 24h
                link
            ]
            
            # Debug row data
            print(f"Losers row data: {new_row}")
            
            # Ensure row length matches headers
            if len(new_row) < len(headers):
                print(f"Losers row has {len(new_row)} columns, expected {len(headers)}. Padding with None.")
                new_row.extend([None] * (len(headers) - len(new_row)))
            elif len(new_row) > len(headers):
                print(f"Losers row has {len(new_row)} columns, expected {len(headers)}. Truncating.")
                new_row = new_row[:len(headers)]
            
            losers_rows.append(new_row)
        
        losers_df = pd.DataFrame(losers_rows, columns=headers)
        print(f"Losers headers: {headers}")
        
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