#!/bin/bash

# Script to diagnose and fix Playwright Chromium executable issue

echo "=== Playwright Diagnostic and Fix Script ==="

# 1. Check Node.js and npm versions
echo "Checking Node.js and npm versions..."
node -v
npm -v

# 2. Check Playwright version
echo -e "\nChecking Playwright version..."
npm list playwright || echo "Playwright not found in npm packages."

# 3. Check if Playwright browsers are installed
echo -e "\nChecking Playwright browser installation..."
npx playwright install --dry-run || echo "Playwright browser check failed."

# 4. Verify Chromium executable path
CHROMIUM_PATH="$HOME/.cache/ms-playwright/chromium-1161/chrome-linux/chrome"
echo -e "\nChecking Chromium executable at $CHROMIUM_PATH..."
if [ -f "$CHROMIUM_PATH" ]; then
    echo "Chromium executable exists."
    ls -l "$CHROMIUM_PATH"
    file "$CHROMIUM_PATH"
else
    echo "Chromium executable not found at $CHROMIUM_PATH."
fi

# 5. Check permissions of the Playwright cache directory
echo -e "\nChecking permissions of Playwright cache directory..."
ls -ld "$HOME/.cache/ms-playwright"

# 6. Attempt to reinstall Playwright browsers
echo -e