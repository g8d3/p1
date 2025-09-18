import pandas as pd
import vectorbt as vbt
import numpy as np
from datetime import datetime
import json
import random

# Load data
def load_data():
    df = pd.read_csv('solana_4h_ohlc.csv')
    df['datetime'] = pd.to_datetime(df['datetime'])
    df.set_index('datetime', inplace=True)
    return df

data = load_data()
price = data['close']

# Use random subsets for robustness testing
random.seed(42)

# Parameters to test
channel_lengths = [20, 50, 100]
trailing_pcts = [0.05, 0.1, 0.2]

strategies = [
    {
        'type': 'Channel Breakout',
        'params': [
            {'channel_length': cl, 'trailing_pct': tp}
            for cl in channel_lengths
            for tp in trailing_pcts
        ]
    }
]

results = []

num_samples = 10

for strategy in strategies:
    strat_type = strategy['type']
    for param_set in strategy['params']:
        for sample in range(num_samples):
            try:
                # Random subset: 500 candles
                start_idx = random.randint(0, len(price) - 500)
                sample_price = price.iloc[start_idx:start_idx + 500]

                channel_length = param_set['channel_length']
                trailing_pct = param_set['trailing_pct']

                # Calculate channel
                upper_channel = sample_price.rolling(window=channel_length).max().shift(1)
                lower_channel = sample_price.rolling(window=channel_length).min().shift(1)

                # Entry: break upper channel
                entries = sample_price > upper_channel

                # Exit: trailing stop
                exits = pd.Series(False, index=sample_price.index)

                # Create portfolio
                pf = vbt.Portfolio.from_signals(
                    sample_price,
                    entries,
                    exits,
                    init_cash=10000,
                    fees=0.001,
                    sl_trail=trailing_pct,
                    freq='4h'
                )

                # Collect metrics
                result = {
                    'strategy': strat_type,
                    'params': json.dumps(param_set),
                    'sample': sample,
                    'total_return': pf.total_return(),
                    'max_drawdown': pf.max_drawdown(),
                    'sharpe_ratio': pf.sharpe_ratio(),
                    'win_rate': pf.trades.win_rate(),
                    'total_trades': len(pf.trades.records)
                }
                results.append(result)
                print(f"Completed {strat_type} with params {param_set}, sample {sample}")

            except Exception as e:
                print(f"Error with {strat_type} {param_set}, sample {sample}: {e}")

# Buy and hold benchmark
bh_pf = vbt.Portfolio.from_holding(price, init_cash=10000, freq='4h')
bh_return = bh_pf.total_return()
bh_drawdown = bh_pf.max_drawdown()
print(f"Buy and Hold Return: {bh_return:.2%}")
print(f"Buy and Hold Drawdown: {bh_drawdown:.2%}")

# Analyze results
results_df = pd.DataFrame(results)

# Group by strategy and params, average metrics
grouped = results_df.groupby(['strategy', 'params']).agg({
    'total_return': 'mean',
    'max_drawdown': 'mean',
    'sharpe_ratio': 'mean',
    'win_rate': 'mean',
    'total_trades': 'mean'
}).reset_index()

# Filter out params with no trades
grouped = grouped[grouped['total_trades'] > 0]

# Calculate score relative to buy and hold
grouped['excess_return'] = grouped['total_return'] - bh_return
grouped['score'] = (grouped['excess_return'] / (1 + grouped['max_drawdown'].abs())) * grouped['win_rate']

# Find best
best = grouped.loc[grouped['score'].idxmax()]
print(f"Best strategy: {best['strategy']}")
print(f"Best params: {best['params']}")
print(f"Avg Return: {best['total_return']:.2%} (BH: {bh_return:.2%})")
print(f"Avg Drawdown: {best['max_drawdown']:.2%} (BH: {bh_drawdown:.2%})")
print(f"Avg Win Rate: {best['win_rate']:.2%}")
print(f"Excess Return: {best['excess_return']:.2%}")
print(f"Score: {best['score']:.4f}")
print(f"Data range: {price.index.min()} to {price.index.max()}")

# Save to CSV
results_df.to_csv('channel_results.csv', index=False)
grouped.to_csv('channel_summary.csv', index=False)
print("Results saved to channel_results.csv and channel_summary.csv")

# Generate single HTML report for best
import plotly.graph_objects as go
from plotly.subplots import make_subplots

best_params = json.loads(best['params'])
strat_type = best['strategy']

# Run on full data for plotting
channel_length = best_params['channel_length']
trailing_pct = best_params['trailing_pct']

upper_channel = price.rolling(window=channel_length).max()
lower_channel = price.rolling(window=channel_length).min()
entries = price > upper_channel.shift(1)
exits = pd.Series(False, index=price.index)

pf = vbt.Portfolio.from_signals(
    price,
    entries,
    exits,
    init_cash=10000,
    fees=0.001,
    sl_trail=trailing_pct,
    freq='4h'
)

# Create subplots
fig = make_subplots(
    rows=3, cols=1,
    subplot_titles=('Portfolio Value', 'Drawdown', 'Trades'),
    shared_xaxes=True
)

# Portfolio value
value_trace = go.Scatter(x=pf.value().index, y=pf.value().values, mode='lines', name='Portfolio Value')
fig.add_trace(value_trace, row=1, col=1)

# Drawdown
drawdown_trace = go.Scatter(x=pf.drawdown().index, y=pf.drawdown().values, mode='lines', name='Drawdown', fill='tozeroy')
fig.add_trace(drawdown_trace, row=2, col=1)

# Trades
trades_df = pf.trades.records_readable
if not trades_df.empty:
    trades_trace = go.Scatter(x=trades_df.index, y=trades_df['Return'], mode='markers', name='Trades',
                              marker=dict(color=trades_df['Return'].apply(lambda x: 'green' if x > 0 else 'red')))
    fig.add_trace(trades_trace, row=3, col=1)

# Add title with params
title = f"Best Strategy: {strat_type}<br>Params: {best['params']}<br>Return: {best['total_return']:.2%} (BH: {bh_return:.2%}), Drawdown: {best['max_drawdown']:.2%} (BH: {bh_drawdown:.2%}), Win Rate: {best['win_rate']:.2%}, Score: {best['score']:.4f}<br>Data: {price.index.min()} to {price.index.max()}"

fig.update_layout(title=title, height=900)

fig.write_html('channel_report.html')
print("Report saved to channel_report.html")