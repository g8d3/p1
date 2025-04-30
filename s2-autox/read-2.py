import os
import sqlite3
import json
from datetime import datetime
from botasaurus import Browser, bt
from openai import OpenAI
from google.generativeai import GenerativeModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
X_USER = os.getenv("X_USER")
X_PASSWORD = os.getenv("X_PASSWORD")

# SQLite database setup
DB_FILE = "twitter_predictions.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            tweet_id TEXT PRIMARY KEY,
            tweet_text TEXT,
            username TEXT,
            created_at TEXT,
            prediction INTEGER,
            model_used TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

# LLM Configuration
LLM_PROVIDER = "openrouter"  # Switch to "gemini" for Gemini API
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = "google/gemini-2.0-flash-001"  # Switch to "gemini-2.0-flash" as needed

def get_llm_client():
    if LLM_PROVIDER == "openrouter":
        return OpenAI(api_key=OPENROUTER_API_KEY)
    elif LLM_PROVIDER == "gemini":
        return GenerativeModel(model_name=MODEL, api_key=GEMINI_API_KEY)
    else:
        raise ValueError("Unsupported LLM provider")

# Tweet prediction logic
def predict_tweet_likability(tweet_text, liked_tweets, llm_client):
    prompt = f"""
    Based on the user's liked tweets, predict if they would like the following tweet.
    Liked tweets: {json.dumps(liked_tweets, indent=2)}
    Tweet to predict: {tweet_text}
    Return a JSON object with a single key 'likelihood' with a value of 0 (dislike) or 1 (like).
    """
    
    if LLM_PROVIDER == "openrouter":
        response = llm_client.generate(
            model=MODEL,
            prompt=prompt,
            max_tokens=100
        )
        return json.loads(response.choices[0].text)
    elif LLM_PROVIDER == "gemini":
        response = llm_client.generate_content(prompt)
        return json.loads(response.text)

# Scrape liked tweets
def scrape_liked_tweets(browser: Browser):
    browser.goto(f"https://x.com/{X_USER}/likes")
    browser.wait_for_element("article")  # Wait for tweet elements
    tweets = []
    
    elements = browser.elements("article")
    for element in elements:
        try:
            tweet_text = element.find_element("div[lang]").text
            tweet_id = element.find_element("time").get_attribute("datetime")
            username = element.find_element("a[href^='/']").text
            tweets.append({
                "id": tweet_id,
                "text": tweet_text,
                "username": username
            })
        except:
            continue
    
    return tweets

# Scrape home feed
def scrape_home_feed(browser: Browser):
    browser.goto("https://x.com/home")
    browser.wait_for_element("article")
    tweets = []
    
    elements = browser.elements("article")
    for element in elements:
        try:
            tweet_text = element.find_element("div[lang]").text
            tweet_id = element.find_element("time").get_attribute("datetime")
            username = element.find_element("a[href^='/']").text
            created_at = element.find_element("time").text
            tweets.append({
                "id": tweet_id,
                "text": tweet_text,
                "username": username,
                "created_at": created_at
            })
        except:
            continue
    
    return tweets

# Save prediction to SQLite
def save_prediction(tweet, prediction, model):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO predictions (tweet_id, tweet_text, username, created_at, prediction, model_used, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        tweet["id"],
        tweet["text"],
        tweet["username"],
        tweet["created_at"],
        prediction["likelihood"],
        model,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

# Main automation task
@bt.task
def automate_twitter_feed():
    init_db()
    llm_client = get_llm_client()
    
    with Browser(headless=True) as browser:
        # Login to Twitter
        browser.goto("https://x.com/login")
        browser.type("input[name='text']", X_USER)
        browser.click("button[type='submit']")
        browser.wait(2)
        browser.type("input[name='password']", X_PASSWORD)
        browser.click("button[type='submit']")
        browser.wait_for_url("https://x.com/home")
        
        # Scrape liked tweets
        liked_tweets = scrape_liked_tweets(browser)
        
        # Scrape home feed and predict
        home_tweets = scrape_home_feed(browser)
        
        for tweet in home_tweets:
            prediction = predict_tweet_likability(tweet["text"], liked_tweets, llm_client)
            save_prediction(tweet, prediction, MODEL)

if __name__ == "__main__":
    automate_twitter_feed()