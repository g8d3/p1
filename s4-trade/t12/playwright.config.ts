import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  webServer: {
    command: 'npm run demo',
    port: 5176,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  workers: 4, // Run tests in parallel for speed
  expect: {
    timeout: 5000, // Shorter expect timeouts
  },
  use: {
    actionTimeout: 3000, // Faster actions
  },
});