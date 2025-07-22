CREATE TABLE users (
    user_id INTEGER PRIMARY KEY, -- Changed from TEXT
    username TEXT,
    created_at DATETIME
);
CREATE TABLE llm_configs (
    config_id INTEGER PRIMARY KEY, -- Changed from TEXT
    user_id INTEGER, -- Foreign key type should match the new primary key type
    config_name TEXT,
    config_json TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE url_inputs (
    url_id INTEGER PRIMARY KEY, -- Changed from TEXT
    user_id INTEGER, -- Foreign key type should match
    url TEXT,
    input_details TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE test_definitions (
    test_id INTEGER PRIMARY KEY, -- Changed from TEXT
    url_id INTEGER, -- Foreign key type should match
    llm_config_id INTEGER, -- Foreign key type should match
    test_description TEXT,
    user_test_details TEXT,
    created_at DATETIME,
    FOREIGN KEY (url_id) REFERENCES url_inputs(url_id),
    FOREIGN KEY (llm_config_id) REFERENCES llm_configs(config_id)
);
CREATE TABLE test_runs (
    run_id INTEGER PRIMARY KEY, -- Changed from TEXT
    test_id INTEGER, -- Foreign key type should match
    run_time DATETIME,
    result_json TEXT,
    status TEXT,
    scheduled_run INTEGER,
    FOREIGN KEY (test_id) REFERENCES test_definitions(test_id)
);
CREATE TABLE schedules (
    schedule_id INTEGER PRIMARY KEY, -- Changed from TEXT
    test_id INTEGER, -- Foreign key type should match
    cron_expression TEXT,
    enabled INTEGER,
    created_at DATETIME,
    FOREIGN KEY (test_id) REFERENCES test_definitions(test_id)
);