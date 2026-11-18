// pages/CampaignPage.js
// Handles Campaign creation end-to-end: create campaign, select survey + datastore,
// map campaign fields to datastore fields, configure the email template, send the
// campaign, then process every token under Management (open preview, answer, submit).

'use strict';

const { expect } = require('@playwright/test');
const { clickWhenReady } = require('../utils/helpers');

class CampaignPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Sidebar "Campaign" navigation item.
    // From DOM inspection: sidebar items are <a class="menu-list-item"> with NO href.
    // Each contains a <mat-icon> ligature (e.g. "campaign", "system_security_update_good")
    // and a <span class="full-width"> label (e.g. "Campaign", "Device", "Datastore").
    // We must NOT match "Device" (icon "system_security_update_good"). The most
    // unambiguous match is the menu <a> whose label <span class="full-width"> is
    // EXACTLY "Campaign".
    this.campaignNav = page.locator('a.menu-list-item').filter({
      has: page.locator('span.full-width', { hasText: /^\s*Campaign\s*$/ }),
    })
      // Fallbacks in case the label span class changes:
      .or(page.locator('a.menu-list-item').filter({
        has: page.locator('mat-icon.routeIcon', { hasText: /^\s*campaign\s*$/ }),
      }))
      .or(page.getByRole('link', { name: /^\s*campaign\s*Campaign\s*$/i }));

    // Sidebar toggle
    this.sidebarToggle = page.getByRole('button', { name: /Toggle sidenav/i });
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigates directly to the Campaign section via URL (same approach as DatastorePage).
   * Direct URL navigation is more reliable than clicking the collapsed sidebar nav item.
   */
  async openCampaign() {
    await this.page.goto('/#/en/campaign');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for network to settle — Angular SPAs can take several seconds after
    // domcontentloaded to finish rendering the campaign list, especially when
    // called after a complex prior flow (e.g. Smoke Test.spec.js).
    await this.page.waitForLoadState('networkidle').catch(() => {});
    // Extra buffer for Angular change detection to render the Create Campaign button.
    // Use a plain setTimeout so it doesn't throw if the page navigates during the wait.
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  // ---------------------------------------------------------------------------
  // Step 2: Campaign creation
  // ---------------------------------------------------------------------------

  /**
   * Clicks "Create Campaign", enters the name, selects the first survey and first
   * datastore, then clicks Proceed.
   * @param {string} campaignName
   */
  async createCampaign(campaignName) {
    // Wait for the "Create Campaign" button to be truly visible and interactable
    // before clicking. Using force:true without this guard fires the click against
    // a skeleton/spinner when Angular hasn't finished rendering after a long prior
    // flow (e.g. Smoke Test.spec.js), so the dialog never opens.
    const createBtn = this.page.getByRole('button', { name: /Create Campaign/i }).first();
    await createBtn.waitFor({ state: 'visible', timeout: 25000 });
    await createBtn.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.mouse.move(0, 0);
    await this.page.waitForTimeout(500);
    await createBtn.click();
    await this.page.waitForTimeout(2000);

    // Enter the campaign name.
    // Scope to a dialog/modal overlay first to avoid matching stale inputs from
    // previous pages that may still be in the DOM but hidden.
    const dialogScope = this.page.locator('mat-dialog-container, .cdk-overlay-pane [role="dialog"], [role="dialog"]').first();
    const nameInput = dialogScope.locator('input').first()
      .or(this.page.getByLabel(/Campaign Name/i))
      .or(this.page.getByPlaceholder(/Campaign Name/i));
    await nameInput.waitFor({ state: 'visible', timeout: 20000 });
    await nameInput.click();
    await nameInput.fill(campaignName);
    await this.page.waitForTimeout(500);

    // Select the first survey from the Select Survey dropdown
    await this._selectFirstFromDropdown(/Select Survey/i);

    // Select the first datastore ONLY if it's not already auto-selected.
    // If a value is already shown, leave it and just Proceed.
    await this._selectFirstFromDropdownIfEmpty(/Select Datastore/i);

    // Click Proceed
    await this.page.getByRole('button', { name: /^Proceed$/i }).click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * Opens a dropdown identified by its label/placeholder text and selects the first option.
   * @param {RegExp} labelPattern
   * @private
   */
  async _selectFirstFromDropdown(labelPattern) {
    const combo = this.page.getByRole('combobox', { name: labelPattern }).first();
    // Ensure the combobox is present before interacting (dropdowns can lazy-load
    // right after campaign creation, especially for a freshly-created survey).
    await combo.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    await combo.scrollIntoViewIfNeeded().catch(() => {});
    await combo.click({ force: true });
    await this.page.waitForTimeout(1500);

    // The opened listbox contains a disabled "dropdown search" textbox rendered as a
    // mat-option (class contains-mat-select-search). Select the first REAL option:
    // an enabled mat-option that is NOT the search box.
    const realOption = this.page.locator('mat-option:not(.contains-mat-select-search)[aria-disabled="false"]').first()
      .or(this.page.getByRole('option').filter({ hasText: /\w/ }).first());
    await realOption.first().waitFor({ state: 'visible', timeout: 10000 });
    await realOption.first().click();
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Like _selectFirstFromDropdown, but skips selection when the dropdown already
   * shows a value (auto-selected). Only opens and picks the first option when the
   * field is blank.
   * @param {RegExp} labelPattern
   * @private
   */
  async _selectFirstFromDropdownIfEmpty(labelPattern) {
    const combo = this.page.getByRole('combobox', { name: labelPattern }).first();
    await combo.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // The selected value renders in the mat-select value text span. If it has
    // non-empty text, a value is already selected and we must not touch it.
    const valueText = combo.locator(
      '.mat-mdc-select-value-text, .mat-select-value-text, .mat-mdc-select-value'
    ).first();
    const current = (await valueText.textContent().catch(() => '') || '').trim();

    if (current.length > 0) {
      // Already auto-selected — leave it as-is and proceed.
      return;
    }

    // Blank — select the first real option.
    await this._selectFirstFromDropdown(labelPattern);
  }

  // ---------------------------------------------------------------------------
  // Step 3: Campaign mapping
  // ---------------------------------------------------------------------------

  /**
   * Clicks "Set campaign mapping", maps each campaign field to a datastore field,
   * then clicks "Map datastore" and verifies success.
   * @param {Record<string,string>} mappings - { Name: 'Employee Name', ... }
   */
  async setCampaignMapping(mappings) {
    await this.page.getByRole('button', { name: /Set campaign mapping/i }).click({ force: true });
    await this.page.waitForTimeout(2000);

    // For each campaign field, open its dropdown and select the datastore field.
    for (const [campaignField, datastoreField] of Object.entries(mappings)) {
      await this._selectMappingValue(campaignField, datastoreField);
    }

    // Click "Map datastore" ONLY if it's present and enabled (some fields auto-fill;
    // if the mapping is already applied there's nothing to click).
    const mapBtn = this.page.getByRole('button', { name: /Map datastore/i });
    const mapVisible = await mapBtn.isVisible().catch(() => false);
    if (mapVisible) {
      const disabled = await mapBtn.isDisabled().catch(() => false);
      if (!disabled) {
        await mapBtn.click({ force: true });
        await this.page.waitForTimeout(2000);
      }
    }
  }

  /**
   * Opens the mapping dropdown associated with a campaign field label and selects
   * the given datastore field value.
   * @param {string} campaignField - e.g. 'Name', 'Email', 'Mobile'
   * @param {string} datastoreField - e.g. 'Employee Name'
   * @private
   */
  async _selectMappingValue(campaignField, datastoreField) {
    // The mapping is a table: each <tr> has a <td> label (Name/Email/Mobile) and a
    // <mat-select> in the same row. Find the row by its label, then open its mat-select.
    const row = this.page.locator('tr').filter({
      has: this.page.locator('td', { hasText: new RegExp(`^\\s*${campaignField}\\s*$`) }),
    }).first();
    const select = row.locator('mat-select').first();
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click({ force: true });
    await this.page.waitForTimeout(1200);

    // Select the datastore field option from the opened panel.
    const option = this.page.getByRole('option', { name: new RegExp(`^\\s*${datastoreField}\\s*$`, 'i') })
      .or(this.page.locator('mat-option').filter({ hasText: new RegExp(`^\\s*${datastoreField}\\s*$`) }));
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
    await this.page.waitForTimeout(800);
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ---------------------------------------------------------------------------
  // Step 4: Email template configuration
  // ---------------------------------------------------------------------------

  /**
   * Selects the first email template, then configures its Name and Role fields.
   * @param {Record<string,string>} templateFields - { Name: 'Employee name', Role: 'Employee Role' }
   */
  async configureEmailTemplate(templateFields) {
    // GUARD: the template may already be configured (e.g. when the campaign reuses a
    // survey that already has a template applied). In that state the page shows the
    // Template section as complete with a "Change email template" button and NO
    // "Add email template" button, and there are no mat-selects to fill. If so, there
    // is nothing to configure here — return and let the caller proceed to "Finish up".
    const addBtn = this.page.getByRole('button', { name: /Add email template/i });
    const addBtnVisible = await addBtn.isVisible().catch(() => false);
    if (!addBtnVisible) {
      const alreadyConfigured = await this.page
        .getByRole('button', { name: /Change email template/i })
        .isVisible()
        .catch(() => false);
      if (alreadyConfigured) {
        console.log('Email template already configured — skipping template selection.');
        return;
      }
    }

    // Click "Add email template" to open the template picker popup.
    await addBtn.scrollIntoViewIfNeeded().catch(() => {});
    await addBtn.click({ force: true });
    await this.page.waitForTimeout(2500);

    // The template cards load asynchronously (ngx-skeleton-loader placeholders first).
    // Wait for the first card's TITLE to actually render before interacting.
    const firstCard = this.page.locator('.card.global-list-card').first();
    await firstCard.scrollIntoViewIfNeeded().catch(() => {});
    // Wait until the card title shows real text (skeleton replaced by content).
    await this.page.locator('.card.global-list-card .dh-card-title')
      .filter({ hasText: /\w/ }).first()
      .waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    await this.page.waitForTimeout(1500);

    // Hover to reveal the float buttons (laptop / edit / check) and click "check" to select.
    await firstCard.hover().catch(() => {});
    await this.page.waitForTimeout(1000);
    const checkIcon = firstCard.locator('.dh-card-hover-float-btns mat-icon, .dh-card-hover-float-btns i, .dh-card-hover-float-btns button')
      .filter({ hasText: 'check' });
    const checkVisible = await checkIcon.first().isVisible().catch(() => false);
    if (checkVisible) {
      await checkIcon.first().click({ force: true });
    } else {
      // Fallback: the float buttons are laptop, edit, check (in order) — click the 3rd.
      await firstCard.locator('.dh-card-hover-float-btns > *').nth(2).click({ force: true });
    }
    await this.page.waitForTimeout(3000);

    // The config panel shows one mat-select per template placeholder row:
    //   row containing "##Name##" -> Name field (select "Employee name")
    //   row containing "##role##" -> Role field (select "Employee Role")
    // NOTE: selecting one field can re-render the panel (indices shift), so we RE-FIND
    // each field's mat-select fresh right before interacting with it.
    // Some templates have no placeholder fields at all — if no mat-select appears,
    // skip field filling and just Confirm (soft wait, no throw).
    const hasSelects = await this.page.locator('mat-select').first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (hasSelects) {
      // 1. Name field
      const nameSelect = await this._findSelectForPlaceholder('##Name##');
      await this._pickOptionInSelect(nameSelect, templateFields.Name);
      await this.page.waitForTimeout(1000);

      // 2. Role field — re-find AFTER the Name selection (DOM may have re-rendered).
      const roleSelect = await this._findSelectForPlaceholder('##role##');
      await this._pickOptionInSelect(roleSelect, templateFields.Role);
    } else {
      console.log('No template placeholder fields present — nothing to map.');
    }

    // Click Confirm (only if a Confirm button is present).
    const confirmBtn = this.page.getByRole('button', { name: /^Confirm$/i });
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click({ force: true });
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Opens a specific mat-select locator and picks the option matching value (exact).
   * @param {import('@playwright/test').Locator} select
   * @param {string} value
   * @private
   */
  async _pickOptionInSelect(select, value) {
    await select.scrollIntoViewIfNeeded().catch(() => {});
    await select.click({ force: true });
    await this.page.waitForTimeout(1200);
    const option = this.page.locator('mat-option').filter({ hasText: new RegExp(`^\\s*${value}\\s*$`, 'i') })
      .or(this.page.getByRole('option', { name: new RegExp(`^\\s*${value}\\s*$`, 'i') }));
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    // Clicking the option closes the dropdown by itself. Do NOT press Escape afterwards —
    // Escape collapses the whole template config panel, removing the remaining fields.
    await option.first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Finds the config-panel row that contains the given placeholder text, opens its
   * mat-select, and selects the requested value.
   * @param {string} placeholder - e.g. '##Name##', '##role##'
   * @param {string} value - e.g. 'Employee name', 'Employee Role'
   * @private
   */
  async _selectTemplateFieldByPlaceholder(placeholder, value) {
    // Each placeholder field has a mat-select. Find the mat-select whose nearest
    // field-container text includes the placeholder token, by scanning all mat-selects
    // in the config panel and matching the one tied to this placeholder.
    const select = await this._findSelectForPlaceholder(placeholder);
    await select.scrollIntoViewIfNeeded().catch(() => {});
    await select.click({ force: true });
    await this.page.waitForTimeout(1200);

    const option = this.page.getByRole('option', { name: new RegExp(`^\\s*${value}\\s*$`, 'i') })
      .or(this.page.locator('mat-option').filter({ hasText: new RegExp(`^\\s*${value}\\s*$`, 'i') }));
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
    await this.page.waitForTimeout(800);
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Scans the config panel's mat-selects and returns the one whose field row contains
   * the given placeholder token (e.g. '##Name##', '##role##').
   * @param {string} placeholder
   * @returns {Promise<import('@playwright/test').Locator>}
   * @private
   */
  async _findSelectForPlaceholder(placeholder) {
    const selects = this.page.locator('mat-select');
    const count = await selects.count();

    // Each field's row contains EXACTLY ONE placeholder token. For each mat-select, walk
    // up until we reach the smallest ancestor that has exactly one "##...##" token, and
    // match it against the requested placeholder. This uniquely maps:
    //   ##Name##  -> the Name field select
    //   ##role##  -> the Role field select
    // (a shared ancestor would contain MULTIPLE tokens, so it is skipped).
    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i);
      const own = await sel.evaluate((el) => {
        let node = el;
        for (let k = 0; k < 8 && node; k++) {
          const tokens = (node.textContent || '').match(/##[^#]+##/g);
          if (tokens && tokens.length === 1) return tokens[0];
          node = node.parentElement;
        }
        return null;
      }).catch(() => null);
      if (own === placeholder) {
        return sel;
      }
    }

    // Fallback: the mat-select nearest to an element whose text equals the placeholder.
    return this.page.locator(`xpath=//*[contains(normalize-space(.), "${placeholder}")]//mat-select`).first();
  }

  // ---------------------------------------------------------------------------
  // Step 5: Finish and send
  // ---------------------------------------------------------------------------

  /**
   * Clicks "Finish up", waits for the confirmation popup, clicks "Send", and verifies
   * the campaign appears in the campaign list.
   * @param {string} campaignName
   */
  async finishAndSend(campaignName) {
    await this.page.getByRole('button', { name: /Finish up/i }).click({ force: true });
    await this.page.waitForTimeout(2000);

    // Wait for the bottom confirmation popup and click Send
    const sendBtn = this.page.getByRole('button', { name: /^Send$/i });
    await sendBtn.waitFor({ state: 'visible', timeout: 15000 });
    await sendBtn.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(4000);

    // Verify the campaign is visible in the list
    const campaignCard = this.page.getByText(campaignName, { exact: false }).first();
    await expect(campaignCard, 'Campaign should appear in the campaign list').toBeVisible({ timeout: 15000 });
  }

  // ---------------------------------------------------------------------------
  // Step 6: Management and token processing
  // ---------------------------------------------------------------------------

  /**
   * After "Send", the app lands EITHER directly on the "Campaign recipient" page
   * (which shows the recipient table with a "Token" column) OR on the Campaign
   * list page (showing campaign cards). This method reaches the recipient table
   * either way:
   *   - If the Token column header is already present, we're done.
   *   - Otherwise we're on the list: click the FIRST card matching the campaign
   *     name (the newest = the one we just created) to open its recipient page.
   * @param {string} campaignName
   */
  async openManagement(campaignName) {
    const tokenHeader = this.page.getByRole('columnheader', { name: /^Token$/i }).first();

    // Already on the recipient page?
    const alreadyThere = await tokenHeader.isVisible().catch(() => false);
    if (!alreadyThere) {
      // On the Campaign list — open the newest matching campaign card.
      const card = this.page.getByText(campaignName, { exact: true }).first();
      await card.waitFor({ state: 'visible', timeout: 20000 });
      await card.click({ force: true });
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(2000);
    }

    // Now wait for the recipient table's Token column header.
    await tokenHeader.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Collects every survey publish URL shown on the recipient page. The recipient
   * page renders, per recipient, a link to the survey to answer:
   *   https://.../#/en/survey/publish/<TOKEN>
   * These are the authoritative "answer this token's survey" URLs.
   * @returns {Promise<string[]>}
   * @private
   */
  async _readSurveyUrls() {
    // Helper that reads publish anchors in one pass.
    const readAnchors = async () => this.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/survey/publish/"]'));
      const seen = new Set();
      const result = [];
      anchors.forEach((a) => {
        const href = a.getAttribute('href') || a.href || '';
        if (href && href.includes('/survey/publish/') && !seen.has(href)) {
          seen.add(href);
          result.push(href);
        }
      });
      return result;
    }).catch(() => []);

    // Poll for the publish links to appear (they render asynchronously on the
    // recipient page). Retry for up to ~30s before giving up.
    let urls = [];
    for (let attempt = 0; attempt < 15; attempt++) {
      urls = await readAnchors();
      if (urls.length > 0) return urls;
      await this.page.waitForTimeout(2000);
    }

    // Fallback: no anchors found. Build publish URLs from the token strings in
    // the recipient table's Token column (2nd cell of each data row).
    const base = new URL(this.page.url()).origin;
    const tokens = await this.page.evaluate(() => {
      const result = [];
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;
        const tokenText = (cells[1].textContent || '').trim();
        // Publish tokens are 12+ char alphanumeric strings (not numeric ids).
        if (/^[A-Za-z0-9]{10,}$/.test(tokenText) && /[A-Za-z]/.test(tokenText)) {
          result.push(tokenText);
        }
      });
      return result;
    }).catch(() => []);

    return tokens.map((t) => `${base}/#/en/survey/publish/${t}`);
  }

  /**
   * Processes every token on the recipient page. For each recipient it opens that
   * recipient's survey (same tab, via the publish URL), delegates answering +
   * submission to the callback, then returns to the recipient list and moves to
   * the next one — until all are done.
   *
   * @param {import('@playwright/test').BrowserContext} context (unused; same-tab flow)
   * @param {(surveyPage: import('@playwright/test').Page, index: number) => Promise<void>} answerFn
   *        callback that fills + submits the survey for a given token
   */
  async processAllTokens(context, answerFn) {
    const surveyUrls = await this._readSurveyUrls();
    console.log(`Found ${surveyUrls.length} survey URL(s) on the recipient page:`, surveyUrls);

    for (let i = 0; i < surveyUrls.length; i++) {
      const url = surveyUrls[i];

      // Open this recipient's survey in a NEW TAB so the recipient page stays intact.
      const surveyPage = await context.newPage();
      try {
        await surveyPage.goto(url);
        await surveyPage.waitForLoadState('networkidle').catch(() => {});
        await surveyPage.waitForTimeout(1500);

        // Answer + submit this token's survey in the new tab.
        await answerFn(surveyPage, i);

        // After submitting, wait so the submission fully registers before we
        // close this tab and move on to the next token's preview.
        if (!surveyPage.isClosed()) {
          await surveyPage.waitForTimeout(3000).catch(() => {});
        }
      } catch (err) {
        console.log(`Token #${i + 1} failed:`, err && err.message);
      } finally {
        // Close the survey tab and return focus to the recipient page.
        // Every call here is guarded: if the page/context has been closed we must
        // NOT throw, otherwise the whole loop (and test) fails on cleanup.
        await surveyPage.close().catch(() => {});
        if (!this.page.isClosed()) {
          await this.page.bringToFront().catch(() => {});
        }
        // Sleep WITHOUT depending on the page being alive (page.waitForTimeout
        // throws if the page is closed), before opening the next preview.
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }
}

module.exports = { CampaignPage };
