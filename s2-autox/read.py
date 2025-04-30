import os
import botasaurus
from neo4j import GraphDatabase
from openrouter import OpenRouter
import google.generativeai as genai

# Environment variables
TWITTER_USERNAME = os.environ.get("X_USER")
TWITTER_PASSWORD = os.environ.get("X_PASSWORD")
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# LLM Provider Selection
LLM_PROVIDER = "gemini"  # Default to Gemini, can be "openrouter"
LLM_MODEL = "gemini-2.0-flash-001" # Default Gemini model

# Neo4j setup
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def create_tweet_node(tx, tweet_id, tweet_text, prediction):
    query = (
        "CREATE (t:Tweet {tweet_id: $tweet_id, text: $tweet_text, prediction: $prediction})"
    )
    tx.run(query, tweet_id=tweet_id, tweet_text=tweet_text, prediction=prediction)

def predict_tweet_relevance(tweet_text):
    if LLM_PROVIDER == "openrouter":
        client = OpenRouter(api_key=OPENROUTER_API_KEY)
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": f"Would the user like this tweet? {tweet_text}. Answer with yes or no."}],
        )
        return response.choices[0].message.content
    elif LLM_PROVIDER == "gemini":
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(LLM_MODEL)
        response = model.generate_content(f"Would the user like this tweet? {tweet_text}. Answer with yes or no.")
        return response.text
    else:
        return "No prediction"

def read_twitter_feed():
    # Botasaurus code to login to Twitter and read the feed
    # This is a placeholder, replace with actual Botasaurus code
    # Example:
    # b = botasaurus.create_browser()
    # b.go_to("https://twitter.com")
    # ... login and scrape tweets ...
    # tweets = [...]
    
    # Replace with actual scraped tweets
    tweets = [
        {"id": "123", "text": "This is a tweet about AI."},
        {"id": "456", "text": "This is a tweet about cats."},
        {"id": "789", "text": "Another tweet about technology."},
        {"id": "101", "text": "A tweet about the weather."}
    ]
    return tweets

def main():
    tweets = read_twitter_feed()

    with driver.session() as session:
        for tweet in tweets:
            prediction = predict_tweet_relevance(tweet["text"])
            session.execute_write(create_tweet_node, tweet["id"], tweet["text"], prediction)
            print(f"Tweet ID: {tweet['id']}, Prediction: {prediction}")

    driver.close()

if __name__ == "__main__":
    main()