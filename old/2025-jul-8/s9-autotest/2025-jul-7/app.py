# app.py (Option 1: Explicit config_dict)
import framework
import os

config_dict = {
  "SQLALCHEMY_DATABASE_URI": os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///app_data.db'),
  "CONFIG_DB_URI": os.environ.get('CONFIG_DB_URI', 'sqlite:///config_db.db'),
  "DEBUG": True, # Flask uses uppercase for config keys
  "SECRET_KEY": os.environ.get('FLASK_SECRET_KEY', 'a_default_secret_key_for_dev') # Critical for security!
}

framework.init(config_dict)