import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Set up any global test state here
  // For example: seed database, clear test data, etc.

  console.log('✅ Global setup completed');

  return async () => {
    // Global teardown if needed
    console.log('🧹 Global teardown completed');
  };
}

export default globalSetup;