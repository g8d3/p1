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
    and inputs are properly displayed, compatible with Flask-Admin 1.6.1.

    Args:
        db_url (str): The SQLAlchemy database connection string (e.g., 'sqlite:///a.db').
                      This will be converted to an absolute path for SQLite.
    """
    # Get the directory where this framework.py file is located
    base_dir = os.path.abspath(os.path.dirname(__file__))
    print(f"Framework base directory: {base_dir}")

    # Let SQLAlchemy handle the DB URL as provided
    print(f"Using DB URI: {db_url}")

    app = Flask(__name__)
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
            print(f"Tables found in db.metadata after reflection: {list(db.metadata.tables.keys())}")

            # Use automap_base to create Python classes from the reflected database tables.
            Base = automap_base(metadata=db.metadata)
            # Prepare the automap base, mapping tables to classes
            Base.prepare(db.engine, reflect=True)
            print(f"Classes mapped by automap_base: {list(Base.classes.keys())}")


            # Iterate through all reflected tables and add them as ModelViews to Flask-Admin
            print("Attempting to add admin views for detected tables:")
            if not db.metadata.tables:
                print("  - No tables were reflected from the database. This means the database file might be empty or inaccessible.")
            else:
                for table_name in db.metadata.tables.keys():
                    try:
                        # Get the dynamically mapped class for the current table
                        mapped_class = Base.classes[table_name]
                        print(f"  - Processing table: '{table_name}'")
                        # Use SQLAlchemy's inspect to get details about the mapped class
                        inspector = inspect(mapped_class)

                        # Get all column keys (e.g., 'id', 'name', 'user_id')
                        column_keys = [c.key for c in inspector.columns]
                        print(f"    - Columns detected for '{table_name}': {column_keys}")

                        # Get all relationship property keys (e.g., 'user', 'posts')
                        # We check for RelationshipProperty type to identify actual relationships
                        relationship_keys = [p.key for p in inspector.iterate_properties if isinstance(p, RelationshipProperty)]
                        print(f"    - Relationships detected for '{table_name}': {relationship_keys}")

                        # For column_list (display in table view), include both columns and relationships
                        all_display_columns = column_keys + [key for key in relationship_keys if key not in column_keys]

                        # For form_columns (inputs in create/edit forms), include only direct columns.
                        # Flask-Admin usually handles simple foreign key columns automatically.
                        all_form_columns = column_keys

                        # Explicitly exclude relationship names from the form altogether
                        # This is to prevent the 'AttributeError: 'tuple' object has no attribute 'items''
                        # which can occur when Flask-Admin 1.6.1 tries to build form fields for relationship objects.
                        form_excluded_columns = relationship_keys

                        # --- FIX for Flask-Admin 1.6.1 Compatibility ---
                        # For older Flask-Admin versions, column_list, form_columns, and form_excluded_columns
                        # are attributes of the ModelView class, not constructor arguments.
                        # We create a dynamic ModelView class for each table.
                        class DynamicModelView(ModelView):
                            # Set column_list and form_columns as class attributes
                            column_list = all_display_columns
                            form_columns = all_form_columns
                            form_excluded_columns = form_excluded_columns # Add this line

                        # Add the dynamically created ModelView class
                        admin.add_view(DynamicModelView(
                            mapped_class,
                            db.session,
                            name=table_name.capitalize()
                        ))
                        # --- END FIX ---

                        print(f"  - Successfully added view for table: '{table_name}' for display: {all_display_columns}, form: {all_form_columns}, and excluded: {form_excluded_columns}")
                    except KeyError:
                        print(f"  - Warning: No mapped class found for table '{table_name}'. Skipping. This usually means the table exists but wasn't mapped by automap_base.")
                    except Exception as e:
                        print(f"  - Error adding view for table '{table_name}': {e}")

        except Exception as e:
            print(f"Error reflecting database or adding views: {e}")
            print("Please ensure the database URL is correct and the database exists and contains tables.")

    # Start the Flask development server.
    # debug=True enables debug mode, which provides helpful error messages and auto-reloads.
    print("\n---------------------------------------------------------")
    print(f"Flask-Admin interface is now running at: http://127.0.0.1:5000/admin/")
    print("Press Ctrl+C to stop the server.")
    print("---------------------------------------------------------")
    app.run(debug=True)
