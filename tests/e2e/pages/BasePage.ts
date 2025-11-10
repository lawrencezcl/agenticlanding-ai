import { Page, Locator, expect } from '@playwright/test';
import { AccessibilityHelper } from '../helpers/accessibility';
import { PerformanceHelper } from '../helpers/performance';

export class BasePage {
  readonly page: Page;
  readonly accessibilityHelper: AccessibilityHelper;
  readonly performanceHelper: PerformanceHelper;

  constructor(page: Page) {
    this.page = page;
    this.accessibilityHelper = new AccessibilityHelper(page);
    this.performanceHelper = new PerformanceHelper(page);
  }

  /**
   * Navigate to a URL and wait for the page to load
   */
  async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) {
    await this.page.goto(url, {
      waitUntil: options?.waitUntil || 'networkidle',
      timeout: 30000
    });
  }

  /**
   * Wait for an element to be visible and interactable
   */
  async waitForElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout
    });
  }

  /**
   * Check if an element exists on the page
   */
  async elementExists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Check if element has specific CSS class
   */
  async hasClass(selector: string, className: string): Promise<boolean> {
    const element = this.page.locator(selector);
    const classes = await element.getAttribute('class');
    return classes?.includes(className) || false;
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  /**
   * Check responsive design at different viewports
   */
  async checkResponsiveDesign(selectors: string[], viewports: Array<{ name: string; width: number; height: number }>) {
    const issues: string[] = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Wait for responsive adjustments

      for (const selector of selectors) {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          const isVisible = await element.isVisible();
          const boundingBox = await element.boundingBox();

          if (!isVisible) {
            issues.push(`Element ${selector} not visible on ${viewport.name} (${viewport.width}x${viewport.height})`);
          }

          if (boundingBox && (boundingBox.width < 0 || boundingBox.height < 0)) {
            issues.push(`Element ${selector} has invalid dimensions on ${viewport.name}`);
          }

          // Check if element is within viewport bounds
          if (boundingBox && (
            boundingBox.x < 0 ||
            boundingBox.y < 0 ||
            boundingBox.x + boundingBox.width > viewport.width ||
            boundingBox.y + boundingBox.height > viewport.height
          )) {
            issues.push(`Element ${selector} extends beyond viewport on ${viewport.name}`);
          }
        }
      }
    }

    return issues;
  }

  /**
   * Verify page title
   */
  async verifyPageTitle(expectedTitle: string) {
    const title = await this.page.title();
    expect(title).toContain(expectedTitle);
  }

  /**
   * Verify meta description
   */
  async verifyMetaDescription(expectedDescription: string) {
    const description = await this.page.getAttribute('meta[name="description"]', 'content');
    expect(description).toContain(expectedDescription);
  }

  /**
   * Check for broken links
   */
  async checkForBrokenLinks() {
    const links = await this.page.locator('a[href]').all();
    const brokenLinks: string[] = [];

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const response = await this.page.request.get(href);
          if (response.status() >= 400) {
            brokenLinks.push(`${href} (${response.status()})`);
          }
        } catch (error) {
          brokenLinks.push(`${href} (Failed to load)`);
        }
      }
    }

    return brokenLinks;
  }

  /**
   * Check for JavaScript errors
   */
  async checkForJavaScriptErrors() {
    const errors: string[] = [];

    this.page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait a bit to collect any errors
    await this.page.waitForTimeout(2000);

    return errors;
  }
}