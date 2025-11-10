import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
  networkRequests: number;
}

export class PerformanceHelper {
  constructor(private page: Page) {}

  /**
   * Get performance metrics from the page
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      // Get LCP (Largest Contentful Paint)
      let lcp = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Get CLS (Cumulative Layout Shift)
      let cls = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Get FID (First Input Delay)
      let fid = 0;
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          fid = (entry as any).processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: lcp,
        firstInputDelay: fid,
        cumulativeLayoutShift: cls,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      };
    });

    // Get network request count
    const networkRequests = await this.page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });

    return {
      ...metrics,
      networkRequests,
    };
  }

  /**
   * Check if metrics meet performance thresholds
   */
  checkPerformanceThresholds(metrics: PerformanceMetrics, thresholds: any) {
    const issues: string[] = [];

    if (metrics.loadTime > thresholds.maxLoadTime) {
      issues.push(`Load time ${metrics.loadTime}ms exceeds threshold of ${thresholds.maxLoadTime}ms`);
    }

    if (metrics.firstContentfulPaint > thresholds.maxFCP) {
      issues.push(`First Contentful Paint ${metrics.firstContentfulPaint}ms exceeds threshold of ${thresholds.maxFCP}ms`);
    }

    if (metrics.largestContentfulPaint > thresholds.maxLCP) {
      issues.push(`Largest Contentful Paint ${metrics.largestContentfulPaint}ms exceeds threshold of ${thresholds.maxLCP}ms`);
    }

    if (metrics.firstInputDelay > thresholds.maxFID) {
      issues.push(`First Input Delay ${metrics.firstInputDelay}ms exceeds threshold of ${thresholds.maxFID}ms`);
    }

    if (metrics.cumulativeLayoutShift > thresholds.maxCLS) {
      issues.push(`Cumulative Layout Shift ${metrics.cumulativeLayoutShift} exceeds threshold of ${thresholds.maxCLS}`);
    }

    if (metrics.networkRequests > 50) {
      issues.push(`High number of network requests: ${metrics.networkRequests}`);
    }

    return issues;
  }

  /**
   * Measure page load performance
   */
  async measurePageLoadPerformance(url: string = '/') {
    console.log(`⏱️ Measuring performance for ${url}`);

    // Start timing
    const startTime = Date.now();

    // Navigate to the page
    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Wait for the page to be fully loaded
    await this.page.waitForLoadState('networkidle');

    const endTime = Date.now();

    // Get detailed metrics
    const metrics = await this.getPerformanceMetrics();

    console.log('📊 Performance Metrics:', {
      loadTime: endTime - startTime,
      fcp: metrics.firstContentfulPaint,
      lcp: metrics.largestContentfulPaint,
      fid: metrics.firstInputDelay,
      cls: metrics.cumulativeLayoutShift,
      requests: metrics.networkRequests,
    });

    return metrics;
  }

  /**
   * Generate a performance score (0-100)
   */
  calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // Deduct points based on performance issues
    if (metrics.loadTime > 3000) score -= 20;
    else if (metrics.loadTime > 2000) score -= 10;

    if (metrics.firstContentfulPaint > 1800) score -= 15;
    else if (metrics.firstContentfulPaint > 1000) score -= 5;

    if (metrics.largestContentfulPaint > 2500) score -= 15;
    else if (metrics.largestContentfulPaint > 1500) score -= 5;

    if (metrics.firstInputDelay > 100) score -= 10;
    else if (metrics.firstInputDelay > 50) score -= 5;

    if (metrics.cumulativeLayoutShift > 0.1) score -= 15;
    else if (metrics.cumulativeLayoutShift > 0.05) score -= 5;

    if (metrics.networkRequests > 100) score -= 10;
    else if (metrics.networkRequests > 50) score -= 5;

    return Math.max(0, score);
  }
}