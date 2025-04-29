import os
from neo4j import GraphDatabase
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# OpenRouter API key
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001" # Default model

# Neo4j connection details
NEO4J_URI = os.environ.get("NEO4J_URI")
NEO4J_USER = os.environ.get("NEO4J_USER")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD")

def get_tweets(username, password, num_tweets=10):
    # Set up Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run Chrome in headless mode
    chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
    chrome_options.add_argument("--window-size=1920x1080")  # Set window size

    # Set up Chrome driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # Log in to Twitter
    driver.get("https://twitter.com/login")
    time.sleep(5)  # Wait for the page to load

    # Enter username
    username_input = driver.find_element(By.NAME, "text")
    username_input.send_keys(username)
    next_button = driver.find_element(By.XPATH, "//div[@role='button' and span[text()='Next']]")
    next_button.click()
    time.sleep(5)

    # Enter password
    password_input = driver.find_element(By.NAME, "password")
    password_input.send_keys(password)
    login_button = driver.find_element(By.XPATH, "//div[@role='button' and span[text()='Log in']]")
    login_button.click()
    time.sleep(10)

    # Get tweets
    try:
        driver.get(f"https://twitter.com/{username}")
        time.sleep(5)

        tweets = []
        tweet_elements = driver.find_elements(By.XPATH, "//div[@data-testid='tweetText']")
        for tweet_element in tweet_elements[:num_tweets]:
            tweets.append(tweet_element.text)

        
    except Exception as e:
        print(f"An error occurred: {e}")
        tweets = []
    finally:
        driver.quit()
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
    password = os.environ.get("X_PASSWORD")  # Twitter password
    tweets = get_tweets(username, password)

    if tweets:
        for tweet in tweets:
            tweet_text = tweet
            prediction = predict_tweet_liking(tweet_text)
            print(f"Tweet: {tweet_text}\nPrediction: {prediction}\n")
            save_to_graphdb(tweet_text, prediction)
    else:
        print(f"Could not retrieve tweets for user {username}")