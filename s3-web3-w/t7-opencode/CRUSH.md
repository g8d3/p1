# Build/Test/Lint Commands

- **Build:** `anchor build`
- **Test:** `anchor test`
- **Run single TypeScript test:** `ts-mocha -p ./tsconfig.json -t 1000000 "tests/<test-file-name>.ts"`
- **Lint:** `npm run lint`
- **Lint Fix:** `npm run lint:fix`

# Code Style Guidelines

- **Formatting:** Adhere to Prettier formatting, enforced by `npm run lint`.
- **Imports:** Imports should be organized and follow a consistent order.
- **Types:** Use TypeScript for type safety in JavaScript files.
- **Naming Conventions:** Use `camelCase` for variables and functions, `PascalCase` for types and classes, and `SCREAMING_SNAKE_CASE` for constants.
- **Error Handling:** Implement robust error handling with `try-catch` blocks for asynchronous operations.
- **Comments:** Keep comments concise and focused on explaining _why_ certain code exists, rather than _what_ it does.

# Tool-Specific Rules

No specific Cursor or Copilot rules found in the repository.

