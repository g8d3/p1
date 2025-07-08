import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from sqlalchemy.ext.automap import automap_base
from sqlalchemy import inspect, create_engine, MetaData
from sqlalchemy.orm import RelationshipProperty # Import RelationshipProperty to identify relationship properties

# Initialize SQLAlchemy instance globally.
# This instance will be initialized with the Flask app later.
db = SQLAlchemy()

def init(db_url):
    """
    Initializes a Flask application with Flask-Admin, connecting to the
    specified database URL. It dynamically creates admin views for all
    tables found in the database schema, ensuring relationship columns
    and inputs are properly displayed.

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
                    # Use SQLAlchemy's inspect to get details about the mapped class
                    inspector = inspect(mapped_class)

                    # Get all column keys (e.g., 'id', 'name', 'user_id')
                    column_keys = [c.key for c in inspector.columns]

                    # Get all relationship property keys (e.g., 'user', 'posts')
                    # We check for RelationshipProperty type to identify actual relationships
                    relationship_keys = [p.key for p in inspector.iterate_properties if isinstance(p, RelationshipProperty)]

                    # Combine all column keys and relationship keys.
                    # This ensures that both regular database columns and the
                    # dynamically created relationship attributes are included
                    # in the Flask-Admin views.
                    # We use a list comprehension to avoid adding duplicate keys
                    # if a relationship key somehow matched a column key (unlikely).
                    all_display_and_form_columns = column_keys + [key for key in relationship_keys if key not in column_keys]

                    # Add a ModelView for the mapped class.
                    # We explicitly set column_list and form_columns to ensure
                    # relationships are displayed and have input fields.
                    admin.add_view(ModelView(
                        mapped_class,
                        db.session,
                        name=table_name.capitalize(),
                        column_list=all_display_and_form_columns, # For displaying columns in the list view
                        form_columns=all_display_and_form_columns # For displaying inputs in create/edit forms
                    ))
                    print(f"  - Successfully added view for table: '{table_name}' with columns: {all_display_and_form_columns}")
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
