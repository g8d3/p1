from dotenv import load_dotenv
load_dotenv()
import os
import sqlite3
import json
from botasaurus import *
from openrouter import OpenRouter

# Configuration
TWITTER_USER = os.environ.get("X_USER")
TWITTER_PASSWORD = os.environ.get("X_PASSWORD")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
DB_NAME = "twitter_predictions.db"

# LLM Provider (OpenRouter or Gemini)
LLM_PROVIDER = "openrouter"  # or "gemini"
LLM_MODEL = "google/gemini-2.0-flash-001"

# Database initialization
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tweets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tweet_id TEXT UNIQUE,
            tweet_text TEXT,
            author TEXT,
            date TEXT,
            source TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tweet_id TEXT,
            prediction_score REAL,
            product_ideas TEXT,
            FOREIGN KEY (tweet_id) REFERENCES tweets (tweet_id)
        )
    """)
    conn.commit()
    conn.close()

# Twitter scraping functions
def scrape_tweets(url, source):
    print(f"Scraping tweets from {url}...")
    
    @browser(profile="twitter")
    async def task(driver, initial_url):
        await driver.goto(initial_url)
        await driver.wait_for_selector('article[data-testid="tweet"]')

        tweets = await driver.querySelectorAll('article[data-testid="tweet"]')
        for tweet in tweets:
            try:
                tweet_id = await tweet.getAttribute('data-testid')
                tweet_text = await tweet.querySelectorEval('div[lang]', 'node => node.innerText')
                author = await tweet.querySelectorEval('div[data-testid*="author"] a', 'node => node.innerText')
                date = await tweet.querySelectorEval('time', 'node => node.dateTime')

                conn = sqlite3.connect(DB_NAME)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO tweets (tweet_id, tweet_text, author, date, source)
                    VALUES (?, ?, ?, ?, ?)
                """, (tweet_id, tweet_text, author, date, source))
                conn.commit()
                conn.close()
                print(f"Saved tweet: {tweet_id}")

            except Exception as e:
                print(f"Error processing tweet: {e}")

    initial_url = url
    task(initial_url=initial_url)
    print("Finished scraping tweets.")

# LLM prediction functions
def predict_interest(tweet_text):
    if LLM_PROVIDER == "openrouter":
        try:
            client = OpenRouter(api_key=OPENROUTER_API_KEY)
            response = client.completions.create(
                model=LLM_MODEL,
                prompt=f"Predict the user's interest in the following tweet: {tweet_text}",
                max_tokens=50,
            )
            prediction_score = float(response.choices[0].text)  # Assuming the response is a score
            return prediction_score
        except Exception as e:
            print(f"Error predicting interest using OpenRouter: {e}")
            return 0.0
    elif LLM_PROVIDER == "gemini":
        # TODO: Implement Gemini API integration
        print("Gemini API integration not implemented yet.")
        return 0.0
    else:
        print("Invalid LLM provider specified.")
        return 0.0

# Digital product filtering functions
def filter_product_ideas(tweet_text, prediction_score):
    product_ideas = []
    if prediction_score > 0.5:  # Adjust threshold as needed
        # Simple keyword-based product idea generation
        if "learn" in tweet_text.lower() or "tutorial" in tweet_text.lower():
            product_ideas.append("Create an online course or tutorial")
        if "tool" in tweet_text.lower() or "software" in tweet_text.lower():
            product_ideas.append("Develop a software tool or application")
        if "report" in tweet_text.lower() or "analysis" in tweet_text.lower():
            product_ideas.append("Write a report or analysis")
        if "book" in tweet_text.lower() or "guide" in tweet_text.lower():
            product_ideas.append("Write an ebook or guide")

    return json.dumps(product_ideas)

# Main function
def main():
    init_db()

    # Scrape liked tweets
    scrape_tweets(f"x.com/{TWITTER_USER}/likes", "likes")

    # Scrape tweets from home timeline
    scrape_tweets("x.com/home", "home")

    # TODO: Implement logic to:
    # - Fetch tweets from the 'tweets' table
    # - Predict user interest for each tweet
    # - Filter tweets for digital product opportunities
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT tweet_id, tweet_text FROM tweets")
    tweets = cursor.fetchall()

    for tweet_id, tweet_text in tweets:
        prediction_score = predict_interest(tweet_text)
        product_ideas = filter_product_ideas(tweet_text, prediction_score)

        cursor.execute("""
            INSERT OR IGNORE INTO predictions (tweet_id, prediction_score, product_ideas)
            VALUES (?, ?, ?)
        """, (tweet_id, prediction_score, product_ideas))
        conn.commit()
        print(f"Saved prediction for tweet: {tweet_id}")

    conn.close()

if __name__ == "__main__":
    main()