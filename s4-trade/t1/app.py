from flask import Flask, render_template, request, redirect, url_for
import os

app = Flask(__name__)

# Configurable categories
CATEGORIES = [
    ("Artificial Intelligence", "https://www.coingecko.com/en/categories/artificial-intelligence"),
    ("Real World Assets (RWA)", "https://www.coingecko.com/en/categories/real-world-assets-rwa"),
    ("DePIN", "https://www.coingecko.com/en/categories/depin"),
    ("AI Agents", "https://www.coingecko.com/en/categories/ai-agents"),
    ("Meme Token", "https://www.coingecko.com/en/categories/meme-token"),
]

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        n = int(request.form.get('n', 10))
        durations = request.form.get('durations', '1d,4h,1h').split(',')
        quantities = request.form.get('quantities', '30').split(',')

        # --- browsermcp scraping stub ---
        # Replace this stub with actual browsermcp tool calls
        results = []
        for name, url in CATEGORIES:
            # Simulate extracted data for demo
            category_results = []
            for i in range(n):
                category_results.append({
                    'coin': f'Coin_{i+1}_{name}',
                    'change_24h': f'{5+i*2:.2f}%',
                    'vol_24h': f'{10000+i*5000}',
                    'link': f'{url}/en/coins/coin_{i+1}_{name.lower().replace(" ", "_")}'
                })
            results.append({'category': name, 'items': category_results})

        return render_template('results.html', n=n, durations=durations, quantities=quantities, categories=CATEGORIES, results=results)
    return render_template('index.html', categories=CATEGORIES)

@app.route('/results')
def results():
    # Placeholder for results page
    return render_template('results.html', results=None)

if __name__ == '__main__':
    app.run(debug=True)
