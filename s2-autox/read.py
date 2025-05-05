import os
import sqlite3
from typing import List, Dict

import botasaurus
from openrouter import OpenRouter

# Configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
X_USER = os.environ.get("X_USER")
X_PASSWORD = os.environ.get("X_PASSWORD")
LIKED_TWEETS_URL = f"https://x.com/{X_USER}/likes"
HOME_TIMELINE_URL = "https://x.com/home"
DATABASE_NAME = "twitter_predictions.db"
LLM_MODEL = "google/gemini-2.0-flash-001"  # Default model, allow easy switch in code


def initialize_database():
    """Initializes the SQLite database."""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tweet_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tweet_text TEXT NOT NULL,
            prediction TEXT,
            product_idea TEXT
        )
    """)
    conn.commit()
    conn.close()


def scrape_tweets(url: str) -> List[str]:
    """Scrapes tweets from a given URL using Botasaurus."""
    tweets = []

    def process_tweet(driver, tweet_element):
        try:
            tweet_text = tweet_element.text
            tweets.append(tweet_text)
        except Exception as e:
            print(f"Error processing tweet: {e}")

    with botasaurus.create_driver(
        headless=True,  # Run in headless mode
    ) as driver:
        driver.get(url)

        # Authenticate (assuming standard Twitter login)
        username_field = driver.find_element("xpath", "//input[@name='text']")
        username_field.send_keys(X_USER)
        next_button = driver.find_element("xpath", "//div[@role='button' and contains(@aria-label, 'Next')]")
        next_button.click()

        # Password field might take a moment to load
        botasaurus.wait(2)

        password_field = driver.find_element("xpath", "//input[@name='password']")
        password_field.send_keys(X_PASSWORD)
        login_button = driver.find_element("xpath", "//div[@role='button' and contains(@data-testid, 'loginButton')]")
        login_button.click()

        # Wait for the timeline to load
        botasaurus.wait(5)

        # Scroll down to load more tweets (adjust range as needed)
        for _ in range(3):
            botasaurus.scroll_down(driver)
            botasaurus.wait(2)

        # Scrape tweets (adjust XPath as needed)
        tweet_elements = driver.find_elements("xpath", "//div[@data-testid='tweetText']")
        for tweet_element in tweet_elements:
            process_tweet(driver, tweet_element)

    return tweets


def predict_tweet_usefulness(tweets: List[str]) -> List[Dict[str, str]]:
    """Predicts the usefulness of tweets for digital product creation using an LLM."""
    predictions = []
    for tweet in tweets:
        try:
            prompt = f"Predict if this tweet is useful for creating digital products:\n{tweet}\n\nUseful (yes/no):"
            response = OpenRouter.chat.completions.create(
                model=LLM_MODEL,
                prompt=prompt,
                max_tokens=50,
                api_key=OPENROUTER_API_KEY,
            )
            prediction = response.choices[0].text.strip()
            predictions.append({"tweet_text": tweet, "prediction": prediction})
        except Exception as e:
            print(f"LLM prediction error: {e}")
            predictions.append({"tweet_text": tweet, "prediction": "error"})
    return predictions


def filter_product_ideas(predictions: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Filters tweets predicted as useful and generates potential product ideas."""
    product_ideas = []
    for result in predictions:
        if result["prediction"].lower() == "yes":
            tweet = result["tweet_text"]
            try:
                prompt = f"Generate a digital product idea based on this tweet:\n{tweet}\n\nProduct idea:"
                response = OpenRouter.chat.completions.create(
                    model=LLM_MODEL,
                    prompt=prompt,
                    max_tokens=100,
                    api_key=OPENROUTER_API_KEY,
                )
                product_idea = response.choices[0].text.strip()
                product_ideas.append({"tweet_text": tweet, "product_idea": product_idea})
            except Exception as e:
                print(f"LLM product idea error: {e}")
                product_ideas.append({"tweet_text": tweet, "product_idea": "error"})
    return product_ideas


def save_predictions_to_db(predictions: List[Dict[str, str]]):
    """Saves tweet predictions and product ideas to the SQLite database."""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    for result in predictions:
        tweet_text = result["tweet_text"]
        prediction = result.get("prediction", None)
        product_idea = result.get("product_idea", None)
        cursor.execute("""
            INSERT INTO tweet_predictions (tweet_text, prediction, product_idea)
            VALUES (?, ?, ?)
        """, (tweet_text, prediction, product_idea))
    conn.commit()
    conn.close()


def main():
    """Main function to orchestrate the tweet scraping, prediction, and filtering."""
    initialize_database()

    # 1. Scrape liked tweets
    print(f"Scraping liked tweets from {LIKED_TWEETS_URL}...")
    liked_tweets = scrape_tweets(LIKED_TWEETS_URL)
    print(f"Found {len(liked_tweets)} liked tweets.")

    # 2. Scrape home timeline tweets
    print(f"Scraping home timeline tweets from {HOME_TIMELINE_URL}...")
    home_timeline_tweets = scrape_tweets(HOME_TIMELINE_URL)
    print(f"Found {len(home_timeline_tweets)} home timeline tweets.")

    # 3. Combine tweets for prediction
    all_tweets = liked_tweets + home_timeline_tweets

    # 4. Predict tweet usefulness
    print("Predicting tweet usefulness...")
    tweet_predictions = predict_tweet_usefulness(all_tweets)

    # 5. Filter product ideas
    print("Filtering product ideas...")
    product_ideas = filter_product_ideas(tweet_predictions)

    # 6. Save results to database
    print("Saving results to database...")
    save_predictions_to_db(tweet_predictions + product_ideas)  # Save both predictions and ideas

    print("Finished processing tweets.")


if __name__ == "__main__":
    main()