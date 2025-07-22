'use strict'

import puppeteer from 'puppeteer-core';
import sqlite3 from 'sqlite3';

// Helper function to replace waitForTimeout
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  let browser = null;
  let context = null;
  let page = null;
  let db = null;

  try {
    // Log Puppeteer version
    console.log(`Using puppeteer-core version: ${puppeteer.version}`);

    // Initialize SQLite database
    console.log('Initializing database...');
    db = new sqlite3.Database('traders.db');
    db.run(`
      CREATE TABLE IF NOT EXISTS traders (
        address TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Connect to Lightpanda's CDP server
    console.log('Connecting to Lightpanda CDP server...');
    browser = await puppeteer.connect({
      browserWSEndpoint: 'ws://127.0.0.1:9222',
      defaultViewport: null,
    });

    // Verify connection
    const browserVersion = await browser.version();
    console.log(`Connected to browser: ${browserVersion}`);

    // Create a new browser context and page
    console.log('Creating browser context and page...');
    context = await browser.createBrowserContext();
    page = await context.newPage();

    // Retry navigation up to 3 times
    console.log('Navigating to gmgn.ai...');
    let navigationSuccess = false;
    let retries = 0;
    const maxRetries = 3;

    while (!navigationSuccess && retries < maxRetries) {
      try {
        console.log(`Navigation attempt ${retries + 1}/${maxRetries}`);
        await delay(2000); // Delay to stabilize session
        await page.goto('https://gmgn.ai/trade?chain=sol', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        navigationSuccess = true;
        console.log('Navigation successful');
      } catch (error) {
        console.warn(`Navigation attempt ${retries + 1} failed: ${error.message}`);
        retries++;
        if (retries === maxRetries) {
          throw new Error(`Navigation failed after ${maxRetries} attempts: ${error.message}`);
        }
        // Recreate page if frame is detached
        await page.close().catch(() => {});
        page = await context.newPage();
      }
    }

    // Close modals
    console.log('Closing modals...');
    // Close .css-pt4g3d modal
    const firstModal = await page.$('.css-pt4g3d');
    if (firstModal) {
      await firstModal.click();
      await delay(1000);
      console.log('Closed .css-pt4g3d modal');
    }

    // Click button.pi-btn:nth-child(2) up to 6 times
    let tableVisible = await page.$('table') !== null;
    let clickCount = 0;
    const maxClicks = 6;

    while (!tableVisible && clickCount < maxClicks) {
      const secondModalButton = await page.$('button.pi-btn:nth-child(2)');
      if (secondModalButton) {
        await secondModalButton.click();
        console.log(`Clicked pi-btn modal (${clickCount + 1}/${maxClicks})`);
        await delay(1000);
        clickCount++;
        tableVisible = await page.$('table') !== null;
      } else {
        console.log('pi-btn button not found');
        break;
      }
    }

    if (!tableVisible) {
      throw new Error('Table not visible after closing modals');
    }
    console.log('Table is visible');

    // Wait for table to be fully loaded
    await page.waitForSelector('table', { timeout: 10000 });

    // Extract trader addresses
    console.log('Extracting trader addresses...');
    const traders = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const addressCell = row.querySelector('td:first-child');
        return addressCell ? addressCell.textContent.trim() : null;
      }).filter(address => address && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address));
    });

    // Save to SQLite
    console.log('Saving to database...');
    const stmt = db.prepare('INSERT OR IGNORE INTO traders (address) VALUES (?)');
    traders.forEach(address => {
      stmt.run(address);
    });
    stmt.finalize();

    console.log(`Saved ${traders.length} trader addresses to database`);

    // Note: XHR URL capture skipped
    console.log('XHR URL capture skipped due to Lightpanda CDP limitations');

  } catch (error) {
    console.error('Script failed:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    // Clean up
    if (db) {
      db.close();
      console.log('Closed database');
    }
    if (page) {
      await page.close().catch(() => {});
      console.log('Closed page');
    }
    if (context) {
      await context.close().catch(() => {});
      console.log('Closed context');
    }
    if (browser) {
      await browser.disconnect().catch(() => {});
      console.log('Disconnected from browser');
    }
  }
})();