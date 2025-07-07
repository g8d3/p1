import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from sqlalchemy.ext.automap import automap_base
from sqlalchemy import inspect, create_engine, MetaData

# Initialize SQLAlchemy instance globally.
# This instance will be initialized with the Flask app later.
db = SQLAlchemy()

def create_sample_db(db_path):
    """
    Creates a sample SQLite database with 'users' and 'products' tables
    and populates them with some initial data.
    This function is useful for testing the dynamic admin interface.
    """
    # Remove existing database file if it exists to ensure a fresh start
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")

    # Create a temporary Flask app context to initialize SQLAlchemy and create tables
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    with app.app_context():
        # Define simple SQLAlchemy models for demonstration purposes
        class User(db.Model):
            __tablename__ = 'users' # Explicitly set table name
            id = db.Column(db.Integer, primary_key=True)
            name = db.Column(db.String(80), unique=True, nullable=False)
            email = db.Column(db.String(120), unique=True, nullable=False)

            def __repr__(self):
                return f'<User {self.name}>'

        class Product(db.Model):
            __tablename__ = 'products' # Explicitly set table name
            id = db.Column(db.Integer, primary_key=True)
            name = db.Column(db.String(80), unique=True, nullable=False)
            price = db.Column(db.Float, nullable=False)

            def __repr__(self):
                return f'<Product {self.name}>'

        # Create all defined tables in the database
        db.create_all()

        # Add some sample data to the tables
        user1 = User(name='Alice', email='alice@example.com')
        user2 = User(name='Bob', email='bob@example.com')
        product1 = Product(name='Laptop', price=1200.00)
        product2 = Product(name='Mouse', price=25.50)
        product3 = Product(name='Keyboard', price=75.00)

        db.session.add_all([user1, user2, product1, product2, product3])
        db.session.commit()
    print(f"Sample database '{db_path}' created and populated successfully.")


def init(db_url):
    """
    Initializes a Flask application with Flask-Admin, connecting to the
    specified database URL. It dynamically creates admin views for all
    tables found in the database schema.

    Args:
        db_url (str): The SQLAlchemy database connection string (e.g., 'sqlite:///a.db').
    """
    custom_instance_path = os.path.abspath(os.getcwd())
    app = Flask(__name__, instance_path=custom_instance_path)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    # A secret key is required for Flask sessions, which Flask-Admin uses.
    app.config['SECRET_KEY'] = 'your_super_secret_key_here_please_change_this_in_production'

    # Initialize the SQLAlchemy instance with the Flask app
    db.init_app(app)

    # Initialize Flask-Admin with the Flask app
    # 'bootstrap3' template mode is used for a clean, responsive UI
    admin = Admin(app, name='Dynamic DB Admin', template_mode='bootstrap3')

    # Use app_context to ensure database operations are within the Flask application context
    with app.app_context():
        try:
            # Reflect the database schema. This populates db.metadata with table information.
            db.metadata.reflect(bind=db.engine)
            print(f"Successfully reflected database schema from: {db_url}")

            # Use automap_base to create Python classes from the reflected database tables.
            Base = automap_base(metadata=db.metadata)
            # Prepare the automap base, mapping tables to classes
            Base.prepare(db.engine, reflect=True)

            # Iterate through all reflected tables and add them as ModelViews to Flask-Admin
            print("Attempting to add admin views for detected tables:")
            for table_name in db.metadata.tables.keys():
                try:
                    # Get the dynamically mapped class for the current table
                    mapped_class = Base.classes[table_name]
                    # Add a ModelView for the mapped class.
                    # The name in the admin interface will be the capitalized table name.
                    admin.add_view(ModelView(mapped_class, db.session, name=table_name.capitalize()))
                    print(f"  - Successfully added view for table: '{table_name}'")
                except KeyError:
                    print(f"  - Warning: No mapped class found for table '{table_name}'. Skipping.")
                except Exception as e:
                    print(f"  - Error adding view for table '{table_name}': {e}")

        except Exception as e:
            print(f"Error reflecting database or adding views: {e}")
            print("Please ensure the database URL is correct and the database exists.")

    # Start the Flask development server.
    # debug=True enables debug mode, which provides helpful error messages and auto-reloads.
    print("\n---------------------------------------------------------")
    print(f"Flask-Admin interface is now running at: http://127.0.0.1:5000/admin/")
    print("Press Ctrl+C to stop the server.")
    print("---------------------------------------------------------")
    app.run(debug=True)

