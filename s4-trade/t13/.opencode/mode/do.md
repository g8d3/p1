# Introduction

Web app dex trading terminal that allows user to CRUD:

- wallets and pick which of them to use for trade
  - wallets should be derived from browser extension using a signature, not expect user to give a private key or address
- presets of slippage, entries and exits.
  - Each entry and exit can be set with price, slippage and volume.
  - Slippage from preset is used if no entry/exit slippage.
  - Each price and volume can be set as an absolute value or percentage.
  - A percentage in price is according current price.
  - A percentage in volume is according: total assets for entries, assets in trade for exits.
- RPCs to support EVM and SVM(Solana) networks
  - With default RPCs for most popular options
- aggregators supporting 1inch and Jupiter

# User and developer experience

- Everything should be saved in DB tables in the browser
- Errors should be evident and complete(line numbers) and should be shown in a popup or modal that softly dissapears
- No mock data, let user and developer know that app failed, why and how.
- Errors can be seen in table with timestamps whenever user or developer wants
- No intrusive functions like `alert`, or `prompt` should be used
- Things like derived addresses private keys or other private information should be saved encrypted

# AI developer

AI developer should:

- Write e2e tests
- Verify tests run faster than manual testing
- Not run commands like npm run dev, since I will be running that in another terminal tab
- Make npm run dev output logs to a file where ai developer can access and verify if there are errors
- Use playwright in headed or UI mode to make sure everything is running perfectly before asking for human interaction
- Read browser console and verify there are no errors
- Push to git after each attempt
- Compare what is on the current version with what a user would like, and iteratively write files called uxdx/<datetime>.md that shows past, present and future aiming to create the best user and developer experience. Use your intuition to determine when a new file is needed, or if user tells you to use a new file you can use a new file.

# uxdx/<datetime>.md files

In this section I will be putting all those specific and concrete things where I see AI developer is doing things that seem suboptimal like:

-