import streamlit as st
import pandas as pd
from datetime import datetime
from scraper import scrape_trending, scrape_gainers_losers, fetch_coin_details

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
    "   - If port 9222 is in use, try another (e.g., 9223) and update `debugger_address` in `driver.py`.\n"
    "3. **Verify Chrome is running**:\n"
    "   - Check with `lsof -i :9222` to ensure the port is active.\n"
    "   - Confirm version with `google-chrome --version` (should be 139.0.7258.158).\n"
    "4. **Keep the browser open** with at least one tab (e.g., Streamlit app at http://localhost:8501). The app will open new tabs for scraping and close only those tabs.\n"
    "5. **Troubleshooting**:\n"
    "   - If connection fails, check port conflicts: `netstat -tuln | grep 9222`.\n"
    "   - Ensure firewall allows localhost connections: `sudo ufw status`.\n"
    "   - If Chrome updates, `webdriver-manager` should fetch the matching ChromeDriver.\n"
    "   - For persistent issues, download ChromeDriver 139 manually from https://chromedriver.storage.googleapis.com/index.html?path=139.0.7258.158/ and specify in `driver.py` with `Service('/path/to/chromedriver')`.\n"
    "   - Do not close all browser tabs during scraping, especially the Streamlit tab.\n"
    "   - Check terminal logs for debugging if the Streamlit tab closes.\n\n"
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