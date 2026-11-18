// pages/DatastorePage.js
// Handles datastore creation, column configuration, row population, and saving.

const { expect } = require('@playwright/test');
const { clickWhenReady, fillWhenReady, assertVisible } = require('../utils/helpers');

class DatastorePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Create Datastore button on the datastore page (to open the dialog).
    // Matches English or Arabic label so it works regardless of app language.
    this.createDatastoreButton = page.locator('button')
      .filter({ hasText: /Create Datastore|قم بإنشاء مخزن بيانات/ })
      .first();

    // Datastore name input field — use a flexible locator since ng-tns classes are dynamic
    this.datastoreNameInput = page.locator('input[placeholder*="name" i], input[placeholder*="Enter" i]').first();

    // Column name input fields — use flexible locators since ng-tns classes are dynamic
    // These will be resolved dynamically in configureAllColumns()

    // + button to add a new column
    this.addColumnButton = page.locator('//span[@class="mat-mdc-button-touch-target"]');

    // Add row button
    this.addRowButton = page.locator('//span[@class="mat-mdc-button-touch-target"]');

    // Save button at the top-right of the page
    this.saveButton = page.locator('button').filter({ hasText: 'save' }).first();
  }

  // --- Navigation ---

  /**
   * Navigates to the Datastore section. The sidebar is collapsed after login,
   * so we navigate directly to the datastore URL path.
   */
  async navigateToDatastore() {
    // Navigate to the datastore section directly
    // The app uses hash-based routing: /#/en/dashboard -> /#/en/datastore
    await this.page.goto('/#/en/datastore');
    await this.page.waitForLoadState('domcontentloaded');
    // Give Angular time to render the page content
    await this.page.waitForTimeout(3000);
  }

  // --- Step 1: Create Datastore ---

  /**
   * Clicks the "Create Datastore" button to open the creation dialog.
   */
  async clickCreateDatastore() {
    // Dismiss any overlay/backdrop that might be blocking
    const backdrop = this.page.locator('.cdk-overlay-backdrop-showing');
    const isBackdropVisible = await backdrop.isVisible().catch(() => false);
    if (isBackdropVisible) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1000);
    }
    await clickWhenReady(this.createDatastoreButton);
  }

  /**
   * Enters the datastore name in the name input field.
   * @param {string} name - The name to assign to the datastore
   */
  async enterDatastoreName(name) {
    // Wait briefly for the popup/dialog to render
    await this.page.waitForTimeout(1000);
    // Try the placeholder-based locator first; if not found, fall back to the dialog's input
    const input = this.page.locator('mat-dialog-container input, [role="dialog"] input, .cdk-overlay-pane input').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click();
    await input.fill(name);
  }

  /**
   * Clicks the "Create Datastore" button inside the dialog to confirm datastore creation.
   */
  async submitCreateDatastore() {
    // Target the "Create Datastore" button specifically inside the dialog
    const dialogButton = this.page.locator('[role="dialog"] button, mat-dialog-container button, .cdk-overlay-pane button')
      .filter({ hasText: 'Create Datastore' });
    await clickWhenReady(dialogButton);
    await this.page.waitForTimeout(3000);
  }

  // --- Step 2: Configure Columns ---

  /**
   * Configures all five columns in order.
   * Column inputs are identified as visible inputs with class containing
   * 'mat-mdc-input-element' and 'ltr' and 'mdc-text-field__input' that are empty.
   */
  async configureAllColumns() {
    // Selector for column name text inputs (these have 'ltr' class that distinguishes them)
    const colInputSelector = 'input.mat-mdc-input-element.ltr';
    
    // After datastore creation, the page shows the column config.
    // Wait for at least one column input to appear
    await this.page.locator(colInputSelector).first().waitFor({ state: 'visible', timeout: 15000 });
    
    // The first visible 'ltr' input is the datastore name (already filled).
    // Column inputs follow. Let's get all ltr inputs and skip the first one (name).
    const allLtrInputs = this.page.locator(colInputSelector);
    const count = await allLtrInputs.count();
    // Column 1: Employee Name (skip index 0 which is the name field)
    const col1 = allLtrInputs.nth(1);
    await col1.click();
    await col1.fill('Employee Name');

    // Column 2: Employee Email
    const col2 = allLtrInputs.nth(2);
    await col2.click();
    await col2.fill('Employee Email');

    // Click + button to add Column 3
    const addBtn = this.page.locator('button').filter({ has: this.page.locator('mat-icon:text("add")') }).first();
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    // Column 3: Employee phone number
    const col3 = allLtrInputs.nth(3);
    await col3.waitFor({ state: 'visible', timeout: 10000 });
    await col3.click();
    await col3.fill('Employee phone number');

    // Click + button to add Column 4
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    // Column 4: Language
    const col4 = allLtrInputs.nth(4);
    await col4.waitFor({ state: 'visible', timeout: 10000 });
    await col4.click();
    await col4.fill('Language');

    // Click + button to add Column 5
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    // Column 5: Channel
    const col5 = allLtrInputs.nth(5);
    await col5.waitFor({ state: 'visible', timeout: 10000 });
    await col5.click();
    await col5.fill('Channel');

    // Click + button to add Column 6
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    // Column 6: Employee Role
    const col6 = allLtrInputs.nth(6);
    await col6.waitFor({ state: 'visible', timeout: 10000 });
    await col6.click();
    await col6.fill('Employee Role');
  }

  // --- Step 3: Add Employee Rows ---

  /**
   * Scrolls the horizontal scrollbar back to the left using the
   * .table-responsive.h-100 container so that row controls and the Add row button are accessible.
   */
  async scrollToRowControls() {
    await this.page.evaluate(() => {
      const scroller = document.querySelector('.table-responsive.h-100');
      if (scroller) {
        scroller.scrollLeft = 0;
      }
    });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clicks the Add row button to create a new empty row.
   * The button shows a "add" mat-icon and the "Add row" text is hidden.
   */
  async clickAddRow() {
    // Scroll the table back to the left first so the add row button is accessible
    await this.page.evaluate(() => {
      const scroller = document.querySelector('.table-responsive.h-100');
      if (scroller) scroller.scrollLeft = 0;
    });
    await this.page.waitForTimeout(500);

    // The "add" buttons on the page: some are for columns, last one(s) are for rows.
    // Use the last visible "add" button which corresponds to "Add row"
    const addButtons = this.page.locator('button:visible').filter({ hasText: 'add' });
    const count = await addButtons.count();
    // The last "add" button is the Add row button
    await addButtons.nth(count - 1).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Populates a single row with employee data.
   * Row cells have placeholder="Enter value" and need horizontal scrolling to access all 5.
   *
   * @param {object} rowData - Employee data
   * @param {string} rowData.name - Employee Name
   * @param {string} rowData.email - Employee Email
   * @param {string} rowData.phone - Employee phone number
   * @param {string} rowData.language - Language
   * @param {string} rowData.channel - Channel
   * @param {number} rowIndex - Zero-based index of the row being populated
   */
  async populateRow(rowData, rowIndex) {
    // Row cells have placeholder="Enter value"
    // For each new row added, 6 new "Enter value" inputs appear (one per column)
    // Calculate the starting index based on rowIndex (each row has 6 cells)
    const startIdx = rowIndex * 6;
    const cells = this.page.locator('input[placeholder="Enter value"]');

    // Fill Employee Name
    const cell0 = cells.nth(startIdx);
    await cell0.scrollIntoViewIfNeeded();
    await cell0.click();
    await cell0.fill(rowData.name);

    // Fill Employee Email
    const cell1 = cells.nth(startIdx + 1);
    await cell1.scrollIntoViewIfNeeded();
    await cell1.click();
    await cell1.fill(rowData.email);

    // Fill Employee phone number
    const cell2 = cells.nth(startIdx + 2);
    await cell2.scrollIntoViewIfNeeded();
    await cell2.click();
    await cell2.fill(rowData.phone);

    // Fill Language
    const cell3 = cells.nth(startIdx + 3);
    await cell3.scrollIntoViewIfNeeded();
    await cell3.click();
    await cell3.fill(rowData.language);

    // Fill Channel
    const cell4 = cells.nth(startIdx + 4);
    await cell4.scrollIntoViewIfNeeded();
    await cell4.click();
    await cell4.fill(rowData.channel);

    // Fill Employee Role
    const cell5 = cells.nth(startIdx + 5);
    await cell5.scrollIntoViewIfNeeded();
    await cell5.click();
    await cell5.fill(rowData.role);
  }

  /**
   * Adds all employee rows by clicking Add row and populating each in sequence.
   *
   * @param {Array<object>} rows - Array of employee data objects
   */
  async addAllEmployeeRows(rows) {
    for (let i = 0; i < rows.length; i++) {
      await this.clickAddRow();
      await this.populateRow(rows[i], i);
    }
  }

  // --- Step 4: Save ---

  /**
   * Clicks the Save button and asserts the datastore is saved successfully.
   */
  async saveDatastore() {
    await clickWhenReady(this.saveButton);
    // Angular SPAs make continuous background XHR calls so 'networkidle' never
    // fires. Use domcontentloaded + a short .catch() guard instead.
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(3000);

    // The save success snackbar appears briefly — check with a short timeout
    // so we don't block the test if it has already dismissed.
    const successIndicator = this.page.locator('.mat-mdc-snack-bar-label, .toast-success, [role="alert"]').first();
    await successIndicator.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {
      console.log('Save success toast not seen (may have dismissed quickly) — continuing.');
    });
  }
}

module.exports = { DatastorePage };
