#!/bin/bash

# Script to fix Playwright Chromium version mismatch

echo "=== Playwright Fix Script (Version 2) ==="

# 1. Clear Playwright cache
echo "Clearing Playwright cache..."
rm -rf "$HOME/.cache/ms-playwright"
if [ $? -eq 0 ]; then
    echo "Cache cleared successfully."
else
    echo "Failed to clear cache."
    exit 1
fi

# 2. Reinstall Playwright browsers (Chromium only)
echo -e "\nReinstalling Playwright Chromium..."
npx playwright install chromium
if [ $? -eq 0 ]; then
    echo "Chromium reinstalled successfully."
else
    echo "Failed to reinstall Chromium."
    exit 1
fi

# 3. Verify new Chromium executable
CHROMIUM_PATH=$(find "$HOME/.cache/ms-playwright" -type f -name chrome -path "*/chromium-*/chrome-linux/chrome" | head -n 1)
echo -e "\nChecking new Chromium executable..."
if [ -n "$CHROMIUM_PATH" ] && [ -f "$CHROMIUM_PATH" ]; then
    echo "Chromium executable found at $CHROMIUM_PATH"
    ls -l "$CHROMIUM_PATH"
    file "$CHROMIUM_PATH"
else
    echo "Chromium executable not found after reinstall."
    exit 1
fi

# 4. Check Playwright configuration for hardcoded paths
echo -e "\nChecking for Playwright configuration..."
if [ -f "playwright.config.js" ] || [ -f "playwright.config.ts" ]; then
    echo "Playwright config file found. Checking for hardcoded browser paths..."
    grep -i "executablePath" playwright.config.* || echo "No executablePath found in config."
else
    echo "No Playwright config file found."
fi

# 5. Check environment variables
echo -e "\nChecking environment variables for Playwright..."
env | grep -i "PLAYWRIGHT" || echo "No Playwright-related environment variables found."

# 6. Test Playwright with a simple script
echo -e "\nRunning a test script to verify Playwright..."
cat << EOF > test_playwright.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  console.log('Browser launched successfully:', await browser.version());
  await browser.close();
})();
EOF
node test_playwright.js
if [ $? -eq 0 ]; then
    echo "Playwright test script ran successfully."
else
    echo "Playwright test script failed."
fi

# 7. Suggest next steps
echo -e "\n=== Next Steps ==="
echo "1. Review the output above for any errors."
echo "2. If the test script failed, check for errors in the output."
echo "3. If issues persist, share the full output of this script."
echo "4. Ensure your Playwright scripts are using the correct browser version."
echo "5. If you suspect dependency issues, try: npm install @playwright/test@latest"