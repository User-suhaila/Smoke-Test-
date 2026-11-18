// tests/Smoke Test.spec.js
// End-to-end test for Answer Extension creation and configuration.
// Flow: Create Datastore → Create Survey (skip answering) → Answer Extension → Preview & Answer
// Credentials are read exclusively from environment variables - never hardcoded.

'use strict';

const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const { allure } = require('allure-playwright');

const { LoginPage }             = require('../pages/LoginPage');
const { DashboardPage }         = require('../pages/DashboardPage');
const { SurveyBuilderPage }     = require('../pages/SurveyBuilderPage');
const { SurveyPreviewPage }     = require('../pages/SurveyPreviewPage');
const { LogicPage }             = require('../pages/LogicPage');
const { DatastorePage }         = require('../pages/DatastorePage');
const { AnswerExtensionPage }   = require('../pages/AnswerExtensionPage');
const { AdvanceLogicPage }     = require('../pages/AdvanceLogicPage');
const { createEmployeeTemplate } = require('../pages/TemplateCreationPage');
const { CampaignPage }         = require('../pages/CampaignPage');
const { surveyData, datastoreData, advanceLogicData, answerExtensionData, templateData, campaignData } = require('../fixtures/surveyData');

dotenv.config({ override: true });

test.describe('Answer Extension Module - End to End', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      console.error('Browser error:', err.message);
    });
  });

  test('Create datastore, create survey, configure Answer Extension, preview and answer', async ({ page, context }) => {
    test.setTimeout(2700000); // 45 minutes for this comprehensive full-cycle test
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const login     = new LoginPage(page);
    const dash      = new DashboardPage(page);
    const builder   = new SurveyBuilderPage(page);
    const datastore = new DatastorePage(page);
    const answerExt = new AnswerExtensionPage(page);

    await allure.epic('Answer Extension Module');
    await allure.feature('Answer Extension Creation');
    await allure.story('Create Datastore → Survey → Answer Extension → Preview');
    await allure.severity('critical');
    await allure.owner('QA Team');

    // ============================
    // STEP 1: Create Datastore
    // ============================
    await allure.step('Login to application', async () => {
      await login.navigate();
      await login.login(username, password);
      await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    });

    await allure.step('Navigate to Datastore page', async () => {
      await datastore.navigateToDatastore();
    });

    await allure.step('Create Datastore: ' + datastoreData.name, async () => {
      await datastore.clickCreateDatastore();
      await datastore.enterDatastoreName(datastoreData.name);
      await datastore.submitCreateDatastore();
    });

    await allure.step('Configure all five columns', async () => {
      await datastore.configureAllColumns();
    });

    await allure.step('Scroll to row controls', async () => {
      await datastore.scrollToRowControls();
    });

    await allure.step('Add employee row 1: ' + datastoreData.employees[0].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[0], 0);
    });

    await allure.step('Add employee row 2: ' + datastoreData.employees[1].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[1], 1);
    });

    await allure.step('Add employee row 3: ' + datastoreData.employees[2].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[2], 2);
    });

    await allure.step('Add employee row 4: ' + datastoreData.employees[3].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[3], 3);
    });

    await allure.step('Add employee row 5: ' + datastoreData.employees[4].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[4], 4);
    });

    await allure.step('Add employee row 6: ' + datastoreData.employees[5].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[5], 5);
    });

    await allure.step('Add employee row 7: ' + datastoreData.employees[6].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[6], 6);
    });

    await allure.step('Save datastore', async () => {
      await datastore.saveDatastore();
    });

    // ============================
    // STEP 2: Create Survey (skip answering)
    // ============================
    await allure.step('Navigate to dashboard', async () => {
      await page.goto('/#/en/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
    });

    await allure.step('Navigate to survey builder', async () => {
      await dash.clickCreateNewForm();
      await builder.selectDoItYourself();
      await builder.assertBuilderVisible();
    });

    await allure.step('Enter survey title', async () => {
      await builder.enterTitle(surveyData.title);
    });

    await allure.step('Add Section Title: General Information', async () => {
      await builder.addSectionTitle(surveyData.sectionTitle);
    });

    // Q1: Single Select - What is your role? (NO eye icon)
    await allure.step('Add Q1: What is your role? (Single Select)', async () => {
      await builder.addSingleSelectControl(surveyData.q1_title);
      await builder.addBulkOptions(surveyData.q1_options);
    });

    // Q2: Rating - Development environment
    await allure.step('Add Q2: Rate development environment (Rating)', async () => {
      await builder.addRatingControl(surveyData.q2_title);
      await builder.clickEyeIcon();
    });

    // Q3: Multiple Select - Technologies
    await allure.step('Add Q3: Technologies you work with (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q3_title);
      await builder.addBulkOptions(surveyData.q3_options);
      await builder.clickEyeIcon();
    });

    // Q4: Multiple Select - Development challenges
    await allure.step('Add Q4: Development challenges (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q4_title);
      await builder.addBulkOptions(surveyData.q4_options);
      await builder.clickEyeIcon();
    });

    // Q5: Multiple Select - Testing types
    await allure.step('Add Q5: Testing types (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q5_title);
      await builder.addBulkOptions(surveyData.q5_options);
      await builder.clickEyeIcon();
    });

    // Q6: Rating - Requirements quality
    await allure.step('Add Q6: Rate requirements quality (Rating)', async () => {
      await builder.addRatingControl(surveyData.q6_title);
      await builder.clickEyeIcon();
    });

    // Q7: Multiple Select - Testing challenges
    await allure.step('Add Q7: Testing challenges (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q7_title);
      await builder.addBulkOptions(surveyData.q7_options);
      await builder.clickEyeIcon();
    });

    // Q8: Multiple Select - Areas you manage
    await allure.step('Add Q8: Areas you manage (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q8_title);
      await builder.addBulkOptions(surveyData.q8_options);
      await builder.clickEyeIcon();
    });

    // Q9: Single Select - How gather requirements
    await allure.step('Add Q9: How gather requirements (Single Select)', async () => {
      await builder.addSingleSelectControl(surveyData.q9_title);
      await builder.addBulkOptions(surveyData.q9_options);
      await builder.clickEyeIcon();
    });

    // Q10: Rating - Requirements clarity
    await allure.step('Add Q10: Requirements clarity (Rating)', async () => {
      await builder.addRatingControl(surveyData.q10_title);
      await builder.clickEyeIcon();
    });

    // Q11: Multiple Select - How do you prioritize product features?
    await allure.step('Add Q11: How do you prioritize product features? (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q11_title);
      await builder.addBulkOptions(surveyData.q11_options);
      await builder.clickEyeIcon();
    });

    // Q12: Multiple Select - Product challenges
    await allure.step('Add Q12: Product challenges (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q12_title);
      await builder.addBulkOptions(surveyData.q12_options);
      await builder.clickEyeIcon();
    });

    // Q13: Multiple Select - Design activities
    await allure.step('Add Q13: Design activities (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q13_title);
      await builder.addBulkOptions(surveyData.q13_options);
      await builder.clickEyeIcon();
    });

    // Q14: Multiple Select - Design process impacts
    await allure.step('Add Q14: Design process impacts (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q14_title);
      await builder.addBulkOptions(surveyData.q14_options);
      await builder.clickEyeIcon();
    });

    // Navigate to Logic page and configure rules
    await allure.step('Navigate to Logic page', async () => {
      const logic = new LogicPage(page);
      await logic.navigateToLogic();

      await allure.step('Add "What is your role?" to logic', async () => {
        await logic.addQuestionToLogic('What is your role?');
      });

      // Rule 1: Developer
      await allure.step('Configure Rule 1: Developer', async () => {
        await logic.configureRule(0, 0, {
          value: 'Developer',
          questions: [
            'How do you rate your current development environment?',
            'Which technologies do you mainly work with?',
            'What challenges do you face during development?',
          ],
        });
      });

      await logic.addRow(0);

      // Rule 2: QA Engineer
      await allure.step('Configure Rule 2: QA Engineer', async () => {
        await logic.configureRule(0, 1, {
          value: 'QA Engineer',
          questions: [
            'What type of testing do you perform?',
            'How do you rate the quality of requirements provided?',
            'What are your biggest testing challenges?',
          ],
        });
      });

      await logic.addRow(0);

      // Rule 3: DevOps Engineer
      await allure.step('Configure Rule 3: DevOps Engineer', async () => {
        await logic.configureRule(0, 2, {
          value: 'DevOps Engineer',
          questions: [
            'Which areas do you manage?',
            'How do you gather requirements?',
          ],
        });
      });

      await logic.addRow(0);

      // Rule 4: Business Analyst
      await allure.step('Configure Rule 4: Business Analyst', async () => {
        await logic.configureRule(0, 3, {
          value: 'Business Analyst',
          questions: [
            'How clear are business requirements before development starts?',
          ],
        });
      });

      await logic.addRow(0);

      // Rule 5: Product Manager
      await allure.step('Configure Rule 5: Product Manager', async () => {
        await logic.configureRule(0, 4, {
          value: 'Product Manager',
          questions: [
            'How do you prioritize product features?',
          ],
        });
      });

      await logic.addRow(0);

      // Rule 6: Project Manager
      await allure.step('Configure Rule 6: Project Manager', async () => {
        await logic.configureRule(0, 5, {
          value: 'Project Manager',
          questions: [
            'What are the biggest product challenges?',
          ],
        });
      });

      await logic.addRow(0);

      // Rule 7: UI/UX Designer
      await allure.step('Configure Rule 7: UI/UX Designer', async () => {
        await logic.configureRule(0, 6, {
          value: 'UI/UX Designer',
          questions: [
            'Which design activities do you perform?',
            'What impacts your design process?',
          ],
        });
      });

      // Click Done to confirm logic configuration
      await allure.step('Confirm logic configuration', async () => {
        await logic.clickDone();
      });
    });

    // Save the survey builder URL so we can navigate back to it later
    let surveyBuilderUrl;

    // Save the survey after logic configuration
    // After skip logic, go to Settings tab → Publish settings →
    // "Let GENFORMS Agent create declarations" → then Save survey.
    await allure.step('Configure Publish Settings and save (GENFORMS Agent declarations)', async () => {
      await builder.configurePublishSettings();
      // Capture the current URL (survey builder) so we can return here later
      surveyBuilderUrl = page.url();
    });

    // Add translations: Translate → select Arabic + Chinese → save.
    await allure.step('Add translations (Arabic, Chinese)', async () => {
      await builder.configureTranslation(surveyData.title);
    });

    // ============================
    // STEP 3: Open Survey Options → Answer Extension
    // ============================
    await allure.step('Open survey card options and select Answer Extension', async () => {
      await answerExt.clickAnswerExtension();
    });

    // ============================
    // STEP 5: Create Answer Extension
    // ============================
    await allure.step('Click Create Answer Extension', async () => {
      await answerExt.clickCreateAnswerExtension();
    });

    // ============================
    // STEP 6: Enter Title
    // ============================
    await allure.step('Enter Answer Extension title: ' + answerExtensionData.title, async () => {
      await answerExt.enterTitle(answerExtensionData.title);
    });

    // ============================
    // STEP 7: Select Datastore
    // ============================
    await allure.step('Select datastore: ' + answerExtensionData.datastoreName, async () => {
      await answerExt.selectDatastore(answerExtensionData.datastoreName);
    });

    // ============================
    // STEP 8: Select Labels
    // ============================
    await allure.step('Select All labels', async () => {
      await answerExt.selectAllLabels();
    });

    // ============================
    // STEP 9: Configure Answer Matching
    // ============================
    await allure.step('Match answer: Submitted By → Employee Email', async () => {
      await answerExt.matchAnswerForLabel();
    });

    // ============================
    // STEP 10: Save Answer Extension
    // ============================
    await allure.step('Click Next', async () => {
      await answerExt.clickNext();
    });

    await allure.step('Save Answer Extension', async () => {
      await answerExt.saveAnswerExtension();
    });

    // ============================
    // STEP 11: Configure Advance Logic
    // ============================
    await allure.step('Open Advance Logic from Survey Card Panel', async () => {
      const advanceLogic = new AdvanceLogicPage(page);
      await advanceLogic.openAdvanceLogic();
    });

    await allure.step('Click Create Advance Logic', async () => {
      const advanceLogic = new AdvanceLogicPage(page);
      await advanceLogic.clickCreateAdvanceLogic();
    });

    await allure.step('Configure all Advance Logic rules (Employee → Role)', async () => {
      const advanceLogic = new AdvanceLogicPage(page);
      await advanceLogic.configureAllRules(advanceLogicData);
    });

    // ============================
    // STEP 12: Template Creation (runs immediately after Advance Logic)
    // ============================
    await allure.step('Create Communication Template: ' + templateData.name, async () => {
      await createEmployeeTemplate(page, templateData);
    });

    // ============================
    // STEP 13: Campaign Creation
    // ============================
    const campaign = new CampaignPage(page);

    await allure.step('Open Campaign from sidebar', async () => {
      await campaign.openCampaign();
    });

    await allure.step('Create Campaign: ' + campaignData.name, async () => {
      await campaign.createCampaign(campaignData.name);
    });

    await allure.step('Set campaign mapping (Name/Email/Mobile)', async () => {
      await campaign.setCampaignMapping(campaignData.mappings);
    });

    await allure.step('Configure email template (Name/Role)', async () => {
      await campaign.configureEmailTemplate(campaignData.templateFields);
    });

    await allure.step('Finish up and Send campaign', async () => {
      await campaign.finishAndSend(campaignData.name);
    });

    // ============================
    // STEP 14: Answer survey from every campaign token (Management)
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
const ROLE_ANSWERS = {
  'Developer': {
    ratings: [5],
    checkboxGroups: [
      ['Frontend technologies', 'Backend technologies'],
      ['Changing requirements', 'Technical complexity'],
    ],
    singleSelects: [],
  },
  'QA Engineer': {
    ratings: [7],
    checkboxGroups: [
      ['Regression testing', 'UI testing', 'Security testing'],
      ['Environment issues', 'Communication gaps', 'Lack of tools'],
    ],
    singleSelects: [],
  },
  'DevOps Engineer': {
    ratings: [],
    checkboxGroups: [
      ['CI/CD pipelines', 'Cloud infrastructure', 'Monitoring'],
    ],
    singleSelects: ['User interviews'],
  },
  'Business Analyst': {
    ratings: [8],
    checkboxGroups: [],
    singleSelects: [],
  },
  'Product Manager': {
    ratings: [],
    checkboxGroups: [
      ['Customer feedback', 'Business value', 'Market research'],
    ],
    singleSelects: [],
  },
  'Project Manager': {
    ratings: [],
    checkboxGroups: [
      ['Changing customer needs', 'Prioritization conflicts', 'Resource limitations'],
    ],
    singleSelects: [],
  },
  'UI/UX Designer': {
    ratings: [],
    checkboxGroups: [
      ['Prototypes', 'Usability testing', 'Design systems'],
      ['Changing requirements', 'Technical limitations', 'Lack of design resources'],
    ],
    singleSelects: [],
  },
};

/**
 * Fully answers the role-based published survey:
 * 1. Reads the pre-selected role (set by advance logic / campaign).
 * 2. Re-triggers skip logic so dependent questions render.
 * 3. Answers every revealed question for that role with exact option text.
 * 4. Falls back to generic answering for any remaining unanswered inputs.
 * @param {import('@playwright/test').Page} page
 */
async function answerPreviewGenerically(page) {
  // The published survey can be slow to render its radio group; a first read may
  // return "" before the DOM hydrates. Poll for a non-empty role, and if it is
  // still empty after polling, reload the page once and poll again. This prevents
  // the "empty role → no answers → missing submit button" failure mode.
  let role = await _waitForRole(page);
  if (!role) {
    await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);
    role = await _waitForRole(page);
  }
  console.log(`  → Detected role: "${role}"`);
  await _retriggerSkipLogic(page);

  const answers = ROLE_ANSWERS[role];
  if (answers) {
    for (const value of answers.ratings) {
      await _clickRating(page, value);
    }
    for (const optionList of answers.checkboxGroups) {
      // Answer at most 3 options per multi-select group — no need to pick more.
      let selectedInGroup = 0;
      for (const optionText of optionList) {
        if (selectedInGroup >= 3) break;
        const cb = page.locator('button.sntms__card, mat-checkbox').filter({ hasText: optionText }).first();
        if (await cb.isVisible().catch(() => false)) {
          await cb.click().catch(() => {});
          selectedInGroup++;
          await page.waitForTimeout(250);
        }
      }
    }
    for (const optionText of answers.singleSelects) {
      const rb = page.locator('button.sntss__card, mat-radio-button').filter({ hasText: optionText }).first();
      if (await rb.isVisible().catch(() => false)) {
        await rb.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }
  }

  await _answerRemainingInputs(page);
}

/**
 * Polls _getSelectedRole until it returns a non-empty value or the timeout is hit.
 * Returns the detected role string (possibly "" if never rendered).
 * @param {import('@playwright/test').Page} page
 * @param {number} timeoutMs
 */
async function _waitForRole(page, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let role = '';
  while (Date.now() < deadline) {
    role = await _getSelectedRole(page);
    if (role) return role;
    await page.waitForTimeout(1000);
  }
  return role;
}

async function _getSelectedRole(page) {
  // Published surveys render single-select as option cards, not mat-radio-button.
  const cardRole = await page.locator('app-snt-q-single-select').first()
    .locator('button.sntss__card.is-selected, button.sntss__card[aria-pressed="true"]')
    .first()
    .innerText()
    .catch(() => '');
  if (cardRole && cardRole.trim()) return cardRole.replace(/\s+/g, ' ').trim();

  return page.evaluate(() => {
    const groups = document.querySelectorAll('mat-radio-group');
    for (const group of groups) {
      const checked = group.querySelector('.mat-mdc-radio-checked, mat-radio-button.mat-radio-checked');
      if (checked) return (checked.textContent || '').trim();
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

async function _clickRating(page, value) {
  const published = page.locator('.sntr').first().locator('button.sntr__star-btn');
  const legacy = page.locator('div.sp-rating-control-svg-container');
  const stars = (await published.count().catch(() => 0)) > 0 ? published : legacy;
  const total = await stars.count().catch(() => 0);
  if (total === 0) return;
  await stars.nth(Math.min(value - 1, total - 1)).click().catch(() => {});
  await page.waitForTimeout(400);
}

async function _retriggerSkipLogic(page) {
  const cards = page.locator('app-snt-q-single-select').first().locator('button.sntss__card');
  const cardCount = await cards.count().catch(() => 0);
  if (cardCount > 0) {
    let selectedIdx = -1;
    for (let i = 0; i < cardCount; i++) {
      const sel = await cards.nth(i).evaluate(
        (el) => el.classList.contains('is-selected') || el.getAttribute('aria-pressed') === 'true'
      ).catch(() => false);
      if (sel) { selectedIdx = i; break; }
    }
    if (selectedIdx === -1) {
      await cards.first().click().catch(() => {});
      await page.waitForTimeout(800);
      return;
    }
    const otherIdx = selectedIdx === 0 ? 1 : 0;
    if (otherIdx < cardCount) {
      await cards.nth(otherIdx).click().catch(() => {});
      await page.waitForTimeout(700);
    }
    await cards.nth(selectedIdx).click().catch(() => {});
    await page.waitForTimeout(1000);
    return;
  }

  const radios = page.locator('mat-radio-group').first().locator('mat-radio-button');
  const count = await radios.count().catch(() => 0);
  if (count === 0) return;
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
    await radios.first().click().catch(() => {});
    await page.waitForTimeout(800);
    return;
  }
  const otherIdx = selectedIdx === 0 ? 1 : 0;
  if (otherIdx < count) {
    await radios.nth(otherIdx).click().catch(() => {});
    await page.waitForTimeout(700);
  }
  await radios.nth(selectedIdx).click().catch(() => {});
  await page.waitForTimeout(1000);
}

async function _answerRemainingInputs(page) {
  const singleGroups = page.locator('app-snt-q-single-select');
  const singleCount = await singleGroups.count().catch(() => 0);
  for (let g = 1; g < singleCount; g++) {
    const group = singleGroups.nth(g);
    if (!await group.isVisible().catch(() => false)) continue;
    const already = await group.locator('button.sntss__card.is-selected, button.sntss__card[aria-pressed="true"]').count().catch(() => 0);
    if (already > 0) continue;
    const first = group.locator('button.sntss__card').first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }

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
  const publishedRatings = page.locator('.sntr');
  const publishedRatingCount = await publishedRatings.count().catch(() => 0);
  for (let r = 0; r < publishedRatingCount; r++) {
    const stars = publishedRatings.nth(r).locator('button.sntr__star-btn');
    const starCount = await stars.count().catch(() => 0);
    if (starCount === 0) continue;
    const already = await publishedRatings.nth(r).locator('button.sntr__star-btn.is-selected, button.sntr__star-btn[aria-pressed="true"]').count().catch(() => 0);
    if (already > 0) continue;
    await stars.nth(Math.min(4, starCount - 1)).click().catch(() => {});
    await page.waitForTimeout(300);
  }
  const stars = page.locator('div.sp-rating-control-svg-container');
  const starCount = await stars.count().catch(() => 0);
  for (let s = 4; s < starCount; s += 10) {
    await stars.nth(s).click().catch(() => {});
    await page.waitForTimeout(300);
  }
  // Multi-select fallback: only ensure each question that has NO checkbox selected
  // gets a minimal answer, and never select more than 3 options within one question.
  // Checkboxes are grouped per question under a common container; we group by the
  // nearest question wrapper so the 3-max cap applies per question, not globally.
  const groupsInfo = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('mat-checkbox'));
    const containerFor = (el) =>
      el.closest('.sp-question, .question-container, [class*="question"]') || el.parentElement;
    const map = new Map();
    boxes.forEach((el, idx) => {
      const c = containerFor(el);
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(idx);
    });
    return Array.from(map.values()).map((indices) => {
      const anyChecked = indices.some((i) => {
        const el = boxes[i];
        return el.classList.contains('mat-mdc-checkbox-checked') || !!el.querySelector('input:checked');
      });
      return { indices, anyChecked };
    });
  }).catch(() => []);

  const allCheckboxes = page.locator('mat-checkbox');
  for (const grp of groupsInfo) {
    if (grp.anyChecked) continue; // question already answered — leave it
    let selected = 0;
    for (const idx of grp.indices) {
      if (selected >= 3) break; // cap at 3 per question
      const cb = allCheckboxes.nth(idx);
      if (!await cb.isVisible().catch(() => false)) continue;
      await cb.click().catch(() => {});
      selected++;
      await page.waitForTimeout(250);
    }
  }

  // Published multi-select uses option cards (button.sntms__card), grouped per question.
  const multiGroups = page.locator('app-snt-q-multi-select');
  const multiCount = await multiGroups.count().catch(() => 0);
  for (let i = 0; i < multiCount; i++) {
    const group = multiGroups.nth(i);
    if (!await group.isVisible().catch(() => false)) continue;
    const already = await group.locator('button.sntms__card[aria-pressed="true"], button.sntms__card.is-selected').count().catch(() => 0);
    if (already > 0) continue;
    const cards = group.locator('button.sntms__card');
    const cardCount = await cards.count().catch(() => 0);
    const toSelect = Math.min(3, cardCount);
    for (let c = 0; c < toSelect; c++) {
      await cards.nth(c).click().catch(() => {});
      await page.waitForTimeout(250);
    }
  }
}
