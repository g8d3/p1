-- 1. Users
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    created_at DATETIME
);

-- 2. LLM Configs
CREATE TABLE llm_configs (
    config_id TEXT PRIMARY KEY,
    user_id TEXT,
    config_name TEXT,
    config_json TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 3. URL Inputs
CREATE TABLE url_inputs (
    url_id TEXT PRIMARY KEY,
    user_id TEXT,
    url TEXT,
    input_details TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 4. Test Definitions
CREATE TABLE test_definitions (
    test_id TEXT PRIMARY KEY,
    url_id TEXT,
    llm_config_id TEXT,
    test_description TEXT,
    user_test_details TEXT,
    created_at DATETIME,
    FOREIGN KEY (url_id) REFERENCES url_inputs(url_id),
    FOREIGN KEY (llm_config_id) REFERENCES llm_configs(config_id)
);

-- 5. Test Runs
CREATE TABLE test_runs (
    run_id TEXT PRIMARY KEY,
    test_id TEXT,
    run_time DATETIME,
    result_json TEXT,
    status TEXT,
    scheduled_run INTEGER,
    FOREIGN KEY (test_id) REFERENCES test_definitions(test_id)
);

-- 6. Schedules
CREATE TABLE schedules (
    schedule_id TEXT PRIMARY KEY,
    test_id TEXT,
    cron_expression TEXT,
    enabled INTEGER,
    created_at DATETIME,
    FOREIGN KEY (test_id) REFERENCES test_definitions(test_id)
);