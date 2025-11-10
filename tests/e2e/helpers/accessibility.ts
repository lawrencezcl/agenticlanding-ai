import { Page, Locator } from '@playwright/test';

export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Check for basic accessibility compliance
   */
  async checkBasicAccessibility() {
    const issues: string[] = [];

    // Check for alt text on images
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images missing alt attributes`);
    }

    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.substring(1));

      if (level > previousLevel + 1) {
        issues.push(`Heading hierarchy skipped: h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    }

    // Check for form labels
    const inputsWithoutLabels = await this.page.locator('input:not([aria-label]):not([aria-labelledby])').count();
    const labels = await this.page.locator('label').count();

    if (inputsWithoutLabels > labels) {
      issues.push('Some form inputs may be missing proper labels');
    }

    // Check for proper button text
    const buttonsWithoutText = await this.page.locator('button:empty:not([aria-label])').count();
    if (buttonsWithoutText > 0) {
      issues.push(`${buttonsWithoutText} buttons without text or aria-label`);
    }

    // Check for color contrast (basic check)
    const elementsWithLowContrast = await this.page.locator('[style*="color"]').count();
    if (elementsWithLowContrast > 0) {
      // Note: Full contrast checking would require a more sophisticated implementation
      // This is just a placeholder for demonstration
    }

    return issues;
  }

  /**
   * Check keyboard navigation
   */
  async checkKeyboardNavigation() {
    const issues: string[] = [];

    // Check if focus is visible
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.locator(':focus').count();

    if (focusedElement === 0) {
      issues.push('No element receives focus on tab press');
    }

    // Check for skip links
    const skipLinks = await this.page.locator('a[href^="#"], [role="navigation"] a').count();
    if (skipLinks === 0) {
      issues.push('No skip links found for keyboard navigation');
    }

    return issues;
  }

  /**
   * Check ARIA attributes
   */
  async checkARIACompliance() {
    const issues: string[] = [];

    // Check for proper ARIA roles
    const invalidRoles = await this.page.locator('[role]:not([role="banner"]):not([role="navigation"]):not([role="main"]):not([role="contentinfo"]):not([role="search"]):not([role="button"]):not([role="link"]):not([role="dialog"]):not([role="alert"]):not([role="status"]):not([role="tooltip"])').count();

    if (invalidRoles > 0) {
      issues.push('Potentially invalid ARIA roles detected');
    }

    // Check for required ARIA attributes
    const elementsWithRequiredAttrsMissing = await this.page.locator('[aria-required="true"]:not([required])').count();
    if (elementsWithRequiredAttrsMissing > 0) {
      issues.push('Elements marked as aria-required but missing required attribute');
    }

    return issues;
  }

  /**
   * Run comprehensive accessibility checks
   */
  async runAccessibilityChecks() {
    console.log('🔍 Running accessibility checks...');

    const basicIssues = await this.checkBasicAccessibility();
    const keyboardIssues = await this.checkKeyboardNavigation();
    const ariaIssues = await this.checkARIACompliance();

    const allIssues = [...basicIssues, ...keyboardIssues, ...ariaIssues];

    if (allIssues.length > 0) {
      console.warn('⚠️ Accessibility issues found:', allIssues);
    } else {
      console.log('✅ No major accessibility issues detected');
    }

    return allIssues;
  }
}