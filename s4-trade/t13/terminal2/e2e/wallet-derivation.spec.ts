import { test, expect } from '@playwright/test'

test.describe('Wallet Derivation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should detect wallet extensions when available', async ({ page }) => {
    // Mock extensions before loading the page
    await page.addInitScript(() => {
      // Mock MetaMask being available
      (window as any).ethereum = {
        request: async (args: any) => {
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
      (window as any).solana = {
        isPhantom: true,
        connect: async () => ({
          publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
        }),
        signMessage: async () => ({ signature: new Uint8Array(64) }),
        isConnected: true,
        publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
      }
    })

    await page.goto('http://localhost:3000')

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Check that both extensions are detected
    await expect(page.locator('text=Connect MetaMask (EVM)')).toBeVisible()
    await expect(page.locator('text=Connect Phantom (SVM)')).toBeVisible()
  })

  test('should connect MetaMask wallet successfully', async ({ page }) => {
    // Mock MetaMask
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async (args: any) => {
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

    await page.goto('http://localhost:3000')

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Click connect MetaMask
    await page.locator('text=Connect MetaMask (EVM)').click()

    // Check wallet appears in table
    await expect(page.locator('text=MetaMask Wallet')).toBeVisible()
    await expect(page.locator('text=0x74...f44e')).toBeVisible()
    await expect(page.locator('text=Derived')).toBeVisible()
  })

  test('should connect Phantom wallet successfully', async ({ page }) => {
    // Mock Phantom
    await page.addInitScript(() => {
      (window as any).solana = {
        isPhantom: true,
        connect: async () => ({
          publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
        }),
        signMessage: async () => ({ signature: new Uint8Array(64) }),
        isConnected: true,
        publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
      }
    })

    await page.goto('http://localhost:3000')

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Click connect Phantom
    await page.locator('text=Connect Phantom (SVM)').click()

    // Check wallet appears in table
    await expect(page.locator('text=Phantom Wallet')).toBeVisible()
    await expect(page.locator('text=EPjF...Dt1v')).toBeVisible()
    await expect(page.locator('text=Derived')).toBeVisible()
  })

  test('should handle MetaMask connection rejection', async ({ page }) => {
    // Mock MetaMask rejection
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async (args: any) => {
          if (args.method === 'eth_requestAccounts') {
            throw { code: 4001, message: 'User rejected the request' }
          }
          return []
        }
      }
    })

    await page.goto('http://localhost:3000')

    // Open connect wallet dialog
    await page.locator('text=Connect Wallet').click()

    // Click connect MetaMask
    await page.locator('text=Connect MetaMask (EVM)').click()

    // Check error appears
    await expect(page.locator('text=Errors (1)')).toBeVisible()
  })

  test('should prevent duplicate wallet connections', async ({ page }) => {
    // Mock MetaMask
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async (args: any) => {
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

    await page.goto('http://localhost:3000')

    // Connect wallet first time
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Connect MetaMask (EVM)').click()

    // Try to connect same wallet again
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Connect MetaMask (EVM)').click()

    // Check error appears
    await expect(page.locator('text=Errors (1)')).toBeVisible()
  })

  test('should generate unique names for multiple wallets of same type', async ({ page }) => {
    // Mock MetaMask with dynamic account switching
    await page.addInitScript(() => {
      let callCount = 0
      (window as any).ethereum = {
        request: async (args: any) => {
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

    await page.goto('http://localhost:3000')

    // Connect first wallet
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Connect MetaMask (EVM)').click()

    // Connect second wallet (different account)
    await page.locator('text=Connect Wallet').click()
    await page.locator('text=Connect MetaMask (EVM)').click()

    // Check both wallets have unique names
    await expect(page.locator('text=MetaMask Wallet')).toBeVisible()
    await expect(page.locator('text=MetaMask Wallet 2')).toBeVisible()
  })
})