const { chromium } = require('playwright');
(async () => {
  console.log('Playwright version:', require('playwright/package.json').version);
  console.log('Chromium executable path:', chromium.executablePath());
  const browser = await chromium.launch();
  console.log('Browser launched successfully:', await browser.version());
  await browser.close();
})();
