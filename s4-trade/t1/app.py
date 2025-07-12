from flask import Flask, render_template, request, redirect, url_for, flash
import os
import json
import requests

app = Flask(__name__)
app.secret_key = 'change_this_secret_key'

def load_mcp_config():
    mcp_config_path = os.path.join(os.path.dirname(__file__), 'mcp_servers.json')
    if os.path.exists(mcp_config_path):
        with open(mcp_config_path, 'r') as f:
            text = f.read()
        # Remove comments
        import re
        text = re.sub(r'//.*', '', text)
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
        try:
            return json.loads(text)
        except Exception:
            return None
    return None



@app.route('/', methods=['GET', 'POST'])
def index():
    mcp_config_path = os.path.join(os.path.dirname(__file__), 'mcp_servers.json')
    mcp_config = ''
    if os.path.exists(mcp_config_path):
        with open(mcp_config_path, 'r') as f:
            mcp_config = f.read()

    config_obj = load_mcp_config()
    categories = config_obj.get('categories', []) if config_obj else []

    if request.method == 'POST':
        if 'save_mcp_config' in request.form:
            new_config = request.form.get('mcp_config', '')
            def strip_json_comments(text):
                import re
                text = re.sub(r'//.*', '', text)
                text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
                return text
            try:
                config_no_comments = strip_json_comments(new_config)
                json.loads(config_no_comments)  # Validate JSON
                with open(mcp_config_path, 'w') as f:
                    f.write(new_config)
                flash('MCP config saved! (comments allowed)', 'success')
                mcp_config = new_config
            except Exception as e:
                flash(f'Error saving MCP config: {e}', 'error')
        else:
            n = int(request.form.get('n', 10))
            durations = request.form.get('durations', '1d,4h,1h').split(',')
            quantities = request.form.get('quantities', '30').split(',')

            results = []
            if config_obj:
                mcp_server = config_obj.get('server', {})
                endpoint = mcp_server.get('endpoint', '')
                url = mcp_server.get('url', '')
                headers = mcp_server.get('headers', {})
                payload = {
                    'categories': categories,
                    'n': n,
                    'durations': durations,
                    'quantities': quantities
                }
                try:
                    resp = requests.post(url + endpoint, json=payload, headers=headers, timeout=60)
                    if resp.status_code == 200:
                        results = resp.json().get('results', [])
                    else:
                        flash(f'MCP server error: {resp.text}', 'error')
                except Exception as e:
                    flash(f'Error contacting MCP server: {e}', 'error')
            else:
                flash('Invalid MCP config.', 'error')
            return render_template('results.html', n=n, durations=durations, quantities=quantities, categories=categories, results=results)
    return render_template('index.html', categories=categories, mcp_config=mcp_config)

@app.route('/results')
def results():
    # Placeholder for results page
    return render_template('results.html', results=None)

if __name__ == '__main__':
    app.run(debug=True)
