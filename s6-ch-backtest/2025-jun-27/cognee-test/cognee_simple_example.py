import asyncio
import cognee
from cognee.shared.logging_utils import get_logger, ERROR
from cognee.api.v1.search import SearchType

# Prerequisites:
# 1. Copy `.env.template` from the cognee repo and rename it to `.env`.
# 2. Add your OpenAI API key to the `.env` file as LLM_API_KEY = "your_key_here"

async def main():
    print("Resetting cognee data...")
    await cognee.prune.prune_data()
    await cognee.prune.prune_system(metadata=True)
    print("Data reset complete.\n")

    text = """
    Natural language processing (NLP) is an interdisciplinary subfield of computer science and information retrieval.
    """

    print("Adding text to cognee:")
    print(text.strip())
    await cognee.add(text)
    print("Text added successfully.\n")

    print("Running cognify to create knowledge graph...\n")
    print("Cognify process steps:")
    print("1. Classifying the document: Determining the type and category of the input text.")
    print("2. Checking permissions: Ensuring the user has the necessary rights to process the text.")
    print("3. Extracting text chunks: Breaking down the text into sentences or phrases for analysis.")
    print("4. Adding data points: Storing the extracted chunks for processing.")
    print("5. Generating knowledge graph: Extracting entities and relationships to form a knowledge graph.")
    print("6. Summarizing text: Creating concise summaries of the content for quick insights.\n")

    await cognee.cognify()
    print("Cognify process complete.\n")

    query_text = "Tell me about NLP"
    print(f"Searching cognee for insights with query: '{query_text}'")
    search_results = await cognee.search(query_type=SearchType.INSIGHTS, query_text=query_text)

    print("Search results:")
    for result_text in search_results:
        print(result_text)

if __name__ == "__main__":
    logger = get_logger(level=ERROR)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main())
    finally:
        loop.run_until_complete(loop.shutdown_asyncgens())
