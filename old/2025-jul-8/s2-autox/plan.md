code to automate reading my twitter feed on s2-autox/read.py.

Do not ask to read s2-autox/read.py, overwrite it.

- I put my twitter user and pass in env vars X_USER, X_PASSWORD.
- Full browser is automated by code using botasaurus, so twitter app might not be needed.
- I want to check if an LLM is able to predict which tweets I would like
<!-- - Save predictions in a graph DB. -->
- Save predictions in sqlite.
- Use LLM provider openrouter and gemini api, allow easy swith in code
- Use LLM google/gemini-2.0-flash-001 and gemini-2.0-flash, allow easy swith in code
- URL for liked tweets seems to be x.com/<user>/likes, it needs auth
- scrape liked tweets so that LLM can predict
- URL for tweets to predict is x.com/home
- use uv in commands, if uv is not installed install it

given predicted tweets that user would like filter the ones that can be useful to create digital products, user can see possible products and pick where is capital is going to to work