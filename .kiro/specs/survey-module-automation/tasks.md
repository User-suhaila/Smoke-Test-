# Implementation Plan: Survey Module Automation

## Overview

Implement a Playwright + JavaScript end-to-end automation framework following the Page Object Model pattern. The implementation proceeds in layers: project scaffolding → utilities and fixtures → page objects (Login → Dashboard → Builder → Preview) → test spec → configuration and reporting. Each layer is verified before moving to the next.

---

## Tasks

- [x] 1. Scaffold project structure and install dependencies
  - Initialize `package.json` with `npm init -y`
  - Install Playwright: `npm install --save-dev @playwright/test`
  - Install dotenv: `npm install dotenv`
  - Run `npx playwright install chromium` to download the Chromium browser binary
  - Create the directory tree: `tests/`, `pages/`, `fixtures/`, `utils/`
  - Create a `.env.example` file documenting `BASE_URL`, `USERNAME`, `PASSWORD`, `HEADLESS` variables
  - Create a `.gitignore` file that excludes `.env`, `node_modules/`, and `playwright-report/`
  - _Requirements: 1.1, 1.3_

- [x] 2. Create Playwright configuration
  - [x] 2.1 Implement `playwright.config.js`
    - Use `defineConfig` from `@playwright/test`
    - Load `.env` via `dotenv.config()` at the top of the file
    - Set `testDir` to `./tests`
    - Set `use.baseURL` from `process.env.BASE_URL` with fallback to `https://stg-genforms.mobilityeye.com/`
    - Set `use.headless` from `process.env.HEADLESS !== 'false'`
    - Set `use.screenshot` to `'only-on-failure'`
    - Set `use.video` to `'retain-on-failure'`
    - Add a single `projects` entry for `chromium` using `devices['Desktop Chrome']`
    - Set `reporter` to `'html'`
    - _Requirements: 1.4, 10.2, 10.3, 10.4, 10.5_

  - [x] 2.2 Add `package.json` scripts
    - Add `"test": "playwright test"` for headless CI execution
    - Add `"test:headed": "playwright test --headed"` for local debugging
    - Add `"test:report": "playwright show-report"` for viewing the HTML report
    - _Requirements: 10.1, 10.3, 10.4_

- [x] 3. Implement fixtures and utilities
  - [x] 3.1 Create `fixtures/surveyData.js`
    - Export a `surveyData` object with `title: 'Automation Survey'`, `textResponse: 'Playwright Automation Test'`, `singleSelectStrategy: 'first available option'`, `ratingStrategy: 'maximum available rating'`
    - _Requirements: 1.6, 4.1, 8.1_

  - [x] 3.2 Create `utils/helpers.js`
    - Implement `clickWhenReady(locator)`: awaits Playwright auto-wait then clicks the locator
    - Implement `fillWhenReady(locator, value)`: awaits Playwright auto-wait then fills the locator
    - Implement `assertVisible(locator, description)`: uses `expect(locator).toBeVisible()` and surfaces `description` in the error context
    - Do NOT use `page.waitForTimeout` anywhere in this file
    - _Requirements: 1.5_

  - [ ]* 3.3 Write unit tests for `utils/helpers.js`
    - Set up Vitest (or Jest) as the unit test runner
    - Mock the Playwright `locator` object
    - Test that `fillWhenReady` calls `locator.fill` with the correct value
    - Test that `assertVisible` throws/rejects when the locator is not visible
    - _Requirements: 1.5_

- [x] 4. Implement `pages/LoginPage.js`
  - [x] 4.1 Create the `LoginPage` class
    - Constructor accepts a `page` object and assigns locators for `usernameInput`, `passwordInput`, and `submitButton` using the locator strategies from the design (prefer `getByRole` / `getByLabel` over raw CSS; confirm exact selectors against the live app)
    - Implement `navigate()`: calls `this.page.goto('/')`
    - Implement `login(username, password)`: fills username, fills password, clicks submit
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Implement `pages/DashboardPage.js`
  - [x] 5.1 Create the `DashboardPage` class
    - Constructor accepts a `page` object and assigns locators for `dashboardIndicator` and `createNewFormButton`
    - Implement `assertDashboardVisible()`: calls `expect(this.dashboardIndicator).toBeVisible()` with a descriptive failure message
    - Implement `clickCreateNewForm()`: clicks `createNewFormButton`
    - _Requirements: 2.4, 2.5, 3.1, 3.4_

- [x] 6. Implement `pages/SurveyBuilderPage.js`
  - [x] 6.1 Create the `SurveyBuilderPage` class — core locators and navigation methods
    - Constructor accepts a `page` object
    - Define locators: `doItYourselfOption`, `builderCanvas`, `titleInput`, `saveButton`, `saveConfirmation`, `previewButton`
    - Implement `selectDoItYourself()`: clicks `doItYourselfOption`
    - Implement `assertBuilderVisible()`: asserts `builderCanvas` is visible
    - Implement `enterTitle(title)`: fills `titleInput` with `title` then asserts `toHaveValue(title)`
    - _Requirements: 3.2, 3.3, 4.1, 4.2_

  - [x] 6.2 Implement control addition methods on `SurveyBuilderPage`
    - Define locators: `textControlButton`, `singleSelectControlButton`, `ratingControlButton`, `textControlInCanvas`, `singleSelectControlInCanvas`, `ratingControlInCanvas`
    - Implement `addTextControl()`: clicks `textControlButton`, asserts `textControlInCanvas` is visible
    - Implement `addSingleSelectControl()`: clicks `singleSelectControlButton`, populates any mandatory option fields with sample data, asserts `singleSelectControlInCanvas` is visible
    - Implement `addRatingControl()`: clicks `ratingControlButton`, asserts `ratingControlInCanvas` is visible
    - Each method must end with an explicit `expect` assertion; failure surfaces the control type in the error message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 6.3 Implement save and preview methods on `SurveyBuilderPage`
    - Implement `saveSurvey()`: clicks `saveButton`, asserts `saveConfirmation` is visible; failure message must state "Save confirmation not visible"
    - Implement `clickPreview()`: clicks `previewButton`
    - _Requirements: 6.1, 6.2, 6.3, 7.1_

- [x] 7. Implement `pages/SurveyPreviewPage.js`
  - [x] 7.1 Create the `SurveyPreviewPage` class — visibility assertions
    - Constructor accepts a `page` object
    - Define locators: `previewContainer`, `textField`, `singleSelectDropdown`, `singleSelectFirstOption`, `ratingControl`, `ratingMaxOption`, `submitButton`, `successMessage`
    - Implement `assertPreviewVisible()`: asserts `previewContainer` is visible
    - Implement `assertAllControlsVisible()`: asserts `textField`, `singleSelectDropdown`, and `ratingControl` are each visible; failure message must identify the missing control by name
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 7.2 Implement survey fill and submission methods on `SurveyPreviewPage`
    - Implement `fillTextControl(value)`: fills `textField` with `value`
    - Implement `selectFirstSingleSelectOption()`: opens `singleSelectDropdown` and clicks `singleSelectFirstOption`
    - Implement `selectMaxRating()`: clicks `ratingMaxOption`
    - Implement `submit()`: clicks `submitButton`
    - Implement `assertSubmissionSuccess()`: asserts `successMessage` is visible; failure message must state "Submission success message not visible"
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8. Checkpoint — verify page objects compile cleanly
  - Ensure all page class files import correctly with no syntax errors (`node --check pages/*.js`)
  - Ensure all fixtures and helpers import correctly
  - Ask the user if any locator or interaction questions arise before proceeding.

- [x] 9. Implement `tests/survey.spec.js`
  - [x] 9.1 Write the end-to-end test spec
    - Import `test` and `expect` from `@playwright/test`
    - Import all four page classes and `surveyData` fixture
    - Load `.env` via `dotenv.config()` at the top of the file
    - Wrap the test in `test.describe('Survey Module - End to End', ...)`
    - Implement the single test `'Create, save, preview, and submit a survey'` following the sequence from the design's execution flow diagram
    - Add a `test.beforeEach` hook that listens for `page.on('pageerror', ...)` and logs browser-side JavaScript errors to the console
    - Each step must end with an explicit assertion before moving to the next step (no assertion-free transitions)
    - _Requirements: 2.1–2.5, 3.1–3.4, 4.1–4.2, 5.1–5.8, 6.1–6.3, 7.1–7.6, 8.1–8.6, 9.1_

  - [ ]* 9.2 Write unit tests for the test spec's page object wiring
    - Verify that page objects are instantiated with the `page` fixture
    - Verify that methods are called in the correct sequence using mocks
    - _Requirements: 9.2_

- [x] 10. Add error handling and robustness wiring
  - [x] 10.1 Verify browser context cleanup
    - Confirm the Playwright `page` fixture provides automatic context teardown after each test (pass and fail)
    - Add a comment in `survey.spec.js` documenting this behavior
    - _Requirements: 9.2_

  - [x] 10.2 Add unexpected URL assertion helper
    - In `utils/helpers.js`, add an `assertURL(page, urlPattern)` function that calls `expect(page).toHaveURL(urlPattern)`
    - Use this helper in `LoginPage` after `login()` to assert navigation away from the login page
    - _Requirements: 9.3_

- [x] 11. Create documentation
  - [x] 11.1 Create `README.md`
    - Document prerequisites (Node.js version, Playwright version)
    - Document installation steps (`npm install`, `npx playwright install chromium`)
    - Document `.env` setup referencing `.env.example`
    - Document `npm test` (headless), `npm run test:headed` (headed), and `npm run test:report` commands
    - _Requirements: 10.1_

- [x] 12. Final checkpoint — run the full test suite end-to-end
  - Run `npm test` (headless) and confirm the test passes against the staging application
  - Run `npm run test:report` to confirm the HTML report generates correctly
  - Ensure all tests pass, ask the user if questions arise.

---

- [ ] 13. Update fixtures with datastore test data
  - [ ] 13.1 Add `datastoreData` export to `fixtures/surveyData.js`
    - Export a `datastoreData` object with:
      - `name: 'Automation datastore'`
      - `columns: ['Employee Name', 'Employee Email', 'Employee phone number', 'Language', 'Channel']`
      - `employees` array containing four objects with `name`, `email`, `phone`, `language`, `channel` fields
    - Employee data:
      - `{ name: 'Suhaila', email: 'Suhaila@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email' }`
      - `{ name: 'Sneha', email: 'Sneha@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email' }`
      - `{ name: 'Anjana', email: 'Anjana@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email' }`
      - `{ name: 'Sri', email: 'sri@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email' }`
    - _Requirements: 11.7_

- [ ] 14. Implement `pages/DatastorePage.js`
  - [ ] 14.1 Create the `DatastorePage` class — datastore creation methods
    - Constructor accepts a `page` object
    - Define locators:
      - `createDatastoreButton`: `page.getByTitle('Create Datastore ')`
      - `datastoreNameInput`: XPath `//input[@class="mat-mdc-input-element ng-tns-c13-175 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine ng-invalid cdk-text-field-autofill-monitored ng-touched"]`
    - Implement `clickCreateDatastore()`: clicks `createDatastoreButton`
    - Implement `enterDatastoreName(name)`: fills `datastoreNameInput` with the provided name
    - Implement `submitCreateDatastore()`: clicks `createDatastoreButton` again to confirm creation
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 14.2 Implement column configuration methods on `DatastorePage`
    - Define locators for each column input field:
      - `column1Input`: XPath with `ng-tns-c13-181`
      - `column2Input`: XPath with `ng-tns-c13-183`
      - `column3Input`: XPath with `ng-tns-c13-193`
      - `column4Input`: XPath with `ng-tns-c13-195`
      - `column5Input`: XPath with `ng-tns-c13-197`
    - Define `addColumnButton`: `page.locator('//span[@class="mat-mdc-button-touch-target"]')`
    - Implement `configureAllColumns()`:
      - Click `column1Input`, fill with `"Employee Name"`
      - Click `column2Input`, fill with `"Employee Email"`, click + button
      - Click `column3Input`, fill with `"Employee phone number"`, click + button
      - Click `column4Input`, fill with `"Language"`, click + button
      - Click `column5Input`, fill with `"Channel"`
    - _Requirements: 11.5_

  - [ ] 14.3 Implement row population methods on `DatastorePage`
    - Define `addRowButton`: `page.locator('//span[@class="mat-mdc-button-touch-target"]')`
    - Implement `scrollToRowControls()`: scrolls the horizontal scrollbar to make row controls and Add row button accessible
    - Implement `clickAddRow()`: clicks the Add row button
    - Implement `populateRow(rowData)`: fills each cell in the current row with data from the `rowData` object (employeeName, employeeEmail, phoneNumber, language, channel)
    - Implement `addAllEmployeeRows(rows)`: iterates over the rows array, clicking Add row and populating each row in sequence
    - _Requirements: 11.6, 11.7, 11.8_

  - [ ] 14.4 Implement save method on `DatastorePage`
    - Define `saveButton` locator for the Save button at the top-right of the page
    - Implement `saveDatastore()`: clicks the Save button and asserts the datastore is saved successfully
    - Failure message must state "Datastore save confirmation not visible"
    - _Requirements: 11.9, 11.10, 11.11_

- [ ] 15. Implement datastore end-to-end test
  - [ ] 15.1 Write the datastore test in the test spec
    - Add a new test `'Create datastore, configure columns, add employees, and save'` inside the existing `test.describe` block (or a new describe block `'Datastore Module - End to End'`)
    - Import `DatastorePage` and `datastoreData` fixture
    - Precondition: execute login steps (reuse LoginPage)
    - After login, execute the full datastore workflow:
      1. Click Create Datastore button
      2. Enter datastore name
      3. Submit creation
      4. Configure all five columns
      5. Scroll to row controls
      6. Add and populate four employee rows
      7. Save and verify success
    - Each step must end with an explicit assertion before moving to the next step
    - _Requirements: 11.1–11.11_

- [ ] 16. Checkpoint — verify datastore page object compiles cleanly
  - Ensure `pages/DatastorePage.js` imports correctly with no syntax errors (`node --check pages/DatastorePage.js`)
  - Ensure `fixtures/surveyData.js` exports both `surveyData` and `datastoreData` correctly
  - Run the datastore test and verify it passes against the staging application

---

- [ ] 17. Update fixtures with Answer Extension test data
  - [ ] 17.1 Add `answerExtensionData` export to `fixtures/surveyData.js`
    - Export an `answerExtensionData` object with:
      - `title: 'Answer Extension_Employee'`
      - `datastoreName: 'Automation datastore'`
      - `matchAnswer: 'Submitted By'`
      - `matchLabel: 'Employee Email'`
    - _Requirements: 12.10, 12.12, 12.18, 12.20_

- [ ] 18. Implement `pages/AnswerExtensionPage.js`
  - [ ] 18.1 Create the `AnswerExtensionPage` class — navigation and creation
    - Constructor accepts a `page` object
    - Define locators:
      - `answerExtensionOption`: `page.getByText('Answer Extension ')`
      - `createAnswerExtensionButton`: `page.getByText(' Create Answer Extension')`
      - `titleInput`: `page.locator('#mat-input-8')`
    - Implement `clickAnswerExtension()`: clicks the Answer Extension option on the survey card
    - Implement `clickCreateAnswerExtension()`: clicks the Create Answer Extension button
    - Implement `enterTitle(title)`: focuses and fills the title input
    - _Requirements: 12.7, 12.8, 12.9, 12.10_

  - [ ] 18.2 Implement datastore and label selection methods
    - Implement `selectDatastore(datastoreName)`: clicks Select Datastores field, selects the specified datastore
    - Implement `selectAllLabels()`: clicks Select Label, checks Select All, closes the panel
    - _Requirements: 12.11, 12.12, 12.13, 12.14, 12.15, 12.16_

  - [ ] 18.3 Implement answer matching configuration
    - Implement `matchAnswerForLabel()`: clicks Match answer for label, selects "Submitted By", clicks Match Label, selects "Employee Email"
    - _Requirements: 12.17, 12.18, 12.19, 12.20_

  - [ ] 18.4 Implement save methods
    - Implement `clickNext()`: clicks the Next button
    - Implement `saveAnswerExtension()`: clicks Save and asserts success
    - _Requirements: 12.21, 12.22, 12.23, 12.24_

- [ ] 19. Implement Answer Extension end-to-end test
  - [ ] 19.1 Write the Answer Extension test spec
    - Create `tests/Smoke Test.spec.js` (or extend the datastore spec)
    - The test flow:
      1. Login
      2. Create Datastore (reuse DatastorePage)
      3. Create Survey (reuse SurveyBuilderPage — skip answering)
      4. Open survey card options
      5. Click Answer Extension
      6. Create Answer Extension with title "Answer Extension_Employee"
      7. Select the previously created datastore ("Automation datastore")
      8. Select All labels
      9. Match "Submitted By" → "Employee Email"
      10. Next → Save → verify success
      11. Preview and answer the survey (reuse SurveyPreviewPage logic)
    - _Requirements: 12.1–12.29_

- [ ] 20. Checkpoint — verify Answer Extension test passes
  - Ensure `pages/AnswerExtensionPage.js` compiles cleanly
  - Run the Answer Extension test and verify it passes against the staging application

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements clauses for full traceability
- Locator strategies should follow the priority order in the design: `data-testid` → ARIA roles → semantic text → CSS selectors
- No `page.waitForTimeout` calls are permitted anywhere in the codebase — Playwright auto-waiting handles all synchronization
- Credentials (`USERNAME`, `PASSWORD`) must only ever be read from environment variables; never hardcoded
- The `page` fixture handles browser context teardown automatically — no manual cleanup code is needed
- Checkpoints are decision points; raise any blocking questions with the user before proceeding past them
- The DatastorePage uses XPath locators with dynamic `ng-tns-c13-*` classes as specified; these may require adjustment if Angular component IDs change between deployments
- The datastore test reuses the LoginPage for authentication as a precondition before navigating to the datastore creation flow

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "3.2"] },
    { "id": 1, "tasks": ["2.2", "3.3", "4.1"] },
    { "id": 2, "tasks": ["5.1", "6.1"] },
    { "id": 3, "tasks": ["6.2", "7.1"] },
    { "id": 4, "tasks": ["6.3", "7.2"] },
    { "id": 5, "tasks": ["9.1", "10.1", "10.2"] },
    { "id": 6, "tasks": ["9.2", "11.1"] },
    { "id": 7, "tasks": ["13.1", "14.1"] },
    { "id": 8, "tasks": ["14.2", "14.3"] },
    { "id": 9, "tasks": ["14.4", "15.1"] },
    { "id": 10, "tasks": ["16"] },
    { "id": 11, "tasks": ["17.1", "18.1"] },
    { "id": 12, "tasks": ["18.2", "18.3"] },
    { "id": 13, "tasks": ["18.4", "19.1"] },
    { "id": 14, "tasks": ["20"] }
  ]
}
```
