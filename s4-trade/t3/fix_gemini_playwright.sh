#!/bin/bash

# Script to fix Gemini CLI Playwright issue

echo "=== Gemini CLI Playwright Fix Script ==="

# 1. Verify gemini CLI version and Playwright dependency
echo "Checking gemini CLI version and dependencies..."
gemini --version || echo "Failed to get gemini version."
npm list -g gemini || echo "gemini not found in global npm packages."
npm list gemini || echo "gemini not found in local npm packages."

# 2. Check which Playwright gemini is using
echo -e "\nChecking Playwright used by gemini..."
GEMINI_PATH=$(which gemini)
if [ -n "$GEMINI_PATH" ]; then
    echo "Gemini found at: $GEMINI_PATH"
    NODE_MODULES_PATH=$(dirname $(dirname "$GEMINI_PATH"))/lib/node_modules
    if [ -d "$NODE_MODULES_PATH/playwright" ]; then
        echo "Playwright found in gemini's node_modules:"
        npm list --prefix "$NODE_MODULES_PATH" playwright
    else
        echo "No Playwright found in gemini's node_modules."
    fi
else
    echo "Gemini CLI not found."
fi

# 3. Clear Playwright cache again (in case gemini uses a different cache)
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

# 5. Debug gemini Playwright configuration
echo -e "\nCreating debug script to inspect gemini's Playwright usage..."
cat << EOF > debug_gemini_playwright.js
const { chromium } = require('playwright');
(async () => {
  console.log('Playwright version:', require('playwright/package.json').version);
  console.log('Chromium executable path:', chromium.executablePath());
  const browser = await chromium.launch();
  console.log('Browser launched successfully:', await browser.version());
  await browser.close();
})();
EOF
echo "Running debug script..."
node debug_gemini_playwright.js
if [ $? -eq 0 ]; then
    echo "Debug script ran successfully."
else
    echo "Debug script failed."
fi

# 6. Check pnpm lockfile (if using pnpm)
echo -e "\nChecking for pnpm lockfile..."
if [ -f "pnpm-lock.yaml" ]; then
    echo "pnpm-lock.yaml found. Checking for Playwright version..."
    grep -i "playwright" pnpm-lock.yaml || echo "No Playwright version specified in pnpm-lock.yaml."
else
    echo "No pnpm-lock.yaml found."
fi

# 7. Suggest updating gemini
echo -e "\nChecking for gemini updates..."
npm outdated -g gemini || echo "No updates checked for gemini (not installed globally or npm error)."

# 8. Suggest next steps
echo -e "\n=== Next Steps ==="
echo "1. Review the output above, especially the Playwright version and executable path used by gemini."
echo "2. If the debug script shows an incorrect path or version, ensure gemini uses the same Playwright as your project."
echo "3. If using pnpm Tej, run: pnpm install @playwright/test@latest"
echo "4. If gemini is outdated, update it: npm install -g gemini@latest"
echo "5. If issues persist, share the output of this script and any gemini configuration files."