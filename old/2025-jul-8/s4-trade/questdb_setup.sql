CREATE TABLE IF NOT EXISTS ohlcv (
    timestamp TIMESTAMP,
    symbol SYMBOL,
    timeframe SYMBOL,
    open DOUBLE,
    high DOUBLE,
    low DOUBLE,
    close DOUBLE,
    volume DOUBLE
) TIMESTAMP(timestamp) PARTITION BY DAY;