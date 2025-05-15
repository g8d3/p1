'use strict'

import puppeteer from 'puppeteer-core';
import sqlite3 from 'sqlite3';

(async () => {
  let browser = null;
  let context = null;
  let page = null;
  let db = null;

  try {
    // Initialize SQLite database
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
      defaultViewport: null, // Use browser's default viewport
    });

    // Verify connection
    const browserVersion = await browser.version();
    console.log(`Connected to browser: ${browserVersion}`);

    // Create a new browser context and page
    context = await browser.createBrowserContext();
    page = await context.newPage();

    // Set up request interception
    let xhrUrl = null;
    try {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.resourceType() === 'xhr') {
          if (request.url().includes('api') && request.url().includes('traders')) {
            xhrUrl = request.url();
            console.log('Found XHR URL:', xhrUrl);
          }
        }
        request.continue();
      });
    } catch (error) {
      console.error('Failed to set up request interception:', error.message);
      throw error;
    }

    // Navigate to the page
    console.log('Navigating to gmgn.ai...');
    await page.goto('https://gmgn.ai/trade?chain=sol', { waitUntil: 'networkidle2', timeout: 30000 });

    // Close modals
    console.log('Closing modals...');
    // Close .css-pt4g3d modal
    const firstModal = await page.$('.css-pt4g3d');
    if (firstModal) {
      await firstModal.click();
      await page.waitForTimeout(1000);
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
        await page.waitForTimeout(1000);
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
    const stmt = db.prepare('INSERT OR IGNORE INTO traders (address) VALUES (?)');
    traders.forEach(address => {
      stmt.run(address);
    });
    stmt.finalize();

    console.log(`Saved ${traders.length} trader addresses to database`);

    // Log XHR URL
    if (xhrUrl) {
      console.log('API endpoint for table data:', xhrUrl);
    } else {
      console.log('No XHR URL found for table data');
    }

  } catch (error) {
    console.error('Script failed:', error.message);
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