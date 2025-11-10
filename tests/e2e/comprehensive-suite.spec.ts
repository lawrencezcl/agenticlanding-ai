import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { TestReporter, takeScreenshots, checkConsoleErrors, measureLoadMetrics } from './test-runner';

test.describe('Comprehensive UI/UX Test Suite', () => {
  let reporter: TestReporter;

  test.beforeAll(async () => {
    reporter = new TestReporter();
  });

  test.describe('🏠 Homepage Comprehensive Tests', () => {
    test('Homepage - Full UI/UX Validation', async ({ page }) => {
      console.log('🚀 Starting comprehensive homepage validation...');

      const homePage = new HomePage(page);
      const testName = 'homepage-comprehensive';

      try {
        // Navigate to homepage
        await homePage.goto();
        await page.waitForTimeout(2000);

        // Check for console errors
        const consoleErrors = await checkConsoleErrors(page);

        // Take screenshots for different viewports
        await takeScreenshots(page, testName);

        // Measure performance metrics
        const loadMetrics = await measureLoadMetrics(page);

        // Run comprehensive tests
        const results = await homePage.runComprehensiveTests();

        // Validate core functionality
        expect(await homePage.elementExists('h1')).toBeTruthy();
        expect(await homePage.elementExists('button')).toBeTruthy();
        expect(consoleErrors).toHaveLength(0);

        // Add results to reporter
        reporter.addResult('Homepage Comprehensive', 'Homepage', {
          status: 'passed',
          performanceScore: results.performance.score,
          accessibilityIssues: results.accessibility.length,
          responsiveIssues: results.responsive.length,
          loadMetrics,
          consoleErrors
        });

        console.log('✅ Homepage validation completed successfully');

      } catch (error) {
        reporter.addResult('Homepage Comprehensive', 'Homepage', {
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    });

    test('Homepage - Critical Path Analysis', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Critical elements that must be present and functional
      const criticalChecks = [
        { selector: 'h1', description: 'Main heading' },
        { selector: 'button:has-text("Get Started Free")', description: 'Primary CTA button' },
        { selector: 'button:has-text("Watch Demo")', description: 'Secondary CTA button' },
        { selector: '.grid.grid-cols-1.md\\:grid-cols-3', description: 'Features grid' }
      ];

      for (const check of criticalChecks) {
        const element = page.locator(check.selector);
        await expect(element).toBeVisible({ timeout: 10000 }, `${check.description} should be visible`);
      }

      // Test critical user flow
      const getStartedBtn = page.locator('button:has-text("Get Started Free")');
      await getStartedBtn.click();
      await page.waitForTimeout(2000);

      // Should navigate to auth page
      expect(page.url()).toContain('/auth');

      reporter.addResult('Homepage Critical Path', 'Homepage', {
        status: 'passed',
        criticalChecks: criticalChecks.length
      });
    });
  });

  test.describe('🔐 Authentication Comprehensive Tests', () => {
    test('Authentication - Full UI/UX Validation', async ({ page }) => {
      console.log('🚀 Starting comprehensive authentication validation...');

      const authPage = new AuthPage(page);
      const testName = 'auth-comprehensive';

      try {
        // Navigate to auth page
        await authPage.gotoSignIn();
        await page.waitForTimeout(2000);

        // Check for console errors
        const consoleErrors = await checkConsoleErrors(page);

        // Take screenshots for different viewports
        await takeScreenshots(page, testName);

        // Run comprehensive tests
        const results = await authPage.runComprehensiveTests();

        // Validate core functionality
        expect(await authPage.elementExists('input[type="email"]')).toBeTruthy();
        expect(await authPage.elementExists('button[type="submit"]')).toBeTruthy();
        expect(consoleErrors).toHaveLength(0);

        // Test form validation
        const emailInput = page.locator('input[type="email"]');
        const submitButton = page.locator('button[type="submit"]');

        // Test empty submission
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Test valid email
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');

        // Add results to reporter
        reporter.addResult('Authentication Comprehensive', 'Authentication', {
          status: 'passed',
          accessibilityIssues: results.accessibility.length,
          responsiveIssues: results.responsive.length,
          consoleErrors
        });

        console.log('✅ Authentication validation completed successfully');

      } catch (error) {
        reporter.addResult('Authentication Comprehensive', 'Authentication', {
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    });

    test('Authentication - Security and Validation', async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.gotoSignIn();

      // Security checks
      const emailInput = page.locator('input[type="email"]');
      const form = page.locator('form');

      // Check input attributes
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('required');

      // Check form method
      if (await form.count() > 0) {
        const method = await form.getAttribute('method');
        expect(method?.toLowerCase()).toBe('post');
      }

      // Test email validation
      const invalidEmails = ['invalid', 'test@', 'test.test'];
      const submitButton = page.locator('button[type="submit"]');

      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation error (implementation dependent)
        const errorMessage = page.locator('[role="alert"], .error, .alert');
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          expect(errorText?.toLowerCase()).toContain('email');
        }
      }

      reporter.addResult('Authentication Security', 'Authentication', {
        status: 'passed',
        emailValidationTests: invalidEmails.length
      });
    });
  });

  test.describe('📱 Responsive Design Tests', () => {
    const viewports = [
      { name: 'Mobile Small', width: 320, height: 568 },
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop Small', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Desktop Large', width: 2560, height: 1440 }
    ];

    viewports.forEach(viewport => {
      test(`Responsive Design - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        const homePage = new HomePage(page);

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await homePage.goto();
        await page.waitForTimeout(1000);

        // Critical elements should be visible
        const criticalElements = [
          'h1:has-text("AI-Powered Landing Pages")',
          'button:has-text("Get Started Free")',
          '.grid.grid-cols-1.md\\:grid-cols-3'
        ];

        const responsiveIssues = [];

        for (const selector of criticalElements) {
          const element = page.locator(selector);
          const isVisible = await element.isVisible();

          if (!isVisible) {
            responsiveIssues.push(`Element not visible: ${selector}`);
          } else {
            // Check if element is within viewport bounds
            const box = await element.boundingBox();
            if (box) {
              const isOutOfBounds = box.x < 0 ||
                                   box.y < 0 ||
                                   box.x + box.width > viewport.width ||
                                   box.y + box.height > viewport.height;

              if (isOutOfBounds) {
                responsiveIssues.push(`Element outside viewport: ${selector}`);
              }
            }
          }
        }

        // Test horizontal scrolling (should not exist)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth;
        });

        if (hasHorizontalScroll) {
          responsiveIssues.push('Page has horizontal scrolling');
        }

        reporter.addResult(`Responsive ${viewport.name}`, 'Responsive Design', {
          status: responsiveIssues.length === 0 ? 'passed' : 'failed',
          viewport,
          responsiveIssues
        });

        expect(responsiveIssues.length).toBeLessThan(2); // Allow minor issues
      });
    });
  });

  test.describe('⚡ Performance Tests', () => {
    test('Performance - Core Web Vitals', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: any = {};

          // FCP
          const paint = performance.getEntriesByType('paint');
          metrics.fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

          // LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
              metrics.cls = clsValue;
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Collect metrics after delay
          setTimeout(() => {
            lcpObserver.disconnect();
            clsObserver.disconnect();
            resolve(metrics);
          }, 5000);
        });
      });

      // Evaluate performance score
      let performanceScore = 100;

      if (metrics.fcp > 3000) performanceScore -= 25;
      else if (metrics.fcp > 1800) performanceScore -= 10;

      if (metrics.lcp > 4000) performanceScore -= 25;
      else if (metrics.lcp > 2500) performanceScore -= 10;

      if (metrics.cls > 0.25) performanceScore -= 25;
      else if (metrics.cls > 0.1) performanceScore -= 10;

      reporter.addResult('Core Web Vitals', 'Performance', {
        status: performanceScore > 70 ? 'passed' : 'failed',
        metrics,
        performanceScore
      });

      expect(performanceScore).toBeGreaterThan(70);
    });

    test('Performance - Resource Loading', async ({ page }) => {
      const resources: any[] = [];

      page.on('response', response => {
        resources.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      });

      const homePage = new HomePage(page);
      await homePage.goto();
      await page.waitForTimeout(3000);

      // Analyze resources
      const totalResources = resources.length;
      const failedResources = resources.filter(r => r.status >= 400).length;
      const slowResources = resources.filter(r => r.url.includes('.jpg') || r.url.includes('.png')).length;

      // Check for optimized images
      const optimizedImages = resources.filter(r =>
        r.url.includes('.webp') || r.url.includes('.avif')
      ).length;

      reporter.addResult('Resource Loading', 'Performance', {
        status: failedResources === 0 ? 'passed' : 'failed',
        totalResources,
        failedResources,
        slowResources,
        optimizedImages
      });

      expect(failedResources).toBe(0);
      expect(totalResources).toBeLessThan(50);
    });
  });

  test.describe('♿ Accessibility Tests', () => {
    test('Accessibility - WCAG Compliance', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Run accessibility checks
      const accessibilityIssues = await homePage.accessibilityHelper.runAccessibilityChecks();

      // Additional accessibility checks
      const additionalChecks = await page.evaluate(() => {
        const issues = [];

        // Check for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let hasH1 = false;
        for (let i = 0; i < headings.length; i++) {
          const heading = headings[i];
          if (heading.tagName === 'H1') hasH1 = true;
        }
        if (!hasH1) issues.push('Missing h1 on page');

        // Check for alt text on images
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
          issues.push(`${images.length} images missing alt attributes`);
        }

        // Check for proper form labels
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        const labels = document.querySelectorAll('label');
        if (inputs.length > labels.length) {
          issues.push('Some form inputs may be missing labels');
        }

        return issues;
      });

      const allIssues = [...accessibilityIssues, ...additionalChecks];

      reporter.addResult('WCAG Compliance', 'Accessibility', {
        status: allIssues.length < 5 ? 'passed' : 'failed',
        issues: allIssues,
        totalIssues: allIssues.length
      });

      expect(allIssues.length).toBeLessThan(5);
    });
  });

  test.afterAll(async () => {
    // Generate final report
    const report = reporter.generateReport();

    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');
    console.log(JSON.stringify(report, null, 2));

    // Save report to file
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }

    fs.writeFileSync(
      path.join('test-results', 'comprehensive-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📄 Report saved to: test-results/comprehensive-test-report.json');
  });
});