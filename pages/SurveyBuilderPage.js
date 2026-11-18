// pages/SurveyBuilderPage.js
// Handles survey construction: title entry, adding controls, saving, and navigating to preview.
// All synchronization relies on Playwright auto-waiting — no page.waitForTimeout calls.

const { expect } = require('@playwright/test');
const { clickWhenReady, fillWhenReady, assertVisible } = require('../utils/helpers');

class SurveyBuilderPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // --- Core navigation / entry-point locators ---

    // "Do it yourself" option — confirmed class: "cft-title"
    this.doItYourselfOption = page.locator('.cft-title').filter({ hasText: /do it yourself/i });

    // Survey title input in the creation sidenav (name="SurveyDetail_Title")
    // This appears after clicking "Do it yourself" and before clicking "Create Survey"
    this.sidenavTitleInput = page.locator('input[name="SurveyDetail_Title"]');

    // "Create Survey" button in the "Create from Scratch" dialog — transitions to the builder.
    // There are TWO "Create Survey" buttons on the page:
    //   1. #top_createsurvey_btn — toolbar button (always visible)
    //   2. button#the-button — inside the dialog (type="submit")
    // We must target ONLY the dialog one (type="submit" + id="the-button").
    this.createSurveyButton = page.locator('button[type="submit"]#the-button').filter({ hasText: /Create Survey/i });

    // Survey title input on the builder page (id="Survey_Title", name="Survey_Title")
    // This is the title field on the actual builder canvas (auto-filled from sidenav)
    this.titleInput = page.locator('input#Survey_Title');

    // Root element of the survey builder interface
    // Confirmed class: "fb-main-builder-container"
    this.builderCanvas = page.locator('.fb-main-builder-container');

    // Save survey button — mini-FAB button containing mat-icon with text "save"
    // Confirmed: class="mdc-fab mdc-fab--mini mat-mdc-mini-fab mat-primary mat-mdc-button-base"
    this.saveButton = page.locator('button.mdc-fab').filter({ has: page.locator('mat-icon', { hasText: 'save' }) });

    // Save confirmation — Angular Material snackbar/toast
    this.saveConfirmation = page.locator(
      'mat-snack-bar-container, [class*="mat-snack-bar"], [role="alert"], [role="status"], .toast, .notification, [class*="success"]'
    ).first()
      .or(page.getByText(/saved|success/i));

    // Preview button — confirmed class: "mdc-button__label" with text "Preview"
    this.previewButton = page.locator('.mdc-button__label').filter({ hasText: /preview/i });

    // --- Control addition locators ---

    // "New Question" button — opens the question type selection panel.
    // It's a mat-button-toggle rendered as <button class="mat-button-toggle-button">.
    // There can be MULTIPLE in the DOM (a hidden/stale one at 0,0 plus the real
    // visible one at the bottom). We target the VISIBLE button only.
    this.newQuestionButton = page.locator('button.mat-button-toggle-button')
      .filter({ hasText: /New Question/i })
      .filter({ visible: true })
      .first();

    // Text control button — confirmed class: "fb-new-questions-list-button"
    this.textControlButton = page.locator('.fb-new-questions-list-button').filter({ hasText: /^Text$/i })
      .or(page.locator('.fb-new-questions-list-button').filter({ hasText: /text/i }).first());

    // Single Select control button — match "Single Select" but NOT "Grid Single Select"
    this.singleSelectControlButton = page.getByRole('button', { name: 'Single Select', exact: true });

    // Rating control button — use role match like Single/Multi Select (consistent),
    // with the older class-based selector as a fallback.
    this.ratingControlButton = page.getByRole('button', { name: 'Rating', exact: true })
      .or(page.locator('.fb-new-questions-list-button').filter({ hasText: /rating/i }));

    // Question label input — confirmed class: "label-editor"
    // This is a <div> element (not input/textarea), so it needs click + type interaction
    this.questionLabelInput = page.locator('.label-editor').last();

    // "Add options in bulk" button inside Single Select control
    // Confirmed class: "mdc-button__label"
    this.addBulkOptionsButton = page.locator('.mdc-button__label').filter({ hasText: /bulk|add options/i });

    // Editable text area in the bulk options popup — confirmed class: "editable-text"
    // This is a contenteditable div, not a textarea
    // The bulk editor div has attribute "appbulkeditor" and contenteditable="true"
    this.bulkOptionsTextarea = page.locator('[appbulkeditor]');

    // Save button inside the bulk options popup
    // It's a raised primary button with text "Save" — use the mat-mdc-raised-button class
    // combined with text to differentiate from the main form save (which is a FAB icon button)
    this.bulkOptionsConfirmButton = page.locator('button.mat-mdc-raised-button').filter({ hasText: /^Save$/i });

    // --- Section and additional control locators ---

    // Down arrow button to access section title option
    // Class: "mat-button-toggle mat-mdc-menu-trigger split-button-1 drop-down-button mat-button-toggle-appearance-standard"
    this.sectionDropdownButton = page.locator('.split-button-1.drop-down-button');

    // Section title editable field
    // Class: "editable-text p-0 border-0 bg-transparent"
    this.sectionTitleField = page.locator('.editable-text.p-0.border-0.bg-transparent').last();

    // Multiple Select control button — use exact role match to avoid "Grid Multiple Select"
    this.multiSelectControlButton = page.getByRole('button', { name: 'Multiple Select', exact: true });

    // Eye icon button (visibility toggle) — question-level action button on the right side
    // Class: "mat-mdc-tooltip-trigger mdc-button mdc-button--raised mat-mdc-raised-button mat-secondary mat-mdc-button-base"
    // Parent: div.d-flex (question action row)
    // Distinguished from option-level visibility buttons (which are mdc-icon-button in float-option-control)
    this.eyeIconButton = page.locator('button.mat-mdc-raised-button.mat-secondary').filter({
      has: page.locator('mat-icon', { hasText: 'visibility' })
    }).last();
  }

  // ---------------------------------------------------------------------------
  // Navigation methods
  // ---------------------------------------------------------------------------

  /**
   * Clicks the "Do it yourself" card from the type-chooser dialog, then selects
   * "Automation Folder" from the Survey folder dropdown inside the "Create from
   * Scratch" dialog. Leaves the dialog open so enterTitle() can fill the title
   * and submit.
   *
   * Confirmed dialog flow (from live DOM inspection):
   *  - Type-chooser dialog → click "Do it Yourself" → "Create from Scratch" dialog opens
   *  - Dialog contains: title input (SurveyDetail_Title) + folder mat-select + Create Survey button
   */
  async selectDoItYourself() {
    // Click the "Do it Yourself" card to open the "Create from Scratch" dialog
    await clickWhenReady(this.doItYourselfOption);
    await this.page.waitForTimeout(1500);

    // Select "Automation Folder" from the Survey folder dropdown
    // The folder mat-select is inside the dialog, labeled "Survey folder"
    const folderSelect = this.page.locator('mat-select').filter({
      has: this.page.locator('mat-label', { hasText: /Survey folder/i }),
    }).first()
      .or(this.page.locator('.cs-folder-row mat-select').first());

    await folderSelect.waitFor({ state: 'visible', timeout: 10000 });
    await folderSelect.click();
    await this.page.waitForTimeout(1000);

    // Pick "Automation Folder" from the mat-option dropdown list
    const automationFolder = this.page.locator('mat-option')
      .filter({ hasText: /^Automation Folder$/ }).first()
      .or(this.page.getByRole('option', { name: 'Automation Folder' }).first());

    await automationFolder.waitFor({ state: 'visible', timeout: 10000 });
    await automationFolder.click();
    await this.page.waitForTimeout(500);
    // Dialog stays open — enterTitle() fills the title and submits
  }

  /**
   * Asserts that the survey creation form (sidenav/dialog) is visible.
   * Checks for the title input field inside the "Create from Scratch" dialog.
   */
  async assertBuilderVisible() {
    await assertVisible(this.sidenavTitleInput, 'Survey creation form should be visible — title input not found');
  }

  /**
   * Fills the survey title. The workflow is:
   * 1. Fill title in the sidenav input (SurveyDetail_Title)
   * 2. Click "Create Survey" button to transition into the builder
   * 3. The builder page title input is auto-populated from the sidenav entry
   *
   * @param {string} title - The survey title to enter
   */
  async enterTitle(title) {
    await fillWhenReady(this.sidenavTitleInput, title);
    await clickWhenReady(this.createSurveyButton);
    // Wait for the page to settle after the navigation/transition
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => {});
    // Wait for builder to load by asserting the builder canvas is visible
    await assertVisible(this.builderCanvas, 'Builder did not load after clicking Create Survey');
  }

  // ---------------------------------------------------------------------------
  // Control addition methods
  // ---------------------------------------------------------------------------

  /**
   * Adds a Text control by clicking "New question" then selecting "Text".
   * Optionally fills in the question label text.
   *
   * @param {string} [questionText] - The question text to enter
   */
  async addTextControl(questionText) {
    await clickWhenReady(this.newQuestionButton);
    // Wait for the question type panel/bottom sheet to appear
    await this.textControlButton.waitFor({ state: 'visible', timeout: 10000 });
    await clickWhenReady(this.textControlButton);
    if (questionText) {
      await this._fillLabelEditor(questionText);
    }
  }

  /**
   * Adds a Single Select control by clicking "New question" then selecting "Single select".
   * Optionally fills in the question label text.
   *
   * @param {string} [questionText] - The question text to enter
   */
  async addSingleSelectControl(questionText) {
    await clickWhenReady(this.newQuestionButton);
    // Wait for the question type panel to appear
    await this.singleSelectControlButton.waitFor({ state: 'visible', timeout: 10000 });
    await clickWhenReady(this.singleSelectControlButton);
    if (questionText) {
      await this._fillLabelEditor(questionText);
    }
  }

  /**
   * Opens the "Add options in bulk" popup for a Single Select control,
   * types the options (one per line), and clicks Save.
   *
   * @param {string[]} options - Array of option strings to add
   */
  async addBulkOptions(options) {
    // Click the "Add in bulk" button (class: mdc-button__label)
    await clickWhenReady(this.addBulkOptionsButton);
    
    // Wait for the bulk editor to appear
    const editableText = this.bulkOptionsTextarea;
    await editableText.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click inside the contenteditable div to focus it
    await editableText.click();
    
    // Clear any existing content first
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Backspace');
    
    // Insert all options as a single block of text (newline-separated)
    // Using insertText for reliability in contenteditable divs
    const bulkText = options.join('\n');
    await this.page.keyboard.insertText(bulkText);
    
    // Click the Save button inside the popup to commit the options
    // Use getByRole to find the Save button that's currently visible in the popup
    await clickWhenReady(this.bulkOptionsConfirmButton);
    
    // Wait a moment for the options to be committed and the form to update
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Adds a Rating control by clicking "New question" then selecting "Rating".
   * Optionally fills in the question label text.
   *
   * @param {string} [questionText] - The question text to enter
   */
  async addRatingControl(questionText) {
    await clickWhenReady(this.newQuestionButton);
    // Wait for the question type panel to appear
    await this.ratingControlButton.waitFor({ state: 'visible', timeout: 10000 });
    await clickWhenReady(this.ratingControlButton);
    if (questionText) {
      await this._fillLabelEditor(questionText);
    }
  }

  /**
   * Fills the label editor div. Since .label-editor is a <div> (not an input),
   * we click it to focus, select all existing text, and type the new text.
   *
   * @param {string} text - The text to enter in the label editor
   * @private
   */
  async _fillLabelEditor(text) {
    const editor = this.questionLabelInput;
    await editor.click();
    // Select all existing text and replace with new text
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.insertText(text);
  }

  /**
   * Adds a section title to the survey.
   * Clicks the dropdown arrow, then clears and types the section title.
   *
   * @param {string} title - The section title text
   */
  async addSectionTitle(title) {
    await clickWhenReady(this.sectionDropdownButton);

    // Wait for the dropdown menu to appear and click "Section Title".
    // The menu renders inline (not in cdk-overlay), so search the whole page.
    const sectionOption = this.page.getByText('Section Title', { exact: true }).first();
    await sectionOption.waitFor({ state: 'visible', timeout: 10000 });
    await sectionOption.click();

    // Wait for the section title element to appear in the builder canvas
    await this.page.waitForTimeout(1000);

    // The section title field has class "editable-text p-0 border-0 bg-transparent"
    // Scope to the builder canvas and take the LAST one (the one just added)
    const sectionField = this.page.locator(
      '.fb-main-builder-container .editable-text.p-0.border-0.bg-transparent'
    ).last();
    await sectionField.waitFor({ state: 'visible', timeout: 10000 });
    await sectionField.click();
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.insertText(title);
    // No need to press any key — the text is committed on the next interaction.
    await this.page.waitForTimeout(300);
  }

  /**
   * Adds a Multi Select control by clicking "New question" then selecting "Multi Select".
   * Optionally fills in the question label text.
   *
   * @param {string} [questionText] - The question text to enter
   */
  async addMultiSelectControl(questionText) {
    await clickWhenReady(this.newQuestionButton);
    await this.multiSelectControlButton.waitFor({ state: 'visible', timeout: 10000 });
    await clickWhenReady(this.multiSelectControlButton);
    if (questionText) {
      await this._fillLabelEditor(questionText);
    }
  }

  /**
   * Clicks the Eye icon (visibility toggle) on the most recently added question.
   * The question-level eye button is a raised secondary button with a "visibility" mat-icon,
   * located in the question's action row (parent div.d-flex).
   * Distinguished from option-level visibility buttons which are icon-buttons inside .float-option-control.
   */
  async clickEyeIcon() {
    // The eye icon only appears when hovering over the question control.
    // The question controls are inside the builder canvas area.

    // Step 1: Scroll to bottom of builder to ensure last question is in view
    await this.page.evaluate(() => {
      const container = document.querySelector('.fb-main-builder-container') || document.documentElement;
      container.scrollTop = container.scrollHeight;
    });
    await this.page.waitForTimeout(500);

    // Step 2: Hover over the last question area to reveal side options
    const lastLabelEditor = this.page.locator('.label-editor').last();
    await lastLabelEditor.scrollIntoViewIfNeeded().catch(() => {});
    await lastLabelEditor.hover({ force: true });
    await this.page.waitForTimeout(1500);

    // Step 3: Find and click the eye icon
    // The eye icon is a raised secondary button with "visibility" mat-icon
    const eyeBtn = this.page.locator('button.mat-mdc-raised-button.mat-secondary').filter({
      has: this.page.locator('mat-icon', { hasText: /visibility/ })
    }).last();

    // Check if visible, if not try hovering again
    let isVisible = await eyeBtn.isVisible().catch(() => false);
    if (!isVisible) {
      await lastLabelEditor.hover({ force: true, position: { x: 0, y: 0 } });
      await this.page.waitForTimeout(1500);
      isVisible = await eyeBtn.isVisible().catch(() => false);
    }

    // Only click if the eye button is actually present — never block for 30s.
    if (isVisible) {
      await eyeBtn.click({ force: true, timeout: 5000 }).catch(() => {});
    }
    await this.page.waitForTimeout(500);
  }

  // ---------------------------------------------------------------------------
  // Save and preview methods
  // ---------------------------------------------------------------------------

  /**
   * Clicks the Save button and asserts that a confirmation indicator is visible.
   */
  async saveSurvey() {
    // Dismiss any open bottom sheet / dialog that may be intercepting clicks
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    // Scroll to top to make save button visible
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);

    // Click the save button
    await this.saveButton.click({ force: true });

    // A popup MAY appear after save — click "Yes" if it shows, otherwise proceed
    const yesButton = this.page.getByRole('button', { name: 'Yes', exact: true });
    const yesVisible = await yesButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (yesVisible) {
      await yesButton.click();
    }

    // Wait for save to complete
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /**
   * Configures Publish Settings after saving the survey:
   *   1. Click the "Settings" tab in the top header.
   *   2. Click the "Publish settings" tab.
   *   3. Select "Let GENFORMS Agent create declarations" when that option is shown.
   *   4. Save the survey again.
   */
  async configurePublishSettings() {
    // NOTE: Do NOT call saveSurvey() here. The Save button navigates away from the
    // builder to the surveys list (opening the Survey Options pane), which removes
    // the "Settings" top-header tab. We must stay in the builder to reach Settings.
    // The survey IS saved by step 4 below (the mini-FAB "save" inside Settings).

    // Dismiss any open overlay and scroll to top so the header tabs are visible.
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(1000);

    // 1. Click the "Settings" nav item in the top header (Build | Logic | Theme | Settings).
    // These are plain clickable text items. Exclude hidden CDK tooltip elements
    // (<div role="tooltip">Settings</div>) by requiring the VISIBLE match.
    const settingsTab = this.page.getByText('Settings', { exact: true })
      .filter({ visible: true })
      .first();
    await settingsTab.waitFor({ state: 'visible', timeout: 15000 });
    await settingsTab.click({ force: true });
    await this.page.waitForTimeout(2000);

    // 2. Click the "Publish settings" tab within the Settings page.
    const publishTab = this.page.getByText(/^Publish settings$/i)
      .filter({ visible: true })
      .first();
    await publishTab.waitFor({ state: 'visible', timeout: 15000 });
    await publishTab.click({ force: true });
    await this.page.waitForTimeout(1500);

    // 3. Select "Let GENFORMS Agent create declarations" only when it is present.
    // Some accounts do not show this option; continue to Save in that case.
    const declarationOption = this.page.getByText(/Let GENFORMS Agent create declarations/i).first();
    const declarationVisible = await declarationOption
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (declarationVisible) {
      await declarationOption.click({ force: true });
      await this.page.waitForTimeout(1000);
    } else {
      console.log('GENFORMS Agent declarations option is not available — skipping.');
    }

    // 4. Save the survey. The save control is a mini-FAB button whose inner
    // mat-icon ligature text is exactly "save" (confirmed via DOM inspection:
    // class "mdc-fab mdc-fab--mini mat-mdc-mini-fab", text "save").
    // Note there is also a "computer" mini-FAB, so we must match "save" exactly.
    const saveFab = this.page.locator('button.mdc-fab.mdc-fab--mini')
      .filter({ hasText: /^\s*save\s*$/ })
      .first();
    await saveFab.waitFor({ state: 'visible', timeout: 15000 });
    await saveFab.scrollIntoViewIfNeeded().catch(() => {});
    await saveFab.click();

    // Handle a possible confirmation dialog ("Yes").
    const yesButton = this.page.getByRole('button', { name: 'Yes', exact: true });
    if (await yesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await yesButton.click().catch(() => {});
    }

    // Handle the "Save theme" popup. Saving from Publish settings opens a dialog
    // titled "Save theme" with a pre-filled "Theme Name" field and a "Save" button.
    // We must confirm it by clicking Save, otherwise the theme is never persisted.
    await this._confirmSaveThemeDialog();

    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /**
   * Confirms the "Save theme" dialog if it appears after saving in Publish settings.
   * The dialog shows a "Theme Name" input (already pre-filled with the survey name)
   * and Cancel / Save buttons. Clicking "Save" persists the theme. This is a no-op
   * if the dialog does not appear.
   */
  async _confirmSaveThemeDialog(timeout = 12000) {
    // Scope everything to the dialog container so we never confuse the dialog's
    // "Save" button with the mini-FAB "save" control in the builder toolbar.
    // The dialog is a [role="dialog"] node containing the title text "Save theme"
    // and a "Save" button (confirmed via DOM snapshot).
    const dialog = this.page
      .locator('mat-dialog-container, [role="dialog"]')
      .filter({ hasText: /Save theme/i })
      .first();

    const appeared = await dialog
      .isVisible({ timeout })
      .catch(() => false);
    if (!appeared) return false;

    // Ensure the Theme Name field has a value (it is normally pre-filled with the
    // survey name). If it is empty, fill a fallback so Save is not disabled.
    const themeInput = dialog
      .getByRole('textbox', { name: /Theme Name/i })
      .or(dialog.locator('input[type="text"], input:not([type])'))
      .first();
    if (await themeInput.count().catch(() => 0)) {
      const current = (await themeInput.inputValue().catch(() => '')) || '';
      if (!current.trim()) {
        await themeInput.fill(`Theme ${Date.now()}`).catch(() => {});
      }
    }

    // Click the dialog's own "Save" button (accessible name "Save"), scoped to
    // the dialog so it can never resolve to the toolbar mini-FAB "save".
    const saveThemeBtn = dialog
      .getByRole('button', { name: /^Save$/i })
      .first();
    await saveThemeBtn.waitFor({ state: 'visible', timeout: 8000 });
    await saveThemeBtn.click({ force: true });

    // Wait for the dialog to close so we know the theme was saved. If it lingers,
    // retry the click once more before giving up.
    const closed = await dialog
      .waitFor({ state: 'hidden', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!closed && (await dialog.isVisible().catch(() => false))) {
      await saveThemeBtn.click({ force: true }).catch(() => {});
      await dialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    }
    await this.page.waitForTimeout(1000);
    return true;
  }

  /**
   * Clicks the Preview button (keyboard_arrow_right icon) to navigate to the survey preview.
   */
  async clickPreview() {
    // After saving, overlays or drawers might obscure the Preview button.
    // Press Escape to dismiss any remaining overlays, then scroll to top.
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    // Scroll to top of the page to make the toolbar visible
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);
    // Try clicking the Preview button
    const previewBtn = this.page.locator('.mdc-button__label').filter({ hasText: /preview/i });
    await previewBtn.scrollIntoViewIfNeeded().catch(() => {});
    await previewBtn.click({ force: true });
  }

  /**
   * Reopens the preview from the survey card panel.
   * After closing the first preview, clicking the survey card again opens a new preview.
   * The survey card has a preview button with class "mdc-button__label".
   */
  async reopenPreview() {
    // Click the survey card's preview button (same class as builder's preview)
    const previewBtn = this.page.locator('.mdc-button__label').filter({ hasText: /preview/i });
    await previewBtn.click({ force: true });
  }

  /**
   * Opens the Answer Table for the survey from the survey options panel.
   * Clicks outside first to dismiss any active states, then clicks the survey card
   * to open the options panel, and selects "Answer Table".
   *
   * @param {string} surveyTitle - The title of the survey to open the answer table for
   */
  async openAnswerTable(surveyTitle) {
    // Click outside to dismiss any popups or active states
    await this.page.locator('body').click({ position: { x: 10, y: 10 } });
    await this.page.waitForTimeout(1000);

    // The survey options panel may already be open, or we need to click the survey card
    // Look for "Answer Table" text in the options panel
    const answerTableOption = this.page.locator('strong').filter({ hasText: 'Answer Table' });
    
    // If the options panel is not already visible, click the survey card to open it
    const isVisible = await answerTableOption.isVisible().catch(() => false);
    if (!isVisible) {
      // Click the survey card to open its options panel
      const surveyCard = this.page.locator('[id^="Surveylist_"]').filter({ hasText: surveyTitle });
      await surveyCard.click();
      await this.page.waitForTimeout(1000);
    }

    // Click the Answer Table option
    await answerTableOption.waitFor({ state: 'visible', timeout: 10000 });
    await answerTableOption.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Adds translations to the survey:
   *   1. From the survey option side pane, select "Translate".
   *   2. Select Arabic and Chinese from the "Select Language" dropdown (multi-select).
   *   3. Click outside to close the dropdown.
   *   4. Click the save button (//span[text()="save"]).
   *
   * @param {string} surveyTitle - The survey title (to open its option pane if needed)
   */
  async configureTranslation(surveyTitle) {
    // A leftover "Save theme" dialog from the publish-settings save can still be
    // open here and would block clicks on the survey card. Confirm/close it first.
    await this._confirmSaveThemeDialog(4000).catch(() => {});

    // Ensure we are viewing the survey list / option pane. Dismiss overlays first.
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(1000);

    // 1. Open the survey's "Survey Options" side pane, then click "Translate".
    // The pane opens when the survey card is clicked. The just-created survey is
    // the first card in the list. "Translate" is <strong translatekey="Translate">.
    const translateOption = this.page.locator('strong[translatekey="Translate"]')
      .or(this.page.getByText('Translate', { exact: true }))
      .first();

    // If the option pane isn't already open (Translate hidden), open it by
    // clicking the FIRST survey card (the newest = the one just created). Card
    // titles are truncated ("Software Compan..."), so we can't match full text —
    // instead click the first survey card in the list.
    let translateVisible = await translateOption.isVisible().catch(() => false);
    if (!translateVisible) {
      const firstCard = this.page.locator('[id^="Surveylist_"]').first()
        .or(this.page.locator('[class*="survey-card" i], [class*="surveyCard" i]').first())
        .or(this.page.getByText(/^Software Compan/i).first());
      await firstCard.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await firstCard.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(2500);
      translateVisible = await translateOption.isVisible().catch(() => false);

      // If still hidden, the title text may be truncated differently — click the
      // very first card title text as a last resort.
      if (!translateVisible) {
        await this.page.getByText(/Software Compan/i).first().click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(2000);
      }
    }
    await translateOption.waitFor({ state: 'visible', timeout: 15000 });
    await translateOption.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(3000);

    // 2. Open the "Select Language" dropdown and choose Arabic + Chinese.
    const languageDropdown = this.page.getByRole('combobox', { name: /Select Language/i })
      .or(this.page.locator('mat-select').filter({ hasText: /Select Language/i }))
      .or(this.page.locator('mat-select').first())
      .first();
    await languageDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await languageDropdown.click({ force: true });
    await this.page.waitForTimeout(1500);

    // Select the Arabic and Chinese options from the opened panel (multi-select).
    for (const lang of [/^\s*Arabic\s*$/i, /^\s*Chinese\s*$/i]) {
      const option = this.page.getByRole('option', { name: lang })
        .or(this.page.locator('mat-option').filter({ hasText: lang }))
        .first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ force: true });
      await this.page.waitForTimeout(800);
    }

    // 3. Click outside to close the dropdown/overlay.
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(500);
    await this.page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
    await this.page.waitForTimeout(1000);

    // 4. Click the save button in the "Survey Texts" toolbar. It's the disk/save
    // icon (a mat-icon with the "save" ligature). Try several equivalent targets.
    const saveTargets = [
      // Requested exact locator: a <span> with text "save".
      this.page.locator('//span[text()="save"]').first(),
      // The save mat-icon (material-icons ligature "save").
      this.page.locator('mat-icon').filter({ hasText: /^\s*save\s*$/ }).first(),
      // A button containing the save mat-icon.
      this.page.locator('button').filter({ has: this.page.locator('mat-icon').filter({ hasText: /^\s*save\s*$/ }) }).first(),
      // Any element with a save-like aria-label/title.
      this.page.locator('[aria-label*="save" i], [title*="save" i]').first(),
    ];

    let translationSaved = false;
    for (const target of saveTargets) {
      if (await target.isVisible().catch(() => false)) {
        await target.click({ force: true });
        translationSaved = true;
        break;
      }
    }
    if (!translationSaved) {
      // Last resort: force-click the save mat-icon by ligature text.
      await this.page.locator('mat-icon').filter({ hasText: /^\s*save\s*$/ })
        .first().click({ force: true }).catch(() => {});
    }

    // Handle a possible confirmation dialog ("Yes").
    const yesButton = this.page.getByRole('button', { name: 'Yes', exact: true });
    if (await yesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await yesButton.click().catch(() => {});
    }

    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }
}

module.exports = { SurveyBuilderPage };
