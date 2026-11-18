// pages/TemplateCreationPage.js
// Handles Communication Template creation — isolated from Advance Logic.
// Flow: Open sidebar → Communication Template → Create → Enter name → Create Template
//       → drag Text element → set content → drag Button element → set colors → Save
//
// Exposes a reusable function `createEmployeeTemplate(page, templateData)` that the main
// automation invokes AFTER Advance Logic configuration is complete.

'use strict';

const { expect } = require('@playwright/test');

class TemplateCreationPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Main sidebar toggle
    this.sidebarToggle = page.getByRole('button', { name: /Toggle sidenav/i });

    // "Communication Template" navigation item — an <a> link with the
    // dashboard_customize icon and text "Communication Template".
    this.communicationTemplateNav = page.locator('a').filter({ hasText: 'Communication Template' });

    // "Create" button in the top-right corner
    this.createButton = page.getByRole('button', { name: 'Create', exact: true });

    // Template name input — textbox labeled "Enter name" in the "Select the template type" dialog
    this.templateNameInput = page.getByRole('textbox', { name: 'Enter name' });

    // "Create Template" button
    this.createTemplateButton = page.getByRole('button', { name: /Create Template/i });

    // Left sidebar Text element (drag source)
    // Left sidebar Text element (drag source) — button.toolbar-item with the text_fields icon
    this.textElementSource = page.locator('button.toolbar-item').filter({ hasText: 'Text' });

    // Left sidebar Button element (drag source) — button.toolbar-item with the smart_button icon
    this.buttonElementSource = page.locator('button.toolbar-item').filter({ hasText: 'Button' });

    // Main content drop zone
    this.rootDropZone = page.locator('#root-drop-zone');

    // Save button — header FAB icon button containing a "save" mat-icon
    this.saveButton = page.locator('button.mat-mdc-mini-fab, button')
      .filter({ has: page.locator('mat-icon', { hasText: 'save' }) })
      .first();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Re-opens the main sidebar and selects Communication Template.
   */
  async openCommunicationTemplate() {
    // Re-open the main sidebar
    const toggleVisible = await this.sidebarToggle.isVisible().catch(() => false);
    if (toggleVisible) {
      await this.sidebarToggle.click({ force: true });
      await this.page.waitForTimeout(1500);
    }

    // Select "Communication Template" from the sidebar navigation
    await this.communicationTemplateNav.first().click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks the "Create" button (top-right), enters the template name, and clicks "Create Template".
   * @param {string} templateName - The name for the new template
   */
  async createNewTemplate(templateName) {
    // Click "Create" in the top-right corner
    await this.createButton.click({ force: true });
    await this.page.waitForTimeout(2000);

    // Enter the template name in the "Select the template type" dialog
    await this.templateNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.templateNameInput.click();
    await this.templateNameInput.fill(templateName);
    await this.page.waitForTimeout(500);

    // Select a template type (Email) — required to enable the "Create Template" button
    const emailType = this.page.getByText('Email', { exact: true }).first();
    await emailType.click({ force: true });
    await this.page.waitForTimeout(1000);

    // Click "Create Template" (now enabled)
    await this.createTemplateButton.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  // ---------------------------------------------------------------------------
  // Editor — drag and drop, content, colors
  // ---------------------------------------------------------------------------

  /**
   * Returns the target drop container. The editor uses Angular CDK drop zones.
   * We prefer the second inner drop container if present, otherwise the root drop zone.
   * @private
   */
  _dropTarget() {
    // Inner containers rendered inside the root drop zone (rows/columns you build)
    const innerContainers = this.page.locator('#root-drop-zone [class*="container"], #root-drop-zone [cdkdroplist], #root-drop-zone [class*="drop"]');
    return {
      innerContainers,
      root: this.rootDropZone,
    };
  }

  /**
   * Performs a manual (Angular CDK compatible) drag from a source locator to a target locator.
   * CDK drag-drop does not respond to native HTML5 dragTo, so we simulate mouse events
   * with intermediate moves.
   * @private
   */
  async _cdkDrag(source, target) {
    const src = await source.boundingBox();
    const tgt = await target.boundingBox();
    if (!src || !tgt) {
      throw new Error('Drag source or target not found (no bounding box)');
    }

    const startX = src.x + src.width / 2;
    const startY = src.y + src.height / 2;
    const endX = tgt.x + tgt.width / 2;
    const endY = tgt.y + tgt.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // Several intermediate moves so CDK registers the drag sequence
    await this.page.mouse.move(startX + 5, startY + 5, { steps: 5 });
    await this.page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 10 });
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.move(endX + 2, endY + 2, { steps: 3 });
    await this.page.waitForTimeout(300);
    await this.page.mouse.up();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Drags the Text element from the left toolbar into the second container,
   * then clears the default text and enters the provided content.
   * @param {string} content - The text content (with exact line breaks / placeholders)
   */
  async addTextElement(content) {
    const { innerContainers, root } = this._dropTarget();
    // Prefer second inner container; fall back to root drop zone
    const count = await innerContainers.count().catch(() => 0);
    const target = count > 1 ? innerContainers.nth(1) : root;

    await this.textElementSource.first().scrollIntoViewIfNeeded().catch(() => {});
    await this._cdkDrag(this.textElementSource.first(), target);
    await this.page.waitForTimeout(2000);

    // The newly added Text element becomes editable — find its editable region
    const textEditable = this.page.locator('#root-drop-zone [contenteditable="true"], #root-drop-zone textarea').last();
    await textEditable.waitFor({ state: 'visible', timeout: 10000 });
    await textEditable.click();
    await this.page.waitForTimeout(500);

    // Remove default text
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');
    await this.page.waitForTimeout(300);

    // Enter the content — insertText preserves placeholder syntax and line breaks
    await this.page.keyboard.insertText(content);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Drags the Button element into the SAME container that holds the Text element.
   *
   * From the editor DOM, the Text element lives inside a
   * `div.template-container.container-vertical` (id starts with "container-vertical-").
   * We drop the Button onto the CENTER of that exact container so it joins it
   * rather than creating a new sibling container.
   */
  async addButtonElement() {
    // The CDK drag-drop can occasionally fail to land the Button block on the canvas
    // (the editor is finicky about the insertion position). Retry the drop until the
    // rendered button (#root-drop-zone .eb-default-button) actually appears.
    const renderedButton = this.page.locator('#root-drop-zone .eb-default-button');

    for (let attempt = 0; attempt < 3; attempt++) {
      // The existing Text content item (inside the vertical container that holds the text).
      // Dropping over the LOWER half of this item makes CDK insert the button right below it,
      // inside the SAME container.
      const textContentItem = this.page.locator('#root-drop-zone .template-content-item').last();
      await textContentItem.scrollIntoViewIfNeeded().catch(() => {});

      await this.buttonElementSource.first().scrollIntoViewIfNeeded().catch(() => {});
      await this._cdkDropBelowItem(this.buttonElementSource.first(), textContentItem);
      await this.page.waitForTimeout(2000);

      // Verify the button landed. If it did, we're done.
      const landed = await renderedButton.first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (landed) {
        console.log(`Button element added (attempt ${attempt + 1}).`);
        return;
      }
      console.log(`Button drop attempt ${attempt + 1} did not land — retrying.`);
      await this.page.waitForTimeout(1000);
    }
    // Last check — surface a clear error if still missing after retries.
    await renderedButton.first().waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * CDK drag-drop helper that appends the dragged source directly BELOW the target item,
   * within the same container. CDK's cdkDropList needs several mousemove events over the
   * target (with small delays) to register the insertion position, so we hover repeatedly
   * over the lower portion of the target item before releasing.
   * @private
   */
  async _cdkDropBelowItem(source, targetItem) {
    const src = await source.boundingBox();
    const tgt = await targetItem.boundingBox();
    if (!src || !tgt) {
      throw new Error('Drag source or target item not found (no bounding box)');
    }

    const startX = src.x + src.width / 2;
    const startY = src.y + src.height / 2;
    // Aim WELL INSIDE the text item's lower portion (~75% down), not at the very bottom edge.
    // Targeting the edge can drop into the gap between containers (a new container).
    const endX = tgt.x + tgt.width / 2;
    const endY = tgt.y + tgt.height * 0.75;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(150);
    // Small initial move to start the CDK drag
    await this.page.mouse.move(startX + 8, startY + 8, { steps: 5 });
    await this.page.waitForTimeout(150);
    // Move toward the target midway
    await this.page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 10 });
    await this.page.waitForTimeout(150);
    // Enter the target item at its vertical middle first
    await this.page.mouse.move(endX, tgt.y + tgt.height / 2, { steps: 8 });
    await this.page.waitForTimeout(250);
    // Then hover repeatedly over the lower-inside portion so CDK inserts BELOW the text
    // within the SAME container (staying inside the item bounds, not the edge).
    for (let i = 0; i < 5; i++) {
      await this.page.mouse.move(endX, endY, { steps: 4 });
      await this.page.waitForTimeout(250);
      await this.page.mouse.move(endX + 2, endY - 3, { steps: 2 });
      await this.page.waitForTimeout(250);
    }
    // Final settle inside the lower portion before releasing
    await this.page.mouse.move(endX, endY, { steps: 3 });
    await this.page.waitForTimeout(300);
    await this.page.mouse.up();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Clicks outside the current element to deselect it — clicks an empty area of the
   * editor canvas (NOT the page corner, which would trigger a navigation/leave dialog).
   */
  async clickOutside() {
    // Press Escape first to close any active element editor
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    // Click an empty area near the top of the content container to deselect
    const canvas = this.page.locator('#root-drop-zone');
    const box = await canvas.boundingBox();
    if (box) {
      // Click just inside the top edge of the canvas, away from any element
      await this.page.mouse.click(box.x + box.width / 2, box.y + 5);
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * Opens the Background color setting in the right-side properties panel and selects
   * the provided color from the color palette.
   * @param {string} rgbColor - e.g. 'rgb(231, 230, 230)'
   */
  async setContainerBackgroundColor(rgbColor) {
    // Dismiss any active floating text editor toolbar first.
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    // 1. Click the INNER vertical container (the box holding the text + button) to select it.
    // This is .template-container.container-vertical — its properties panel title is "Vertical"
    // and it is the box that should receive the gray background. Click near its top-left edge
    // (its padding, away from the text/button children) via a real mouse click.
    const container = this.page.locator('#root-drop-zone .template-container.container-vertical').last();
    await container.scrollIntoViewIfNeeded().catch(() => {});
    const box = await container.boundingBox();
    if (box) {
      await this.page.mouse.click(box.x + 4, box.y + 4);
    } else {
      await container.click({ force: true });
    }
    await this.page.waitForTimeout(1500);

    // 2. Open the "Background" color swatch in the container's Color section.
    const bgCard = await this._openColorSwatch('Background');

    // 3. Select the palette item matching the requested rgb color, scoped to this card.
    await this._selectCustomPalletColor(rgbColor, bgCard);
  }

  /**
   * Selects a color from the open color palette by matching its inline background-color style.
   * @param {string} rgbColor - e.g. 'rgb(231, 230, 230)'
   * @private
   */
  async _selectPaletteColor(rgbColor) {
    // The color palette items are div.color-pallet.dh-custom-color-pallet-item and the
    // element ITSELF carries the inline style, e.g.:
    //   class="color-pallet dh-custom-color-pallet-item ten ng-star-inserted"
    //   style="background-color: rgb(112, 173, 71); border-color: rgb(112, 173, 71);"
    // There can be multiple matching items (multiple palettes in the DOM); pick the one
    // that is actually VISIBLE and click it. Do NOT re-open/close the swatch.
    const palletItems = this.page.locator(`.color-pallet[style*="background-color: ${rgbColor}"]`);
    await palletItems.first().waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});

    const count = await palletItems.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const item = palletItems.nth(i);
      if (await item.isVisible().catch(() => false)) {
        await item.scrollIntoViewIfNeeded().catch(() => {});
        await item.click({ force: true });
        await this.page.waitForTimeout(1000);
        return;
      }
    }

    // Fallback: any visible element carrying that exact background-color style.
    const anySwatch = this.page.locator(`[style*="background-color: ${rgbColor}"]`);
    const anyCount = await anySwatch.count().catch(() => 0);
    for (let i = 0; i < anyCount; i++) {
      const el = anySwatch.nth(i);
      if (await el.isVisible().catch(() => false)) {
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await el.click({ force: true });
        await this.page.waitForTimeout(1000);
        return;
      }
    }
  }

  /**
   * Selects the button element, opens its Button color setting, and applies the provided color.
   * @param {string} rgbColor - e.g. 'rgb(112, 173, 71)'
   */
  async setButtonColor(rgbColor) {
    // The text element's floating editor toolbar can stay active and intercept clicks,
    // popping up a text-format toolbar instead of the color palette. Dismiss it first
    // by pressing Escape and clicking a neutral area of the editor.
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    const canvas = this.page.locator('.template-content-container').first();
    const cbox = await canvas.boundingBox();
    if (cbox) {
      await this.page.mouse.click(cbox.x + cbox.width - 5, cbox.y + 5);
      await this.page.waitForTimeout(800);
    }

    // Click the rendered Button element (the visible "Button" box) in the canvas to select it.
    // Clicking the actual .eb-default-button (via its center) reliably opens the Button
    // properties panel with its Color section populated.
    const renderedButton = this.page.locator('#root-drop-zone .eb-default-button').last();
    // Wait for the button block to be present. If it's missing (a prior drop didn't
    // land / the canvas re-rendered), re-add it once before failing.
    let buttonVisible = await renderedButton
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (!buttonVisible) {
      console.log('Button element not found before setting color — re-adding it.');
      await this.addButtonElement().catch(() => {});
      buttonVisible = await renderedButton
        .waitFor({ state: 'visible', timeout: 15000 })
        .then(() => true)
        .catch(() => false);
    }
    await renderedButton.scrollIntoViewIfNeeded().catch(() => {});
    const bbox = await renderedButton.boundingBox();
    if (bbox) {
      await this.page.mouse.click(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    } else {
      await renderedButton.click({ force: true });
    }
    await this.page.waitForTimeout(1500);

    // In the properties panel Color section, open the "Button" color swatch.
    // Structure (confirmed from DOM):
    //   .tts-color-row
    //     .layout-card-container
    //       .layout-card-header > .layout-card-label = "Button"
    //       .layout-swatch-section  <-- click this to open the palette
    const buttonCard = await this._openColorSwatch('Button');

    // Select the green palette item scoped to the Button color card's palette.
    //   class="color-pallet dh-custom-color-pallet-item ten ..."
    //   style="background-color: rgb(112, 173, 71); border-color: rgb(112, 173, 71);"
    await this._selectCustomPalletColor(rgbColor, buttonCard);
  }

  /**
   * Selects a color from the custom color palette (.color-pallet.dh-custom-color-pallet-item)
   * matching the exact rgb background-color. Scopes to the given card's palette when provided
   * so we don't pick the same color from a different color control's palette.
   * @param {string} rgbColor
   * @param {import('@playwright/test').Locator} [scope] - the color card whose palette to use
   * @private
   */
  async _selectCustomPalletColor(rgbColor, scope) {
    const selector = `.color-pallet.dh-custom-color-pallet-item[style*="background-color: ${rgbColor}"]`;

    // 1. Prefer items scoped within the given card (the palette that just opened for it).
    if (scope) {
      const scoped = scope.locator(selector);
      const scopedCount = await scoped.count().catch(() => 0);
      for (let i = 0; i < scopedCount; i++) {
        const item = scoped.nth(i);
        if (await item.isVisible().catch(() => false)) {
          await item.scrollIntoViewIfNeeded().catch(() => {});
          const box = await item.boundingBox();
          if (box) await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          else await item.click({ force: true });
          await this.page.waitForTimeout(1200);
          return;
        }
      }
    }

    // 2. Fall back to any visible matching item on the page.
    const items = this.page.locator(selector);
    const count = await items.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      if (await item.isVisible().catch(() => false)) {
        await item.scrollIntoViewIfNeeded().catch(() => {});
        const box = await item.boundingBox();
        if (box) await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        else await item.click({ force: true });
        await this.page.waitForTimeout(1200);
        return;
      }
    }
  }

  /**
   * Opens the color swatch for a given color label ("Text", "Button", "Background",
   * "Button Outline") in the Color section of the properties panel.
   * @param {string} labelText
   * @private
   */
  async _openColorSwatch(labelText) {
    // The card container whose label matches labelText.
    const card = this.page.locator('.layout-card-container').filter({
      has: this.page.locator('.layout-card-label', { hasText: new RegExp(`^${labelText}$`) }),
    });
    await card.first().scrollIntoViewIfNeeded().catch(() => {});

    const swatch = card.first().locator('.layout-swatch-section');

    // Clicking the swatch section opens the color palette. Verify the palette actually
    // opened (color-pallet items become visible); if not, click again (it can need a
    // second activation, and it toggles closed if double-clicked, so we re-check state).
    for (let attempt = 0; attempt < 3; attempt++) {
      const paletteVisible = await this.page.locator('.color-pallet').first().isVisible().catch(() => false);
      if (paletteVisible) break;
      await swatch.click({ force: true });
      await this.page.waitForTimeout(1500);
    }

    // Return the card so callers can scope the palette to this specific color control.
    return card.first();
  }

  /**
   * Clicks Save to persist the template.
   */
  async save() {
    await this.saveButton.click({ force: true });
    await this.page.waitForTimeout(3000);
  }
}

/**
 * Reusable entry point for the Template Creation step.
 * Invoked by the main automation AFTER Advance Logic configuration is complete.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} templateData - { name, textContent, backgroundColor, buttonColor }
 */
async function createEmployeeTemplate(page, templateData) {
  const template = new TemplateCreationPage(page);

  // 1. Re-open sidebar and select Communication Template
  await template.openCommunicationTemplate();

  // 2. Create → enter name → Create Template
  await template.createNewTemplate(templateData.name);

  // 3. Drag Text element into second container and set content
  await template.addTextElement(templateData.textContent);

  // 4. Drag Button element into the same container (below the text)
  await template.addButtonElement();

  // 5. Click the Text element, then set the Background color
  await template.setContainerBackgroundColor(templateData.backgroundColor);

  // 6. Select the Button element and set its color
  await template.setButtonColor(templateData.buttonColor);

  // 7. Save
  await template.save();
}

module.exports = { TemplateCreationPage, createEmployeeTemplate };
