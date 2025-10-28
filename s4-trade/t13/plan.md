Web app dex trading terminal that allows user to CRUD:

- wallets and pick which of them to use for trade
- presets of slippage, entries and exits.
  - Each entry and exit can be set with price, slippage and volume.
  - Slippage from preset is used if no entry/exit slippage.
  - Each price and volume can be set as an absolute value or percentage.
  - A percentage in price is according current price.
  - A percentage in volume is according: total assets for entries, assets in trade for exits.
- RPCs to support EVM and SVM(Solana) networks
  - With default RPCs for most popular options

User and developer experience:

- Everything should be saved in DB tables in the browser
- Errors should be evident and complete(line numbers) and should be shown in a popup or modal that softly dissapears
- No mock data, let user and developer know that app failed, why and how.
- Errors can be seen in table with timestamps whenever user or developer wants
- No intrusive functions like `alert`, or `prompt` should be used
- Things like derived addresses private keys or other private information should be saved encrypted
