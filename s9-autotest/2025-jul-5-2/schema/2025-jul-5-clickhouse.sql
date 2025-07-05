-- 1. Users
CREATE TABLE users
(
    user_id UUID,
    username String,
    created_at DateTime,
    PRIMARY KEY (user_id)
) ENGINE = MergeTree()
ORDER BY user_id;

-- 2. LLM Configs
CREATE TABLE llm_configs
(
    config_id UUID,
    user_id UUID,
    config_name String,
    config_json String,
    created_at DateTime,
    PRIMARY KEY (config_id)
) ENGINE = MergeTree()
ORDER BY config_id;

-- 3. URL Inputs
CREATE TABLE url_inputs
(
    url_id UUID,
    user_id UUID,
    url String,
    input_details String,
    created_at DateTime,
    PRIMARY KEY (url_id)
) ENGINE = MergeTree()
ORDER BY url_id;

-- 4. Test Definitions
CREATE TABLE test_definitions
(
    test_id UUID,
    url_id UUID,
    llm_config_id UUID,
    test_description String,
    user_test_details String,
    created_at DateTime,
    PRIMARY KEY (test_id)
) ENGINE = MergeTree()
ORDER BY test_id;

-- 5. Test Runs
CREATE TABLE test_runs
(
    run_id UUID,
    test_id UUID,
    run_time DateTime,
    result_json String,
    status String,
    scheduled_run Bool,
    PRIMARY KEY (run_id)
) ENGINE = MergeTree()
ORDER BY run_id;

-- 6. Schedules
CREATE TABLE schedules
(
    schedule_id UUID,
    test_id UUID,
    cron_expression String,
    enabled Bool,
    created_at DateTime,
    PRIMARY KEY (schedule_id)
) ENGINE = MergeTree()
ORDER BY schedule_id;