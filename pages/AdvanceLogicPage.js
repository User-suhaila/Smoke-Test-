
// pages/AdvanceLogicPage.js
// Handles Advance Logic configuration from the Survey Card Panel.
// Flow: Open Advance Logic → Create → Configure rules (question, condition, employee, action, target question, role)

const { expect } = require('@playwright/test');
const { clickWhenReady } = require('../utils/helpers');

class AdvanceLogicPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // "Advance Logic" side button on the survey card panel (element ID: validation_sidebtn)
    this.advanceLogicButton = page.locator('#validation_sidebtn');

    // "Create new rule sets" button — adds a new rule set after configuring one
    this.createNewRuleSetsButton = page.getByRole('button', { name: /Create new rule sets/i });

    // "Save Advance Logic" button
    this.saveAdvanceLogicButton = page.getByRole('button', { name: /Save Advance Logic/i });
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * After Answer Extension is saved, navigates back to the survey list via breadcrumbs,
   * then selects Advance Logic from the survey card panel.
   */
  async openAdvanceLogic() {
    // Click the "Surveys" breadcrumb link to go back to surveys list
    const surveysBreadcrumb = this.page.locator('a').filter({ hasText: /Surveys/i });
    await clickWhenReady(surveysBreadcrumb);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);

    // Click the Advance Logic button on the survey card panel
    await clickWhenReady(this.advanceLogicButton);
    await this.page.waitForTimeout(2000);
  }

  /**
   * Clicks "Create Advance Logic" button to start configuring rules.
   */
  async clickCreateAdvanceLogic() {
    // The "Create Advance Logic" button appears on the Advance Logic page
    const createBtn = this.page.getByRole('button', { name: /Create Advance Logic/i });
    await clickWhenReady(createBtn);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  // ---------------------------------------------------------------------------
  // Rule Configuration
  // ---------------------------------------------------------------------------

  /**
   * Configures a single advance logic rule.
   *
   * Based on page snapshot, the UI uses:
   * - combobox "Choose your questions" with option role elements like "Survey field Employee Name"
   * - combobox "Choose your condition" (disabled until question is selected)
   * - textbox "Input" for the condition value
   * - combobox "Choose action" for the action
   * - combobox "Questions" for the target question
   *
   * @param {object} rule - Rule configuration
   * @param {string} rule.questionField - The question to base the condition on (e.g., 'Employee Name')
   * @param {string} rule.condition - The condition type (e.g., 'Equals to')
   * @param {string} rule.employee - The employee name to match
   * @param {string} rule.action - The action to perform (e.g., 'Select Options')
   * @param {string} rule.targetQuestion - The target question (e.g., 'What is your role?')
   * @param {string} rule.role - The role option to select
   */
  async configureRule({ questionField, condition, employee, action, targetQuestion, role }) {
    // 1. Choose your questions — click the combobox to open, then select the option
    const chooseQuestionCombo = this.page.getByRole('combobox', { name: 'Choose your questions' });
    await chooseQuestionCombo.click({ force: true });
    await this.page.waitForTimeout(1000);

    // Options are labeled like "Survey field Employee Name" — select by the field name
    const questionOption = this.page.getByRole('option').filter({ hasText: questionField });
    await questionOption.click();
    await this.page.waitForTimeout(1000);

    // 2. Choose your condition — now enabled after question selection
    const chooseConditionCombo = this.page.getByRole('combobox', { name: 'Choose your condition' });
    await chooseConditionCombo.click({ force: true });
    await this.page.waitForTimeout(1000);

    const conditionOption = this.page.getByRole('option', { name: new RegExp(`^${condition}`) });
    await conditionOption.click();
    await this.page.waitForTimeout(1000);

    // 3. Select the employee from the Options dropdown
    const optionsCombo = this.page.getByRole('combobox', { name: /Options/i });
    await optionsCombo.click({ force: true });
    await this.page.waitForTimeout(1000);

    const employeeOption = this.page.getByRole('option').filter({ hasText: employee });
    await employeeOption.click();
    await this.page.waitForTimeout(500);
    // Close dropdown
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);

    // 4. Choose action — select "Select Options"
    const chooseActionCombo = this.page.getByRole('combobox', { name: 'Choose action' });
    await chooseActionCombo.click({ force: true });
    await this.page.waitForTimeout(1000);

    const actionOption = this.page.getByRole('option', { name: new RegExp(`^${action}`, 'i') });
    await actionOption.click();
    await this.page.waitForTimeout(1000);

    // 5. Select the target question from "Questions" combobox
    const questionsCombo = this.page.getByRole('combobox', { name: 'Questions', exact: true });
    await questionsCombo.click({ force: true });
    await this.page.waitForTimeout(1000);

    const targetQuestionOption = this.page.getByRole('option').filter({ hasText: targetQuestion });
    await targetQuestionOption.click();
    await this.page.waitForTimeout(1000);

    // 6. Select the role option — after selecting the target question, 
    // an Options dropdown appears in the Actions section for selecting the role value
    // Wait for it to appear, then select the role
    await this.page.waitForTimeout(2000);
    
    // The Options dropdown in Actions section is the LAST one on the page
    // (the first one is in the Rule section for employees)
    const roleOptionsCombo = this.page.getByRole('combobox', { name: /Options/i }).last();
    await roleOptionsCombo.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const hasRoleOptionsCombo = await roleOptionsCombo.isVisible().catch(() => false);
    if (hasRoleOptionsCombo) {
      await roleOptionsCombo.click({ force: true });
      await this.page.waitForTimeout(1000);

      const roleOption = this.page.getByRole('option').filter({ hasText: role });
      await roleOption.click();
      await this.page.waitForTimeout(500);
    }

    // Close any open dropdown
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Clicks "Create new rule sets" to add another rule set.
   */
  async clickCreateNewRuleSets() {
    await clickWhenReady(this.createNewRuleSetsButton);
    await this.page.waitForTimeout(2000);
  }

  /**
   * Saves the Advance Logic configuration.
   */
  async saveAdvanceLogic() {
    const saveBtn = this.page.getByRole('button', { name: /Save Advance Logic/i }).first();
    await clickWhenReady(saveBtn);
    await this.page.waitForTimeout(3000);
  }

  /**
   * Configures all advance logic rules from the provided data.
   * After each rule (except the last), clicks "Create new rule sets".
   * After the last rule, saves the advance logic.
   *
   * @param {object} data - The advance logic data object
   * @param {string} data.questionField - Question field for condition
   * @param {string} data.condition - Condition type
   * @param {string} data.action - Action to perform
   * @param {string} data.targetQuestion - Target question for action
   * @param {Array<{employee: string, role: string}>} data.rules - Array of employee-to-role mappings
   */
  async configureAllRules(data) {
    const { questionField, condition, action, targetQuestion, rules } = data;

    for (let i = 0; i < rules.length; i++) {
      const { employee, role } = rules[i];

      await this.configureRule({
        questionField,
        condition,
        employee,
        action,
        targetQuestion,
        role,
      });

      // After each rule (except the last), click "Create new rule sets"
      if (i < rules.length - 1) {
        await this.clickCreateNewRuleSets();
      }
    }

    // Save after all rules are configured
    await this.saveAdvanceLogic();
  }
}

module.exports = { AdvanceLogicPage };
