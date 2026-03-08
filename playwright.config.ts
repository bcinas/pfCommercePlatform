import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
  fullyParallel: false, // serial to avoid race conditions on shared DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Uncomment below to auto-start dev servers for CI
  // webServer: [
  //   { command: 'cd backend && npm run dev', url: 'http://localhost:5000', reuseExistingServer: true },
  //   { command: 'cd frontend && npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
  // ],
})
