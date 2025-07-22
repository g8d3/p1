(p1) ➜  cognee-test /home/vuos/code/p1/.venv/bin/python /home/vuos/code/p1/s6-ch-backtest/2025-jun-27/cognee-test/mai
n.py

2025-06-27T17:57:31.170942 [info     ] Logging initialized            [cognee.shared.logging_utils] cognee_version=0.1.44 os_info='Linux 6.8.0-62-generic (#65-Ubuntu SMP PREEMPT_DYNAMIC Mon May 19 17:15:03 UTC 2025)' python_version=3.13.1 structlog_version=25.4.0

2025-06-27T17:57:31.171325 [info     ] Want to learn more? Visit the Cognee documentation: https://docs.cognee.ai [cognee.shared.logging_utils]

HTTP Request: GET https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json "HTTP/1.1 200 OK"

Langfuse client is disabled since no public_key was provided as a parameter or environment variable 'LANGFUSE_PUBLIC_KEY'. See our docs: https://langfuse.com/docs/sdk/python/low-level-sdk#initialize-client12:57:35 - LiteLLM:INFO: utils.py:2929 - 
LiteLLM completion() model= gpt-4o-mini; provider = openai

LiteLLM completion() model= gpt-4o-mini; provider = openai12:57:37 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
EmbeddingRateLimiter initialized: enabled=False, requests_limit=60, interval_seconds=6012:57:37 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-1812:57:38 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-largeUser 37ebe813-7bd7-4a66-bc76-7074d2a05e5f has registered.

2025-06-27T17:57:38.626127 [info     ] Pipeline run started: `4b84e400-23fc-5976-bbb4-f8ee303eed81` [run_tasks(tasks: [Task], data)]
2025-06-27T17:57:39.477185 [info     ] Coroutine task started: `resolve_data_directories` [run_tasks_base]
2025-06-27T17:57:40.138101 [info     ] Coroutine task started: `ingest_data` [run_tasks_base]2025-06-27 12:57:40,982|[WARNING]|100213|134965100984128|dlt|logger.py|wrapper:24|In schema `metadata_extraction`: The following columns in table 'file_metadata' did not receive any data during this load and therefore could not have their types inferred:
  - node_set

Unless type hints are provided, these columns will not be materialized in the destination.
One way to provide type hints is to use the 'columns' argument in the '@dlt.resource' decorator.  For example:

@dlt.resource(columns={'node_set': {'data_type': 'text'}})

2025-06-27T17:57:41.110792 [info     ] Coroutine task completed: `ingest_data` [run_tasks_base]
2025-06-27T17:57:41.471381 [info     ] Coroutine task completed: `resolve_data_directories` [run_tasks_base]
2025-06-27T17:57:41.812429 [info     ] Pipeline run completed: `4b84e400-23fc-5976-bbb4-f8ee303eed81` [run_tasks(tasks: [Task], data)]
2025-06-27T17:57:42.176155 [warning  ] Ontology file 'None' not found. Using fallback ontology at http://example.org/empty_ontology [OntologyAdapter]
2025-06-27T17:57:42.176662 [info     ] Lookup built: 0 classes, 0 individuals [OntologyAdapter]
2025-06-27T17:57:42.189620 [info     ] Pipeline run started: `af81ab41-8243-522f-a10a-b7b5febcc577` [run_tasks(tasks: [Task], data)]
2025-06-27T17:57:42.544013 [info     ] Coroutine task started: `classify_documents` [run_tasks_base]
2025-06-27T17:57:42.914438 [info     ] Coroutine task started: `check_permissions_on_documents` [run_tasks_base]
2025-06-27T17:57:43.277327 [info     ] Async Generator task started: `extract_chunks_from_documents` [run_tasks_base]
2025-06-27T17:57:43.635879 [info     ] Coroutine task started: `extract_graph_from_data` [run_tasks_base]12:57:44 - LiteLLM:INFO: utils.py:2929 - 
LiteLLM completion() model= gpt-4o-mini; provider = openai

LiteLLM completion() model= gpt-4o-mini; provider = openai12:57:48 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-1812:57:48 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
2025-06-27T17:57:48.390710 [warning  ] File /home/vuos/code/p1/.venv/lib/python3.13/site-packages/cognee/.cognee_system/databases/cognee_graph.pkl not found. Initializing an empty graph. [cognee.shared.logging_utils]
2025-06-27T17:57:48.391555 [info     ] No close match found for 'concept' in category 'classes' [OntologyAdapter]
2025-06-27T17:57:48.391715 [info     ] No close match found for 'natural language processing' in category 'individuals' [OntologyAdapter]
2025-06-27T17:57:48.391901 [info     ] No close match found for 'field' in category 'classes' [OntologyAdapter]
2025-06-27T17:57:48.392032 [info     ] No close match found for 'computer science' in category 'individuals' [OntologyAdapter]12:57:49 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:51 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:51 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:52 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:53 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large
2025-06-27T17:57:53.343903 [info     ] Coroutine task started: `summarize_text` [run_tasks_base]12:57:53 - LiteLLM:INFO: utils.py:2929 - 
LiteLLM completion() model= gpt-4o-mini; provider = openai

LiteLLM completion() model= gpt-4o-mini; provider = openai12:57:55 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-1812:57:55 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
2025-06-27T17:57:55.148622 [info     ] Coroutine task started: `add_data_points` [run_tasks_base]12:57:56 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:56 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:57 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:57 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:58 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:57:59 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large
2025-06-27T17:58:00.007541 [info     ] Coroutine task completed: `add_data_points` [run_tasks_base]
2025-06-27T17:58:00.355183 [info     ] Coroutine task completed: `summarize_text` [run_tasks_base]
2025-06-27T17:58:00.710217 [info     ] Coroutine task completed: `extract_graph_from_data` [run_tasks_base]
2025-06-27T17:58:01.085563 [info     ] Async Generator task completed: `extract_chunks_from_documents` [run_tasks_base]
2025-06-27T17:58:01.453419 [info     ] Coroutine task completed: `check_permissions_on_documents` [run_tasks_base]
2025-06-27T17:58:01.817885 [info     ] Coroutine task completed: `classify_documents` [run_tasks_base]
2025-06-27T17:58:02.166593 [info     ] Pipeline run completed: `af81ab41-8243-522f-a10a-b7b5febcc577` [run_tasks(tasks: [Task], data)]12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:03 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:04 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:06 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:06 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:06 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/text-embedding-3-large
selected model name for cost calculation: openai/text-embedding-3-large12:58:07 - LiteLLM:INFO: utils.py:2929 - 
LiteLLM completion() model= gpt-4o-mini; provider = openai

LiteLLM completion() model= gpt-4o-mini; provider = openai12:58:09 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-1812:58:09 - LiteLLM:INFO: cost_calculator.py:655 - selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18
selected model name for cost calculation: openai/gpt-4o-mini-2024-07-18Natural Language Processing (NLP) is a subfield of computer science that focuses on the interaction between computers and human (natural) languages. It encompasses tasks such as understanding, interpreting, and generating human language in a valuable way.