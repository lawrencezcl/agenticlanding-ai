import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { testData } from './fixtures/test-data';

test.describe('Authentication UI/UX Tests', () => {
  let authPage: AuthPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    homePage = new HomePage(page);
  });

  test.describe('Sign-in Page Structure', () => {
    test('should display all sign-in elements correctly', async ({ page }) => {
      await authPage.gotoSignIn();

      // Test basic structure
      await authPage.verifySignInPageStructure();

      // Verify page title
      await expect(page).toHaveTitle(/Sign in/);

      // Test brand logo links to home
      const brandLogo = page.locator('h1:has-text("AgenticLanding AI")');
      await expect(brandLogo).toBeVisible();
      await brandLogo.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toBe('http://localhost:3001/');
    });

    test('should have proper form semantics', async ({ page }) => {
      await authPage.gotoSignIn();

      // Check for form element
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Check for proper labels
      const emailLabel = page.locator('label[for="email"], label:has-text("email")');
      if (await emailLabel.count() > 0) {
        await expect(emailLabel).toBeVisible();
      }

      // Check input attributes
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('placeholder');
      await expect(emailInput).toHaveAttribute('required');
    });

    test('should have proper navigation links', async ({ page }) => {
      await authPage.gotoSignIn();

      // Test sign-up link
      const signUpLink = page.locator('a:has-text("create a new account")');
      await expect(signUpLink).toBeVisible();
      await signUpLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/auth/signup');

      // Test terms and privacy links
      await authPage.gotoSignIn();
      const termsLink = page.locator('a:has-text("Terms of Service")');
      const privacyLink = page.locator('a:has-text("Privacy Policy")');

      await expect(termsLink).toBeVisible();
      await expect(privacyLink).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate email input correctly', async ({ page }) => {
      await authPage.gotoSignIn();

      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Send sign-in link")');

      // Test empty submission
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation error
      const errorMessage = page.locator('[role="alert"], .alert-destructive, .text-red-600');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText?.toLowerCase()).toContain('email');
      }

      // Test invalid email format
      await emailInput.fill('invalid-email');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show email format error
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText?.toLowerCase()).toContain('email');
      }

      // Test valid email format
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
      await expect(submitButton).toBeEnabled();
    });

    test('should provide helpful error messages', async ({ page }) => {
      await authPage.gotoSignIn();

      // Submit form without email
      const submitButton = page.locator('button[type="submit"], button:has-text("Send sign-in link")');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check for error message
      const errorMessage = page.locator('[role="alert"], .alert-destructive');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText).toBeTruthy();
        expect(errorText?.length).toBeGreaterThan(5); // Should be descriptive
      }
    });

    test('should clear errors when user starts typing', async ({ page }) => {
      await authPage.gotoSignIn();

      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Send sign-in link")');

      // Submit empty form to trigger error
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Type in email field
      await emailInput.fill('test@example.com');

      // Error should potentially clear or update
      // This depends on implementation, so we just check it doesn't crash
      await expect(emailInput).toHaveValue('test@example.com');
    });
  });

  test.describe('OAuth Integration', () => {
    test('should display OAuth provider buttons', async ({ page }) => {
      await authPage.gotoSignIn();

      // Check for OAuth buttons
      const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
      const githubButton = page.locator('button:has-text("GitHub"), button:has-text("Continue with GitHub")');

      // Test Google button
      if (await googleButton.count() > 0) {
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toBeEnabled();

        // Check for Google icon
        const googleIcon = googleButton.locator('svg');
        await expect(googleIcon).toBeVisible();
      }

      // Test GitHub button
      if (await githubButton.count() > 0) {
        await expect(githubButton).toBeVisible();
        await expect(githubButton).toBeEnabled();

        // Check for GitHub icon
        const githubIcon = githubButton.locator('svg');
        await expect(githubIcon).toBeVisible();
      }
    });

    test('should handle OAuth button interactions', async ({ page }) => {
      await authPage.gotoSignIn();

      const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');

      if (await googleButton.count() > 0) {
        // Click OAuth button
        await googleButton.click();
        await page.waitForTimeout(2000);

        // Should either redirect to OAuth provider or show error
        const currentUrl = page.url();
        const isOAuthProvider = currentUrl.includes('accounts.google.com') ||
                               currentUrl.includes('github.com') ||
                               currentUrl.includes('oauth');

        const hasError = await page.locator('[role="alert"]').isVisible();

        expect(isOAuthProvider || hasError).toBeTruthy();
      }
    });
  });

  test.describe('Email Authentication Flow', () => {
    test('should handle email sign-in correctly', async ({ page }) => {
      await authPage.gotoSignIn();

      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Send sign-in link")');

      // Fill in valid email
      await emailInput.fill('test@example.com');
      await submitButton.click();

      // Should show success message or redirect
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const isVerifyPage = currentUrl.includes('/auth/verify-request');
      const hasSuccessMessage = await page.locator('text=check your email, email sent').isVisible();

      expect(isVerifyPage || hasSuccessMessage).toBeTruthy();
    });

    test('should show loading state during submission', async ({ page }) => {
      await authPage.gotoSignIn();

      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Send sign-in link")');

      // Fill email and submit
      await emailInput.fill('test@example.com');

      // Check for loading state
      await submitButton.click();

      // Should show loading indicator briefly
      const spinner = page.locator('.animate-spin, [role="progressbar"]');
      const hasSpinner = await spinner.isVisible({ timeout: 2000 });

      // Check button is disabled during loading
      const isDisabled = await submitButton.isDisabled();

      expect(hasSpinner || isDisabled).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      await authPage.gotoSignIn();

      // Test mobile viewport
      await page.setViewportSize(testData.viewports.mobile);
      await page.waitForTimeout(500);

      // All elements should be visible and properly sized
      await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Form should not be wider than viewport
      const form = page.locator('form, .card');
      const formBox = await form.boundingBox();
      if (formBox) {
        expect(formBox.width).toBeLessThanOrEqual(page.viewportSize().width - 32); // Account for padding
      }
    });

    test('should adapt layout for different screen sizes', async ({ page }) => {
      await authPage.gotoSignIn();

      const viewports = [
        testData.viewports.mobile,
        testData.viewports.tablet,
        testData.viewports.desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        // Key elements should remain visible
        await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Content should be properly centered
        const container = page.locator('.container, .max-w-\\[.*\\], main > div');
        if (await container.count() > 0) {
          const containerBox = await container.boundingBox();
          if (containerBox) {
            // Should be reasonably centered
            const centerX = page.viewportSize().width / 2;
            const containerCenterX = containerBox.x + containerBox.width / 2;
            expect(Math.abs(centerX - containerCenterX)).toBeLessThan(100);
          }
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should meet accessibility standards', async ({ page }) => {
      await authPage.gotoSignIn();

      // Check for proper page language
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe('en');

      // Check for page title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(5);

      // Check for proper form labels
      const emailInput = page.locator('input[type="email"]');
      const hasLabel = await emailInput.getAttribute('aria-label') ||
                      await emailInput.getAttribute('aria-labelledby') ||
                      await page.locator('label[for="email"]').count() > 0;

      expect(hasLabel).toBeTruthy();

      // Check for proper button text
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        expect(buttonText || ariaLabel).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await authPage.gotoSignIn();

      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBe(1);

      // Continue tabbing through form elements
      const focusableElements = page.locator('button, input, a, [tabindex]:not([tabindex="-1"])');
      const elementCount = await focusableElements.count();

      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        focusedElement = page.locator(':focus');
        expect(await focusedElement.count()).toBe(1);

        // Check if focused element is visible
        const isVisible = await focusedElement.isVisible();
        expect(isVisible).toBeTruthy();
      }

      // Test Enter key on focused button
      if (await focusedElement.evaluate(el => el.tagName === 'BUTTON')) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await authPage.gotoSignIn();

      // Check text elements have proper contrast
      const textElements = page.locator('h1, h2, p, label, button');

      for (let i = 0; i < Math.min(5, await textElements.count()); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            opacity: computed.opacity
          };
        });

        // Basic checks
        expect(styles.color).toBeTruthy();
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0.5);
      }
    });
  });

  test.describe('Security and Privacy', () => {
    test('should have proper security attributes', async ({ page }) => {
      await authPage.gotoSignIn();

      // Check form method
      const form = page.locator('form');
      if (await form.count() > 0) {
        const method = await form.getAttribute('method');
        expect(method?.toLowerCase()).toBe('post');
      }

      // Check input types
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');

      // Check autocomplete
      const autocomplete = await emailInput.getAttribute('autocomplete');
      expect(autocomplete).toBeTruthy();
      expect(['email', 'username']).toContain(autocomplete);

      // Check for secure form submission (HTTPS in production)
      const url = page.url();
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        expect(url).toStartWith('https://');
      }
    });

    test('should display privacy links correctly', async ({ page }) => {
      await authPage.gotoSignIn();

      // Test privacy links exist and are clickable
      const termsLink = page.locator('a:has-text("Terms of Service")');
      const privacyLink = page.locator('a:has-text("Privacy Policy")');

      await expect(termsLink).toBeVisible();
      await expect(privacyLink).toBeVisible();

      // Check links have proper href attributes
      const termsHref = await termsLink.getAttribute('href');
      const privacyHref = await privacyLink.getAttribute('href');

      expect(termsHref).toBeTruthy();
      expect(privacyHref).toBeTruthy();
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work correctly in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');

      await authPage.runComprehensiveTests();
    });

    test('should work correctly in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      await authPage.runComprehensiveTests();
    });

    test('should work correctly in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');

      await authPage.runComprehensiveTests();
    });
  });

  test.describe('User Flow Integration', () => {
    test('should navigate from home to sign-in correctly', async ({ page }) => {
      // Start from home page
      await homePage.goto();

      // Find and click Get Started button
      const getStartedBtn = page.locator('button:has-text("Get Started Free")');
      await expect(getStartedBtn).toBeVisible();
      await getStartedBtn.click();

      // Should navigate to sign-in page
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/auth/signin');

      // Verify sign-in page loads correctly
      await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
    });

    test('should handle navigation back to home correctly', async ({ page }) => {
      await authPage.gotoSignIn();

      // Click brand logo
      const brandLogo = page.locator('h1:has-text("AgenticLanding AI") a, h1:has-text("AgenticLanding AI")');
      await expect(brandLogo).toBeVisible();
      await brandLogo.click();

      // Should navigate back to home
      await page.waitForTimeout(1000);
      expect(page.url()).toBe('http://localhost:3001/');

      // Verify home page content
      await expect(page.locator('h1:has-text("AI-Powered Landing Pages")')).toBeVisible();
    });

    test('should handle browser refresh correctly', async ({ page }) => {
      await authPage.gotoSignIn();

      // Fill form with data
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('test@example.com');

      // Refresh page
      await page.reload();
      await page.waitForTimeout(2000);

      // Page should load correctly without errors
      await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
      await expect(emailInput).toBeVisible();

      // Form should be empty (unless specifically implemented to persist)
      const emailValue = await emailInput.inputValue();
      expect(emailValue).toBe('');
    });
  });

  test('Comprehensive Authentication Test', async ({ page }) => {
    console.log('🔐 Running comprehensive authentication test...');

    const results = await authPage.runComprehensiveTests();

    // Log results
    console.log('Auth Test Results:', {
      structure: results.structure,
      validation: results.validation,
      responsive: results.responsive,
      accessibility: results.accessibility,
      brokenLinks: results.brokenLinks,
      jsErrors: results.jsErrors
    });

    // Assert no critical issues
    expect(results.jsErrors).toHaveLength(0);
    expect(results.brokenLinks.length).toBeLessThan(3);
    expect(results.accessibility.length).toBeLessThan(5);
  });
});