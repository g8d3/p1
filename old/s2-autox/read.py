import os
import sqlite3
from botasaurus import *
from openrouter import OpenRouter

# Environment variables
X_USER = os.environ.get("X_USER")
X_PASSWORD = os.environ.get("X_PASSWORD")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Database setup
conn = sqlite3.connect("twitter_predictions.db")
cursor = conn.cursor()
cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS predictions (
        tweet_id TEXT PRIMARY KEY,
        tweet_text TEXT,
        prediction REAL,
        product_ideas TEXT
    )
"""
)
conn.commit()


def predict_tweet_usefulness(tweet_text, llm_provider="openrouter", llm_model="google/gemini-2.0-flash-001"):
    try:
        if llm_provider == "openrouter":
            api_key = OPENROUTER_API_KEY
            client = OpenRouter(api_key=api_key)
            prompt = f"Given the following tweet, predict how useful it would be for creating digital products (0-1): {tweet_text}"
            response = client.chat.completions.create(
                model=llm_model,
                messages=[{"role": "user", "content": prompt}],
            )
            prediction = float(response.choices[0].message.content.strip())
        elif llm_provider == "gemini":
            # need to implement gemini api call
            # api_key = GEMINI_API_KEY
            # client = ...
            # prompt = f"Given the following tweet, predict how useful it would be for creating digital products (0-1): {tweet_text}"
            # response = client.chat.completions.create(
            #     model=llm_model,
            #     messages=[{"role": "user", "content": prompt}],
            # )
            # prediction = float(response.choices[0].message.content.strip())
            prediction = 0.5  # Placeholder for Gemini API
        else:
            raise ValueError("Invalid LLM provider.")
        return prediction
    except Exception as e:
        print(f"Error during prediction: {e}")
        return None


def suggest_product_ideas(tweet_text, llm_provider="openrouter", llm_model="google/gemini-2.0-flash"):
    try:
        if llm_provider == "openrouter":
            api_key = OPENROUTER_API_KEY
            client = OpenRouter(api_key=api_key)
            prompt = f"Given the following tweet, suggest some digital product ideas: {tweet_text}"
            response = client.chat.completions.create(
                model=llm_model,
                messages=[{"role": "user", "content": prompt}],
            )
            product_ideas = response.choices[0].message.content.strip()
        elif llm_provider == "gemini":
            # need to implement gemini api call
            # api_key = GEMINI_API_KEY
            # client = ...
            # prompt = f"Given the following tweet, suggest some digital product ideas: {tweet_text}"
            # response = client.chat.completions.create(
            #     model=llm_model,
            #     messages=[{"role": "user", "content": prompt}],
            # )
            # product_ideas = response.choices[0].message.content.strip()
            product_ideas = "Placeholder product ideas for Gemini API"
        else:
            raise ValueError("Invalid LLM provider.")
        return product_ideas
    except Exception as e:
        print(f"Error during product idea generation: {e}")
        return None


@browser(
    headless=True,  # Set to False if you want to see the browser
    profile_dir="profile_dir",
    delete_profile=False,
)
def automate_twitter_feed(driver: AntiDetectDriver):
    if not X_USER or not X_PASSWORD:
        raise ValueError("X_USER and X_PASSWORD environment variables must be set.")

    driver.get("https://x.com/login")
    # Login
    driver.fill('input[name="text"]', X_USER)
    driver.click('div[role="button"] span[class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0"]')
    driver.fill('input[name="password"]', X_PASSWORD)
    driver.click('div[role="button"] span[class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0"]')
    driver.wait_for_selector('a[href*="/likes"]')

    # Scrape liked tweets
    driver.get(f"https://x.com/{X_USER}/likes")
    liked_tweets = []
    while True:
        tweets = driver.query_selector_all('div[data-testid="tweetText"]')
        if not tweets:
            break
        for tweet in tweets:
            tweet_text = tweet.inner_text()
            liked_tweets.append(tweet_text)
        driver.scroll_down(1000)  # Scroll down to load more tweets

    # Scrape tweets to predict
    driver.get("https://x.com/home")
    predict_tweets = []
    while True:
        tweets = driver.query_selector_all('div[data-testid="tweetText"]')
        if not tweets:
            break
        for tweet in tweets:
            tweet_text = tweet.inner_text()
            predict_tweets.append(tweet_text)
        driver.scroll_down(1000)  # Scroll down to load more tweets

    # LLM predictions and database storage
    for tweet_text in predict_tweets:
        tweet_id = str(hash(tweet_text))  # Create a unique ID for the tweet
        prediction = predict_tweet_usefulness(tweet_text)
        if prediction is not None:
            product_ideas = suggest_product_ideas(tweet_text)
            cursor.execute(
                """
                INSERT OR REPLACE INTO predictions (tweet_id, tweet_text, prediction, product_ideas)
                VALUES (?, ?, ?, ?)
            """,
                (tweet_id, tweet_text, prediction, product_ideas),
            )
            conn.commit()
            print(
                f"Tweet: {tweet_text[:50]}..., Prediction: {prediction}, Product Ideas: {product_ideas[:50]}..."
            )

    conn.close()


if __name__ == "__main__":
    automate_twitter_feed()