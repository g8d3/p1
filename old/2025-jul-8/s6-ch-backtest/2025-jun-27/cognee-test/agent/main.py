import requests
import os
import asyncio
import cognee
from cognee.modules.search.types import SearchType

docs_url = "https://docs.cognee.ai/llms-full.txt"
docs_path = os.path.join(os.path.dirname(__file__), "cognee_docs.txt")

def download_docs():
    if not os.path.exists(docs_path):
        print("Downloading Cognee docs...")
        r = requests.get(docs_url)
        r.raise_for_status()
        with open(docs_path, "w", encoding="utf-8") as f:
            f.write(r.text)
        print("Docs downloaded.")
    else:
        print("Docs already downloaded.")

def load_docs():
    with open(docs_path, "r", encoding="utf-8") as f:
        return f.read()

def main():
    download_docs()
    docs = load_docs()
    print("Cognee agent is ready. Type your question (or 'exit' to quit):")
    async def chat_loop():
        while True:
            query = input("You: ")
            if query.strip().lower() in ("exit", "quit"): break
            results = await cognee.search(
                query_text=query,
                query_type=SearchType.INFORMATION
            )
            if results:
                for result in results:
                    print("Agent:", result)
            else:
                print("Agent: No answer found.")
    asyncio.run(chat_loop())

if __name__ == "__main__":
    main()
