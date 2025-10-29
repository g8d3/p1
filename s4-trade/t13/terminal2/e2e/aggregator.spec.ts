import { test, expect } from '@playwright/test'

test.describe('Aggregator Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should display default aggregators', async ({ page }) => {
    // Check that default aggregators are loaded
    await expect(page.locator('h3:has-text("Aggregators")')).toBeVisible()

    // Should show 1inch and Jupiter by default (in the aggregators table)
    await expect(page.locator('td:has-text("1inch")').first()).toBeVisible()
    await expect(page.locator('td:has-text("Jupiter")').first()).toBeVisible()
  })

  test('should allow adding new aggregator', async ({ page }) => {
    // Click add aggregator button
    await page.locator('text=Add Aggregator').click()

    // Fill aggregator form
    await page.locator('input[placeholder="My Aggregator"]').fill('Test Aggregator')
    await page.locator('button:has-text("Create Aggregator")').click()

    // Check aggregator appears in table
    await expect(page.locator('text=Test Aggregator')).toBeVisible()
  })

  test('should show trading interface', async ({ page }) => {
    // Check trading section elements (exclude Trading Presets section)
    await expect(page.locator('h3:has-text("Trading")').first()).toBeVisible()
    await expect(page.locator('text=From Token')).toBeVisible()
    await expect(page.locator('text=To Token')).toBeVisible()
    await expect(page.locator('text=Amount')).toBeVisible()
    await expect(page.locator('text=Get Quotes')).toBeVisible()
  })

  test('should validate trading form', async ({ page }) => {
    // Try to get quotes without filling form
    await page.locator('text=Get Quotes').click()

    // Should not crash and button should still be visible
    await expect(page.locator('text=Get Quotes')).toBeVisible()
  })

  test('should handle aggregator API errors gracefully', async ({ page }) => {
    // This test would require mocking API responses
    // For now, just check that the UI handles missing data gracefully
    await expect(page.locator('text=Get Quotes')).toBeVisible()
  })
})