// pages/AnswerExtensionPage.js
// Handles Answer Extension creation, configuration, and saving.

const { expect } = require('@playwright/test');
const { clickWhenReady, fillWhenReady, assertVisible } = require('../utils/helpers');

class AnswerExtensionPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Answer Extension option on the survey card
    this.answerExtensionOption = page.getByText('Answer Extension ');

    // Create Answer Extension button
    this.createAnswerExtensionButton = page.getByRole('button', { name: 'Create Answer Extension' });

    // Enter Title field — use label/placeholder-based locator since #mat-input-8 is dynamic
    this.titleInput = page.getByLabel('Enter Title').or(page.locator('input[placeholder*="Title" i], input[placeholder*="Enter" i]').first());

    // Next button
    this.nextButton = page.getByRole('button', { name: 'Next' });

    // Save button
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  // --- Step 3: Open Survey Options and Select Answer Extension ---

  /**
   * Navigates back to the survey list, opens the survey card options pane,
   * and clicks the "Answer Extension" option.
   */
  async clickAnswerExtension() {
    // After translations or other steps, the page may be on a different view.
    // Navigate back to the survey list first.
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(1000);

    // Check if we're already on the survey list with options pane open
    let answerExtVisible = await this.answerExtensionOption.isVisible().catch(() => false);

    if (!answerExtVisible) {
      // We're not on the survey list — navigate there
      await this.page.goto('/#/en/dashboard').catch(() => {});
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(3000);

      // The options pane is opened by clicking the "more_vert" (three dots) icon
      // on the survey card — NOT the card body (which opens the editor).
      // Find the first more_vert icon (newest survey card) and click it.
      const moreVertIcon = this.page.getByText('more_vert').first()
        .or(this.page.locator('[alt="more_vert"]').first())
        .or(this.page.locator('mat-icon').filter({ hasText: 'more_vert' }).first());

      await moreVertIcon.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await moreVertIcon.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(2500);
    }

    // Now click the "Answer Extension" option
    await this.answerExtensionOption.waitFor({ state: 'visible', timeout: 15000 });
    await clickWhenReady(this.answerExtensionOption);
    await this.page.waitForTimeout(1000);
  }

  // --- Step 4: Create the Answer Extension ---

  /**
   * Clicks the "Create Answer Extension" button.
   */
  async clickCreateAnswerExtension() {
    await clickWhenReady(this.createAnswerExtensionButton);
    await this.page.waitForTimeout(1000);
  }

  // --- Step 5: Enter the Answer Extension Title ---

  /**
   * Focuses the title input and enters the Answer Extension title.
   * @param {string} title - The title for the Answer Extension
   */
  async enterTitle(title) {
    // Try label-based locator first, fallback to visible text input in the form
    let input = this.titleInput;
    const isVisible = await input.isVisible().catch(() => false);
    
    if (!isVisible) {
      // Fallback: find the visible text input on the Answer Extension creation form
      input = this.page.locator('input.mat-mdc-input-element.ltr').last();
    }
    
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.click();
    await input.fill(title);
  }

  // --- Step 6: Select the Datastore ---

  /**
   * Clicks the Select Datastores field and selects the specified datastore.
   * @param {string} datastoreName - The name of the datastore to select
   */
  async selectDatastore(datastoreName) {
    // Click the Select Datastores dropdown/field
    const selectDatastoresField = this.page.getByText('Select Datastores', { exact: false }).first();
    await clickWhenReady(selectDatastoresField);
    await this.page.waitForTimeout(1000);

    // Select the datastore by its name
    const datastoreOption = this.page.getByText(datastoreName, { exact: false }).first();
    await clickWhenReady(datastoreOption);
    await this.page.waitForTimeout(500);
  }

  // --- Step 7: Select Labels ---

  /**
   * Clicks the Select Label field, checks "Select All", and closes the panel.
   */
  async selectAllLabels() {
    // Click the Select Label field
    const selectLabelField = this.page.getByText('Select Label', { exact: false }).first();
    await clickWhenReady(selectLabelField);
    await this.page.waitForTimeout(1000);

    // Check "Select All"
    const selectAllOption = this.page.getByText('Select All', { exact: false }).first();
    await clickWhenReady(selectAllOption);
    await this.page.waitForTimeout(500);

    // Close the label-selection panel by clicking outside or pressing Escape
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  // --- Step 8: Configure Answer Matching ---

  /**
   * Configures the answer matching:
   * - Click "Match answer for the label"
   * - Select "Submitted By"
   * - Click "Match Label"
   * - Select "Employee Email"
   */
  async matchAnswerForLabel() {
    // Click "Match answer for the label"
    const matchAnswerBtn = this.page.getByText('Match answer', { exact: false }).first();
    await clickWhenReady(matchAnswerBtn);
    await this.page.waitForTimeout(1000);

    // Select "Submitted By" from the dropdown
    const submittedByOption = this.page.getByText('Submitted By', { exact: false }).first();
    await clickWhenReady(submittedByOption);
    await this.page.waitForTimeout(1000);

    // Dismiss any open overlay/backdrop by pressing Escape or clicking the backdrop
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    // Click "Match Label"
    const matchLabelBtn = this.page.getByText('Match Label', { exact: false }).first();
    await clickWhenReady(matchLabelBtn);
    await this.page.waitForTimeout(1000);

    // Select "Employee Email" from the dropdown options
    // Use getByRole('option') or look within the overlay panel
    const employeeEmailOption = this.page.locator('.cdk-overlay-pane, .mat-mdc-select-panel, [role="listbox"]')
      .locator('text=Employee Email').first();
    const isOptionVisible = await employeeEmailOption.isVisible().catch(() => false);
    
    if (isOptionVisible) {
      await employeeEmailOption.click();
    } else {
      // Fallback: try clicking by exact text within mat-option
      const option = this.page.locator('mat-option').filter({ hasText: 'Employee Email' }).first();
      await option.click();
    }
    await this.page.waitForTimeout(500);
  }

  // --- Step 9: Save the Answer Extension ---

  /**
   * Clicks the Next button.
   */
  async clickNext() {
    await clickWhenReady(this.nextButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clicks Save and asserts the Answer Extension is created successfully.
   */
  async saveAnswerExtension() {
    await clickWhenReady(this.saveButton);
    await this.page.waitForTimeout(2000);

    // Assert that a success indicator is visible after save
    const successIndicator = this.page.locator('.mat-mdc-snack-bar-label, .toast-success, [role="alert"]').first();
    await assertVisible(successIndicator, 'Answer Extension save confirmation not visible');
  }
}

module.exports = { AnswerExtensionPage };
