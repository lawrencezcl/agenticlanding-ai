import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly heroSection: Locator;
  readonly featuresSection: Locator;
  readonly ctaSection: Locator;
  readonly getStartedButton: Locator;
  readonly watchDemoButton: Locator;
  readonly brandLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.heroSection = page.locator('section:has(h1)');
    this.featuresSection = page.locator('section:has-text("AI-Optimized")');
    this.ctaSection = page.locator('section:has-text("Get Started Free")');
    this.getStartedButton = page.locator('button:has-text("Get Started Free")');
    this.watchDemoButton = page.locator('button:has-text("Watch Demo")');
    this.brandLogo = page.locator('h1:has-text("AgenticLanding AI")');
  }

  /**
   * Navigate to the home page
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Verify all major sections are present and visible
   */
  async verifyHomePageStructure() {
    // Verify page title
    await this.verifyPageTitle('AgenticLanding AI');

    // Verify main sections are present
    await expect(this.heroSection).toBeVisible();
    await expect(this.featuresSection).toBeVisible();
    await expect(this.ctaSection).toBeVisible();

    // Verify key elements
    await expect(this.brandLogo).toBeVisible();
    await expect(this.getStartedButton).toBeVisible();
    await expect(this.watchDemoButton).toBeVisible();

    // Verify hero content
    const heroTitle = this.page.locator('h1:has-text("AI-Powered Landing Pages")');
    await expect(heroTitle).toBeVisible();

    const heroSubtitle = this.page.locator('p:has-text("Transform campaign context")');
    await expect(heroSubtitle).toBeVisible();

    // Verify feature cards
    const featureCards = this.page.locator('.grid.grid-cols-1.md\\:grid-cols-3 > div');
    await expect(featureCards).toHaveCount(3);

    // Verify specific feature content
    await expect(this.page.locator('text=Lightning Fast')).toBeVisible();
    await expect(this.page.locator('text=AI-Optimized')).toBeVisible();
    await expect(this.page.locator('text=Brand Compliant')).toBeVisible();
  }

  /**
   * Test hero section functionality
   */
  async testHeroSection() {
    const heroSection = this.page.locator('section:has(h1)');

    // Verify hero section is visible
    await expect(heroSection).toBeVisible();

    // Check for gradient background
    const heroSectionElement = await heroSection.elementHandle();
    const computedStyle = await heroSectionElement?.evaluate(el => {
      return window.getComputedStyle(el);
    });

    // Verify background styling
    expect(computedStyle?.background).toContain('gradient');

    // Test button visibility and text
    await expect(this.getStartedButton).toBeVisible();
    await expect(this.getStartedButton).toContainText('Get Started Free');

    await expect(this.watchDemoButton).toBeVisible();
    await expect(this.watchDemoButton).toContainText('Watch Demo');

    // Test animation elements (Framer Motion classes)
    const animatedElements = this.page.locator('[class*="motion"]');
    expect(await animatedElements.count()).toBeGreaterThan(0);
  }

  /**
   * Test features section
   */
  async testFeaturesSection() {
    const featureCards = this.page.locator('.grid.grid-cols-1.md\\:grid-cols-3 > div');

    // Verify all 3 feature cards are present
    await expect(featureCards).toHaveCount(3);

    // Check each feature card has proper structure
    for (let i = 0; i < 3; i++) {
      const card = featureCards.nth(i);
      await expect(card).toBeVisible();

      // Check for icon container
      const iconContainer = card.locator('div[class*="rounded-lg"]');
      await expect(iconContainer).toBeVisible();

      // Check for title
      const title = card.locator('h3');
      await expect(title).toBeVisible();

      // Check for description
      const description = card.locator('p');
      await expect(description).toBeVisible();
    }

    // Verify specific feature content
    const features = [
      { title: 'Lightning Fast', description: 'Generate landing pages in minutes' },
      { title: 'AI-Optimized', description: 'Data-driven design for maximum conversions' },
      { title: 'Brand Compliant', description: 'Never compromise on brand guidelines' }
    ];

    for (const feature of features) {
      await expect(this.page.locator(`text=${feature.title}`)).toBeVisible();
      await expect(this.page.locator(`text=${feature.description}`)).toBeVisible();
    }
  }

  /**
   * Test CTA section
   */
  async testCTASection() {
    // This would test the Call-to-Action section if it exists
    const ctaButtons = this.page.locator('button:has-text("Get Started"), button:has-text("Sign Up")');

    if (await ctaButtons.count() > 0) {
      await expect(ctaButtons.first()).toBeVisible();
    }
  }

  /**
   * Test responsive design
   */
  async testResponsiveDesign() {
    const selectors = [
      'h1:has-text("AI-Powered Landing Pages")',
      '.grid.grid-cols-1.md\\:grid-cols-3 > div',
      'button:has-text("Get Started Free")',
      'button:has-text("Watch Demo")'
    ];

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Widescreen', width: 2560, height: 1440 }
    ];

    const issues = await this.checkResponsiveDesign(selectors, viewports);

    if (issues.length > 0) {
      console.warn('⚠️ Responsive design issues:', issues);
    }

    return issues;
  }

  /**
   * Test navigation interactions
   */
  async testNavigation() {
    // Test if clicking Get Started button works
    await this.getStartedButton.click();

    // Should navigate to sign-in or dashboard
    await this.page.waitForTimeout(2000); // Wait for navigation

    const currentUrl = this.page.url();

    // Check if navigated to auth page or dashboard
    const isAuthPage = currentUrl.includes('/auth/') || currentUrl.includes('/signin');
    const isDashboard = currentUrl.includes('/dashboard');

    expect(isAuthPage || isDashboard).toBeTruthy();
  }

  /**
   * Test visual design consistency
   */
  async testVisualDesignConsistency() {
    // Check for consistent color scheme
    const brandElements = this.page.locator('[class*="brand-main"], [class*="text-brand"]');

    if (await brandElements.count() > 0) {
      const firstBrandElement = brandElements.first();
      const brandColor = await firstBrandElement.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      // Verify brand elements have consistent color
      for (let i = 1; i < await brandElements.count(); i++) {
        const element = brandElements.nth(i);
        const elementColor = await element.evaluate(el => {
          return window.getComputedStyle(el).color;
        });

        // Colors should be similar (allowing for slight variations)
        expect(elementColor).toBe(brandColor);
      }
    }

    // Check for consistent typography
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const headingFonts = new Set();

    for (let i = 0; i < await headings.count(); i++) {
      const heading = headings.nth(i);
      const fontFamily = await heading.evaluate(el => {
        return window.getComputedStyle(el).fontFamily;
      });
      headingFonts.add(fontFamily);
    }

    // Should use consistent font family for headings
    expect(headingFonts.size).toBeLessThanOrEqual(2); // Allow for title vs other headings
  }

  /**
   * Test loading performance
   */
  async testPerformance() {
    const metrics = await this.performanceHelper.measurePageLoadPerformance('/');
    const issues = this.performanceHelper.checkPerformanceThresholds(metrics, {
      maxLoadTime: 3000,
      maxFCP: 1800,
      maxLCP: 2500,
      maxFID: 100,
      maxCLS: 0.1
    });

    const score = this.performanceHelper.calculatePerformanceScore(metrics);
    console.log(`📊 Performance Score: ${score}/100`);

    return { metrics, issues, score };
  }

  /**
   * Run comprehensive home page tests
   */
  async runComprehensiveTests() {
    console.log('🏠 Running comprehensive home page tests...');

    await this.goto();

    const results = {
      structure: await this.verifyHomePageStructure(),
      hero: await this.testHeroSection(),
      features: await this.testFeaturesSection(),
      cta: await this.testCTASection(),
      responsive: await this.testResponsiveDesign(),
      navigation: await this.testNavigation(),
      design: await this.testVisualDesignConsistency(),
      performance: await this.testPerformance(),
      accessibility: await this.accessibilityHelper.runAccessibilityChecks(),
      brokenLinks: await this.checkForBrokenLinks(),
      jsErrors: await this.checkForJavaScriptErrors()
    };

    return results;
  }
}