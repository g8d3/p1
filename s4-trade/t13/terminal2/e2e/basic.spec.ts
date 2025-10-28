import { test, expect } from '@playwright/test'

test.describe('DEX Trading Terminal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should load the terminal page', async ({ page }) => {
    await expect(page).toHaveTitle(/DEX Trading Terminal/)

    // Check main heading
    await expect(page.locator('h1')).toContainText('DEX Trading Terminal')

    // Check that main sections are present
    await expect(page.locator('h3:has-text("Wallets")')).toBeVisible()
    await expect(page.locator('h3:has-text("EVM RPC Endpoints")')).toBeVisible()
    await expect(page.locator('h3:has-text("SVM RPC Endpoints")')).toBeVisible()
    await expect(page.locator('h3:has-text("Trading Presets")')).toBeVisible()
  })

  test('should show empty states initially', async ({ page }) => {
    // Check wallets section shows empty state
    await expect(page.locator('text=No wallets configured')).toBeVisible()

    // Check presets section shows empty state
    await expect(page.locator('text=No presets configured')).toBeVisible()
  })

  test('should be able to add a wallet', async ({ page }) => {
    // Click add wallet button
    await page.locator('text=Add Wallet').click()

    // Fill wallet form
    await page.locator('input[placeholder="My Wallet"]').fill('Test Wallet')
    await page.locator('input[placeholder="0x..."]').fill('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')

    // Submit form
    await page.locator('text=Create Wallet').click()

    // Check wallet appears in table
    await expect(page.locator('text=Test Wallet')).toBeVisible()
    await expect(page.locator('text=0x74...f44e')).toBeVisible()
  })

  test('should be able to add an RPC endpoint', async ({ page }) => {
    // Click add RPC button
    await page.locator('text=Add RPC').first().click()

    // Fill RPC form
    await page.locator('input[placeholder="My RPC"]').fill('Test RPC')
    await page.locator('input[placeholder="https://..."]').fill('https://test-rpc.example.com')

    // Submit form
    await page.locator('text=Create RPC').click()

    // Check RPC appears in table
    await expect(page.locator('text=Test RPC')).toBeVisible()
  })

  test('should show error center', async ({ page }) => {
    // Error center should be visible as a button
    await expect(page.locator('text=Errors (0)')).toBeVisible()

    // Click to open error center
    await page.locator('text=Errors (0)').click()

    // Check error center modal is open
    await expect(page.locator('text=Error Center')).toBeVisible()
    await expect(page.locator('text=No errors logged yet')).toBeVisible()
  })
})