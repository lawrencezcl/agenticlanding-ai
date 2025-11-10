import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { testData } from './fixtures/test-data';

test.describe('Performance and Metrics Tests', () => {
  let homePage: HomePage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    authPage = new AuthPage(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load homepage within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();

      await homePage.goto();

      const loadTime = Date.now() - startTime;
      console.log(`Homepage load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(testData.performance.maxLoadTime);
    });

    test('should load auth page within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();

      await authPage.gotoSignIn();

      const loadTime = Date.now() - startTime;
      console.log(`Auth page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(testData.performance.maxLoadTime);
    });

    test('should have good First Contentful Paint (FCP)', async ({ page }) => {
      await homePage.goto();

      const fcp = await page.evaluate(() => {
        const paint = performance.getEntriesByType('paint');
        const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : 0;
      });

      console.log(`First Contentful Paint: ${fcp}ms`);
      expect(fcp).toBeLessThan(testData.performance.maxFCP);
    });

    test('should have good Largest Contentful Paint (LCP)', async ({ page }) => {
      await homePage.goto();

      // Wait for LCP to be measured
      await page.waitForTimeout(3000);

      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      console.log(`Largest Contentful Paint: ${lcp}ms`);
      if (lcp > 0) {
        expect(lcp).toBeLessThan(testData.performance.maxLCP);
      }
    });

    test('should have good First Input Delay (FID)', async ({ page }) => {
      await homePage.goto();

      // Simulate user interaction
      await page.click('body');
      await page.waitForTimeout(1000);

      const fid = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              resolve(entry.processingStart - entry.startTime);
              return;
            }
          });
          observer.observe({ entryTypes: ['first-input'] });

          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      console.log(`First Input Delay: ${fid}ms`);
      if (fid > 0) {
        expect(fid).toBeLessThan(testData.performance.maxFID);
      }
    });

    test('should have low Cumulative Layout Shift (CLS)', async ({ page }) => {
      await homePage.goto();

      // Wait for layout shifts to be measured
      await page.waitForTimeout(5000);

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
          }, 5000);
        });
      });

      console.log(`Cumulative Layout Shift: ${cls}`);
      expect(cls).toBeLessThan(testData.performance.maxCLS);
    });
  });

  test.describe('Resource Loading', () => {
    test('should optimize image loading', async ({ page }) => {
      await homePage.goto();

      const imageMetrics = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.map(img => ({
          src: img.src,
          hasLoadingAttr: img.hasAttribute('loading'),
          loadingValue: img.getAttribute('loading'),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.offsetWidth,
          displayHeight: img.offsetHeight,
          fileExtensions: img.src.split('.').pop()?.toLowerCase()
        }));
      });

      console.log(`Found ${imageMetrics.length} images`);

      for (const img of imageMetrics) {
        // Check for lazy loading on below-the-fold images
        if (img.loadingValue === 'lazy') {
          console.log(`✅ Image using lazy loading: ${img.src}`);
        }

        // Check if images are appropriately sized
        if (img.naturalWidth > 0 && img.displayWidth > 0) {
          const sizeRatio = img.naturalWidth / img.displayWidth;
          if (sizeRatio > 2) {
            console.warn(`⚠️ Image may be oversized: ${img.src} (ratio: ${sizeRatio.toFixed(2)})`);
          }
        }

        // Check for modern image formats
        if (img.fileExtensions && !['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif'].includes(img.fileExtensions)) {
          console.warn(`⚠️ Unusual image format: ${img.fileExtensions}`);
        }
      }
    });

    test('should minimize network requests', async ({ page }) => {
      await homePage.goto();

      const resourceCount = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources.length;
      });

      console.log(`Total network requests: ${resourceCount}`);
      expect(resourceCount).toBeLessThan(50);

      // Analyze resource types
      const resourceTypes = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const types: { [key: string]: number } = {};

        resources.forEach(resource => {
          const type = resource.initiatorType;
          types[type] = (types[type] || 0) + 1;
        });

        return types;
      });

      console.log('Resource types:', resourceTypes);

      // Check for excessive requests of any type
      Object.entries(resourceTypes).forEach(([type, count]) => {
        if (type === 'script' && count > 10) {
          console.warn(`⚠️ High number of script requests: ${count}`);
        }
        if (type === 'css' && count > 5) {
          console.warn(`⚠️ High number of CSS requests: ${count}`);
        }
        if (type === 'img' && count > 20) {
          console.warn(`⚠️ High number of image requests: ${count}`);
        }
      });
    });

    test('should use efficient compression', async ({ page }) => {
      const responses: any[] = [];

      page.on('response', response => {
        const url = response.url();
        const headers = response.headers();

        if (url.includes('.js') || url.includes('.css') || url.includes('.html')) {
          responses.push({
            url,
            contentType: headers['content-type'],
            contentEncoding: headers['content-encoding'],
            contentLength: headers['content-length']
          });
        }
      });

      await homePage.goto();

      // Wait for responses to be collected
      await page.waitForTimeout(2000);

      console.log(`Analyzed ${responses.length} responses for compression`);

      for (const response of responses) {
        if (response.contentEncoding) {
          console.log(`✅ Compressed: ${response.url} (${response.contentEncoding})`);
        } else {
          console.warn(`⚠️ Not compressed: ${response.url}`);
        }
      }
    });
  });

  test.describe('Memory and CPU Usage', () => {
    test('should not have excessive memory usage', async ({ page }) => {
      await homePage.goto();

      // Wait for page to fully load
      await page.waitForTimeout(5000);

      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      if (memoryInfo) {
        const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
        console.log(`Memory usage: ${usedMB.toFixed(2)} MB`);

        // Should use less than 50MB of JavaScript heap
        expect(usedMB).toBeLessThan(50);
      } else {
        console.log('Memory information not available in this browser');
      }
    });

    test('should not cause layout thrashing', async ({ page }) => {
      await homePage.goto();

      const layoutOperations = await page.evaluate(() => {
        let layoutCount = 0;
        let paintCount = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              layoutCount++;
            }
            if (entry.entryType === 'paint') {
              paintCount++;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift', 'paint'] });

        // Simulate some interactions
        document.body.click();
        window.scrollBy(0, 100);
        window.scrollBy(0, -100);

        return new Promise((resolve) => {
          setTimeout(() => {
            observer.disconnect();
            resolve({ layoutCount, paintCount });
          }, 3000);
        });
      });

      console.log(`Layout operations: ${layoutOperations}, Paint operations: ${paintOperations}`);
      expect(layoutOperations).toBeLessThan(10);
    });
  });

  test.describe('Core Web Vitals Simulation', () => {
    test('should achieve good Core Web Vitals scores', async ({ page }) => {
      await homePage.goto();

      // Collect all metrics
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

          // FID
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              metrics.fid = entry.processingStart - entry.startTime;
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Collect all metrics after delay
          setTimeout(() => {
            lcpObserver.disconnect();
            clsObserver.disconnect();
            fidObserver.disconnect();

            // Add navigation timing
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;

            resolve(metrics);
          }, 5000);
        });
      });

      console.log('Core Web Vitals:', metrics);

      // Calculate scores
      const scores = {
        fcp: metrics.fcp < 1800 ? 100 : metrics.fcp < 3000 ? 50 : 0,
        lcp: metrics.lcp < 2500 ? 100 : metrics.lcp < 4000 ? 50 : 0,
        cls: metrics.cls < 0.1 ? 100 : metrics.cls < 0.25 ? 50 : 0,
        fid: metrics.fid < 100 ? 100 : metrics.fid < 300 ? 50 : 0
      };

      const overallScore = Object.values(scores).reduce((a: number, b: number) => a + b, 0) / Object.keys(scores).length;

      console.log(`Performance Score: ${overallScore.toFixed(0)}/100`);

      // Assert good performance
      expect(metrics.fcp).toBeLessThan(3000);
      expect(metrics.lcp).toBeLessThan(4000);
      expect(metrics.cls).toBeLessThan(0.25);
      if (metrics.fid > 0) {
        expect(metrics.fid).toBeLessThan(300);
      }

      expect(overallScore).toBeGreaterThan(70);
    });
  });

  test.describe('Performance Regression Testing', () => {
    test('should maintain performance across page navigation', async ({ page }) => {
      // Load homepage
      await homePage.goto();
      await page.waitForTimeout(2000);

      const initialMetrics = await homePage.performanceHelper.getPerformanceMetrics();

      // Navigate to auth page
      await authPage.gotoSignIn();
      await page.waitForTimeout(2000);

      const authMetrics = await authPage.performanceHelper.getPerformanceMetrics();

      // Navigate back to homepage
      await homePage.goto();
      await page.waitForTimeout(2000);

      const returnMetrics = await homePage.performanceHelper.getPerformanceMetrics();

      console.log('Performance comparison:', {
        initial: initialMetrics.loadTime,
        auth: authMetrics.loadTime,
        return: returnMetrics.loadTime
      });

      // Performance shouldn't degrade significantly
      expect(returnMetrics.loadTime).toBeLessThan(initialMetrics.loadTime * 1.5);
    });

    test('should handle resource loading efficiently', async ({ page }) => {
      const resourceTiming: any[] = [];

      page.on('response', response => {
        const timing = response.request().timing();
        resourceTiming.push({
          url: response.url(),
          startTime: timing.startTime,
          responseEnd: timing.responseEnd,
          duration: timing.responseEnd - timing.startTime
        });
      });

      await homePage.goto();
      await page.waitForTimeout(3000);

      // Analyze resource loading times
      const slowResources = resourceTiming.filter(r => r.duration > 2000);
      console.log(`Found ${slowResources.length} slow resources (>2s)`);

      if (slowResources.length > 0) {
        slowResources.forEach(resource => {
          console.warn(`⚠️ Slow resource: ${resource.url} (${resource.duration}ms)`);
        });
      }

      expect(slowResources.length).toBeLessThan(3);
    });
  });

  test('Comprehensive Performance Test', async ({ page }) => {
    console.log('⚡ Running comprehensive performance test...');

    // Test homepage performance
    const homeResults = await homePage.testPerformance();

    // Test auth page performance
    await authPage.gotoSignIn();
    const authMetrics = await authPage.performanceHelper.measurePageLoadPerformance('/auth/signin');

    const results = {
      homepage: homeResults,
      auth: {
        metrics: authMetrics,
        issues: authPage.performanceHelper.checkPerformanceThresholds(authMetrics, testData.performance),
        score: authPage.performanceHelper.calculatePerformanceScore(authMetrics)
      }
    };

    console.log('Performance Test Results:', {
      homepage: {
        score: homeResults.score,
        issues: homeResults.issues.length,
        loadTime: homeResults.metrics.loadTime
      },
      auth: {
        score: results.auth.score,
        issues: results.auth.issues.length,
        loadTime: results.auth.metrics.loadTime
      }
    });

    // Assert good performance overall
    expect(homeResults.score).toBeGreaterThan(70);
    expect(results.auth.score).toBeGreaterThan(70);
    expect(homeResults.issues.length).toBeLessThan(5);
    expect(results.auth.issues.length).toBeLessThan(5);
  });
});