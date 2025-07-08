import os
import json
from flask import Flask, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from sqlalchemy.ext.automap import automap_base
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker

# This will be the global instance of our framework
_framework_instance = None

class _DynamicAdminFramework: # Renamed with leading underscore to suggest internal use
    def __init__(self):
        self.app = None
        self.db = None
        self.admin = None
        self.config_db_uri = None
        self.app_db_uri = None
        self.framework_settings = {} # To store settings loaded from config DB

    def init(self, config_dict=None):
        """
        Initializes and runs the Flask application.
        Loads configuration from config_dict or environment variables.
        """
        self.app = Flask(__name__) # Create Flask app internally

        # 1. Load Configuration
        self._load_app_config(config_dict)

        # 2. Initialize Framework's Internal DB Connection for Config
        self.config_engine = create_engine(self.app.config['CONFIG_DB_URI'])
        self.ConfigSession = sessionmaker(bind=self.config_engine)

        # 3. Load Framework Settings from the Config Database
        self.framework_settings = self._load_framework_settings()

        # Apply settings loaded from DB (e.g., app_name, secret_key, admin_base_url)
        # Prioritize config_dict/env over DB for base Flask settings, but DB for UI/Admin settings
        self.app.config['SECRET_KEY'] = self.app.config.get('SECRET_KEY', self.framework_settings.get('secret_key', os.urandom(24)))
        self.app.name = self.framework_settings.get('app_name', 'Dynamic Admin App')

        # 4. Initialize Flask-SQLAlchemy for the Application Data
        self.db = SQLAlchemy(self.app) # Uses app.config['SQLALCHEMY_DATABASE_URI']

        # 5. Initialize Flask-Admin
        self.admin = Admin(
            self.app,
            name=self.framework_settings.get('app_name', 'Dynamic Admin'),
            template_mode='bootstrap3',
            url=self.framework_settings.get('admin_base_url', '/admin')
        )

        # 6. Register dynamic models and admin views
        self._register_dynamic_models()

        # 7. Set up default redirect
        @self.app.route('/')
        def index_redirect():
            return redirect(url_for('admin.index'))

        # 8. Run the Flask application
        # This will block execution until the app stops
        self.app.run(
            debug=self.app.config.get('DEBUG', False),
            host=self.app.config.get('HOST', '127.0.0.1'),
            port=self.app.config.get('PORT', 5000)
        )

    def _load_app_config(self, config_dict):
        """Loads application-wide Flask configurations."""
        # Default configuration values
        defaults = {
            "SQLALCHEMY_DATABASE_URI": 'sqlite:///app_data.db',
            "CONFIG_DB_URI": 'sqlite:///config_db.db',
            "DEBUG": False,
            "HOST": '127.0.0.1',
            "PORT": 5000,
            "SECRET_KEY": os.urandom(24) # Random for dev, MUST be overridden in production
        }

        # Apply defaults
        for key, value in defaults.items():
            self.app.config[key] = value

        # Override with environment variables
        self.app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', self.app.config['SQLALCHEMY_DATABASE_URI'])
        self.app.config['CONFIG_DB_URI'] = os.environ.get('CONFIG_DB_URI', self.app.config['CONFIG_DB_URI'])
        self.app.config['DEBUG'] = os.environ.get('DEBUG', str(self.app.config['DEBUG'])).lower() in ('true', '1', 't')
        self.app.config['HOST'] = os.environ.get('HOST', self.app.config['HOST'])
        self.app.config['PORT'] = int(os.environ.get('PORT', self.app.config['PORT']))
        self.app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', self.app.config['SECRET_KEY']) # Prioritize env for secrets

        # Override with dictionary if provided (highest precedence)
        if config_dict:
            for key, value in config_dict.items():
                self.app.config[key] = value

        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Always False with modern Flask-SQLAlchemy

    # --- Remainder of the methods from previous response go here ---
    # _load_framework_settings(self)
    # _load_ui_table_configs(self)
    # _register_dynamic_models(self)
    # _add_navigation_menu(self)

    def _load_framework_settings(self):
        # ... (same implementation as before)
        settings = {}
        session = self.ConfigSession()
        try:
            meta = MetaData()
            meta.reflect(self.config_engine, only=['framework_settings'])
            if 'framework_settings' in meta.tables:
                settings_table = meta.tables['framework_settings']
                with self.config_engine.connect() as conn:
                    result = conn.execute(settings_table.select())
                    for row in result:
                        settings[row.setting_key] = row.setting_value
            else:
                print("Warning: 'framework_settings' table not found in config DB. Using defaults.")
        except Exception as e:
            print(f"Error loading framework settings from config DB: {e}")
        finally:
            session.close()
        return settings

    def _load_ui_table_configs(self):
        # ... (same implementation as before)
        configs = {}
        session = self.ConfigSession()
        try:
            meta = MetaData()
            meta.reflect(self.config_engine, only=['ui_table_configs'])
            if 'ui_table_configs' in meta.tables:
                ui_table = meta.tables['ui_table_configs']
                with self.config_engine.connect() as conn:
                    result = conn.execute(ui_table.select())
                    for row in result:
                        config = dict(row._mapping)
                        for key in ['column_labels']:
                            if config.get(key):
                                try: config[key] = json.loads(config[key])
                                except json.JSONDecodeError: pass
                        for key in ['column_list', 'column_searchable_list', 'column_filters', 'form_columns']:
                            if config.get(key): config[key] = [s.strip() for s in config[key].split(',')]
                            else: config[key] = None
                        configs[config['table_name']] = config
            else:
                print("Warning: 'ui_table_configs' table not found in config DB. Using default ModelViews.")
        except Exception as e:
            print(f"Error loading UI table configs from config DB: {e}")
        finally:
            session.close()
        return configs

    def _register_dynamic_models(self):
        # ... (same implementation as before)
        # Ensure app context for db.session
        with self.app.app_context():
            engine = create_engine(self.app.config['SQLALCHEMY_DATABASE_URI'])
            metadata = MetaData()

            try:
                metadata.reflect(engine)
            except Exception as e:
                print(f"Error reflecting application database: {e}")
                return

            Base = automap_base(metadata=metadata)
            Base.prepare()

            ui_configs = self._load_ui_table_configs()

            for table_name in metadata.tables.keys():
                if table_name in ['framework_settings', 'ui_table_configs', 'navigation_menu']:
                    continue

                model_class_name = ''.join(word.capitalize() for word in table_name.split('_'))
                # Automap uses table names as keys in Base.classes, not model class names
                if table_name in Base.classes:
                    model_class = Base.classes[table_name]
                    table_config = ui_configs.get(table_name, {})

                    dynamic_view_attrs = {
                        'column_list': table_config.get('column_list'),
                        'column_labels': table_config.get('column_labels'),
                        'column_searchable_list': table_config.get('column_searchable_list'),
                        'column_filters': table_config.get('column_filters'),
                        'form_columns': table_config.get('form_columns'),
                        'can_create': table_config.get('can_create', True),
                        'can_edit': table_config.get('can_edit', True),
                        'can_delete': table_config.get('can_delete', True),
                    }
                    dynamic_view_attrs = {k: v for k, v in dynamic_view_attrs.items() if v is not None}

                    DynamicModelView = type(
                        f"{model_class.__name__}AdminView",
                        (ModelView,),
                        dynamic_view_attrs
                    )

                    display_name = table_config.get('display_name', table_name.replace('_', ' ').title())
                    try:
                        self.admin.add_view(DynamicModelView(model_class, self.db.session, name=display_name))
                        print(f"Registered admin view for table: {table_name} as '{display_name}'")
                    except Exception as e:
                        print(f"Could not register admin view for {table_name}: {e}")
                else:
                    print(f"Warning: No automapped class found for table '{table_name}'. Skipping.")
        self._add_navigation_menu()

    def _add_navigation_menu(self):
        from flask_admin.base import MenuLink
        session = self.ConfigSession()
        try:
            meta = MetaData()
            meta.reflect(self.config_engine, only=['navigation_menu'])
            if 'navigation_menu' in meta.tables:
                nav_table = meta.tables['navigation_menu']
                with self.config_engine.connect() as conn:
                    result = conn.execute(nav_table.select().order_by(nav_table.c.display_order))
                    menu_items_data = [dict(row._mapping) for row in result]

                    for item_data in menu_items_data:
                        if item_data['target_table']:
                            view_found = False
                            for view in self.admin._views:
                                if isinstance(view, ModelView) and hasattr(view, 'model') and view.model.__table__.name == item_data['target_table']:
                                    # Optionally, you could add a category here if you want to group views, but do not use add_link(add_category(...))
                                    view_found = True
                                    break
                            if not view_found:
                                print(f"Warning: Menu item '{item_data['label']}' targets unknown table '{item_data['target_table']}'.")
                        elif item_data['url_path']:
                            self.admin.add_link(MenuLink(
                                name=item_data['label'],
                                url=item_data.get('url_path', '#'),
                                category=None,
                                icon_type='fa',
                                icon_value=item_data.get('icon_class', '')
                            ))
            else:
                print("Warning: 'navigation_menu' table not found in config DB. Default admin navigation will be used.")
        except Exception as e:
            print(f"Error loading navigation menu from config DB: {e}")
        finally:
            session.close()

# Expose the init function globally for the developer
_framework_instance = _DynamicAdminFramework()
init = _framework_instance.init