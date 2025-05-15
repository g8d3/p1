'use strict'

import puppeteer from 'puppeteer-core';
import sqlite3 from 'sqlite3';

(async () => {
  // Initialize SQLite database
  const db = new sqlite3.Database('traders.db');
  
  // Create table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS traders (
      address TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Connect to Lightpanda's CDP server
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:9222',
  });

  // Create a new browser context and page
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  // Intercept network requests to find XHR
  let xhrUrl = null;
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    if (request.resourceType() === 'xhr') {
      // Look for the request that fetches table data
      if (request.url().includes('api') && request.url().includes('traders')) {
        xhrUrl = request.url();
        console.log('Found XHR URL:', xhrUrl);
      }
    }
    request.continue();
  });

  // Navigate to the page
  await page.goto('https://gmgn.ai/trade?chain=sol', { waitUntil: 'networkidle2' });

  // Close modals
  try {
    // Close .css-pt4g3d modal
    const firstModal = await page.$('.css-pt4g3d');
    if (firstModal) {
      await firstModal.click();
      await page.waitForTimeout(1000); // Wait for modal to close
    }

    // Click button.pi-btn:nth-child(2) up to 6 times, 1 second apart, until table is present
    let tableVisible = await page.$('table') !== null;
    let clickCount = 0;
    const maxClicks = 6;

    while (!tableVisible && clickCount < maxClicks) {
      const secondModalButton = await page.$('button.pi-btn:nth-child(2)');
      if (secondModalButton) {
        await secondModalButton.click();
        await page.waitForTimeout(1000); // Wait 1 second between clicks
        clickCount++;
        tableVisible = await page.$('table') !== null;
      } else {
        break; // Exit if button not found
      }
    }

    if (!tableVisible) {
      console.log('Table not visible after closing modals');
      await page.close();
      await context.close();
      await browser.disconnect();
      db.close();
      return;
    }
  } catch (error) {
    console.log('Error closing modals:', error.message);
    await page.close();
    await context.close();
    await browser.disconnect();
    db.close();
    return;
  }

  // Wait for table to be fully loaded
  await page.waitForSelector('table', { timeout: 10000 });

  // Extract trader addresses
  const traders = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const addressCell = row.querySelector('td:first-child');
      return addressCell ? addressCell.textContent.trim() : null;
    }).filter(address => address && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)); // Basic Solana address validation
  });

  // Save to SQLite
  const stmt = db.prepare('INSERT OR IGNORE INTO traders (address) VALUES (?)');
  traders.forEach(address => {
    stmt.run(address);
  });
  stmt.finalize();

  console.log(`Saved ${traders.length} trader addresses to database`);

  // Log the XHR URL if found
  if (xhrUrl) {
    console.log('API endpoint for table data:', xhrUrl);
  } else {
    console.log('No XHR URL found for table data');
  }

  // Clean up
  db.close();
  await page.close();
  await context.close();
  await browser.disconnect();
})();