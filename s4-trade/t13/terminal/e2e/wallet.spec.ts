import { test, expect } from '@playwright/test';

test.describe('Wallet Management', () => {
  test('creates a new wallet', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click Wallets tab
    await page.getByRole('button', { name: 'Wallets' }).click();

    // Fill wallet form
    await page.getByPlaceholder('Wallet Alias').fill('Test Wallet');
    await page.getByPlaceholder('Private Key').fill('0x1234567890abcdef');

    // Click create
    await page.getByRole('button', { name: 'Create Wallet' }).click();

    // Check if wallet appears in table
    await expect(page.getByText('Test Wallet')).toBeVisible();
  });
});