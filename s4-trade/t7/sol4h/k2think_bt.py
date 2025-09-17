import pandas as pd
import vectorbt as vbt
from vectorbt.indicators.ma import EMA, SMA  # Moving Averages (EMA, SMA)
from vectorbt.indicators.rsi import RSI      # Relative Strength Index
from vectorbt.indicators.macd import MACD    # Moving Average Convergence Divergence
import numpy as np
import matplotlib.pyplot as plt

# Load Solana 4h OHLCV data (replace with your CSV path)
data = pd.read_csv('solana_4h_ohlc.csv', parse_dates=['datetime'], index_col='datetime')
close = data['close'].astype(float)  # Ensure close is numeric
high = data['high'].astype(float)
low = data['low'].astype(float)
volume = data['volume'].astype(float)  # Ensure volume is numeric

# --------------------------
# Strategy 1: MA Crossover (EMA 50/200)
# --------------------------
def ma_crossover_strategy(close):
    """Long when EMA50 crosses above EMA200; short when crosses below."""
    ema50 = EMA.run(close, window=50).ma
    ema200 = EMA.run(close, window=200).ma
    entries = ema50.cross_above(ema200)
    exits = ema50.cross_below(ema200)
    return entries, exits

# --------------------------
# Strategy 2: RSI Mean Reversion (RSI 14)
# --------------------------
def rsi_mean_reversion_strategy(close):
    """Long when RSI crosses below 30 (oversold); exit when RSI crosses above 70 (overbought)."""
    rsi = RSI.run(close, window=14).rsi
    entries = rsi.cross_below(30)
    exits = rsi.cross_above(70)
    return entries, exits

# --------------------------
# Strategy 3: Bollinger Bands Squeeze
# --------------------------
def bollinger_squeeze_strategy(close):
    """Long after a squeeze when price breaks above upper band; exit when price < SMA20."""
    sma20 = SMA.run(close, window=20).ma
    std20 = close.rolling(window=20).std()
    upper_band = sma20 + 2 * std20
    lower_band = sma20 - 2 * std20
    band_width = (upper_band - lower_band) / sma20  # Normalized width
    squeeze = band_width < 0.02  # Squeeze if width < 2% of SMA
    squeeze_ended = (~squeeze) & squeeze.shift(1)  # Squeeze just ended (current not squeeze, previous was)
    entries = squeeze_ended & (close > upper_band)
    exits = close < sma20
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 4: MACD Momentum
# --------------------------
def macd_momentum_strategy(close):
    """Long when MACD crosses above signal line; exit when crosses below."""
    macd_obj = MACD.run(close, fast=12, slow=26, signal=9)
    entries = macd_obj.macd.cross_above(macd_obj.signal)
    exits = macd_obj.macd.cross_below(macd_obj.signal)
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 5: VWAP Breakout (Daily)
# --------------------------
def vwap_breakout_strategy(close, high, low, volume):
    """Long when close > daily VWAP and volume > daily avg volume."""
    # Compute daily VWAP
    typical_price = (high + low + close) / 3
    # Group by date and calculate VWAP per day
    daily_vwap = typical_price.groupby(typical_price.index.date).apply(
        lambda x: (x * volume.loc[x.index]).sum() / x.sum()  # VWAP = (sum(typical_price * volume)) / sum(volume)
    ).rename('daily_vwap')  # Name the grouped series
    # Map daily VWAP back to original 4h candles
    daily_vwap = daily_vwap.reindex(typical_price.index, method='ffill')  # Forward-fill to align with 4h data

    # Compute daily average volume
    daily_avg_vol = volume.groupby(volume.index.date).transform('mean').rename('daily_avg_vol')

    # Entry condition: Close > VWAP and volume > daily avg volume (first entry per day)
    entries = (close > daily_vwap) & (volume > daily_avg_vol)
    # Avoid duplicate entries (only trigger once per day)
    entries = entries & (~entries.shift(1))  # True only if previous entry was False

    # Exit condition: Close < VWAP
    exits = close < daily_vwap

    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 6: OBV Volume Strategy (OBV SMA 20)
# --------------------------
def obv_volume_strategy(close, volume):
    """Long when OBV crosses above 20-period SMA; exit when crosses below."""
    # Compute OBV (On-Balance Volume)
    obv = pd.Series(0, index=close.index, name='obv')
    obv.iloc[0] = 0  # Initialize first OBV to 0
    for i in range(1, len(close)):
        if close.iloc[i] > close.iloc[i-1]:
            obv.iloc[i] = obv.iloc[i-1] + volume.iloc[i]
        else:
            obv.iloc[i] = obv.iloc[i-1] - volume.iloc[i]

    # Compute OBV SMA (20-period)
    obv_sma = SMA.run(obv, window=20).ma

    # Entry/exit signals
    entries = obv.cross_above(obv_sma)
    exits = obv.cross_below(obv_sma)
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Backtest All Strategies
# --------------------------
strategies = {
    "EMA 50/200 Crossover": ma_crossover_strategy(close),
    "RSI Mean Reversion (30/70)": rsi_mean_reversion_strategy(close),
    "Bollinger Bands Squeeze": bollinger_squeeze_strategy(close),
    "MACD Momentum": macd_momentum_strategy(close),
    "VWAP Breakout": vwap_breakout_strategy(close, high, low, volume),
    "OBV Volume Strategy": obv_volume_strategy(close, volume)
}

# Backtest parameters (realistic fees/slippage)
fees = 0.001  # 0.1% per trade (buy/sell)
slippage = 0.001  # 0.1% slippage per trade
initial_cash = 10000  # Starting capital

# Store results for comparison
results = {}
cum_returns = []  # For visualization

for name, (entries, exits) in strategies.items():
    # Skip strategies with no entries/exits
    if entries.sum() == 0 or exits.sum() == 0:
        results[name] = {
            "Total Return (%)": "0.00%",
            "Win Rate (%)": "0.00%",
            "Max Drawdown (%)": "0.00%",
            "Sharpe Ratio": "0.00",
            "Avg Trade Duration (hours)": "0.00",
            "Trades": 0
        }
        cum_returns.append(pd.Series(0, index=close.index, name=name))
        continue

    # Remove NaN entries (if any)
    entries = entries.dropna()
    exits = exits.dropna()

    # Ensure entries/exits align with close index (vectorbt requires same length)
    # Sometimes groupby operations may cause misalignment; reindex if needed
    entries = entries.reindex(close.index, fill_value=False)
    exits = exits.reindex(close.index, fill_value=False)

    # Create portfolio
    try:
        portfolio = vbt.Portfolio.from_signals(
            close,
            entries,
            exits,
            fees=fees,
            slippage=slippage,
            initial_cash=initial_cash,
            # max_pos_size=1.0,  # Optional: Limit position size (e.g., 1.0 = 100% of cash)
            # cash_sharing=True  # Optional: Share cash across entries (improves efficiency)
        )
    except Exception as e:
        print(f"Error with {name}: {e}")
        continue

    # Extract metrics
    total_return = portfolio.total_return() * 100
    win_rate = portfolio.win_rate() * 100
    max_drawdown = portfolio.max_drawdown() * 100
    sharpe_ratio = portfolio.sharpe_ratio()
    avg_duration = portfolio.trades.duration().mean() / np.timedelta64(1, 'h')  # Convert to hours
    num_trades = len(portfolio.trades)

    # Store results
    results[name] = {
        "Total Return (%)": f"{total_return:.2f}%",
        "Win Rate (%)": f"{win_rate:.2f}%",
        "Max Drawdown (%)": f"{max_drawdown:.2f}%",
        "Sharpe Ratio": f"{sharpe_ratio:.2f}",
        "Avg Trade Duration (hours)": f"{avg_duration:.2f}",
        "Trades": num_trades
    }

    # Compute cumulative returns for visualization
    cum_ret = (portfolio.returns() + 1).cumprod() * initial_cash - initial_cash
    cum_returns.append(cum_ret.rename(name))

# Convert results to DataFrame for readability
results_df = pd.DataFrame(results).T
print("Strategy Performance Metrics (Last 5 Years):")
print(results_df)

# --------------------------
# Visualize Cumulative Returns
# --------------------------
if cum_returns:
    cum_returns = pd.concat(cum_returns, axis=1).fillna(0)
    plt.figure(figsize=(12, 6))
    for col in cum_returns.columns:
        plt.plot(cum_returns[col], label=col)
    plt.title("Cumulative Portfolio Value Comparison (Solana 4h)")
    plt.xlabel("Time")
    plt.ylabel("Portfolio Value ($)")
    plt.legend()
    plt.grid(True)
    plt.show()
else:
    print("No valid strategies to visualize.")
