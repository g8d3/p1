import tweepy
import os
from neo4j import GraphDatabase
import requests

# Twitter API credentials
bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
consumer_key = os.environ.get("TWITTER_CONSUMER_KEY")
consumer_secret = os.environ.get("TWITTER_CONSUMER_SECRET")
access_token = os.environ.get("TWITTER_ACCESS_TOKEN")
access_token_secret = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")

# OpenRouter API key
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001" # Default model

# Neo4j connection details
NEO4J_URI = os.environ.get("NEO4J_URI")
NEO4J_USER = os.environ.get("NEO4J_USER")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD")

def get_tweets(username, num_tweets=10):
    client = tweepy.Client(bearer_token, consumer_key, consumer_secret, access_token, access_token_secret)
    response = client.get_users_tweets(id=username, max_results=num_tweets)
    tweets = response.data
    return tweets

def predict_tweet_liking(tweet_text, model=MODEL):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": f"Will I like this tweet? {tweet_text}"}]
    }
    response = requests.post(OPENROUTER_URL, headers=headers, json=data)
    if response.status_code == 200:
        prediction = response.json()["choices"][0]["message"]["content"].strip()
        return prediction
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return "Unknown"

def save_to_graphdb(tweet_text, prediction):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    with driver.session() as session:
        query = (
            "CREATE (t:Tweet {text: $tweet_text, prediction: $prediction})"
        )
        session.run(query, tweet_text=tweet_text, prediction=prediction)
    driver.close()

if __name__ == "__main__":
    username = os.environ.get("X_USER")  # Twitter username
    tweets = get_tweets(username)

    if tweets:
        for tweet in tweets:
            tweet_text = tweet.text
            prediction = predict_tweet_liking(tweet_text)
            print(f"Tweet: {tweet_text}\nPrediction: {prediction}\n")
            save_to_graphdb(tweet_text, prediction)
    else:
        print(f"Could not retrieve tweets for user {username}")