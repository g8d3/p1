import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/React App/);
});

test('can navigate to traders list', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Traders');
  await expect(page.locator('.RaList-main')).toBeVisible();
});
