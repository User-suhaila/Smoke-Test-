// tests/datastore.spec.js
// End-to-end test for Datastore Creation and Population.
// Precondition: Login is performed before datastore operations.
// Credentials are read exclusively from environment variables - never hardcoded.

'use strict';

const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const { allure } = require('allure-playwright');

const { LoginPage }      = require('../pages/LoginPage');
const { DatastorePage }  = require('../pages/DatastorePage');
const { datastoreData }  = require('../fixtures/surveyData');

dotenv.config({ override: true });

test.describe('Datastore Module - End to End', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      console.error('Browser error:', err.message);
    });
  });

  test('Create datastore, configure columns, add employees, and save', async ({ page }) => {
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const login     = new LoginPage(page);
    const datastore = new DatastorePage(page);

    await allure.epic('Datastore Module');
    await allure.feature('Datastore Creation');
    await allure.story('Create Datastore with Employee Records');
    await allure.severity('critical');
    await allure.owner('QA Team');

    // Precondition: Login
    await allure.step('Login to application', async () => {
      await login.navigate();
      await login.login(username, password);
      // Wait for login to complete
      await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    });

    // Navigate to the Datastore page
    await allure.step('Navigate to Datastore page', async () => {
      await datastore.navigateToDatastore();
    });

    // Step 1: Create Datastore
    await allure.step('Click Create Datastore button (opens popup)', async () => {
      await datastore.clickCreateDatastore();
    });

    await allure.step('Enter datastore name: ' + datastoreData.name, async () => {
      await datastore.enterDatastoreName(datastoreData.name);
    });

    await allure.step('Confirm datastore creation (click Create Datastore in popup)', async () => {
      await datastore.submitCreateDatastore();
    });

    // Step 2: Configure Columns
    await allure.step('Configure all five columns', async () => {
      await datastore.configureAllColumns();
    });

    // Step 3: Add Employee Rows
    await allure.step('Scroll to row controls', async () => {
      await datastore.scrollToRowControls();
    });

    await allure.step('Add and populate employee row 1: ' + datastoreData.employees[0].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[0], 0);
    });

    await allure.step('Add and populate employee row 2: ' + datastoreData.employees[1].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[1], 1);
    });

    await allure.step('Add and populate employee row 3: ' + datastoreData.employees[2].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[2], 2);
    });

    await allure.step('Add and populate employee row 4: ' + datastoreData.employees[3].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[3], 3);
    });

    await allure.step('Add and populate employee row 5: ' + datastoreData.employees[4].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[4], 4);
    });

    await allure.step('Add and populate employee row 6: ' + datastoreData.employees[5].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[5], 5);
    });

    await allure.step('Add and populate employee row 7: ' + datastoreData.employees[6].name, async () => {
      await datastore.clickAddRow();
      await datastore.populateRow(datastoreData.employees[6], 6);
    });

    // Step 4: Save
    await allure.step('Save datastore and verify success', async () => {
      await datastore.saveDatastore();
    });
  });

});
