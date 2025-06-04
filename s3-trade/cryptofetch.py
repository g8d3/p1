# Cryptocurrency Data Fetcher
# This file is a starting point for the application that fetches cryptocurrency data using the ccxt library.
# It can be expanded to include QuestDB integration, real-time updates, and web interface development.

import ccxt

def fetch_crypto_data(symbol="BTC/USDT", timeframe="1d"):
    """
    Fetch historical OHLCV (Open, High, Low, Close, Volume) data for a given trading pair and timeframe.
    :param symbol: Trading pair (e.g., "BTC/USDT")
    :param timeframe: Timeframe (e.g., "1d", "1h", "1m")
    :return: OHLCV data as a list of [timestamp, open, high, low, close, volume]
    """
    try:
        # Initialize the exchange (using Binance as an example)
        exchange = ccxt.binance({
            'enableRateLimit': True,
            # API keys can be added here if needed, but keep in mind security considerations
        })
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe)
        return ohlcv
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    # Example usage: Fetch data for Bitcoin
    data = fetch_crypto_data()
    print("Fetched data:", data[:5])  # Print first 5 entries for verification
