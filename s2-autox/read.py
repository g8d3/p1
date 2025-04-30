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

# SQLite setup
DATABASE_PATH = "tweets.db"

def create_tweet_node(conn, tweet_id, tweet_text, prediction):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tweets (tweet_id, text, prediction) VALUES (?, ?, ?)",
        (tweet_id, tweet_text, prediction),
    )
    conn.commit()

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
    b = botasaurus.create_browser()
    b.go_to("https://twitter.com/login")

    # Login
    b.type("#layers > div:nth-child(2) > div > div > div > div > div > div.css-1dbjc4n.r-1867qdf.r-1wbh5a2.r-kwpbio.r-rsyp9y.r-1pjcn9w.r-htvpln > div > div.css-1dbjc4n.r-eqz5dr.r-16y2uox.r-1wbh5a2 > div > div.css-1dbjc4n.r-1awozwy.r-18kxxzh.r-dnmrzf > div.css-1dbjc4n.r-1niwhzg.r-1udh08x.r-u8s1d.r-zchlnj.r-ipm5af.r-1wyyakj > div.css-1dbjc4n.r-mk0jrb.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61zpm3.r-oyd9v9 > div > label > div.css-1dbjc4n.r-16y2uox.r-1wbh5a2 > div > div > div.css-901oao.r-1bwzh9t.r-1b88vr5.r-1b7u577.r-16eur91.r-bcqeeo.r-qvutc0 > input", TWITTER_USERNAME)
    b.click('div[data-testid="Next"]')
    b.sleep(2)
    b.type('div[data-testid="PasswordField"] > div > label > div.css-1dbjc4n.r-16y2uox.r-1wbh5a2 > div > div > div.css-901oao.r-1bwzh9t.r-1b88vr5.r-1b7u577.r-16eur91.r-bcqeeo.r-qvutc0 > input', TWITTER_PASSWORD)
    b.click('div[data-testid="Login"]')
    b.sleep(5)

    # Scrape tweets
    tweets = []
    for article in b.query_all('article[data-testid="tweet"]'):
        try:
            tweet_id = article.get_attribute("data-tweet-id")
            tweet_text = article.query_selector('div[data-testid="tweetText"]').inner_text()
            tweets.append({"id": tweet_id, "text": tweet_text})
        except Exception as e:
            print(f"Error extracting tweet: {e}")

    b.close()
    return tweets

def main():
    tweets = read_twitter_feed()

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS tweets (tweet_id TEXT, text TEXT, prediction TEXT)"
    )
    conn.commit()

    for tweet in tweets:
        prediction = predict_tweet_relevance(tweet["text"])
        create_tweet_node(conn, tweet["id"], tweet["text"], prediction)
        print(f"Tweet ID: {tweet['id']}, Prediction: {prediction}")

    conn.close()

if __name__ == "__main__":
    main()