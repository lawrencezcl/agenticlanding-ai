import { test as base, expect, Page } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { testData } from './fixtures/test-data';

// Extended test fixtures
export const test = base.extend<{
  homePage: HomePage;
  authPage: AuthPage;
}>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
});

export { expect } from '@playwright/test';

// Test utilities
export class TestReporter {
  private results: any[] = [];

  addResult(testName: string, category: string, result: any) {
    this.results.push({
      testName,
      category,
      timestamp: new Date().toISOString(),
      ...result
    });
  }

  generateReport() {
    const report = {
      summary: this.generateSummary(),
      details: this.results,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  private generateSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const skippedTests = this.results.filter(r => r.status === 'skipped').length;

    const categories = ['Homepage', 'Authentication', 'Accessibility', 'Performance', 'Cross-browser'];
    const categoryResults = categories.map(category => {
      const categoryTests = this.results.filter(r => r.category === category);
      return {
        category,
        total: categoryTests.length,
        passed: categoryTests.filter(r => r.status === 'passed').length,
        failed: categoryTests.filter(r => r.status === 'failed').length,
        avgPerformance: categoryTests.reduce((acc, r) => acc + (r.performanceScore || 0), 0) / categoryTests.length
      };
    });

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate: ((passedTests / totalTests) * 100).toFixed(2) + '%',
      categories: categoryResults
    };
  }

  private generateRecommendations() {
    const recommendations: string[] = [];

    // Analyze common issues
    const performanceIssues = this.results
      .filter(r => r.performanceScore && r.performanceScore < 70)
      .length;

    if (performanceIssues > 0) {
      recommendations.push('Consider optimizing images and reducing bundle size to improve performance scores');
    }

    const accessibilityIssues = this.results
      .filter(r => r.accessibilityIssues && r.accessibilityIssues.length > 0)
      .length;

    if (accessibilityIssues > 0) {
      recommendations.push('Improve accessibility by adding proper ARIA labels and ensuring keyboard navigation');
    }

    const responsiveIssues = this.results
      .filter(r => r.responsiveIssues && r.responsiveIssues.length > 0)
      .length;

    if (responsiveIssues > 0) {
      recommendations.push('Fix responsive design issues to ensure proper display across all device sizes');
    }

    return recommendations;
  }
}

// Test helper functions
export async function takeScreenshots(page: Page, testName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Full page screenshot
  await page.screenshot({
    path: `test-results/screenshots/${testName}-full-${timestamp}.png`,
    fullPage: true
  });

  // Viewport-specific screenshots
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `test-results/screenshots/${testName}-${viewport.name}-${timestamp}.png`,
      fullPage: true
    });
  }
}

export async function checkConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Wait a bit to collect any errors
  await page.waitForTimeout(2000);

  return errors;
}

export async function measureLoadMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      firstMeaningfulPaint: performance.getEntriesByName('first-meaningful-paint')[0]?.startTime || 0
    };
  });
}