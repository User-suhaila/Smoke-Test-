// utils/helpers.js
// Reusable utility functions shared across page objects.
// Playwright auto-waiting is used throughout — no page.waitForTimeout calls.

const { expect } = require('@playwright/test');

/**
 * Waits for a locator to be actionable then clicks it.
 * Playwright auto-waits for the element to be visible and enabled before clicking.
 *
 * @param {import('@playwright/test').Locator} locator
 */
async function clickWhenReady(locator) {
  await locator.click();
}

/**
 * Waits for a locator to be editable then fills it with the given value.
 * Playwright auto-waits for the element to be visible and editable before filling.
 *
 * @param {import('@playwright/test').Locator} locator
 * @param {string} value
 */
async function fillWhenReady(locator, value) {
  await locator.fill(value);
}

/**
 * Asserts that a locator is visible, surfacing the description in the error context.
 *
 * @param {import('@playwright/test').Locator} locator
 * @param {string} description - Human-readable label shown when the assertion fails
 */
async function assertVisible(locator, description) {
  await expect(locator, description).toBeVisible();
}

/**
 * Asserts that the current page URL matches the given pattern.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp} urlPattern
 */
async function assertURL(page, urlPattern) {
  await expect(page).toHaveURL(urlPattern);
}

module.exports = { clickWhenReady, fillWhenReady, assertVisible, assertURL };
