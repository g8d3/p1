import tweepy
import openai
import os
from neo4j import GraphDatabase

# Twitter API credentials
bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
consumer_key = os.environ.get("TWITTER_CONSUMER_KEY")
consumer_secret = os.environ.get("TWITTER_CONSUMER_SECRET")
access_token = os.environ.get("TWITTER_ACCESS_TOKEN")
access_token_secret = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")

# OpenAI API key
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Neo4j connection details
NEO4J_URI = os.environ.get("NEO4J_URI")
NEO4J_USER = os.environ.get("NEO4J_USER")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD")

def get_tweets(username, num_tweets=10):
    client = tweepy.Client(bearer_token, consumer_key, consumer_secret, access_token, access_token_secret)
    response = client.get_users_tweets(id=username, max_results=num_tweets)
    tweets = response.data
    return tweets

def predict_tweet_liking(tweet_text):
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=f"Will I like this tweet? {tweet_text}\nLikelihood:",
        max_tokens=10,
        n=1,
        stop=None,
        temperature=0.5,
    )
    prediction = response.choices[0].text.strip()
    return prediction

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