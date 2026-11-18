// tests/campaignCreation.spec.js
// End-to-end Campaign automation:
//  1. Create "Company Based Campaign" (first survey + first datastore)
//  2. Map campaign fields to datastore fields
//  3. Configure the email template (Name -> Employee name, Role -> Employee Role)
//  4. Finish up and Send
//  5. Open Management and process EVERY token: open preview, answer, submit
//
// Credentials are read exclusively from environment variables.

'use strict';

const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const { allure } = require('allure-playwright');

const { LoginPage } = require('../pages/LoginPage');
const { CampaignPage } = require('../pages/CampaignPage');
const { SurveyPreviewPage } = require('../pages/SurveyPreviewPage');
const { campaignData } = require('../fixtures/surveyData');

dotenv.config({ override: true });

test.describe('Campaign Module - End to End', () => {
  test('Create campaign, map datastore, configure template, send, and process all tokens', async ({ page, context }) => {
    test.setTimeout(1200000); // 20 minutes

    page.on('pageerror', (err) => console.error('Browser error:', err.message));

    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const login = new LoginPage(page);
    const campaign = new CampaignPage(page);

    await allure.epic('Campaign Module');
    await allure.feature('Campaign Creation and Token Processing');
    await allure.severity('critical');

    // ============================
    // Login
    // ============================
    await allure.step('Login to application', async () => {
      await login.navigate();
      await login.login(username, password);
      await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
      await page.waitForTimeout(3000);
    });

    // ============================
    // STEP 2: Campaign creation
    // ============================
    await allure.step('Open Campaign from sidebar', async () => {
      await campaign.openCampaign();
    });

    await allure.step('Create Campaign: ' + campaignData.name, async () => {
      await campaign.createCampaign(campaignData.name);
    });

    // ============================
    // STEP 3: Campaign mapping
    // ============================
    await allure.step('Set campaign mapping (Name/Email/Mobile)', async () => {
      await campaign.setCampaignMapping(campaignData.mappings);
    });

    // ============================
    // STEP 4: Email template configuration
    // ============================
    await allure.step('Configure email template (Name/Role)', async () => {
      await campaign.configureEmailTemplate(campaignData.templateFields);
    });

    // ============================
    // STEP 5: Finish and send
    // ============================
    await allure.step('Finish up and Send campaign', async () => {
      await campaign.finishAndSend(campaignData.name);
    });

    // ============================
    // STEP 6: Management and token processing
    // ============================
    await allure.step('Open Management for the campaign', async () => {
      await campaign.openManagement(campaignData.name);
    });

    await allure.step('Process every token (open preview, answer, submit)', async () => {
      await campaign.processAllTokens(context, async (previewPage, index) => {
        await allure.step('Answer and submit token #' + (index + 1), async () => {
          const preview = new SurveyPreviewPage(previewPage);
          await preview.assertPreviewVisible();
          await answerPreviewGenerically(previewPage);
          await preview.submit();
          await preview.assertSubmissionSuccess();
        });
      });
    });
  });
});

// ─── Per-role answer maps ────────────────────────────────────────────────────
// Skip-logic rules (from LogicPage config):
//   Developer     → Q2 Rating, Q3 Multi, Q4 Multi
//   QA Engineer   → Q5 Multi, Q6 Rating, Q7 Multi
//   DevOps Engineer → Q8 Multi, Q9 Single
//   Business Analyst → Q10 Rating
//   Product Manager  → Q11 Multi
//   Project Manager  → Q12 Multi
//   UI/UX Designer   → Q13 Multi, Q14 Multi
const ROLE_ANSWERS = {
  'Developer': {
    ratings: [5],                          // Q2
    checkboxGroups: [
      ['Frontend technologies', 'Backend technologies'],   // Q3
      ['Changing requirements', 'Technical complexity'],   // Q4
    ],
    singleSelects: [],
  },
  'QA Engineer': {
    ratings: [7],                          // Q6
    checkboxGroups: [
      ['Regression testing', 'UI testing', 'Security testing'],  // Q5
      ['Environment issues', 'Communication gaps', 'Lack of tools'], // Q7
    ],
    singleSelects: [],
  },
  'DevOps Engineer': {
    ratings: [],
    checkboxGroups: [
      ['CI/CD pipelines', 'Cloud infrastructure', 'Monitoring'], // Q8
    ],
    singleSelects: ['User interviews'],    // Q9
  },
  'Business Analyst': {
    ratings: [8],                          // Q10
    checkboxGroups: [],
    singleSelects: [],
  },
  'Product Manager': {
    ratings: [],
    checkboxGroups: [
      ['Customer feedback', 'Business value', 'Market research'], // Q11
    ],
    singleSelects: [],
  },
  'Project Manager': {
    ratings: [],
    checkboxGroups: [
      ['Changing customer needs', 'Prioritization conflicts', 'Resource limitations'], // Q12
    ],
    singleSelects: [],
  },
  'UI/UX Designer': {
    ratings: [],
    checkboxGroups: [
      ['Prototypes', 'Usability testing', 'Design systems'],          // Q13
      ['Changing requirements', 'Technical limitations', 'Lack of design resources'], // Q14
    ],
    singleSelects: [],
  },
};

/**
 * Fully answers the role-based published survey:
 * 1. Reads the pre-selected role (set by advance logic / campaign).
 * 2. Re-triggers skip logic: selects a different role then back, so dependent
 *    questions render.
 * 3. Answers every revealed question for that role using exact option text.
 * 4. Falls back to generic answering for any remaining unanswered inputs.
 *
 * @param {import('@playwright/test').Page} page
 */
async function answerPreviewGenerically(page) {
  // ── Step 1: Read the currently pre-selected role ──────────────────────────
  const role = await _getSelectedRole(page);
  console.log(`  → Detected role: "${role}"`);

  // ── Step 2: Re-trigger skip logic ─────────────────────────────────────────
  await _retriggerSkipLogic(page);

  // ── Step 3: Answer role-specific questions ────────────────────────────────
  const answers = ROLE_ANSWERS[role];
  if (answers) {
    // Ratings — each value maps to clicking the nth star (1-based → index value-1)
    for (const value of answers.ratings) {
      const stars = page.locator('div.sp-rating-control-svg-container');
      const total = await stars.count().catch(() => 0);
      if (total > 0) {
        const idx = Math.min(value - 1, total - 1);
        await stars.nth(idx).click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    // Multi-select checkboxes — click each named option
    for (const optionList of answers.checkboxGroups) {
      for (const optionText of optionList) {
        const cb = page.locator('mat-checkbox').filter({ hasText: optionText }).first();
        if (await cb.isVisible().catch(() => false)) {
          await cb.click().catch(() => {});
          await page.waitForTimeout(250);
        }
      }
    }

    // Single-select radios (non-role, e.g. Q9 for DevOps)
    for (const optionText of answers.singleSelects) {
      const rb = page.locator('mat-radio-button').filter({ hasText: optionText }).first();
      if (await rb.isVisible().catch(() => false)) {
        await rb.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }
  }

  // ── Step 4: Fallback — answer any remaining unanswered inputs ─────────────
  // This handles cases where role detection failed or questions differ in DOM.
  await _answerRemainingInputs(page);
}

/**
 * Reads the text of the currently selected mat-radio-button in the first
 * mat-radio-group (the role question).
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} role name, or '' if nothing selected
 */
async function _getSelectedRole(page) {
  return page.evaluate(() => {
    const groups = document.querySelectorAll('mat-radio-group');
    for (const group of groups) {
      const checked = group.querySelector(
        '.mat-mdc-radio-checked, mat-radio-button.mat-radio-checked'
      );
      if (checked) {
        return (checked.textContent || '').trim();
      }
      // Fallback: check native input inside
      const inputs = group.querySelectorAll('input[type="radio"]');
      for (const inp of inputs) {
        if (inp.checked) {
          const label = inp.closest('mat-radio-button');
          if (label) return (label.textContent || '').trim();
        }
      }
    }
    return '';
  }).catch(() => '');
}

/**
 * Re-triggers skip logic by clicking a different role then back to the original,
 * forcing dependent questions to render. If no role is pre-selected, selects
 * the first option.
 * @param {import('@playwright/test').Page} page
 */
async function _retriggerSkipLogic(page) {
  const radios = page.locator('mat-radio-group').first().locator('mat-radio-button');
  const count = await radios.count().catch(() => 0);
  if (count === 0) return;

  // Find the selected index
  let selectedIdx = -1;
  for (let i = 0; i < count; i++) {
    const sel = await radios.nth(i).evaluate(
      (el) => el.classList.contains('mat-mdc-radio-checked') ||
               el.classList.contains('mat-radio-checked') ||
               !!el.querySelector('input:checked')
    ).catch(() => false);
    if (sel) { selectedIdx = i; break; }
  }

  if (selectedIdx === -1) {
    // Nothing pre-selected — just select the first
    await radios.first().click().catch(() => {});
    await page.waitForTimeout(800);
    return;
  }

  // Click a different option then back to force re-render of dependent questions
  const otherIdx = selectedIdx === 0 ? 1 : 0;
  if (otherIdx < count) {
    await radios.nth(otherIdx).click().catch(() => {});
    await page.waitForTimeout(700);
  }
  await radios.nth(selectedIdx).click().catch(() => {});
  await page.waitForTimeout(1000);
}

/**
 * Fallback: answers any remaining unanswered radio groups, ratings, and
 * checkboxes that were not covered by the role-specific logic.
 * @param {import('@playwright/test').Page} page
 */
async function _answerRemainingInputs(page) {
  // Unanswered radio groups (skip the first — that's the role question)
  const groups = page.locator('mat-radio-group');
  const groupCount = await groups.count().catch(() => 0);
  for (let g = 1; g < groupCount; g++) {
    const group = groups.nth(g);
    if (!await group.isVisible().catch(() => false)) continue;
    const hasChecked = await group.evaluate(
      (el) => !!el.querySelector('.mat-mdc-radio-checked, .mat-radio-checked, input:checked')
    ).catch(() => false);
    if (hasChecked) continue;
    const first = group.locator('mat-radio-button').first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  // Unanswered ratings
  const stars = page.locator('div.sp-rating-control-svg-container');
  const starCount = await stars.count().catch(() => 0);
  if (starCount > 0) {
    // Each rating question has 10 stars; click star index 4 (value=5) per group
    for (let s = 4; s < starCount; s += 10) {
      await stars.nth(s).click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  // Unanswered checkboxes — at least 2 per visible group
  const checkboxes = page.locator('mat-checkbox');
  const cbCount = await checkboxes.count().catch(() => 0);
  let clicked = 0;
  for (let i = 0; i < cbCount; i++) {
    const cb = checkboxes.nth(i);
    if (!await cb.isVisible().catch(() => false)) continue;
    const isChecked = await cb.evaluate(
      (el) => el.classList.contains('mat-mdc-checkbox-checked') ||
               !!el.querySelector('input:checked')
    ).catch(() => false);
    if (!isChecked) {
      await cb.click().catch(() => {});
      await page.waitForTimeout(250);
      clicked++;
    }
  }
}
