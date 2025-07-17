#!/bin/bash

# Script to fix Gemini CLI Playwright MCP issue

echo "=== Gemini CLI Playwright MCP Fix Script ==="

# 1. Check @executeautomation/playwright-mcp-server version
echo "Checking @executeautomation/playwright-mcp-server version..."
npm list -g @executeautomation/playwright-mcp-server || echo "playwright-mcp-server not found in global npm packages."
npm list @executeautomation/playwright-mcp-server || echo "playwright-mcp-server not found in local npm packages."

# 2. Update @executeautomation/playwright-mcp-server
echo -e "\nUpdating @executeautomation/playwright-mcp-server..."
npm install -g @executeautomation/playwright-mcp-server@latest
if [ $? -eq 0 ]; then
    echo "playwright-mcp-server updated successfully."
else
    echo "Failed to update playwright-mcp-server."
    exit 1
fi

# 3. Clear Playwright cache again
echo -e "\nClearing Playwright cache..."
rm -rf "$HOME/.cache/ms-playwright"
if [ $? -eq 0 ]; then
    echo "Cache cleared successfully."
else
    echo "Failed to clear cache."
    exit 1
fi

# 4. Reinstall Playwright browsers
echo -e "\nReinstalling Playwright Chromium..."
npx playwright install chromium
if [ $? -eq 0 ]; then
    echo "Chromium reinstalled successfully."
else
    echo "Failed to reinstall Chromium."
    exit 1
fi

# 5. Debug playwright-mcp-server
echo -e "\nCreating debug script to inspect playwright-mcp-server..."
cat << EOF > debug_mcp_playwright.js
const { chromium } = require('playwright');
(async () => {
  console.log('Playwright version:', require('playwright/package.json').version);
  console.log('Chromium executable path:', chromium.executablePath());
  const browser = await chromium.launch();
  console.log('Browser launched successfully:', await browser.version());
  await browser.close();
})();
EOF
echo "Running debug script with npx @executeautomation/playwright-mcp-server..."
npx @executeautomation/playwright-mcp-server --exec node debug_mcp_playwright.js
if [ $? -eq 0 ]; then
    echo "Debug script ran successfully."
else
    echo "Debug script failed."
fi

# 6. Test gemini CLI
echo -e "\nTesting gemini CLI with a simple command..."
echo "go to google" | gemini
if [ $? -eq 0 ]; then
    echo "Gemini CLI test ran successfully."
else
    echo "Gemini CLI test failed."
fi

# 7. Check for environment variables overriding Playwright paths
echo -e "\nChecking environment variables..."
env | grep -i "PLAYWRIGHT" || echo "No Playwright-related environment variables found."

# 8. Suggest next steps
echo -e "\n=== Next Steps ==="
echo "1. Review the output above, especially the debug script’s Playwright version and executable path."
echo "2. If the gemini CLI test fails, check the error message for details."
echo "3. If the issue persists, share the output of this script and any additional gemini or MCP configuration files."
echo "4. Consider explicitly setting the Playwright browser path in settings.json (see below)."
echo "5. Contact @executeautomation/playwright-mcp-server support if the issue persists."