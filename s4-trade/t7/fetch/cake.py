import sys
import requests
import csv

# Command line arguments
token_contract = sys.argv[1]  # Token contract address
timeframe = sys.argv[2]  # Candle timeframe (e.g., '1h', '1d')
num_candles = int(sys.argv[3])  # Number of candles

# First, fetch pools for the token
token_url = f"https://api.dexscreener.com/latest/dex/search?q={token_contract}"
response = requests.get(token_url)
if response.status_code != 200 or not response.text.strip().startswith('{'):
    print("Invalid token address or API error.")
    exit()
token_data = response.json()

if 'pairs' in token_data and token_data['pairs']:
    if len(token_data['pairs']) == 1 and token_data['pairs'][0]['pairAddress'].lower() == token_contract.lower():
        # Input is a pair address, fetch OHLCV
        pair_contract = token_contract
        chart_url = f"https://api.dexscreener.com/latest/dex/pairs/bsc/{pair_contract}/chart?limit={num_candles}&interval={timeframe}"
        response = requests.get(chart_url)
        if response.status_code != 200 or not response.text.strip().startswith('{'):
            print("Invalid pair address or API error.")
            exit()
        data = response.json()

        # Save OHLCV data as CSV
        filename = f"ohlcv_{pair_contract}_{timeframe}_{num_candles}.csv"
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            if 'data' in data and data['data']:
                for item in data['data']:
                    writer.writerow([item['timestamp'], item['open'], item['high'], item['low'], item['close'], item['volume']])
                print(f"Data saved to {filename}")
            else:
                print("No data found or error in response. Empty CSV created.")
    else:
        # Multiple pools, list them
        print("Available pools for token:")
        for i, pair in enumerate(token_data['pairs'][:10]):  # Limit to top 10
            base_symbol = pair.get('baseToken', {}).get('symbol', 'N/A')
            quote_symbol = pair.get('quoteToken', {}).get('symbol', 'N/A')
            volume = pair.get('volume', {}).get('h24', 'N/A')
            tvl = pair.get('liquidity', {}).get('usd', 'N/A')
            dex = pair.get('dexId', 'N/A')
            print(f"{i+1}. {dex}: {base_symbol}/{quote_symbol} - Volume 24h: {volume}, TVL: {tvl}, Pair: {pair['pairAddress']}")
        print("\nChoose a pair address from above and run the script again with that address as the first argument.")
else:
    print("No pools found. Invalid address.")