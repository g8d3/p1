from flask import Flask, render_template, request, jsonify
import sqlite3
import psycopg2
import mysql.connector
import os

app = Flask(__name__)

# Endpoint to get credentials as JSON
@app.route('/credentials', methods=['GET'])
def get_credentials():
    return render_template('partials/credentials.html', credentials=db_credentials)
from flask import Flask, render_template, request, jsonify
import sqlite3
import psycopg2
import mysql.connector
import os

app = Flask(__name__)

# Path for the credentials SQLite database
CRED_DB_PATH = os.path.join(os.path.dirname(__file__), 'credentials.db')

# In-memory store for credentials (for demo)
db_credentials = []

def init_cred_db():
    conn = sqlite3.connect(CRED_DB_PATH)
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, host TEXT, port TEXT, user TEXT, password TEXT, database TEXT
    )''')
    conn.commit()
    conn.close()

def load_credentials():
    conn = sqlite3.connect(CRED_DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT type, host, port, user, password, database FROM credentials')
    creds = [dict(zip(['type','host','port','user','password','database'], row)) for row in cur.fetchall()]
    conn.close()
    return creds

def save_credential(cred):
    conn = sqlite3.connect(CRED_DB_PATH)
    cur = conn.cursor()
    cur.execute('INSERT INTO credentials (type, host, port, user, password, database) VALUES (?, ?, ?, ?, ?, ?)',
                (cred['type'], cred['host'], cred['port'], cred['user'], cred['password'], cred['database']))
    conn.commit()
    conn.close()

# Initialize and load credentials from the database
init_cred_db()
db_credentials = load_credentials()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add-credential', methods=['POST'])
def add_credential():
    data = request.json
    cred = {
        'type': data['type'],
        'host': data['host'],
        'port': data['port'],
        'user': data['user'],
        'password': data['password'],
        'database': data['database']
    }
    db_credentials.append(cred)
    save_credential(cred)
    # Return updated credentials partial for htmx swap
    return render_template('partials/credentials.html', credentials=db_credentials)

@app.route('/connect', methods=['POST'])
def connect():
    data = request.json
    idx = int(data['idx'])
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cur.fetchall()]
            conn.close()
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            tables = [row[0] for row in cur.fetchall()]
            conn.close()
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
            cur = conn.cursor()
            cur.execute("SHOW TABLES;")
            tables = [row[0] for row in cur.fetchall()]
            conn.close()
        else:
            return jsonify({'error': 'Unknown DB type'}), 400
        return jsonify({'tables': tables, 'idx': idx, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/table-data', methods=['POST'])
def table_data():
    idx = int(request.form['idx'])
    table = request.form['table']
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return jsonify({'columns': [], 'rows': [], 'table': table, 'idx': idx, 'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {table} LIMIT 20;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        conn.close()
        return jsonify({'columns': columns, 'rows': rows, 'table': table, 'idx': idx, 'success': True})
    except Exception as e:
        return jsonify({'columns': [], 'rows': [], 'table': table, 'idx': idx, 'error': str(e)}), 400

@app.route('/insert-row', methods=['POST'])
def insert_row():
    idx = int(request.form['idx'])
    table = request.form['table']
    cred = db_credentials[idx]
    columns = request.form.getlist('columns')
    values = [request.form.get(col) for col in columns]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
            placeholder = '?'
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
            placeholder = '%s'
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
            placeholder = '%s'
        else:
            return jsonify({'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        placeholders = ','.join([placeholder for _ in columns])
        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
        cur.execute(sql, values)
        conn.commit()
        # Fetch updated table data
        cur.execute(f"SELECT * FROM {table} LIMIT 20;")
        rows = cur.fetchall()
        columns2 = [desc[0] for desc in cur.description]
        conn.close()
        return jsonify({'columns': columns2, 'rows': rows, 'table': table, 'idx': idx, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/delete-row', methods=['POST'])
def delete_row():
    idx = int(request.form['idx'])
    table = request.form['table']
    pk_col = request.form['pk_col']
    pk_val = request.form['pk_val']
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return jsonify({'columns': [], 'rows': [], 'table': table, 'idx': idx, 'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        sql = f"DELETE FROM {table} WHERE {pk_col} = %s" if cred['type'] != 'sqlite' else f"DELETE FROM {table} WHERE {pk_col} = ?"
        cur.execute(sql, (pk_val,))
        conn.commit()
        # Fetch updated table data
        cur.execute(f"SELECT * FROM {table} LIMIT 20;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        conn.close()
        return jsonify({'columns': columns, 'rows': rows, 'table': table, 'idx': idx, 'success': True})
    except Exception as e:
        return jsonify({'columns': [], 'rows': [], 'table': table, 'idx': idx, 'error': str(e)}), 400

@app.route('/create-table', methods=['POST'])
def create_table():
    idx = int(request.form['idx'])
    table = request.form['table']
    columns = request.form['columns']  # e.g. "id INTEGER PRIMARY KEY, name TEXT"
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return jsonify({'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        sql = f"CREATE TABLE {table} ({columns})"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Table created successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/drop-table', methods=['POST'])
def drop_table():
    idx = int(request.form['idx'])
    table = request.form['table']
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return jsonify({'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        sql = f"DROP TABLE {table}"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Table dropped successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/add-column', methods=['POST'])
def add_column():
    idx = int(request.form['idx'])
    table = request.form['table']
    column_def = request.form['column_def']  # e.g. "age INTEGER"
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return jsonify({'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        sql = f"ALTER TABLE {table} ADD COLUMN {column_def}"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Column added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/drop-column', methods=['POST'])
def drop_column():
    idx = int(request.form['idx'])
    table = request.form['table']
    column = request.form['column']
    cred = db_credentials[idx]
    try:
        if cred['type'] == 'sqlite':
            conn = sqlite3.connect(cred['database'])
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return jsonify({'error': 'Unknown DB type'}), 400
        cur = conn.cursor()
        if cred['type'] == 'sqlite':
            return jsonify({'error': 'SQLite does not support DROP COLUMN directly'}), 400
        sql = f"ALTER TABLE {table} DROP COLUMN {column}"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Column dropped successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
