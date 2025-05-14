import notte

agi = notte.Agent(reasoning_model="gemini/gemini-2.0-flash", max_steps=5)
agi.run(task="go to https://gmgn.ai/trade?chain=sol and find which url is browser using to fetch items on displayed table")