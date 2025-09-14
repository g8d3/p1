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