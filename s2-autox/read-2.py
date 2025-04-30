import os
import sqlite3
import json
from datetime import datetime
from botasaurus.browser import browser, Driver
from botasaurus.task import task
from botasaurus import bt
from openai import OpenAI
from google.generativeai import GenerativeModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
X_USER = os.getenv("X_USER")
X_PASSWORD = os.getenv("X_PASSWORD")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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
LLM_PROVIDER = "openai"  # Switch to "gemini" for Gemini API
MODEL = "google/gemini-2.0-flash-001"  # Switch to "gemini-2.0-flash" as needed

def get_llm_client():
    if LLM_PROVIDER == "openai":
        return OpenAI(api_key=OPENAI_API_KEY)
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
    
    if LLM_PROVIDER == "openai":
        response = llm_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )
        return json.loads(response.choices[0].message.content)
    elif LLM_PROVIDER == "gemini":
        response = llm_client.generate_content(prompt)
        return json.loads(response.text)

# Scrape liked tweets
@browser(
    reuse_driver=True,
    cache=True,
    max_retry=5,
    close_on_crash=True,
    create_error_logs=False,
    output=None
)
def scrape_liked_tweets(driver: Driver, data):
    driver.google_get(f"https://x.com/{X_USER}/likes", bypass_cloudflare=True)
    driver.wait_for_element("article", wait=8)
    tweets = []
    
    elements = driver.select_all("article")
    for element in elements:
        try:
            tweet_text = element.select("div[lang]").text
            tweet_id = element.select("time").get_attribute("datetime")
            username = element.select("a[href^='/']").text
            tweets.append({
                "id": tweet_id,
                "text": tweet_text,
                "username": username
            })
        except:
            continue
    
    bt.write_temp_json(tweets, "liked_tweets")  # For debugging
    return tweets

# Scrape home feed
@browser(
    reuse_driver=True,
    cache=True,
    max_retry=5,
    close_on_crash=True,
    create_error_logs=False,
    output=None
)
def scrape_home_feed(driver: Driver, data):
    driver.google_get("https://x.com/home", bypass_cloudflare=True)
    driver.wait_for_element("article", wait=8)
    tweets = []
    
    elements = driver.select_all("article")
    for element in elements:
        try:
            tweet_text = element.select("div[lang]").text
            tweet_id = element.select("time").get_attribute("datetime")
            username = element.select("a[href^='/']").text
            created_at = element.select("time").text
            tweets.append({
                "id": tweet_id,
                "text": tweet_text,
                "username": username,
                "created_at": created_at
            })
        except:
            continue
    
    bt.write_temp_json(tweets, "home_tweets")  # For debugging
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
@task(
    cache=True,
    close_on_crash=True,
    create_error_logs=False
)
def automate_twitter_feed(data):
    init_db()
    llm_client = get_llm_client()
    
    with Browser(headless=False) as browser:  # Headless=False to avoid detection
        # Login to Twitter
        browser.google_get("https://x.com/login")
        browser.type("input[name='text']", X_USER)
        browser.enable_human_mode()
        browser.click("button[type='submit']")
        browser.disable_human_mode()
        browser.short_random_sleep()
        browser.type("input[name='password']", X_PASSWORD)
        browser.enable_human_mode()
        browser.click("button[type='submit']")
        browser.disable_human_mode()
        browser.wait_for_url("https://x.com/home", timeout=10)
        
        # Scrape liked tweets
        liked_tweets = scrape_liked_tweets()
        
        # Scrape home feed and predict
        home_tweets = scrape_home_feed()
        
        for tweet in home_tweets:
            prediction = predict_tweet_likability(tweet["text"], liked_tweets, llm_client)
            save_prediction(tweet, prediction, MODEL)

if __name__ == "__main__":
    automate_twitter_feed.run()