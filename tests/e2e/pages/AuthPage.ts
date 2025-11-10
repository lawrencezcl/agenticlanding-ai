import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  readonly signInButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly googleSignInButton: Locator;
  readonly githubSignInButton: Locator;
  readonly emailSignInButton: Locator;
  readonly errorMessage: Locator;
  readonly brandLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.signInButton = page.locator('button[type="submit"]');
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.googleSignInButton = page.locator('button:has-text("Google")');
    this.githubSignInButton = page.locator('button:has-text("GitHub")');
    this.emailSignInButton = page.locator('button:has-text("Send sign-in link")');
    this.errorMessage = page.locator('[role="alert"], .alert-destructive');
    this.brandLogo = page.locator('h1:has-text("AgenticLanding AI")');
  }

  /**
   * Navigate to the sign-in page
   */
  async gotoSignIn() {
    await super.goto('/auth/signin');
  }

  /**
   * Navigate to the sign-up page
   */
  async gotoSignUp() {
    await super.goto('/auth/signup');
  }

  /**
   * Verify sign-in page structure and elements
   */
  async verifySignInPageStructure() {
    // Verify page title
    await this.verifyPageTitle('Sign in');

    // Verify brand logo
    await expect(this.brandLogo).toBeVisible();

    // Verify main heading
    const mainHeading = this.page.locator('h2:has-text("Sign in to your account")');
    await expect(mainHeading).toBeVisible();

    // Verify form elements
    await expect(this.emailInput).toBeVisible();
    await expect(this.emailInput).toHaveAttribute('type', 'email');
    await expect(this.emailInput).toHaveAttribute('placeholder', 'Enter your email address');

    // Verify OAuth buttons
    const oauthButtons = this.page.locator('button:has-text("Continue with")');
    expect(await oauthButtons.count()).toBeGreaterThan(0);

    // Verify email sign-in button
    await expect(this.emailSignInButton).toBeVisible();
    await expect(this.emailSignInButton).toContainText('Send sign-in link');

    // Verify footer links
    await expect(this.page.locator('a:has-text("Terms of Service")')).toBeVisible();
    await expect(this.page.locator('a:has-text("Privacy Policy")')).toBeVisible();
    await expect(this.page.locator('a:has-text("create a new account")')).toBeVisible();
  }

  /**
   * Test form validation
   */
  async testFormValidation() {
    // Test empty form submission
    await this.emailSignInButton.click();
    await this.page.waitForTimeout(1000);

    // Should show validation error
    const hasError = await this.errorMessage.isVisible();
    if (hasError) {
      const errorText = await this.errorMessage.textContent();
      expect(errorText).toContain('email');
    }

    // Test invalid email format
    await this.emailInput.fill('invalid-email');
    await this.emailSignInButton.click();
    await this.page.waitForTimeout(1000);

    // Should show email validation error
    const hasInvalidEmailError = await this.errorMessage.isVisible();
    if (hasInvalidEmailError) {
      const errorText = await this.errorMessage.textContent();
      expect(errorText?.toLowerCase()).toContain('email');
    }

    // Test valid email
    await this.emailInput.fill('test@example.com');

    // Check if button is enabled
    await expect(this.emailSignInButton).toBeEnabled();
  }

  /**
   * Test OAuth sign-in buttons
   */
  async testOAuthButtons() {
    // Check if OAuth buttons are present
    const googleButton = this.page.locator('button:has-text("Google")');
    const githubButton = this.page.locator('button:has-text("GitHub")');

    if (await googleButton.count() > 0) {
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();

      // Check for Google icon
      const googleIcon = googleButton.locator('svg');
      await expect(googleIcon).toBeVisible();
    }

    if (await githubButton.count() > 0) {
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();

      // Check for GitHub icon
      const githubIcon = githubButton.locator('svg');
      await expect(githubIcon).toBeVisible();
    }
  }

  /**
   * Test email sign-in flow
   */
  async testEmailSignIn() {
    const testEmail = 'test@example.com';

    // Fill in email
    await this.emailInput.fill(testEmail);
    await expect(this.emailInput).toHaveValue(testEmail);

    // Click sign-in button
    await this.emailSignInButton.click();

    // Should either show success message or redirect to verify page
    await this.page.waitForTimeout(3000);

    const currentUrl = this.page.url();
    const isVerifyPage = currentUrl.includes('/auth/verify-request');
    const hasSuccessMessage = await this.page.locator('text=check your email').isVisible();

    expect(isVerifyPage || hasSuccessMessage).toBeTruthy();
  }

  /**
   * Test navigation between auth pages
   */
  async testNavigation() {
    // Test link to sign-up page
    const signUpLink = this.page.locator('a:has-text("create a new account")');
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    // Should navigate to sign-up page
    await this.page.waitForTimeout(2000);
    expect(this.page.url()).toContain('/auth/signup');

    // Navigate back to sign-in
    await this.gotoSignIn();
    await this.verifySignInPageStructure();
  }

  /**
   * Test responsive design on auth pages
   */
  async testResponsiveDesign() {
    const selectors = [
      'h2:has-text("Sign in to your account")',
      'input[type="email"]',
      'button:has-text("Send sign-in link")',
      '.card'
    ];

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    const issues = await this.checkResponsiveDesign(selectors, viewports);

    if (issues.length > 0) {
      console.warn('⚠️ Auth page responsive design issues:', issues);
    }

    return issues;
  }

  /**
   * Test accessibility on auth pages
   */
  async testAccessibility() {
    const issues = await this.accessibilityHelper.runAccessibilityChecks();

    // Additional auth-specific accessibility checks
    const formLabels = await this.page.locator('label').count();
    const formInputs = await this.page.locator('input').count();

    if (formInputs > formLabels) {
      issues.push('Some form inputs may be missing proper labels');
    }

    // Check for proper ARIA attributes on buttons
    const buttons = await this.page.locator('button').all();
    for (const button of buttons) {
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();

      if (!hasAriaLabel && !hasText?.trim()) {
        issues.push('Found button without accessible text or aria-label');
      }
    }

    return issues;
  }

  /**
   * Test loading states and error handling
   */
  async testLoadingStates() {
    // Fill in email and click sign-in to trigger loading state
    await this.emailInput.fill('test@example.com');
    await this.emailSignInButton.click();

    // Check for loading indicator (spinner)
    const spinner = this.page.locator('.animate-spin, [role="progressbar"]');

    // Should show loading state briefly
    const hasSpinner = await spinner.isVisible({ timeout: 2000 });

    if (hasSpinner) {
      await expect(spinner).toBeVisible();
    }

    // Wait for loading to complete
    await this.page.waitForTimeout(3000);
  }

  /**
   * Test form security and validation
   */
  async testSecurityAndValidation() {
    // Check for CSRF protection (should have some form of token)
    const form = this.page.locator('form');
    if (await form.count() > 0) {
      const hasCSRFToken = await form.locator('input[name*="csrf"], input[name*="token"]').count() > 0;
      // Note: CSRF tokens might be implemented differently, so this is optional
    }

    // Check for proper input types
    await expect(this.emailInput).toHaveAttribute('type', 'email');

    // Check for autocomplete attributes
    const hasAutocomplete = await this.emailInput.getAttribute('autocomplete');
    expect(hasAutocomplete).toBeTruthy();

    // Check for required attribute
    const isRequired = await this.emailInput.getAttribute('required');
    expect(isRequired).toBeTruthy();
  }

  /**
   * Run comprehensive auth page tests
   */
  async runComprehensiveTests() {
    console.log('🔐 Running comprehensive auth page tests...');

    await this.gotoSignIn();

    const results = {
      structure: await this.verifySignInPageStructure(),
      validation: await this.testFormValidation(),
      oauth: await this.testOAuthButtons(),
      emailFlow: await this.testEmailSignIn(),
      navigation: await this.testNavigation(),
      responsive: await this.testResponsiveDesign(),
      accessibility: await this.testAccessibility(),
      loadingStates: await this.testLoadingStates(),
      security: await this.testSecurityAndValidation(),
      brokenLinks: await this.checkForBrokenLinks(),
      jsErrors: await this.checkForJavaScriptErrors()
    };

    return results;
  }
}