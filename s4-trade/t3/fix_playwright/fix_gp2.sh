#!/bin/bash

# Script to fix Gemini CLI Playwright MCP issue (Version 2)

echo "=== Gemini CLI Playwright MCP Fix Script (Version 2) ==="

# 1. Verify @executeautomation/playwright-mcp-server version
echo "Checking @executeautomation/playwright-mcp-server version..."
npm list -g @executeautomation/playwright-mcp-server || echo "playwright-mcp-server not found in global npm packages."
npm list @executeautomation/playwright-mcp-server || echo "playwright-mcp-server not found in local npm packages."

# 2. Check Playwright version used by playwright-mcp-server
echo -e "\nChecking Playwright version in playwright-mcp-server's node_modules..."
MCP_PATH=$(dirname $(dirname $(which npx)))/lib/node_modules/@executeautomation/playwright-mcp-server
if [ -d "$MCP_PATH/node_modules/playwright" ]; then
    echo "Playwright found in playwright-mcp-server's node_modules:"
    npm list --prefix "$MCP_PATH" playwright
else
    echo "No Playwright found in playwright-mcp-server's node_modules."
fi

# 3. Ensure Playwright is installed in the project
echo -e "\nInstalling Playwright in the project to ensure compatibility..."
npm install @playwright/test@1.53.1
if [ $? -eq 0 ]; then
    echo "Playwright installed successfully."
else
    echo "Failed to install Playwright."
    exit 1
fi

# 4. Clear Playwright cache
echo -e "\nClearing Playwright cache..."
rm -rf "$HOME/.cache/ms-playwright"
if [ $? -eq 0 ]; then
    echo "Cache cleared successfully."
else
    echo "Failed to clear cache."
    exit 1
fi

# 5. Reinstall Playwright browsers with the correct version
echo -e "\nReinstalling Playwright Chromium for version 1.53.1..."
npx playwright install chromium --force
if [ $? -eq 0 ]; then
    echo "Chromium reinstalled successfully."
else
    echo "Failed to reinstall Chromium."
    exit 1
fi

# 6. Verify Chromium executable
echo -e "\nChecking Chromium executable..."
CHROMIUM_PATH=$(find "$HOME/.cache/ms-playwright" -type f -name chrome -path "*/chromium-*/chrome-linux/chrome" | head -n 1)
if [ -n "$CHROMIUM_PATH" ] && [ -f "$CHROMIUM_PATH" ]; then
    echo "Chromium executable found at $CHROMIUM_PATH"
    ls -l "$CHROMIUM_PATH"
    file "$CHROMIUM_PATH"
else
    echo "Chromium executable not found."
    exit 1
fi

# 7. Test gemini CLI
echo -e "\nTesting gemini CLI with a simple command..."
echo "go to google" | gemini
if [ $? -eq 0 ]; then
    echo "Gemini CLI test ran successfully."
else
    echo "Gemini CLI test failed. Check the error output above."
fi

# 8. Suggest next steps
echo -e "\n=== Next Steps ==="
echo "1. Review the output above, especially the gemini CLI test result."
echo "2. If the gemini CLI test fails, note the error message."
echo "3. If the issue persists, try adding PLAYWRIGHT_BROWSERS_PATH to settings.json (see previous instructions)."
echo "4. Share the full output of this script and any additional gemini or MCP configuration files."
echo "5. Contact @executeautomation/playwright-mcp-server support if the issue persists."