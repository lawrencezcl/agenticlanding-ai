import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Production testing configuration for AgenticLanding AI platform
 * Tests against https://agenticlanding-ai.vercel.app
 */
export default defineConfig({
  testDir: './tests/e2e/production',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report-production' }],
    ['json', { outputFile: 'test-results-production.json' }],
    ['junit', { outputFile: 'test-results-production.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://agenticlanding-ai.vercel.app',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each action */
    actionTimeout: 15000,

    /* Global timeout for navigation */
    navigationTimeout: 45000,

    /* User agent for realistic testing */
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

    /* Ignore HTTPS errors for production testing */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-production',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox-production',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit-production',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome-production',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari-production',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against tablet viewports */
    {
      name: 'Tablet-production',
      use: { ...devices['iPad Pro'] },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/production/global-setup.ts'),

  /* Test timeout */
  timeout: 90000,

  /* Expect timeout */
  expect: {
    timeout: 15000,
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results-production',

  /* Metadata for test reporting */
  metadata: {
    'Test Environment': 'Production',
    'Target URL': 'https://agenticlanding-ai.vercel.app',
    'Test Suite': 'Comprehensive E2E Production Tests',
    'Timestamp': new Date().toISOString()
  }
});