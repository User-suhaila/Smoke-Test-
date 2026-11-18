// pages/SurveyPreviewPage.js
// Handles survey preview (opens in new tab), answering questions, and submission.

const { expect } = require('@playwright/test');
const { clickWhenReady, fillWhenReady, assertVisible } = require('../utils/helpers');

class SurveyPreviewPage {
  /**
   * @param {import('@playwright/test').Page} page - The NEW TAB page containing the survey preview
   */
  constructor(page) {
    this.page = page;

    // Submit button.
    // The published survey renders a nav button whose label span has class
    // "snt-stage__nav-btn-label". We click the containing <button> element.
    // Fallbacks cover the survey-builder preview and any older renders.
    this.submitButton = page.locator('button.snt-stage__nav-btn--submit')
      .or(page.locator('button:has(.snt-stage__nav-btn-label)').filter({ hasText: /submit/i }))
      .or(page.locator('.snt-stage__nav-btn-label').filter({ hasText: /submit/i }).locator('xpath=ancestor::button[1]'))
      .or(page.locator('#submit-btn-div'))
      .or(page.getByRole('button', { name: /^\s*submit\s*$/i }))
      .or(page.locator('button').filter({ hasText: /^\s*submit\s*$/i }))
      .first();

    // Success message after submission
    this.successMessage = page.getByText(/thank you|submitted|success|completed/i)
      .or(page.locator('mat-snack-bar-container, [role="alert"], [class*="success"]').first());
  }

  /**
   * Asserts that the preview page has loaded by checking the submit button is visible.
   */
  async assertPreviewVisible() {
    await expect(this.submitButton).toBeVisible({ timeout: 15000 });
  }

  /**
   * Selects a radio button option by its label text (for Single Select questions).
   * @param {string} optionText - The option label text to select
   */
  async selectRadioOption(optionText) {
    // Published preview uses option cards. Older previews still use mat-radio-button.
    const option = this.page
      .locator('button.sntss__card, mat-radio-button')
      .filter({ hasText: optionText, visible: true })
      .first();
    await option.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verifies that a question is visible on the preview page.
   * @param {string} questionText - The question text to check
   * @returns {boolean} - Whether the question is visible
   */
  async isQuestionVisible(questionText) {
    const question = this.page.getByText(questionText);
    return await question.isVisible().catch(() => false);
  }

  /**
   * Asserts that a question IS visible on the preview page.
   * @param {string} questionText - The question text that should be visible
   */
  async assertQuestionVisible(questionText) {
    const question = this.page.getByText(questionText);
    await expect(question).toBeVisible({ timeout: 5000 });
  }

  /**
   * Asserts that a question is NOT visible on the preview page.
   * @param {string} questionText - The question text that should NOT be visible
   */
  async assertQuestionNotVisible(questionText) {
    const question = this.page.getByText(questionText);
    await expect(question).not.toBeVisible({ timeout: 3000 });
  }

  /**
   * Selects checkboxes (mat-checkbox) for a Multi Select question.
   * Clicks the first N checkboxes visible after the question text.
   * @param {string} questionText - The question to find checkboxes for
   * @param {number} [count=2] - Number of checkboxes to select
   */
  async selectMultiSelectOptions(questionText, count = 2) {
    // Find all mat-checkbox elements on the page
    const checkboxes = this.page.locator('button.sntms__card, mat-checkbox').filter({ visible: true });
    const total = await checkboxes.count();
    // Click up to 'count' checkboxes
    const toSelect = Math.min(count, total);
    for (let i = 0; i < toSelect; i++) {
      await checkboxes.nth(i).click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Selects a specific checkbox option by its text label.
   * @param {string} optionText - The checkbox label text
   */
  async selectCheckbox(optionText) {
    const checkbox = this.page
      .locator('button.sntms__card, mat-checkbox')
      .filter({ hasText: optionText, visible: true })
      .first();
    await checkbox.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Selects a rating value (1-10) in the SVG rating control.
   * @param {number} [value=5] - Rating value to select (1-10). Default: 5
   */
  async selectRating(value = 5) {
    // Published preview uses star buttons. Older previews use the SVG rating containers.
    const ratingOptions = this.page
      .locator('button.sntr__star-btn, div.sp-rating-control-svg-container')
      .filter({ visible: true });
    await ratingOptions.nth(value - 1).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Clicks the Submit button.
   */
  async submit() {
    await clickWhenReady(this.submitButton);
  }

  /**
   * Asserts submission was successful.
   */
  async assertSubmissionSuccess() {
    await this.page.waitForLoadState('networkidle').catch(() => {});
    const successVisible = await this.successMessage.isVisible().catch(() => false);
    if (!successVisible) {
      await expect(this.submitButton).not.toBeVisible({ timeout: 10000 });
    }
  }

  /**
   * Closes the preview tab.
   */
  async close() {
    await this.page.close();
  }
}

module.exports = { SurveyPreviewPage };
