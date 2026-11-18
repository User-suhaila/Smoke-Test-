// pages/LoginPage.js
// Handles all authentication interactions for the survey automation framework.
// Credentials must only come from environment variables — never hardcoded here.

const { fillWhenReady, clickWhenReady, assertURL } = require('../utils/helpers');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Username input: name="Username" (capital U), Angular Material text field
    this.usernameInput = page.locator('input[name="Username"]');

    // Password input: name="Password" (capital P), type="password"
    this.passwordInput = page.locator('input[name="Password"]');

    // Login submit button: id="the-button", first instance (Login vs SSO)
    // Using getByRole with exact name to target the Login button specifically
    this.submitButton = page.locator('button#the-button', { hasText: 'Login' });
  }

  /**
   * Navigates to the application root (baseURL is set in playwright.config.js).
   */
  async navigate() {
    // Retry navigation to tolerate transient network hiccups (ERR_CONNECTION_TIMED_OUT).
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await this.page.waitForLoadState('networkidle').catch(() => {});
        return;
      } catch (err) {
        lastErr = err;
        await this.page.waitForTimeout(3000);
      }
    }
    throw lastErr;
  }

  /**
   * Fills in credentials, validates CAPTCHA only if it is visible,
   * then clicks the Login button. If the reCAPTCHA image challenge appears
   * (Login button stays disabled), reloads and retries up to 5 times.
   *
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`Login attempt ${attempt}...`);

      // A previous attempt can land on the dashboard after this loop already
      // decided the username field was still visible. Do not wait for it again.
      if (await this._isLoggedIn()) {
        console.log('Login successful ✓');
        break;
      }

      // Fill credentials (re-fill every attempt in case page was reloaded)
      await this.usernameInput.waitFor({ state: 'visible', timeout: 15000 });
      await fillWhenReady(this.usernameInput, username);
      await fillWhenReady(this.passwordInput, password);

      // Check if reCAPTCHA is visible — validate it before clicking Login.
      const captchaIframe = this.page.locator('iframe[title="reCAPTCHA"]').first();
      const captchaVisible = await captchaIframe
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);

      if (captchaVisible) {
        console.log('reCAPTCHA visible — validating before Login...');
        await this._solveCaptcha();
      } else {
        console.log('No reCAPTCHA — clicking Login directly.');
      }

      // Check if Login button is enabled (reCAPTCHA validation enables it)
      await this.submitButton.waitFor({ state: 'visible', timeout: 10000 });
      const isDisabled = await this.submitButton.isDisabled().catch(() => true);

      if (isDisabled) {
        console.warn(`Login button is disabled (reCAPTCHA not verified) on attempt ${attempt} — reloading...`);
        // Navigate to fresh login URL to get a new reCAPTCHA session
        await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        // Wait longer between retries to let Google's reCAPTCHA score reset
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      // Login button is enabled — click it
      await this.submitButton.click();

      // The SPA can keep the login form mounted for a moment after a successful
      // click. Wait for the dashboard instead of sampling the username field once.
      const reachedDashboard = await this._dashboardTitle()
        .waitFor({ state: 'visible', timeout: 20000 })
        .then(() => true)
        .catch(() => false);

      if (reachedDashboard || await this._isLoggedIn()) {
        console.log('Login successful ✓');
        break;
      }

      console.warn(`Still on login page after attempt ${attempt} — retrying...`);
      await this.page.waitForTimeout(1000);
    }

    // Handle consent popup and language
    await this.dismissPostLoginPopup();
    await this.ensureEnglish();
  }

  /**
   * True when the app has left the login form and the dashboard is showing.
   * @private
   */
  _dashboardTitle() {
    // The collapsed sidebar also contains a hidden "Dashboard" label. Only the
    // visible page title counts as a successful login.
    return this.page.getByText('Dashboard', { exact: true }).filter({ visible: true }).first();
  }

  async _isLoggedIn() {
    const dashboardVisible = await this._dashboardTitle()
      .isVisible()
      .catch(() => false);
    if (dashboardVisible) return true;

    const usernameVisible = await this.usernameInput.isVisible().catch(() => false);
    return !usernameVisible && /#\/[a-z]{2}\/dashboard/i.test(this.page.url());
  }

  /**
   * Solves the reCAPTCHA v2 checkbox inside the anchor iframe.
   * Clicks #recaptcha-anchor and waits for aria-checked="true".
   * @private
   */
  async _solveCaptcha() {
    const captchaFrame = this.page.frameLocator('iframe[title="reCAPTCHA"]');
    const checkbox = captchaFrame.locator('#recaptcha-anchor');

    // Already checked? Nothing to do.
    const already = await checkbox.getAttribute('aria-checked').catch(() => 'false');
    if (already === 'true') {
      console.log('reCAPTCHA already checked ✓');
      return;
    }

    await checkbox.click({ force: true }).catch(() => {});

    // Wait up to 5s for aria-checked to become "true"
    for (let i = 0; i < 10; i++) {
      await this.page.waitForTimeout(500);
      const checked = await checkbox.getAttribute('aria-checked').catch(() => 'false');
      if (checked === 'true') {
        console.log('reCAPTCHA validated ✓');
        return;
      }
    }

    console.warn('reCAPTCHA checkbox clicked but not yet verified — proceeding.');
  }

  /**
   * Some accounts show a popup (e.g. terms / consent) immediately after login.
   * If an "Agree" button is present, click it. This is best-effort and never
   * blocks the flow when no popup appears.
   */
  async dismissPostLoginPopup() {
    // Match an "Agree" / "I Agree" / "Agree & Continue" button by accessible name,
    // falling back to any visible element with that text (e.g. inside a dialog).
    const agreeButton = this.page.getByRole('button', { name: /agree/i }).first()
      .or(this.page.locator('button').filter({ hasText: /agree/i }).first())
      .or(this.page.getByText(/^\s*(I )?Agree\b.*$/i).first());

    const visible = await agreeButton
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (visible) {
      await agreeButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(1000);
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  /**
   * Forces the application language to English. The account may persist a
   * non-English language (e.g. Arabic), which breaks every text-based selector.
   * This normalizes the language via the header language switcher, falling back
   * to rewriting the URL hash from /#/ar/... to /#/en/....
   */
  async ensureEnglish() {
    // Fast check: if the URL already uses the English route, nothing to do.
    const url = this.page.url();
    if (/#\/en(\/|$)/.test(url)) return;

    try {
      // The header language switcher shows the current language code (e.g. "AR").
      const langButton = this.page.locator('button').filter({
        has: this.page.locator('img', { hasText: 'translate' }),
      }).first()
        .or(this.page.getByRole('button', { name: /^(AR|EN|FR)$/i }).first());

      if (await langButton.isVisible().catch(() => false)) {
        await langButton.click({ force: true });
        await this.page.waitForTimeout(1000);
        // Pick the English option from the opened menu.
        const englishOption = this.page.getByText(/^\s*(English|EN|الإنجليزية)\s*$/i).first();
        if (await englishOption.isVisible().catch(() => false)) {
          await englishOption.click({ force: true });
          await this.page.waitForLoadState('networkidle').catch(() => {});
          await this.page.waitForTimeout(1500);
        }
      }
    } catch {
      // Ignore — fall through to the URL rewrite below.
    }

    // Fallback: if still not English, rewrite the hash route to /#/en/.
    const current = this.page.url();
    if (!/#\/en(\/|$)/.test(current) && /#\/[a-z]{2}(\/|$)/i.test(current)) {
      const fixed = current.replace(/#\/[a-z]{2}(\/|$)/i, '#/en$1');
      await this.page.goto(fixed).catch(() => {});
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(1500);
    }
  }
}

module.exports = { LoginPage };
