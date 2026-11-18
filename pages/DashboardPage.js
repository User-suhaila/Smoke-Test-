// pages/DashboardPage.js
// Handles post-login dashboard interactions for the survey automation framework.

const { expect } = require('@playwright/test');
const { clickWhenReady } = require('../utils/helpers');

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // "Create a new form" button
    this.createNewFormButton = page.getByText('Create a new form', { exact: true });

    // "Create Survey" button in the dialog footer
    this.createSurveyInFolderButton = page.locator('.mdc-button__label').filter({ hasText: /create survey/i });
  }

  /**
   * Asserts that the dashboard is visible after a successful login.
   */
  async assertDashboardVisible() {
    await expect(this.page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    await expect(this.createNewFormButton).toBeVisible({ timeout: 15000 });
  }

  /**
   * Clicks "Create a new form" to open the type-chooser dialog.
   * After this returns, the dialog with "Do it Yourself" / "Use a Template" /
   * "GENFORMS AI Agent" cards is visible — the caller then selects a type.
   */
  async clickCreateNewForm() {
    await clickWhenReady(this.createNewFormButton);
    await this.page.waitForTimeout(1500);

    // Wait for the type-chooser dialog to be visible
    const doItYourself = this.page.locator('.cft-title').filter({ hasText: 'Do it Yourself' });
    await doItYourself.waitFor({ state: 'visible', timeout: 10000 });
  }
}

module.exports = { DashboardPage };
