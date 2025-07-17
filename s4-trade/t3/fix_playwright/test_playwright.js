const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  console.log('Browser launched successfully:', await browser.version());
  await browser.close();
})();
