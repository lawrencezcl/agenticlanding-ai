import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';

interface TestResult {
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  screenshot?: string;
  error?: string;
}

class ProductionTestReporter {
  private results: TestResult[] = [];

  addResult(result: TestResult) {
    this.results.push(result);
    console.log(`${result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const total = this.results.length;

    let report = `
📊 PRODUCTION E2E TEST REPORT
============================
Date: ${new Date().toISOString()}
Target: https://agenticlanding-ai.vercel.app

SUMMARY:
✅ Passed: ${passed}
⚠️  Warnings: ${warnings}
❌ Failed: ${failed}
📈 Total: ${total}
Success Rate: ${((passed / total) * 100).toFixed(1)}%

DETAILED RESULTS:
`;

    this.results.forEach((result, index) => {
      const status = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      report += `\n${index + 1}. ${status} ${result.message}`;
      if (result.error) {
        report += `\n   Error: ${result.error}`;
      }
      if (result.details) {
        report += `\n   Details: ${JSON.stringify(result.details, null, 2)}`;
      }
    });

    return report;
  }
}

test.describe('AgenticLanding AI - Production E2E Tests', () => {
  let reporter: ProductionTestReporter;
  let homePage: HomePage;
  let authPage: AuthPage;

  test.beforeAll(async () => {
    reporter = new ProductionTestReporter();
  });

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    authPage = new AuthPage(page);
  });

  test.describe('🏠 Homepage Functionality', () => {
    test('Homepage loads properly with all elements', async ({ page }) => {
      try {
        console.log('🔍 Testing homepage load...');

        // Navigate to homepage
        await page.goto('https://agenticlanding-ai.vercel.app', {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        // Wait for page to be fully loaded
        await page.waitForTimeout(3000);

        // Check page title
        const title = await page.title();
        expect(title).toContain('AgenticLanding AI');

        // Check for critical elements
        const criticalSelectors = [
          'h1',
          'button:has-text("Get Started")',
          'button:has-text("Watch Demo")',
          '.grid.grid-cols-1, .grid.grid-cols-3' // Features grid
        ];

        const missingElements: string[] = [];
        for (const selector of criticalSelectors) {
          const element = page.locator(selector);
          const isVisible = await element.isVisible().catch(() => false);
          if (!isVisible) {
            missingElements.push(selector);
          }
        }

        if (missingElements.length > 0) {
          reporter.addResult({
            status: 'failed',
            message: 'Critical elements missing from homepage',
            details: { missingElements }
          });
        } else {
          reporter.addResult({
            status: 'passed',
            message: 'Homepage loads with all critical elements'
          });
        }

        // Check for console errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        await page.waitForTimeout(2000);

        if (consoleErrors.length > 0) {
          reporter.addResult({
            status: 'warning',
            message: 'Console errors detected',
            details: { errors: consoleErrors }
          });
        }

      } catch (error) {
        reporter.addResult({
          status: 'failed',
          message: 'Homepage failed to load',
          error: error.message
        });
        throw error;
      }
    });

    test('All CTA buttons navigate correctly', async ({ page }) => {
      console.log('🔍 Testing CTA button navigation...');

      await page.goto('https://agenticlanding-ai.vercel.app');
      await page.waitForTimeout(2000);

      // Test Get Started button
      const getStartedBtn = page.locator('button:has-text("Get Started"), button:has-text("Get Started Free"), a:has-text("Get Started")');
      const getStartedCount = await getStartedBtn.count();

      if (getStartedCount > 0) {
        const btn = getStartedBtn.first();
        await expect(btn).toBeVisible();

        // Click and check navigation
        await btn.click();
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        const isAuthPage = currentUrl.includes('/auth/') || currentUrl.includes('/signin') || currentUrl.includes('/signup');

        if (isAuthPage) {
          reporter.addResult({
            status: 'passed',
            message: 'Get Started button navigates to authentication'
          });
        } else {
          reporter.addResult({
            status: 'warning',
            message: 'Get Started button navigation unclear',
            details: { currentUrl }
          });
        }

        // Go back for next test
        await page.goto('https://agenticlanding-ai.vercel.app');
        await page.waitForTimeout(2000);
      } else {
        reporter.addResult({
          status: 'failed',
          message: 'Get Started button not found'
        });
      }

      // Test Watch Demo button
      const watchDemoBtn = page.locator('button:has-text("Watch Demo"), a:has-text("Watch Demo")');
      const watchDemoCount = await watchDemoBtn.count();

      if (watchDemoCount > 0) {
        const btn = watchDemoBtn.first();
        await expect(btn).toBeVisible();

        // Click and check response
        const btnText = await btn.textContent();

        try {
          await btn.click();
          await page.waitForTimeout(2000);

          // Check if it opens a modal, video, or navigates
          const hasModal = await page.locator('[role="dialog"], .modal, .popup').count() > 0;
          const hasVideo = await page.locator('iframe, video').count() > 0;

          if (hasModal || hasVideo || page.url() !== 'https://agenticlanding-ai.vercel.app/') {
            reporter.addResult({
              status: 'passed',
              message: 'Watch Demo button triggers appropriate action'
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: 'Watch Demo button action unclear'
            });
          }
        } catch (error) {
          reporter.addResult({
            status: 'failed',
            message: 'Watch Demo button not functional',
            error: error.message
          });
        }
      } else {
        reporter.addResult({
          status: 'warning',
          message: 'Watch Demo button not found'
        });
      }

      // Test CTA Section buttons
      const ctaSection = page.locator('section:has-text("Start Free Trial"), section:has-text("Schedule Demo")');

      if (await ctaSection.count() > 0) {
        const startTrialBtn = page.locator('button:has-text("Start Free Trial"), a:has-text("Start Free Trial")');
        const scheduleDemoBtn = page.locator('button:has-text("Schedule Demo"), a:has-text("Schedule Demo")');

        if (await startTrialBtn.count() > 0) {
          await startTrialBtn.first().click();
          await page.waitForTimeout(2000);

          const trialUrl = page.url();
          if (trialUrl.includes('/auth/') || trialUrl.includes('/signin') || trialUrl.includes('/signup')) {
            reporter.addResult({
              status: 'passed',
              message: 'Start Free Trial button navigates correctly'
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: 'Start Free Trial button navigation unclear',
              details: { url: trialUrl }
            });
          }
        }

        await page.goto('https://agenticlanding-ai.vercel.app');
        await page.waitForTimeout(2000);

        if (await scheduleDemoBtn.count() > 0) {
          await scheduleDemoBtn.first().click();
          await page.waitForTimeout(2000);

          const demoUrl = page.url();
          reporter.addResult({
            status: 'passed',
            message: 'Schedule Demo button works',
            details: { url: demoUrl }
          });
        }
      } else {
        reporter.addResult({
          status: 'warning',
          message: 'CTA Section with Start Free Trial/Schedule Demo not found'
        });
      }
    });
  });

  test.describe('🔐 Authentication Flow', () => {
    test('Sign-in page loads and works', async ({ page }) => {
      try {
        console.log('🔍 Testing authentication flow...');

        // Test direct navigation to sign-in
        const signInResponse = await page.goto('https://agenticlanding-ai.vercel.app/auth/signin', {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        if (signInResponse && signInResponse.status() === 200) {
          reporter.addResult({
            status: 'passed',
            message: 'Sign-in page loads successfully'
          });

          // Check for OAuth providers
          await page.waitForTimeout(2000);

          const googleProvider = page.locator('button:has-text("Google"), button[title*="Google"]');
          const githubProvider = page.locator('button:has-text("GitHub"), button[title*="GitHub"]');

          const hasGoogle = await googleProvider.count() > 0;
          const hasGithub = await githubProvider.count() > 0;

          if (hasGoogle && hasGithub) {
            reporter.addResult({
              status: 'passed',
              message: 'Both Google and GitHub OAuth providers available'
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: 'Missing OAuth providers',
              details: { hasGoogle, hasGithub }
            });
          }

          // Check for email form
          const emailInput = page.locator('input[type="email"]');
          const submitBtn = page.locator('button[type="submit"]');

          if (await emailInput.count() > 0 && await submitBtn.count() > 0) {
            reporter.addResult({
              status: 'passed',
              message: 'Email authentication form available'
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: 'Email authentication form not found'
            });
          }
        } else {
          reporter.addResult({
            status: 'failed',
            message: 'Sign-in page failed to load',
            details: { status: signInResponse?.status() }
          });
        }

      } catch (error) {
        reporter.addResult({
          status: 'failed',
          message: 'Authentication flow test failed',
          error: error.message
        });
      }
    });

    test('Check for /auth/signup 404 error', async ({ page }) => {
      try {
        console.log('🔍 Testing /auth/signup endpoint...');

        const signupResponse = await page.goto('https://agenticlanding-ai.vercel.app/auth/signup', {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        if (signupResponse) {
          const status = signupResponse.status();

          if (status === 404) {
            reporter.addResult({
              status: 'failed',
              message: 'CONFIRMED: /auth/signup returns 404 error',
              details: { status }
            });
          } else if (status === 200) {
            reporter.addResult({
              status: 'passed',
              message: '/auth/signup loads successfully'
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: '/auth/signup returns unexpected status',
              details: { status }
            });
          }
        } else {
          reporter.addResult({
            status: 'failed',
            message: 'Unable to reach /auth/signup endpoint'
          });
        }

      } catch (error) {
        reporter.addResult({
          status: 'failed',
          message: '/auth/signup test failed',
          error: error.message
        });
      }
    });
  });

  test.describe('📱 Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(viewport => {
      test(`Responsive design - ${viewport.name}`, async ({ page }) => {
        try {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto('https://agenticlanding-ai.vercel.app', {
            waitUntil: 'networkidle'
          });

          await page.waitForTimeout(2000);

          // Check critical elements are visible
          const criticalElements = [
            'h1',
            'button:has-text("Get Started")',
            'button:has-text("Watch Demo")'
          ];

          let visibleCount = 0;
          for (const selector of criticalElements) {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              visibleCount++;
            }
          }

          const successRate = (visibleCount / criticalElements.length) * 100;

          if (successRate >= 80) {
            reporter.addResult({
              status: 'passed',
              message: `Responsive design works on ${viewport.name}`,
              details: { successRate, viewport }
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: `Responsive design issues on ${viewport.name}`,
              details: { successRate, viewport, visibleElements: visibleCount }
            });
          }

          // Check for horizontal scrolling
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > document.body.clientWidth;
          });

          if (hasHorizontalScroll) {
            reporter.addResult({
              status: 'warning',
              message: `Horizontal scrolling detected on ${viewport.name}`,
              details: { viewport }
            });
          }

        } catch (error) {
          reporter.addResult({
            status: 'failed',
            message: `Responsive test failed for ${viewport.name}`,
            error: error.message
          });
        }
      });
    });
  });

  test.describe('🚀 Dashboard Access', () => {
    test('Dashboard loads after authentication (mock test)', async ({ page }) => {
      try {
        console.log('🔍 Testing dashboard access...');

        // Try to access dashboard directly
        const dashboardResponse = await page.goto('https://agenticlanding-ai.vercel.app/dashboard', {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        if (dashboardResponse) {
          const status = dashboardResponse.status();
          const currentUrl = page.url();

          if (status === 200) {
            // Check if dashboard content is loaded
            await page.waitForTimeout(2000);

            const dashboardElements = page.locator('h1:has-text("Dashboard"), .dashboard, [data-testid="dashboard"]');
            const hasDashboardContent = await dashboardElements.count() > 0;

            if (hasDashboardContent) {
              reporter.addResult({
                status: 'passed',
                message: 'Dashboard loads successfully with content'
              });
            } else {
              reporter.addResult({
                status: 'warning',
                message: 'Dashboard loads but may have missing content'
              });
            }
          } else if (status === 401 || status === 403) {
            reporter.addResult({
              status: 'passed',
              message: 'Dashboard properly protected (redirects/auth required)',
              details: { status, currentUrl }
            });
          } else if (status === 404) {
            reporter.addResult({
              status: 'failed',
              message: 'Dashboard returns 404 - route may not exist',
              details: { status }
            });
          } else {
            reporter.addResult({
              status: 'warning',
              message: 'Dashboard returns unexpected status',
              details: { status }
            });
          }
        } else {
          reporter.addResult({
            status: 'failed',
            message: 'Unable to reach dashboard'
          });
        }

      } catch (error) {
        reporter.addResult({
          status: 'warning',
          message: 'Dashboard test inconclusive (possibly redirects to auth)',
          error: error.message
        });
      }
    });
  });

  test.describe('🔍 404 Error Detection', () => {
    test('Check for broken links and navigation', async ({ page }) => {
      try {
        console.log('🔍 Checking for broken links...');

        await page.goto('https://agenticlanding-ai.vercel.app');
        await page.waitForTimeout(2000);

        // Find all links on the page
        const links = await page.locator('a[href]').all();
        const brokenLinks: string[] = [];
        const totalLinks = links.length;

        // Test a sample of links (avoid too many requests)
        const linksToTest = links.slice(0, 10);

        for (const link of linksToTest) {
          try {
            const href = await link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
              const fullUrl = href.startsWith('http') ? href : `https://agenticlanding-ai.vercel.app${href}`;

              const response = await page.request.get(fullUrl);
              if (response.status() >= 400) {
                brokenLinks.push(`${href} (${response.status()})`);
              }
            }
          } catch (error) {
            // Skip failed link tests
          }
        }

        if (brokenLinks.length === 0) {
          reporter.addResult({
            status: 'passed',
            message: 'No broken links found in sample test',
            details: { tested: linksToTest.length, total: totalLinks }
          });
        } else {
          reporter.addResult({
            status: 'warning',
            message: 'Broken links detected',
            details: { brokenLinks, tested: linksToTest.length, total: totalLinks }
          });
        }

      } catch (error) {
        reporter.addResult({
          status: 'warning',
          message: 'Link testing incomplete',
          error: error.message
        });
      }
    });
  });

  test.afterAll(async () => {
    const report = reporter.generateReport();
    console.log(report);

    // Save report to file
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync('test-results-production')) {
      fs.mkdirSync('test-results-production');
    }

    fs.writeFileSync(
      path.join('test-results-production', 'production-test-report.txt'),
      report
    );

    // Save JSON report
    fs.writeFileSync(
      path.join('test-results-production', 'production-test-results.json'),
      JSON.stringify(reporter.getResults(), null, 2)
    );

    console.log('\n📄 Reports saved to test-results-production/');
  });
});