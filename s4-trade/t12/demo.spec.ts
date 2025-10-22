import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5176');
  await page.waitForLoadState('networkidle');

  // Mock MetaMask
  await page.evaluate(() => {
    (window as any).ethereum = {
      request: async (args: any) => {
        if (args.method === 'eth_requestAccounts') {
          return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'];
        } else if (args.method === 'personal_sign') {
          return '0x1234567890abcdef'; // Mock signature
        }
        return null;
      },
      isMetaMask: true,
    };
  });
});

test('demo loads without console errors', async ({ page }) => {
  const consoleMessages: string[] = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Check for error messages in console
  const errors = consoleMessages.filter(msg => msg.startsWith('error:'));
  expect(errors).toHaveLength(0);

  // Log all console messages for review
  console.log('Console messages:', consoleMessages);
});

test('connect wallet', async ({ page }) => {
  // Click Connect Wallet
  await page.click('text=Connect Wallet');

  // Check if authenticated UI appears (manual: 5-10s, auto: <2s)
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });
});

test('disconnect wallet', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  // Disconnect
  await page.click('text=Disconnect');

  // Check back to connect screen (manual: 1-2s, auto: <1s)
  await expect(page.locator('text=Connect Wallet')).toBeVisible({ timeout: 1000 });
});

test('select network', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  // Select Solana
  await page.selectOption('select', 'solana');

  // Check network updated (manual: 1-2s, auto: <1s)
  await expect(page.locator('text=Generated for solana:')).toBeVisible({ timeout: 1000 });
});

test('set wallet count', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  // Set count to 10
  await page.fill('input[type="number"]', '10');

  // Check value (manual: 1s, auto: <0.5s)
  await expect(page.locator('input[type="number"]')).toHaveValue('10');
});

test('generate wallets', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  // Set count to 2
  await page.fill('input[type="number"]', '2');

  // Generate
  await page.click('text=Generate Wallets');

  // Wait for wallets to appear (manual: 10-30s, auto: <5s)
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Check 2 wallets generated
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2);
});

test('copy address', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  await page.fill('input[type="number"]', '1');
  await page.click('text=Generate Wallets');
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Mock clipboard
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as any).copiedText = text;
        }
      }
    });
  });

  // Click Copy (manual: 2-3s, auto: <1s)
  await page.click('table tbody tr:first-child button:has-text("Copy")');

  // Verify copied
  const copied = await page.evaluate(() => (window as any).copiedText);
  expect(copied).toMatch(/^0x[a-fA-F0-9]{40}$/); // Ethereum address
});

test('export wallet', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  await page.fill('input[type="number"]', '1');
  await page.click('text=Generate Wallets');
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Mock clipboard
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as any).copiedText = text;
        }
      }
    });
  });

  // Click Export (manual: 2-3s, auto: <1s)
  await page.click('table tbody tr:first-child button:has-text("Export")');

  // Check copied text is JSON
  const copied = await page.evaluate(() => (window as any).copiedText);
  expect(() => JSON.parse(copied)).not.toThrow();
});

test('sign message', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  await page.fill('input[type="number"]', '1');
  await page.click('text=Generate Wallets');
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Mock clipboard and prompt
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as any).copiedText = text;
        }
      }
    });
    (window as any).prompt = () => 'test message';
  });

  // Click Sign Msg (manual: 5-10s, auto: <2s)
  await page.click('table tbody tr:first-child button:has-text("Sign Msg")');

  // Check signature copied
  const copied = await page.evaluate(() => (window as any).copiedText);
  expect(copied).toBeTruthy();
});

test('sign transaction', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  await page.fill('input[type="number"]', '1');
  await page.click('text=Generate Wallets');
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Mock clipboard and prompt
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as any).copiedText = text;
        }
      }
    });
    (window as any).prompt = () => '{"to": "0x123", "value": "1000000000000000000"}';
  });

  // Click Sign Tx (manual: 5-10s, auto: <2s)
  await page.click('table tbody tr:first-child button:has-text("Sign Tx")');

  // Check signed tx copied
  const copied = await page.evaluate(() => (window as any).copiedText);
  expect(copied).toBeTruthy();
});

test('delete wallet', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  await page.fill('input[type="number"]', '1');
  await page.click('text=Generate Wallets');
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Delete (manual: 2-3s, auto: <1s)
  await page.click('table tbody tr:first-child button:has-text("Delete")');

  // Check wallet removed
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(0);
});

test('toggle theme', async ({ page }) => {
  await page.click('text=Connect Wallet');
  await expect(page.locator('text=Disconnect')).toBeVisible({ timeout: 2000 });

  await page.fill('input[type="number"]', '1');
  await page.click('text=Generate Wallets');
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  // Check initial dark theme
  await expect(page.locator('.wallet-table-container')).toHaveClass(/dark/);

  // Toggle to light (manual: 1s, auto: <0.5s)
  await page.click('text=Light Theme');

  // Check light theme
  await expect(page.locator('.wallet-table-container')).toHaveClass(/light/);
});