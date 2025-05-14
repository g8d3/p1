import notte

agi = notte.Agent(reasoning_model="gemini/gemini-2.0-flash", max_steps=5)
agi.run(task="doom scroll cat memes on google images")