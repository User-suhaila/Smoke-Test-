// pages/LogicPage.js
// Handles survey logic configuration — adding conditional rules based on question answers.

const { expect } = require('@playwright/test');
const { clickWhenReady } = require('../utils/helpers');

class LogicPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // "Next" button — FAB button with aria description "Next"
    // Distinguished from the collapsible sidebar button by aria-describedby
    this.nextButton = page.getByRole('button', { description: 'Next', exact: true });

    // Question dropdown to select which question to add logic for
    this.questionDropdown = page.locator('#Add_logic_qn');

    // "Add question to logic" button
    this.addQuestionToLogicButton = page.locator('#Add_logic_btn');

    // Done (checkmark) button — confirms the logic configuration
    this.doneButton = page.locator('button').filter({ 
      has: page.locator('mat-icon', { hasText: 'done' }) 
    });
  }

  /**
   * Navigates to the Logic tab.
   */
  async navigateToLogic() {
    // Scroll to top and dismiss overlays before clicking Next
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    // Click the keyboard_arrow_right button (Next)
    await this.nextButton.click({ force: true });
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /**
   * Selects a question from the dropdown and clicks "Add question to logic".
   * @param {string} questionTitle - The question text to select
   */
  async addQuestionToLogic(questionTitle) {
    // Open the question dropdown
    await this.questionDropdown.click({ force: true });
    await this.page.waitForTimeout(500);
    // Select the question by text
    const option = this.page.locator('mat-option').filter({ hasText: questionTitle });
    await option.click();
    await this.page.waitForTimeout(500);
    // Click "Add question to logic" button
    await clickWhenReady(this.addQuestionToLogicButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Configures a logic rule row.
   * @param {number} cardIndex - The card index (0-based)
   * @param {number} rowIndex - The row index within the card (0-based)
   * @param {object} rule - Rule configuration
   * @param {string} rule.value - The answer value to match (e.g., "Developer")
   * @param {string[]} rule.questions - Array of question titles to show/hide
   * @param {string} [rule.when='Equal to'] - When condition (default: "Equal to")
   * @param {string} [rule.action='Show'] - Action (default: "Show")
   */
  async configureRule(cardIndex, rowIndex, rule) {
    const { value, questions, when = 'Equal to', action = 'Show' } = rule;

    // 1. "When answer is" dropdown — ALWAYS select explicitly
    const whenDropdown = this.page.locator(`#logic_opt_when_${cardIndex}_${rowIndex}`);
    await whenDropdown.click({ force: true });
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: when, exact: true }).click();
    await this.page.waitForTimeout(300);

    // 2. "Choose value" dropdown — select the answer value
    const valueDropdown = this.page.locator(`#logic_opt_equals_${cardIndex}_${rowIndex}`);
    await valueDropdown.click({ force: true });
    await this.page.waitForTimeout(500);
    const valueOption = this.page.locator('mat-option').filter({ hasText: value });
    await valueOption.click();
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);

    // 3. "Action" dropdown — ALWAYS select explicitly
    const actionDropdown = this.page.locator(`#logic_opt_action_${cardIndex}_${rowIndex}`);
    await actionDropdown.click({ force: true });
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: action, exact: true }).click();
    await this.page.waitForTimeout(300);

    // 4. "Questions" dropdown — select target questions (multi-select)
    const questionsDropdown = this.page.locator(`#logic_opt_questions_${cardIndex}_${rowIndex}`);
    await questionsDropdown.click({ force: true });
    await this.page.waitForTimeout(500);
    for (const q of questions) {
      const qOption = this.page.locator('mat-option').filter({ hasText: q });
      await qOption.scrollIntoViewIfNeeded().catch(() => {});
      await qOption.click({ force: true });
      await this.page.waitForTimeout(300);
    }
    // Close the dropdown by pressing Escape and clicking away
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
    // Click on a neutral area to ensure focus is released
    await this.page.locator('body').click({ position: { x: 10, y: 10 }, force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks the "Add row" button to add another logic condition row to the current card.
   * @param {number} cardIndex - The card index (0-based)
   */
  async addRow(cardIndex) {
    const addRowBtn = this.page.locator(`#Add_row_logic_btn_${cardIndex}`);
    // Dismiss any open overlays/dropdowns first
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    // Click elsewhere to deactivate any focused field
    await this.page.locator('body').click({ position: { x: 10, y: 10 }, force: true });
    await this.page.waitForTimeout(300);
    // Scroll the add row button into view and click
    await addRowBtn.scrollIntoViewIfNeeded().catch(() => {});
    await addRowBtn.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks the Done (checkmark) button to confirm the logic configuration.
   */
  async clickDone() {
    await clickWhenReady(this.doneButton);
    await this.page.waitForTimeout(500);
  }
}

module.exports = { LogicPage };
