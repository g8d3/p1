import os
import sqlite3
import time
from botasaurus.browser import browser
import botasaurus as bt


def scrape_tweets(number_of_pages: int = 3):
    """
    Scrapes tweets from x.com/home and saves them to an SQLite database.
    """

    # Database setup
    conn = sqlite3.connect('twitter_tweets.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tweets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT
        )
    ''')
    conn.commit()

    # Twitter credentials from environment variables
    twitter_username = os.environ.get("X_USER")
    twitter_password = os.environ.get("X_PASSWORD")

    if not twitter_username or not twitter_password:
        print("Error: Twitter username and password must be set in environment variables X_USER and X_PASSWORD.")
        return

    # Botasaurus setup
    with bt.browser() as browser:
        page = browser.open("https://x.com/home")

        # Login
        page.fill('input[name="text"]', twitter_username)
        page.locator('div[role="button"]:has-text("Next")').click()
        time.sleep(2)  # Wait for the next page to load
        page.fill('input[name="password"]', twitter_password)
        page.locator('div[data-testid="LoginForm_Login_Button"]').click()
        time.sleep(5)  # Wait for login to complete and home page to load

        # Scroll and extract tweets
        for i in range(number_of_pages):
            print(f"Scraping page {i + 1}")
            # Scroll down to load more tweets
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(5)  # Wait for new tweets to load

            # Extract tweets
            tweets = page.locator('div[data-testid="tweetText"]').all_text_contents()
            for tweet in tweets:
                cursor.execute("INSERT INTO tweets (content) VALUES (?)", (tweet,))
            conn.commit()
            print(f"Extracted {len(tweets)} tweets from page {i + 1}")

    conn.close()
    print("Finished scraping and saving tweets.")


if __name__ == "__main__":
    scrape_tweets()