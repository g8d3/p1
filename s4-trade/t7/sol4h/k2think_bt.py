import pandas as pd
import vectorbt as vbt
import numpy as np
import matplotlib.pyplot as plt

# --------------------------
# Helper Functions: Cross Detection
# --------------------------
def cross_above(a, b):
    """Returns True when 'a' crosses above 'b' (current a > b, previous a <= previous b)."""
    return (a > b) & (a.shift(1) <= b.shift(1))

def cross_below(a, b):
    """Returns True when 'a' crosses below 'b' (current a < b, previous a >= previous b)."""
    return (a < b) & (a.shift(1) >= b.shift(1))

# --------------------------
# Load Data
# --------------------------
data = pd.read_csv('solana_4h_ohlc.csv', parse_dates=['datetime'], index_col='datetime')
close = data['close'].astype(float)  # Ensure numeric
high = data['high'].astype(float)
low = data['low'].astype(float)
volume = data['volume'].astype(float)

# --------------------------
# Strategy 1: EMA 50/200 Crossover
# --------------------------
def ma_crossover_strategy(close):
    # Compute EMA using .ma() accessor with ma_type='ema'
    ema50 = close.vbt.ma(window=50, ma_type='ema')
    ema200 = close.vbt.ma(window=200, ma_type='ema')
    entries = cross_above(ema50, ema200)
    exits = cross_below(ema50, ema200)
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 2: RSI Mean Reversion (RSI 14)
# --------------------------
def rsi_mean_reversion_strategy(close):
    rsi = close.vbt.rsi(window=14)  # RSI via accessor
    entries = cross_below(rsi, 30)
    exits = cross_above(rsi, 70)
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 3: Bollinger Bands Squeeze
# --------------------------
def bollinger_squeeze_strategy(close):
    # Compute SMA using .ma() accessor with ma_type='sma'
    sma20 = close.vbt.ma(window=20, ma_type='sma')
    std20 = close.rolling(window=20).std()
    upper_band = sma20 + 2 * std20
    lower_band = sma20 - 2 * std20
    band_width = (upper_band - lower_band) / sma20  # Normalized width
    squeeze = band_width < 0.02  # Squeeze condition
    squeeze_ended = (~squeeze) & squeeze.shift(1)  # Squeeze just ended
    entries = squeeze_ended & cross_above(close, upper_band)
    exits = cross_below(close, sma20)
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 4: MACD Momentum
# --------------------------
def macd_momentum_strategy(close):
    # MACD via accessor (returns macd_line, signal_line, hist)
    macd_line, signal_line, _ = close.vbt.macd(fast=12, slow=26, signal=9)
    entries = cross_above(macd_line, signal_line)
    exits = cross_below(macd_line, signal_line)
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 5: VWAP Breakout (Daily)
# --------------------------
def vwap_breakout_strategy(close, high, low, volume):
    typical_price = (high + low + close) / 3
    # Compute daily VWAP
    daily_vwap = typical_price.groupby(typical_price.index.date).apply(
        lambda x: (x * volume.loc[x.index]).sum() / x.sum()
    ).rename('daily_vwap').reindex(typical_price.index, method='ffill')  # Align with 4h data
    
    # Daily average volume
    daily_avg_vol = volume.groupby(volume.index.date).transform('mean').rename('daily_avg_vol')
    
    # Entries: Close > VWAP and volume > daily avg (first entry per day)
    entries = (close > daily_vwap) & (volume > daily_avg_vol)
    entries = entries & (~entries.shift(1))  # Avoid duplicate entries
    
    # Exits: Close < VWAP
    exits = close < daily_vwap
    return entries.astype(bool), exits.astype(bool)

# --------------------------
# Strategy 6: OBV Volume Strategy (OBV SMA 20)
# --------------------------
def obv_volume_strategy(close, volume):
    # Compute OBV (On-Balance Volume)
    obv = pd.Series(0, index=close.index, name='obv')
    obv.iloc[0] = 0
    for i in range(1, len(close)):
        if close.iloc[i] > close.iloc[i-1]:
            obv.iloc[i] = obv.iloc[i-1] + volume.iloc[i]
        else:
            obv.iloc[i] = obv.iloc[i-1] - volume.iloc[i]
    
    # Compute OBV SMA using .ma() accessor
    obv_sma = obv.vbt.ma(window=20, ma_type='sma')
    
    # Entries/Exits: OBV crosses above/below SMA
    entries = cross_above(obv, obv_sma)
    exits = cross_below(obv, obv_sma)
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

results = {}
cum_returns = []

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
    
    # Align entries/exits with close index (ensure same length)
    entries = entries.reindex(close.index, fill_value=False)
    exits = exits.reindex(close.index, fill_value=False)
    
    # Backtest portfolio
    try:
        portfolio = vbt.Portfolio.from_signals(
            close,
            entries,
            exits,
            fees=fees,
            slippage=slippage,
            initial_cash=initial_cash
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
    
    results[name] = {
        "Total Return (%)": f"{total_return:.2f}%",
        "Win Rate (%)": f"{win_rate:.2f}%",
        "Max Drawdown (%)": f"{max_drawdown:.2f}%",
        "Sharpe Ratio": f"{sharpe_ratio:.2f}",
        "Avg Trade Duration (hours)": f"{avg_duration:.2f}",
        "Trades": num_trades
    }
    
    # Compute cumulative returns for visualization
    returns_series = portfolio.returns()
    cum_ret = (returns_series + 1).cumprod() * initial_cash - initial_cash
    cum_returns.append(cum_ret.rename(name))

# Convert results to DataFrame and print
results_df = pd.DataFrame(results).T
print("Strategy Performance Metrics (Last 5 Years):")
print(results_df)

# Visualize cumulative returns
if cum_returns:
    cum_returns = pd.concat(cum_returns, axis=1).fillna(0)
    plt.figure(figsize=(12, 6))
    for col in cum_returns.columns:
        plt.plot(cum_returns[col], label=col)
    plt.title("Solana 4h Strategy Portfolio Value Comparison")
    plt.xlabel("Time")
    plt.ylabel("Portfolio Value ($)")
    plt.legend()
    plt.grid(True)
    plt.show()
else:
    print("No valid strategies to visualize.")