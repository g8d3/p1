import requests
from datetime import datetime, timedelta
import time
import csv

# Configuration
symbol = "SOLUSDT"  # Trading pair (Solana/USD); adjust for other pairs (e.g., SOLBTC)
interval = "4h"    # Candlestick interval (4 hours)
limit = 1000       # Max entries per request (Binance limit)
days_back = 5 * 365  # Approx 5 years in days

# Calculate timestamps (milliseconds)
end_time = int(datetime.now().timestamp() * 1000)
start_time = int((datetime.now() - timedelta(days=days_back)).timestamp() * 1000)

# Fetch data in chunks
all_klines = []
while True:
    # Construct API URL
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&startTime={start_time}&limit={limit}&endTime={end_time}"
    
    # Make request with delay to avoid rate limits
    response = requests.get(url)
    time.sleep(0.5)  # Adjust based on API rate limits (Binance allows 1200 requests/min)
    
    if response.status_code != 200:
        print(f"Error fetching data: Status code {response.status_code}")
        break
    
    klines = response.json()
    if not klines:
        print("No more data available.")
        break
    
    all_klines.extend(klines)
    
    # Update start_time to the last fetched kline's open time + interval (4h in ms)
    last_open_time = klines[-1][0]
    start_time = last_open_time + (4 * 60 * 60 * 1000)
    
    # Check if we've reached the end time
    if start_time >= end_time:
        break

# Process and save to CSV
ohlcvs = []
for kline in all_klines:
    timestamp = kline[0]
    dt = datetime.utcfromtimestamp(timestamp / 1000).strftime('%Y-%m-%d %H:%M:%S')
    ohlcv = {
        "timestamp": timestamp,
        "datetime": dt,
        "open": kline[1],
        "high": kline[2],
        "low": kline[3],
        "close": kline[4],
        "volume": kline[5]
    }
    ohlcvs.append(ohlcv)

# Write to CSV
with open('solana_4h_ohlc.csv', 'w', newline='') as csvfile:
    fieldnames = ["timestamp", "datetime", "open", "high", "low", "close", "volume"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for row in ohlcvs:
        writer.writerow(row)

print(f"Successfully saved {len(ohlcvs)} 4-hour OHLCV entries to solana_4h_ohlc.csv")
