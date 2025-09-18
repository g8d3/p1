import csv
import json
from collections import defaultdict

# Read the CSV file
data = defaultdict(lambda: {'total_return': [], 'max_drawdown': [], 'sharpe_ratio': [], 'win_rate': [], 'total_trades': []})

with open('/home/vuos/code/p1/s4-trade/t7/sol4h/backtest_results.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = (row['strategy'], row['params'])
        data[key]['total_return'].append(float(row['total_return']))
        data[key]['max_drawdown'].append(float(row['max_drawdown']))
        data[key]['sharpe_ratio'].append(float(row['sharpe_ratio']))
        data[key]['win_rate'].append(float(row['win_rate']))
        data[key]['total_trades'].append(int(row['total_trades']))

# Compute averages and scores
results = []
for (strategy, params), values in data.items():
    avg_return = sum(values['total_return']) / len(values['total_return'])
    avg_drawdown = sum(values['max_drawdown']) / len(values['max_drawdown'])
    avg_sharpe = sum(values['sharpe_ratio']) / len(values['sharpe_ratio'])
    avg_win_rate = sum(values['win_rate']) / len(values['win_rate'])
    avg_trades = sum(values['total_trades']) / len(values['total_trades'])
    score = (avg_return / (1 + abs(avg_drawdown))) * avg_win_rate
    results.append({
        'strategy': strategy,
        'params': params,
        'avg_return': avg_return,
        'avg_drawdown': avg_drawdown,
        'avg_sharpe': avg_sharpe,
        'avg_win_rate': avg_win_rate,
        'avg_trades': avg_trades,
        'score': score
    })

# Sort by score descending
results.sort(key=lambda x: x['score'], reverse=True)

# Top 5
top5 = results[:5]

print("Top 5 param sets by composite score:")
for i, r in enumerate(top5, 1):
    print(f"{i}. Strategy: {r['strategy']}, Params: {r['params']}")
    print(f"   Avg Return: {r['avg_return']:.4f}, Avg Drawdown: {r['avg_drawdown']:.4f}, Avg Sharpe: {r['avg_sharpe']:.4f}, Avg Win Rate: {r['avg_win_rate']:.4f}, Avg Trades: {r['avg_trades']:.1f}, Score: {r['score']:.4f}")
    print()

# Best recommendation
best = top5[0]
print(f"Recommended best strategy and params for robustness and risk management:")
print(f"Strategy: {best['strategy']}")
print(f"Params: {best['params']}")
print(f"Reason: Highest composite score ({best['score']:.4f}), balancing return, drawdown, and win rate.")