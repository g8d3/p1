# Flask-Admin Dynamic Framework

This folder contains `framework.py`, a utility to automatically generate a Flask-Admin interface for any SQLAlchemy-compatible database (e.g., SQLite, PostgreSQL, MySQL) by reflecting its schema and creating admin views for all tables.

## Features
- Auto-detects all tables and relationships in the database.
- Dynamically generates Flask-Admin views for each table.
- Handles relationship columns and avoids common Flask-Admin 1.6.1 form errors.
- Works with SQLite (absolute path auto-detection) and other SQLAlchemy-supported databases.

## Usage

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the admin interface:**
   ```python
   from framework import init
   init('sqlite:///relative_or_absolute_path_to_your.db')
   # Or for other DBs: init('postgresql://user:pass@host/dbname')
   ```

3. **Access the admin UI:**
   Open [http://127.0.0.1:5000/admin/](http://127.0.0.1:5000/admin/) in your browser.

## Notes
- The `SECRET_KEY` in `framework.py` should be changed for production use.
- The database file path for SQLite is resolved relative to this folder.
- Compatible with Flask-Admin 1.6.1 and SQLAlchemy automap.

## License
MIT or similar. Modify as needed.
