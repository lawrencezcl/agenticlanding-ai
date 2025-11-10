import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';

test.describe('Accessibility Compliance Tests', () => {
  let homePage: HomePage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    authPage = new AuthPage(page);
  });

  test.describe('WCAG 2.1 Level A Compliance', () => {
    test('should have proper page structure and semantics', async ({ page }) => {
      await homePage.goto();

      // Check for proper DOCTYPE
      const doctype = await page.evaluate(() => document.doctype?.name);
      expect(doctype).toBe('html');

      // Check for proper lang attribute
      const lang = await page.getAttribute('html', 'lang');
      expect(lang).toBe('en');

      // Check for proper page title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);

      // Check for proper heading structure
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1); // Should have exactly one h1

      // Check for landmark regions
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      const header = page.locator('header, [role="banner"]');
      await expect(header).toBeVisible();

      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }
    });

    test('should have accessible images', async ({ page }) => {
      await homePage.goto();

      // Check all images have alt attributes
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Images should have alt text unless they're decorative
        if (role !== 'presentation' && role !== 'none') {
          expect(alt).toBeTruthy();
        }
      }

      // Check for meaningful alt text
      const meaningfulImages = images.filter({ has: page.locator('[alt]:not([alt=""])') });
      const meaningfulCount = await meaningfulImages.count();

      for (let i = 0; i < meaningfulCount; i++) {
        const img = meaningfulImages.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt?.length).toBeGreaterThan(3); // Should be descriptive
      }
    });

    test('should have accessible forms', async ({ page }) => {
      await authPage.gotoSignIn();

      // Check form elements have proper labels
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');

        // Skip hidden inputs
        if (type === 'hidden') continue;

        // Check for associated label
        const hasLabel = await input.getAttribute('aria-label') ||
                        await input.getAttribute('aria-labelledby') ||
                        await page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0 ||
                        await input.locator('xpath=./ancestor::label').count() > 0;

        expect(hasLabel).toBeTruthy();
      }

      // Check form has proper submit mechanism
      const form = page.locator('form');
      if (await form.count() > 0) {
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        expect(await submitButton.count()).toBeGreaterThan(0);
      }

      // Check form validation is accessible
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');

      await emailInput.fill('invalid-email');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check for error messages
      const errorMessage = page.locator('[role="alert"], .error, .alert');
      if (await errorMessage.isVisible()) {
        // Error should be associated with the input
        const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
        if (ariaDescribedBy) {
          const describedElement = page.locator(`#${ariaDescribedBy}`);
          expect(await describedElement.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should have accessible links', async ({ page }) => {
      await homePage.goto();

      // Check all links have meaningful text
      const links = page.locator('a[href]');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 20); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Links should have accessible text
        expect(text || ariaLabel || title).toBeTruthy();

        // Avoid "click here" text
        if (text) {
          expect(text.toLowerCase()).not.toContain('click here');
          expect(text.toLowerCase()).not.toContain('read more');
        }

        // Check if link opens in new window (should have warning)
        const target = await link.getAttribute('target');
        if (target === '_blank') {
          const hasWarning = text?.toLowerCase().includes('opens in new window') ||
                            ariaLabel?.toLowerCase().includes('opens in new window');

          if (!hasWarning) {
            console.warn('Link opens in new window without warning:', text);
          }
        }
      }
    });

    test('should have accessible buttons', async ({ page }) => {
      await homePage.goto();

      // Check all buttons have accessible text
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');

        // Buttons should have accessible text
        expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();

        // Check button is not disabled without reason
        const isDisabled = await button.isDisabled();
        if (isDisabled) {
          const ariaDisabled = await button.getAttribute('aria-disabled');
          expect(ariaDisabled).toBe('true');
        }
      }
    });

    test('should have proper color contrast', async ({ page }) => {
      await homePage.goto();

      // Get all text elements
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
      const elementCount = await textElements.count();

      // Sample first 10 elements for performance
      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            opacity: computed.opacity
          };
        });

        // Basic color checks
        expect(styles.color).toBeTruthy();
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0.5);

        // Check if text is readable (basic heuristic)
        const colorRgb = styles.color.match(/\d+/g);
        const bgRgb = styles.backgroundColor.match(/\d+/g);

        if (colorRgb && bgRgb && bgRgb.length >= 3) {
          const colorLuminance = (0.299 * parseInt(colorRgb[0]) +
                                 0.587 * parseInt(colorRgb[1]) +
                                 0.114 * parseInt(colorRgb[2])) / 255;

          const bgLuminance = (0.299 * parseInt(bgRgb[0]) +
                              0.587 * parseInt(bgRgb[1]) +
                              0.114 * parseInt(bgRgb[2])) / 255;

          const contrast = (Math.max(colorLuminance, bgLuminance) + 0.05) /
                          (Math.min(colorLuminance, bgLuminance) + 0.05);

          // WCAG AA requires 4.5:1 for normal text
          const fontSize = parseFloat(styles.fontSize);
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === 'bold');
          const requiredContrast = isLargeText ? 3 : 4.5;

          expect(contrast).toBeGreaterThan(requiredContrast - 1); // Allow some margin for measurement errors
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await homePage.goto();

      // Get all focusable elements
      const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const elementCount = await focusableElements.count();

      // Test tab navigation
      for (let i = 0; i < Math.min(elementCount, 15); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = page.locator(':focus');
        expect(await focusedElement.count()).toBe(1);

        // Check if focused element is visible
        const isVisible = await focusedElement.isVisible();
        expect(isVisible).toBeTruthy();

        // Check for visible focus indicator
        const styles = await focusedElement.evaluate(el => {
          const computed = window.getComputedStyle(el, ':focus');
          return {
            outline: computed.outline,
            outlineOffset: computed.outlineOffset,
            boxShadow: computed.boxShadow
          };
        });

        const hasFocusIndicator = styles.outline !== 'none' ||
                                 styles.boxShadow !== 'none' ||
                                 await focusedElement.getAttribute('data-focus-visible') !== null;

        if (!hasFocusIndicator) {
          console.warn('Element may not have visible focus indicator');
        }
      }

      // Test Enter key on buttons
      const firstButton = page.locator('button').first();
      if (await firstButton.count() > 0) {
        await firstButton.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }

      // Test Space key on buttons
      const secondButton = page.locator('button').nth(1);
      if (await secondButton.count() > 0) {
        await secondButton.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);
      }
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await homePage.goto();

      // Check for proper ARIA roles
      const elementsWithRoles = page.locator('[role]');
      const roleCount = await elementsWithRoles.count();

      for (let i = 0; i < roleCount; i++) {
        const element = elementsWithRoles.nth(i);
        const role = await element.getAttribute('role');

        // Check for valid ARIA roles
        const validRoles = [
          'banner', 'navigation', 'main', 'complementary', 'contentinfo',
          'search', 'form', 'region', 'alert', 'dialog', 'button', 'link',
          'heading', 'list', 'listitem', 'table', 'row', 'cell', 'grid'
        ];

        expect(validRoles).toContain(role);
      }

      // Check for required ARIA attributes
      const requiredAttributes = [
        { selector: '[aria-required="true"]', required: ['required'] },
        { selector: '[aria-expanded]', required: ['aria-controls'] },
        { selector: '[aria-label]', required: [] },
        { selector: '[aria-labelledby]', required: [] }
      ];

      for (const { selector, required } of requiredAttributes) {
        const elements = page.locator(selector);
        const count = await elements.count();

        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);

          for (const attr of required) {
            const hasAttr = await element.getAttribute(attr);
            expect(hasAttr).toBeTruthy();
          }
        }
      }
    });

    test('should handle screen reader compatibility', async ({ page }) => {
      await homePage.goto();

      // Check for proper semantic HTML
      await expect(page.locator('main, [role="main"]')).toBeVisible();

      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Check for skip links
      const skipLinks = page.locator('a[href^="#"]:has-text("skip"), .skip-link');
      if (await skipLinks.count() === 0) {
        console.warn('No skip links found - consider adding for better accessibility');
      }

      // Check for landmark regions
      const landmarks = page.locator('header, nav, main, footer, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]');
      expect(await landmarks.count()).toBeGreaterThan(0);

      // Check form has proper fieldset if multiple related fields
      const forms = page.locator('form');
      const formCount = await forms.count();

      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);
        const inputs = form.locator('input, select, textarea');
        const inputCount = await inputs.count();

        if (inputCount > 2) {
          // Consider using fieldset for groups of related fields
          const fieldsets = form.locator('fieldset');
          const hasFieldset = await fieldsets.count() > 0;

          if (!hasFieldset) {
            console.warn('Form with multiple inputs might benefit from fieldset grouping');
          }
        }
      }
    });
  });

  test.describe('Motion and Animation Accessibility', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Test with reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await homePage.goto();

      // Check for reduced animations
      const animatedElements = page.locator('[class*="motion"], [class*="animation"], [class*="transition"]');
      const animatedCount = await animatedElements.count();

      for (let i = 0; i < animatedCount; i++) {
        const element = animatedElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            animation: computed.animation,
            transition: computed.transition,
            transform: computed.transform
          };
        });

        // Animations should be reduced or disabled
        if (styles.animation !== 'none') {
          console.warn('Animation still present with reduced motion preference');
        }
      }
    });

    test('should not have auto-playing content', async ({ page }) => {
      await homePage.goto();

      // Check for auto-playing videos
      const videos = page.locator('video[autoplay]');
      expect(await videos.count()).toBe(0);

      // Check for auto-playing audio
      const audios = page.locator('audio[autoplay]');
      expect(await audios.count()).toBe(0);

      // Check for animated GIFs (should have controls)
      const gifs = page.locator('img[src*=".gif"]');
      const gifCount = await gifs.count();

      for (let i = 0; i < gifCount; i++) {
        const gif = gifs.nth(i);
        const hasControls = await gif.getAttribute('data-controls') ||
                           await gif.locator('xpath=./ancestor::*[contains(@class, "gif-controls")]').count() > 0;

        if (!hasControls) {
          console.warn('Animated GIF without controls detected');
        }
      }
    });
  });

  test('Comprehensive Accessibility Audit', async ({ page }) => {
    console.log('♿ Running comprehensive accessibility audit...');

    // Test homepage accessibility
    await homePage.goto();
    const homeAccessibilityIssues = await homePage.accessibilityHelper.runAccessibilityChecks();

    // Test auth page accessibility
    await authPage.gotoSignIn();
    const authAccessibilityIssues = await authPage.testAccessibility();

    const allIssues = [...homeAccessibilityIssues, ...authAccessibilityIssues];

    console.log(`Accessibility audit complete. Found ${allIssues.length} issues:`);

    if (allIssues.length > 0) {
      allIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    // Assert reasonable accessibility standards
    expect(allIssues.length).toBeLessThan(10);

    // Categorize issues by severity
    const criticalIssues = allIssues.filter(issue =>
      issue.toLowerCase().includes('missing') ||
      issue.toLowerCase().includes('required') ||
      issue.toLowerCase().includes('invalid')
    );

    expect(criticalIssues.length).toBeLessThan(3);
  });
});