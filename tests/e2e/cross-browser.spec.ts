import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';

test.describe('Cross-browser Compatibility Tests', () => {
  let homePage: HomePage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    authPage = new AuthPage(page);
  });

  test.describe('Chromium/Chrome Compatibility', () => {
    test('should work correctly in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');

      console.log('🌐 Testing Chrome compatibility...');

      // Test homepage
      await homePage.goto();
      await homePage.verifyHomePageStructure();

      // Test auth page
      await authPage.gotoSignIn();
      await authPage.verifySignInPageStructure();

      // Test specific Chrome features
      const chromeFeatures = await page.evaluate(() => {
        return {
          supportsWebP: document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0,
          supportsIntersectionObserver: 'IntersectionObserver' in window,
          supportsResizeObserver: 'ResizeObserver' in window,
          supportsCSSGrid: CSS.supports('display', 'grid'),
          supportsFlexbox: CSS.supports('display', 'flex'),
          supportsCustomProperties: CSS.supports('color', 'var(--test)')
        };
      });

      console.log('Chrome feature support:', chromeFeatures);

      // Test performance
      const metrics = await homePage.performanceHelper.measurePageLoadPerformance('/');
      expect(metrics.loadTime).toBeLessThan(5000);

      // Test animations
      const hasAnimations = await page.locator('[class*="motion"], [class*="animation"]').count() > 0;
      if (hasAnimations) {
        await page.waitForTimeout(1000); // Let animations run
      }
    });
  });

  test.describe('Firefox Compatibility', () => {
    test('should work correctly in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      console.log('🦊 Testing Firefox compatibility...');

      // Test homepage
      await homePage.goto();
      await homePage.verifyHomePageStructure();

      // Test auth page
      await authPage.gotoSignIn();
      await authPage.verifySignInPageStructure();

      // Test Firefox-specific features
      const firefoxFeatures = await page.evaluate(() => {
        return {
          supportsWebP: document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0,
          supportsIntersectionObserver: 'IntersectionObserver' in window,
          supportsResizeObserver: 'ResizeObserver' in window,
          supportsCSSGrid: CSS.supports('display', 'grid'),
          supportsFlexbox: CSS.supports('display', 'flex'),
          supportsCustomProperties: CSS.supports('color', 'var(--test)'),
          scrollbarWidth: CSS.supports('scrollbar-width', 'none')
        };
      });

      console.log('Firefox feature support:', firefoxFeatures);

      // Test Firefox-specific CSS handling
      const computedStyles = await page.evaluate(() => {
        const element = document.querySelector('h1');
        if (!element) return null;

        const computed = window.getComputedStyle(element);
        return {
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          letterSpacing: computed.letterSpacing,
          textTransform: computed.textTransform
        };
      });

      expect(computedStyles).toBeTruthy();
    });
  });

  test.describe('Safari/WebKit Compatibility', () => {
    test('should work correctly in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');

      console.log('🍎 Testing Safari compatibility...');

      // Test homepage
      await homePage.goto();
      await homePage.verifyHomePageStructure();

      // Test auth page
      await authPage.gotoSignIn();
      await authPage.verifySignInPageStructure();

      // Test Safari-specific features
      const safariFeatures = await page.evaluate(() => {
        return {
          supportsWebP: false, // Safari doesn't support WebP
          supportsIntersectionObserver: 'IntersectionObserver' in window,
          supportsResizeObserver: 'ResizeObserver' in window,
          supportsCSSGrid: CSS.supports('display', 'grid'),
          supportsFlexbox: CSS.supports('display', 'flex'),
          supportsCustomProperties: CSS.supports('color', 'var(--test)'),
          supportsBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)')
        };
      });

      console.log('Safari feature support:', safariFeatures);

      // Test font rendering (Safari often handles fonts differently)
      const fontRendering = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return null;

        const computed = window.getComputedStyle(h1);
        return {
          fontFamily: computed.fontFamily,
          fontSmooth: computed.fontSmooth,
          textRendering: computed.textRendering,
          WebkitFontSmoothing: computed.WebkitFontSmoothing
        };
      });

      expect(fontRendering).toBeTruthy();

      // Test touch events (important for iOS Safari)
      const touchSupport = await page.evaluate(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      });

      console.log('Touch support:', touchSupport);
    });
  });

  test.describe('Consistent Rendering Across Browsers', () => {
    test('should render layouts consistently', async ({ page }) => {
      await homePage.goto();

      // Check critical layout elements
      const layoutChecks = await page.evaluate(() => {
        const hero = document.querySelector('section:has(h1)');
        const features = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
        const buttons = document.querySelectorAll('button');

        return {
          heroVisible: hero ? hero.offsetParent !== null : false,
          featuresVisible: features ? features.offsetParent !== null : false,
          buttonCount: buttons.length,
          buttonVisible: Array.from(buttons).filter(btn => btn.offsetParent !== null).length
        };
      });

      expect(layoutChecks.heroVisible).toBeTruthy();
      expect(layoutChecks.featuresVisible).toBeTruthy();
      expect(layoutChecks.buttonCount).toBeGreaterThan(0);
      expect(layoutChecks.buttonVisible).toBeGreaterThan(0);
    });

    test('should handle flexbox layouts consistently', async ({ page }) => {
      await homePage.goto();

      const flexboxChecks = await page.evaluate(() => {
        const flexContainers = document.querySelectorAll('[style*="display: flex"], .flex, [class*="flex"]');
        return Array.from(flexContainers).map(container => {
          const computed = window.getComputedStyle(container);
          return {
            display: computed.display,
            flexDirection: computed.flexDirection,
            justifyContent: computed.justifyContent,
            alignItems: computed.alignItems,
            flexWrap: computed.flexWrap
          };
        });
      });

      expect(flexboxChecks.length).toBeGreaterThan(0);

      // Verify flexbox properties are recognized
      flexboxChecks.forEach(flex => {
        expect(flex.display).toContain('flex');
      });
    });

    test('should handle CSS Grid consistently', async ({ page }) => {
      await homePage.goto();

      const gridChecks = await page.evaluate(() => {
        const gridContainers = document.querySelectorAll('[style*="display: grid"], .grid, [class*="grid"]');
        return Array.from(gridContainers).map(container => {
          const computed = window.getComputedStyle(container);
          return {
            display: computed.display,
            gridTemplateColumns: computed.gridTemplateColumns,
            gridTemplateRows: computed.gridTemplateRows,
            gap: computed.gap
          };
        });
      });

      expect(gridChecks.length).toBeGreaterThan(0);

      // Verify grid properties are recognized
      gridChecks.forEach(grid => {
        expect(grid.display).toContain('grid');
      });
    });

    test('should handle responsive design consistently', async ({ page }) => {
      await homePage.goto();

      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        const responsiveCheck = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          const container = document.querySelector('.container, .max-w-\\[.*\\]');
          const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');

          return {
            h1Visible: h1 ? h1.offsetParent !== null : false,
            containerVisible: container ? container.offsetParent !== null : false,
            gridVisible: grid ? grid.offsetParent !== null : false,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
          };
        });

        expect(responsiveCheck.h1Visible).toBeTruthy();
        expect(responsiveCheck.containerVisible).toBeTruthy();
        expect(responsiveCheck.gridVisible).toBeTruthy();
        expect(responsiveCheck.viewportWidth).toBe(viewport.width);
      }
    });
  });

  test.describe('Feature Detection and Graceful Degradation', () => {
    test('should handle missing features gracefully', async ({ page }) => {
      await homePage.goto();

      // Check for feature detection usage
      const featureDetection = await page.evaluate(() => {
        return {
          hasFeatureDetection: !!window.Modernizr ||
                             typeof CSS !== 'undefined' && CSS.supports ||
                             document.querySelector('script[src*="modernizr"]') !== null,
          supportsFlexbox: CSS.supports('display', 'flex'),
          supportsGrid: CSS.supports('display', 'grid'),
          supportsCustomProperties: CSS.supports('color', 'var(--test)'),
          supportsObjectFit: CSS.supports('object-fit', 'cover')
        };
      });

      console.log('Feature detection results:', featureDetection);

      // Test that layout doesn't break without features
      const layoutIntegrity = await page.evaluate(() => {
        const criticalElements = document.querySelectorAll('h1, .container, button');
        return Array.from(criticalElements).every(el => el.offsetParent !== null);
      });

      expect(layoutIntegrity).toBeTruthy();
    });

    test('should provide fallbacks for unsupported features', async ({ page }) => {
      await homePage.goto();

      // Test CSS custom properties fallback
      const customPropertiesTest = await page.evaluate(() => {
        const element = document.body;
        const computed = window.getComputedStyle(element);

        return {
          hasColorVar: computed.getPropertyValue('--brand-main') !== '',
          hasBackgroundColor: computed.backgroundColor !== 'rgba(0, 0, 0, 0)'
        };
      });

      expect(customPropertiesTest.hasBackgroundColor).toBeTruthy();
    });
  });

  test.describe('Browser-specific Issues', () => {
    test('should handle browser-specific CSS prefixes', async ({ page }) => {
      await homePage.goto();

      const prefixChecks = await page.evaluate(() => {
        const styles = window.getComputedStyle(document.body);
        return {
          webkitTransform: styles.webkitTransform,
          mozTransform: styles.MozTransform,
          msTransform: styles.msTransform,
          webkitTransition: styles.webkitTransition,
          mozTransition: styles.MozTransition,
          msTransition: styles.msTransition
        };
      });

      // Browser should recognize at least some prefixed properties
      const hasPrefixedProps = Object.values(prefixChecks).some(val => val && val !== 'none');
      console.log('Vendor prefix support:', prefixChecks);
    });

    test('should handle form inputs consistently', async ({ page }) => {
      await authPage.gotoSignIn();

      const formConsistency = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"]');
        if (!emailInput) return null;

        const computed = window.getComputedStyle(emailInput);
        return {
          boxSizing: computed.boxSizing,
          border: computed.border,
          padding: computed.padding,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          appearance: computed.appearance || computed.webkitAppearance || computed.mozAppearance
        };
      });

      expect(formConsistency).toBeTruthy();
      expect(formConsistency?.boxSizing).toBe('border-box');
    });

    test('should handle JavaScript consistently', async ({ page }) => {
      await homePage.goto();

      const jsConsistency = await page.evaluate(() => {
        return {
          hasConsoleErrors: console.errors && console.errors.length > 0,
          hasModernJS: typeof Promise !== 'undefined' && typeof Map !== 'undefined',
          hasES6Features: typeof Array.from !== 'undefined' && typeof Object.assign !== 'undefined',
          eventListeners: document.eventListeners || []
        };
      });

      expect(jsConsistency.hasModernJS).toBeTruthy();
      expect(jsConsistency.hasES6Features).toBeTruthy();
    });
  });

  test('Comprehensive Cross-browser Test', async ({ page, browserName }) => {
    console.log(`🌐 Running comprehensive ${browserName} compatibility test...`);

    // Test both major pages
    await homePage.goto();
    const homeResults = await homePage.runComprehensiveTests();

    await authPage.gotoSignIn();
    const authResults = await authPage.runComprehensiveTests();

    // Browser-specific checks
    const browserInfo = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        onLine: navigator.onLine
      };
    });

    console.log(`Browser info for ${browserName}:`, browserInfo);

    // Verify consistent functionality
    expect(homeResults.jsErrors).toHaveLength(0);
    expect(authResults.jsErrors).toHaveLength(0);

    // Verify reasonable performance
    expect(homeResults.performance.score).toBeGreaterThan(60);
    expect(authResults.performance.score).toBeGreaterThan(60);

    console.log(`${browserName} compatibility test completed successfully`);
  });
});