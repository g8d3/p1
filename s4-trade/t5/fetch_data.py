import requests
import pandas as pd
import time

def fetch_klines(symbol, interval, start_time, end_time):
    url = "https://api.binance.com/api/v3/klines"
    klines = []
    limit = 1000 # Max 1000 klines per request

    while start_time < end_time:
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": start_time,
            "limit": limit
        }
        response = requests.get(url, params=params)
        data = response.json()

        if not data:
            break

        klines.extend(data)
        start_time = data[-1][6] + 1 # Next request starts after the last kline's close time

        # Binance API rate limit: 1200 requests per minute.
        # We are fetching 1000 klines per request, so we need to be careful.
        # Adding a small delay to avoid hitting rate limits.
        time.sleep(0.1) 
        
    return klines

def save_to_csv(klines, filename):
    df = pd.DataFrame(klines, columns=[
        "Open time", "Open", "High", "Low", "Close", "Volume",
        "Close time", "Quote asset volume", "Number of trades",
        "Taker buy base asset volume", "Taker buy quote asset volume", "Ignore"
    ])
    df["Open time"] = pd.to_datetime(df["Open time"], unit="ms")
    df["Close time"] = pd.to_datetime(df["Close time"], unit="ms")
    df = df[["Open time", "Open", "High", "Low", "Close", "Volume"]]
    df.to_csv(filename, index=False)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    symbol = "BTCUSDT"
    interval = "1h" # 1-hour candles
    
    # Fetch data for the last 90 days (approx. 3 months)
    end_time = int(time.time() * 1000)
    start_time = end_time - (90 * 24 * 60 * 60 * 1000) # 90 days ago in milliseconds

    print(f"Fetching {symbol} {interval} data from {pd.to_datetime(start_time, unit='ms')} to {pd.to_datetime(end_time, unit='ms')}...")
    klines = fetch_klines(symbol, interval, start_time, end_time)
    save_to_csv(klines, "BTCUSDT_1h.csv")
