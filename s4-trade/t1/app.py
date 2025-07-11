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
        # TODO: Call browsermcp scraping and analysis logic here
        # For now, just pass config to results page
        return render_template('results.html', n=n, durations=durations, quantities=quantities, categories=CATEGORIES, results=None)
    return render_template('index.html', categories=CATEGORIES)

@app.route('/results')
def results():
    # Placeholder for results page
    return render_template('results.html', results=None)

if __name__ == '__main__':
    app.run(debug=True)
