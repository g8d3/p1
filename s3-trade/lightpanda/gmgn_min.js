'use strict'
import puppeteer from 'puppeteer-core';
(async () => {
  try {
    const browser = await puppeteer.connect({ browserWSEndpoint: 'ws://127.0.0.1:9222' });
    console.log('Connected:', await browser.version());
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    console.log('Navigating...');
    await page.goto('https://gmgn.ai/trade?chain=sol', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded');
    await page.close();
    await context.close();
    await browser.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
})();