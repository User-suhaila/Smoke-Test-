// tests/templateCreation.spec.js
// Standalone test to verify the Communication Template creation step in isolation.
// Logs in, then runs createEmployeeTemplate() directly (no datastore/survey setup).

'use strict';

const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');

const { LoginPage } = require('../pages/LoginPage');
const { createEmployeeTemplate } = require('../pages/TemplateCreationPage');
const { templateData } = require('../fixtures/surveyData');

dotenv.config({ override: true });

test.describe('Communication Template - Isolated', () => {
  test('Create Employee Template', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    page.on('pageerror', (err) => console.error('Browser error:', err.message));

    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const login = new LoginPage(page);
    await login.navigate();
    await login.login(username, password);
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Run the template creation workflow directly
    await createEmployeeTemplate(page, templateData);
  });
});
