from flask import Flask, render_template, request, jsonify
import sqlite3
import psycopg2
import mysql.connector

app = Flask(__name__)

# In-memory store for credentials (for demo)
db_credentials = []

@app.route('/')
def index():
    return render_template('index.html', credentials=db_credentials)

@app.route('/add-credential', methods=['POST'])
def add_credential():
    cred = {
        'type': request.form['type'],
        'host': request.form['host'],
        'port': request.form['port'],
        'user': request.form['user'],
        'password': request.form['password'],
        'database': request.form['database']
    }
    db_credentials.append(cred)
    return render_template('partials/credentials.html', credentials=db_credentials)

@app.route('/connect', methods=['POST'])
def connect():
    idx = int(request.form['idx'])
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
            return "Unknown DB type", 400
        return render_template('partials/tables.html', tables=tables, idx=idx)
    except Exception as e:
        return f"Error: {e}", 400

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
            return "Unknown DB type", 400
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {table} LIMIT 20;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        conn.close()
        return render_template('partials/table_data.html', columns=columns, rows=rows, table=table)
    except Exception as e:
        return f"Error: {e}", 400

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
        elif cred['type'] == 'postgres':
            conn = psycopg2.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], dbname=cred['database']
            )
        elif cred['type'] == 'mysql':
            conn = mysql.connector.connect(
                host=cred['host'], port=cred['port'], user=cred['user'], password=cred['password'], database=cred['database']
            )
        else:
            return "Unknown DB type", 400
        cur = conn.cursor()
        placeholders = ','.join(['%s' if cred['type'] != 'sqlite' else '?' for _ in columns])
        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
        cur.execute(sql, values)
        conn.commit()
        conn.close()
        return "Row inserted successfully"
    except Exception as e:
        return f"Error: {e}", 400

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
            return "Unknown DB type", 400
        cur = conn.cursor()
        sql = f"DELETE FROM {table} WHERE {pk_col} = %s" if cred['type'] != 'sqlite' else f"DELETE FROM {table} WHERE {pk_col} = ?"
        cur.execute(sql, (pk_val,))
        conn.commit()
        conn.close()
        return "Row deleted successfully"
    except Exception as e:
        return f"Error: {e}", 400

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
            return "Unknown DB type", 400
        cur = conn.cursor()
        sql = f"CREATE TABLE {table} ({columns})"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return "Table created successfully"
    except Exception as e:
        return f"Error: {e}", 400

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
            return "Unknown DB type", 400
        cur = conn.cursor()
        sql = f"DROP TABLE {table}"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return "Table dropped successfully"
    except Exception as e:
        return f"Error: {e}", 400

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
            return "Unknown DB type", 400
        cur = conn.cursor()
        sql = f"ALTER TABLE {table} ADD COLUMN {column_def}"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return "Column added successfully"
    except Exception as e:
        return f"Error: {e}", 400

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
            return "Unknown DB type", 400
        cur = conn.cursor()
        if cred['type'] == 'sqlite':
            return "SQLite does not support DROP COLUMN directly", 400
        sql = f"ALTER TABLE {table} DROP COLUMN {column}"
        cur.execute(sql)
        conn.commit()
        conn.close()
        return "Column dropped successfully"
    except Exception as e:
        return f"Error: {e}", 400

if __name__ == '__main__':
    app.run(debug=True)
