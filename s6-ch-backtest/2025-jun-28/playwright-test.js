// playwright-test.js
// This Playwright test script dynamically explores the app, tests all main flows, and logs results.
// It is designed to be LLM-friendly and can be extended to report to a DB or external system.

const { test, expect } = require('@playwright/test');

// Utility to log results (could be extended to write to a DB)
function logResult(step, success, message) {
    console.log(JSON.stringify({ step, success, message }));
}

test('Full DB Manager Flow', async ({ page }) => {
    await page.goto('http://localhost:5000');
    logResult('visit_home', true, 'Visited home page');

    // Add a credential (SQLite, in-memory for test)
    await page.fill('input[name="host"]', '');
    await page.fill('input[name="port"]', '');
    await page.fill('input[name="user"]', '');
    await page.fill('input[name="password"]', '');
    await page.fill('input[name="database"]', ':memory:');
    await page.selectOption('select[name="type"]', 'sqlite');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=SQLite')).toBeVisible();
    logResult('add_credential', true, 'Added SQLite credential');

    // Connect to the credential
    await page.click('button:has-text("Connect")');
    await expect(page.locator('text=Tables')).toBeVisible();
    logResult('connect_credential', true, 'Connected to SQLite');

    // Create a table
    await page.fill('input[placeholder="Table name"]', 'test_table');
    await page.fill('input[placeholder*="id INTEGER"]', 'id INTEGER PRIMARY KEY, name TEXT');
    await page.click('form button:has-text("Create Table")');
    await expect(page.locator('button:has-text("test_table")')).toBeVisible();
    logResult('create_table', true, 'Created table');

    // Open the table
    await page.click('button:has-text("test_table")');
    await expect(page.locator('form button:has-text("Insert Row")')).toBeVisible();
    logResult('open_table', true, 'Opened table view');

    // Insert a row
    await page.fill('input[placeholder="id"]', '1');
    await page.fill('input[placeholder="name"]', 'Alice');
    await page.click('form button:has-text("Insert Row")');
    await expect(page.locator('td', { hasText: 'Alice' })).toBeVisible();
    logResult('insert_row', true, 'Inserted row');

    // Delete the row
    await page.click('form button:has-text("Delete")');
    await expect(page.locator('td', { hasText: 'Alice' })).not.toBeVisible();
    logResult('delete_row', true, 'Deleted row');

    // Drop the table
    await page.click('button:has-text("Drop")');
    await expect(page.locator('button:has-text("test_table")')).not.toBeVisible();
    logResult('drop_table', true, 'Dropped table');

    // All done
    logResult('test_complete', true, 'All main flows tested');
});
