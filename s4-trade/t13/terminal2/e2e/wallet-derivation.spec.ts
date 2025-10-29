import { test, expect } from '@playwright/test'

test.describe('Wallet Derivation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should detect wallet extensions when available', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Mock extensions after page load
    await page.evaluate(() => {
      // Mock MetaMask being available
      window.ethereum = {
        request: function(args) {
          if (args.method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
          }
          if (args.method === 'personal_sign') {
            return '0x1234567890abcdef'
          }
          if (args.method === 'eth_accounts') {
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
          }
          return []
        }
      }

      // Mock Phantom being available
      window.solana = {
        isPhantom: true,
        connect: function() {
          return {
            publicKey: { toString: function() { return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' } }
          }
        },
        signMessage: function() { return { signature: new Uint8Array(64) } },
        isConnected: true,
        publicKey: { toString: function() { return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' } }
      }
    })

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Check that both extensions are detected
    await expect(page.locator('text=Derive from MetaMask (EVM)')).toBeVisible()
    await expect(page.locator('text=Derive from Phantom (SVM)')).toBeVisible()
  })

  test('should derive MetaMask wallet successfully', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Mock MetaMask
    await page.evaluate(() => {
      window.ethereum = {
        request: function(args) {
          if (args.method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
          }
          if (args.method === 'personal_sign') {
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00'
          }
          return []
        }
      }
    })

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Click derive from MetaMask
    await page.locator('text=Derive from MetaMask (EVM)').click()

    // Check derived wallet appears in table (address should be different from extension)
    await expect(page.locator('text=MetaMask Derived')).toBeVisible()
    await expect(page.locator('span').filter({ hasText: 'MetaMask' })).toBeVisible() // Source column badge
    // The derived address should not be the same as the extension address
    await expect(page.locator('text=0x74...f44e')).not.toBeVisible()
  })

  test('should derive Phantom wallet successfully', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Mock Phantom
    await page.evaluate(() => {
      window.solana = {
        isPhantom: true,
        connect: function() {
          return {
            publicKey: { toString: function() { return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' } }
          }
        },
        signMessage: function() {
          return { signature: new Uint8Array(64).fill(1) }
        },
        isConnected: true,
        publicKey: { toString: function() { return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' } }
      }
    })

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Click derive from Phantom
    await page.locator('text=Derive from Phantom (SVM)').click()

    // Check derived wallet appears in table (address should be different from extension)
    await expect(page.locator('text=Phantom Derived')).toBeVisible()
    await expect(page.locator('span').filter({ hasText: 'Phantom' })).toBeVisible() // Source column badge
    // The derived address should not be the same as the extension address
    await expect(page.locator('text=EPjF...Dt1v')).not.toBeVisible()
  })

  test('should handle MetaMask connection rejection', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Mock MetaMask rejection
    await page.evaluate(() => {
      window.ethereum = {
        request: function(args) {
          if (args.method === 'eth_requestAccounts') {
            throw { code: 4001, message: 'User rejected the request' }
          }
          return []
        }
      }
    })

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Click derive from MetaMask
    await page.locator('text=Derive from MetaMask (EVM)').click()

    // Check error appears
    await expect(page.locator('text=Errors (1)')).toBeVisible()
  })

  test('should prevent duplicate wallet connections', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Mock MetaMask
    await page.evaluate(() => {
      window.ethereum = {
        request: function(args) {
          if (args.method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
          }
          if (args.method === 'personal_sign') {
            return '0x1234567890abcdef'
          }
          return []
        }
      }
    })

    // Connect wallet first time
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Derive from MetaMask (EVM)').click()

    // Try to derive same wallet again
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Derive from MetaMask (EVM)').click()

    // Check error appears
    await expect(page.locator('text=Errors (1)')).toBeVisible()
  })

  test('should generate unique names for multiple wallets of same type', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Mock MetaMask with dynamic account switching
    await page.evaluate(() => {
      let callCount = 0
      window.ethereum = {
        request: function(args) {
          if (args.method === 'eth_requestAccounts') {
            callCount++
            return callCount === 1
              ? ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
              : ['0x1234567890123456789012345678901234567890']
          }
          if (args.method === 'personal_sign') {
            return '0x1234567890abcdef'
          }
          return []
        }
      }
    })

    // Derive first wallet
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Derive from MetaMask (EVM)').click()

    // Derive second wallet (different account)
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Derive from MetaMask (EVM)').click()

    // Check both wallets have unique names
    await expect(page.locator('text=MetaMask Derived')).toBeVisible()
    await expect(page.locator('text=MetaMask Derived 1')).toBeVisible()
  })
})