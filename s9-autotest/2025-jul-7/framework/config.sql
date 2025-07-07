-- Table: framework_settings (Global settings)
CREATE TABLE framework_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT
);

-- Example Data for framework_settings:
-- INSERT INTO framework_settings (setting_key, setting_value) VALUES ('app_name', 'My Dynamic Admin');
-- INSERT INTO framework_settings (setting_key, setting_value) VALUES ('admin_base_url', '/admin');
-- INSERT INTO framework_settings (setting_key, setting_value) VALUES ('secret_key', 'super_secret_dev_key'); -- In production, use environment variables!

-- Table: ui_table_configs (UI settings per application table)
CREATE TABLE ui_table_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Or SERIAL for PostgreSQL
    table_name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255), -- E.g., "User Accounts" instead of "users"
    can_create BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    column_list TEXT, -- Comma-separated list of columns to display (e.g., "id,name,email")
    column_labels TEXT, -- JSON string for custom labels (e.g., '{"id": "User ID", "name": "Full Name"}')
    column_searchable_list TEXT, -- Comma-separated list for search
    column_filters TEXT, -- Comma-separated list for filters
    form_columns TEXT, -- Comma-separated list for form fields
    -- Add more Flask-Admin ModelView properties as needed
    -- For relationships, you might need a separate table or more complex JSON
    -- e.g., '{"user": {"fields": ["first_name", "last_name"]}}'
    UNIQUE(table_name)
);

-- Example Data for ui_table_configs:
-- Assuming you have a 'users' table in your application data schema
-- INSERT INTO ui_table_configs (table_name, display_name, column_list, column_labels, column_searchable_list)
-- VALUES ('users', 'User Accounts', 'id,username,email,created_at', '{"username": "Login Name", "created_at": "Joined Date"}', 'username,email');

-- Table: navigation_menu (For admin sidebar menu)
CREATE TABLE navigation_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label VARCHAR(255) NOT NULL,
    target_table VARCHAR(255), -- Links to a table defined in ui_table_configs
    url_path VARCHAR(255), -- For custom non-table views
    icon_class VARCHAR(255), -- E.g., 'fa fa-user'
    parent_id INTEGER, -- For nested menus
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES navigation_menu(id)
);

-- Example Data for navigation_menu:
-- INSERT INTO navigation_menu (label, target_table, icon_class, display_order) VALUES ('Users', 'users', 'fa fa-users', 10);
-- INSERT INTO navigation_menu (label, target_table, icon_class, display_order) VALUES ('Products', 'products', 'fa fa-cube', 20);
-- INSERT INTO navigation_menu (label, url_path, icon_class, display_order) VALUES ('Dashboard', '/admin/dashboard', 'fa fa-tachometer', 5);