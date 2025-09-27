# Agent Guidelines for Tradr Extension

## Build/Lint/Test Commands
- No build system required - load unpacked extension in Chrome DevTools
- No linting configured - use ESLint with browser environment if needed
- No testing framework - manual testing via Chrome extension reload
- Single test: Load extension, open popup, click "Test API" button

## Code Style Guidelines

### Imports & Modules
- Use ES6 modules with `importScripts()` for background scripts
- Export functions at bottom of ai.js for Node.js compatibility
- No external dependencies - vanilla JavaScript only

### Formatting
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Line length: ~100 characters max

### Naming Conventions
- camelCase for variables, functions, and properties
- PascalCase for constructor functions (none used)
- ALL_CAPS for constants (none defined)
- Prefix event handlers with `on` (e.g., `onPresetChange`)

### Types & Variables
- Use `const` for immutable values, `let` for mutable
- Avoid `var` except in preset files for compatibility
- No TypeScript - use JSDoc for complex function documentation

### Error Handling
- Wrap async operations in try/catch blocks
- Include detailed error context (URLs, prompts, responses)
- Log errors to console and show user-friendly messages
- Use `throw new Error()` with descriptive messages

### Security
- Never expose API keys in code or logs
- Validate all user inputs before processing
- Use HTTPS URLs for API calls
- Avoid eval() in production code (currently used for scraping)