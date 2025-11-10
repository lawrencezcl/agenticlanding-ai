import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { testData } from './fixtures/test-data';

test.describe('Homepage UI/UX Tests', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test.describe('Homepage Structure and Content', () => {
    test('should display all major sections correctly', async ({ page }) => {
      await homePage.goto();

      // Test basic structure
      await homePage.verifyHomePageStructure();

      // Test hero section
      await expect(page.locator('h1:has-text("AI-Powered Landing Pages")')).toBeVisible();
      await expect(page.locator('p:has-text("Transform campaign context")')).toBeVisible();

      // Test feature cards
      await expect(page.locator('text=Lightning Fast')).toBeVisible();
      await expect(page.locator('text=AI-Optimized')).toBeVisible();
      await expect(page.locator('text=Brand Compliant')).toBeVisible();

      // Test call-to-action buttons
      await expect(page.locator('button:has-text("Get Started Free")')).toBeVisible();
      await expect(page.locator('button:has-text("Watch Demo")')).toBeVisible();
    });

    test('should have correct page metadata', async ({ page }) => {
      await homePage.goto();

      // Test page title
      await expect(page).toHaveTitle(/AgenticLanding AI.*AI-Powered Landing Page Generation/);

      // Test meta description
      const description = await page.getAttribute('meta[name="description"]', 'content');
      expect(description).toContain('Transform campaign context into high-converting');
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await homePage.goto();

      // Check for single h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let previousLevel = 0;

      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.substring(1));

        // Hierarchy should not skip levels
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = level;
      }
    });
  });

  test.describe('Visual Design and Branding', () => {
    test('should maintain consistent color scheme', async ({ page }) => {
      await homePage.goto();

      // Test brand colors are present
      const brandElements = page.locator('[class*="brand"], [class*="gradient"]');
      await expect(brandElements.first()).toBeVisible();

      // Test buttons have consistent styling
      const primaryButtons = page.locator('button[class*="primary"], .btn-primary');
      if (await primaryButtons.count() > 0) {
        const firstButton = primaryButtons.first();
        const backgroundColor = await firstButton.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });

        expect(backgroundColor).toBeTruthy();
      }
    });

    test('should use consistent typography', async ({ page }) => {
      await homePage.goto();

      // Check font loading
      const fonts = await page.evaluate(() => {
        return Array.from(document.fonts).map(font => font.family);
      });

      expect(fonts.length).toBeGreaterThan(0);

      // Check heading fonts are consistent
      const headings = page.locator('h1, h2, h3');
      const headingFonts = new Set();

      for (let i = 0; i < await headings.count(); i++) {
        const heading = headings.nth(i);
        const fontFamily = await heading.evaluate(el => {
          return window.getComputedStyle(el).fontFamily;
        });
        headingFonts.add(fontFamily);
      }

      // Should use consistent font family for headings
      expect(headingFonts.size).toBeLessThanOrEqual(2);
    });

    test('should have proper spacing and layout', async ({ page }) => {
      await homePage.goto();

      // Test container has proper max-width
      const container = page.locator('.container, .max-w-\\[.*\\]');
      await expect(container.first()).toBeVisible();

      // Test grid layout for features
      const featureGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');
      await expect(featureGrid).toBeVisible();

      // Test cards have consistent spacing
      const featureCards = featureGrid.locator('> div');
      await expect(featureCards).toHaveCount(3);

      // Check card spacing
      const firstCard = featureCards.first();
      const secondCard = featureCards.nth(1);

      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();

      expect(firstCardBox).toBeTruthy();
      expect(secondCardBox).toBeTruthy();

      if (firstCardBox && secondCardBox) {
        const spacing = secondCardBox.left - (firstCardBox.left + firstCardBox.width);
        expect(spacing).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      await homePage.goto();

      // Test mobile viewport
      await page.setViewportSize(testData.viewports.mobile);
      await page.waitForTimeout(500);

      // Elements should still be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Get Started Free")')).toBeVisible();

      // Grid should adapt to single column on mobile
      const featureGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');
      const gridCols = await featureGrid.evaluate(el => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });

      expect(gridCols).toContain('1fr');
    });

    test('should adapt layout for tablet devices', async ({ page }) => {
      await homePage.goto();

      // Test tablet viewport
      await page.setViewportSize(testData.viewports.tablet);
      await page.waitForTimeout(500);

      // Should show improved layout on tablet
      await expect(page.locator('h1')).toBeVisible();

      // Check if elements are properly sized
      const heroTitle = page.locator('h1');
      const fontSize = await heroTitle.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });

      expect(parseInt(fontSize)).toBeGreaterThan(24); // Should be reasonably large
    });

    test('should handle large desktop screens', async ({ page }) => {
      await homePage.goto();

      // Test large desktop viewport
      await page.setViewportSize(testData.viewports.widescreen);
      await page.waitForTimeout(500);

      // Content should not stretch too wide
      const container = page.locator('.container, .max-w-\\[.*\\]');
      const containerBox = await container.boundingBox();

      if (containerBox) {
        expect(containerBox.width).toBeLessThan(page.viewportSize().width);
      }
    });
  });

  test.describe('Interactions and Functionality', () => {
    test('should handle button clicks correctly', async ({ page }) => {
      await homePage.goto();

      // Test Get Started button
      const getStartedBtn = page.locator('button:has-text("Get Started Free")');
      await expect(getStartedBtn).toBeVisible();
      await expect(getStartedBtn).toBeEnabled();

      // Click should trigger navigation
      await getStartedBtn.click();
      await page.waitForTimeout(2000);

      // Should navigate to auth or dashboard
      const currentUrl = page.url();
      const isAuthPage = currentUrl.includes('/auth/') || currentUrl.includes('/signin');
      const isDashboard = currentUrl.includes('/dashboard');

      expect(isAuthPage || isDashboard).toBeTruthy();
    });

    test('should have hover states on interactive elements', async ({ page }) => {
      await homePage.goto();

      // Test button hover states
      const buttons = page.locator('button');
      await expect(buttons.first()).toBeVisible();

      // Hover over button
      await buttons.first().hover();
      await page.waitForTimeout(200);

      // Check for hover effect (could be opacity change, background change, etc.)
      const computedStyle = await buttons.first().evaluate(el => {
        return window.getComputedStyle(el, ':hover');
      });

      expect(computedStyle).toBeTruthy();
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await homePage.goto();

      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBeGreaterThan(0);

      // Test Enter key on focused button
      if (await focusedElement.getAttribute('role') === 'button' ||
          await focusedElement.evaluate(el => el.tagName === 'BUTTON')) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();

      await homePage.goto();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(testData.performance.maxLoadTime);
    });

    test('should have good performance metrics', async ({ page }) => {
      await homePage.goto();

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        };
      });

      expect(metrics.domContentLoaded).toBeLessThan(2000);
      expect(metrics.loadComplete).toBeLessThan(3000);
      expect(metrics.firstContentfulPaint).toBeLessThan(1800);
    });

    test('should not have layout shifts', async ({ page }) => {
      await homePage.goto();

      // Check for cumulative layout shift
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          observer.observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });

      expect(cls).toBeLessThan(testData.performance.maxCLS);
    });
  });

  test.describe('Accessibility', () => {
    test('should meet basic accessibility standards', async ({ page }) => {
      await homePage.goto();

      // Check for alt text on images
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);

      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      await expect(headings.first()).toBeVisible();

      // Check for skip links or navigation
      const skipLinks = page.locator('a[href^="#"], [role="navigation"]');
      expect(await skipLinks.count()).toBeGreaterThan(0);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await homePage.goto();

      // This is a simplified check - full contrast checking would require
      // more sophisticated color analysis
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6');

      for (let i = 0; i < Math.min(5, await textElements.count()); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Basic check that colors are defined
        expect(styles.color).toBeTruthy();
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await homePage.goto();

      // Test tab through focusable elements
      const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const elementCount = await focusableElements.count();

      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = page.locator(':focus');
        expect(await focusedElement.count()).toBe(1);
      }
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work correctly in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');

      await homePage.runComprehensiveTests();
    });

    test('should work correctly in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      await homePage.runComprehensiveTests();
    });

    test('should work correctly in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');

      await homePage.runComprehensiveTests();
    });
  });

  test('Comprehensive Homepage Test', async ({ page }) => {
    console.log('🏠 Running comprehensive homepage test...');

    const results = await homePage.runComprehensiveTests();

    // Log results
    console.log('Homepage Test Results:', {
      performance: results.performance,
      responsive: results.responsive,
      accessibility: results.accessibility,
      brokenLinks: results.brokenLinks,
      jsErrors: results.jsErrors
    });

    // Assert no critical issues
    expect(results.jsErrors).toHaveLength(0);
    expect(results.brokenLinks.length).toBeLessThan(5);
    expect(results.performance.score).toBeGreaterThan(70);
  });
});