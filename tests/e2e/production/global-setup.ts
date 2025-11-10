import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Production E2E Test Setup...');
  console.log('📍 Target URL: https://agenticlanding-ai.vercel.app');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Pre-flight checks
    console.log('🔍 Performing pre-flight checks...');

    // Check if the site is accessible
    const response = await page.goto('https://agenticlanding-ai.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    if (!response) {
      throw new Error('Unable to connect to production site');
    }

    const status = response.status();
    console.log(`📊 Site status: ${status}`);

    if (status >= 400) {
      throw new Error(`Production site returned status ${status}`);
    }

    // Check for critical errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000); // Wait for initial page load

    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors detected:', consoleErrors);
    }

    console.log('✅ Production site is accessible and ready for testing');

  } catch (error) {
    console.error('❌ Production setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;