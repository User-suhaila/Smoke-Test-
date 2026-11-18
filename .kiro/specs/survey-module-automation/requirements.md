# Requirements Document

## Introduction

This document specifies the requirements for a Playwright + JavaScript end-to-end automation framework that automates the complete survey creation and submission workflow on the application hosted at `https://stg-genforms.mobilityeye.com/`. The framework follows the Page Object Model (POM) pattern, separates concerns across pages, utilities, test data, and test cases, and avoids hardcoded waits by relying on Playwright's built-in auto-waiting and explicit assertions.

## Glossary

- **Framework**: The Playwright + JavaScript automation framework being built.
- **Application**: The web application hosted at `https://stg-genforms.mobilityeye.com/`.
- **POM**: Page Object Model — a design pattern that creates an object repository for web UI elements, separating locators and page interactions from test logic.
- **LoginPage**: The page object class responsible for authentication interactions.
- **DashboardPage**: The page object class responsible for dashboard interactions.
- **SurveyBuilderPage**: The page object class responsible for survey creation and control interactions.
- **SurveyPreviewPage**: The page object class responsible for survey preview and submission interactions.
- **Control**: An interactive UI element added to a survey (e.g., Text, Single Select, Rating).
- **Survey**: A form created within the Application consisting of a title and one or more Controls.
- **Test Runner**: Playwright Test, the built-in test runner for Playwright.
- **Config**: The `playwright.config.js` file that defines browser settings, base URL, and environment configuration.
- **Fixtures**: The `fixtures/surveyData.js` file that stores all test data used across tests.
- **Helpers**: The `utils/helpers.js` file that provides reusable utility functions.
- **Headless Mode**: Browser execution without a visible UI window.
- **Headed Mode**: Browser execution with a visible UI window.

---

## Requirements

### Requirement 1: Project Structure and Configuration

**User Story:** As a QA engineer, I want a well-structured automation project, so that the codebase is maintainable, scalable, and easy to extend.

#### Acceptance Criteria

1. THE Framework SHALL organize source files following this folder structure:
   ```
   project/
   ├── tests/
   │   └── survey.spec.js
   ├── pages/
   │   ├── LoginPage.js
   │   ├── DashboardPage.js
   │   ├── SurveyBuilderPage.js
   │   └── SurveyPreviewPage.js
   ├── fixtures/
   │   └── surveyData.js
   ├── utils/
   │   └── helpers.js
   ├── playwright.config.js
   └── package.json
   ```
2. THE Framework SHALL implement the Page Object Model pattern, encapsulating all page-specific locators and interactions within their respective page classes.
3. THE Framework SHALL store application credentials and the base URL in environment variables or a `.env` configuration file, and SHALL NOT hardcode credentials in any source file.
4. THE Config SHALL define Chromium as the target browser and support both headless and headed execution modes via a configurable flag.
5. THE Framework SHALL use Playwright's built-in auto-waiting mechanisms and explicit `expect` assertions, and SHALL NOT use hardcoded `page.waitForTimeout` calls for synchronization.
6. THE Fixtures file SHALL export survey test data including the survey title `"Automation Survey"`, the text response `"Playwright Automation Test"`, the single select strategy `"first available option"`, and the rating strategy `"maximum available rating"`.

---

### Requirement 2: Authentication

**User Story:** As a QA engineer, I want the automation to log in with valid credentials, so that subsequent test steps can access protected application pages.

#### Acceptance Criteria

1. WHEN the test suite starts, THE LoginPage SHALL navigate the browser to the application URL defined in the Config.
2. WHEN the application URL is loaded, THE LoginPage SHALL populate the username field and the password field with credentials sourced from environment variables or the Config.
3. WHEN credentials are submitted, THE LoginPage SHALL trigger the login action by clicking the submit control.
4. WHEN login succeeds, THE DashboardPage SHALL assert that the dashboard element is visible, confirming a successful authentication.
5. IF the dashboard element is not visible after login, THEN THE Framework SHALL fail the test with a descriptive assertion error message.

---

### Requirement 3: Survey Creation Navigation

**User Story:** As a QA engineer, I want the automation to navigate to the survey creation flow, so that a new survey can be built programmatically.

#### Acceptance Criteria

1. WHEN the dashboard is displayed, THE DashboardPage SHALL locate and click the "Create a new form" element.
2. WHEN the "Create a new form" action is triggered, THE SurveyBuilderPage SHALL locate and click the "Do it yourself" option.
3. WHEN the "Do it yourself" option is selected, THE SurveyBuilderPage SHALL assert that the survey builder interface is visible.
4. IF the "Create a new form" element is not found on the dashboard, THEN THE Framework SHALL fail the test with a descriptive assertion error message.

---

### Requirement 4: Survey Title Entry

**User Story:** As a QA engineer, I want the automation to enter the survey title, so that the survey is identifiable by name.

#### Acceptance Criteria

1. WHEN the survey builder interface is visible, THE SurveyBuilderPage SHALL locate the title input field and populate it with the value `"Automation Survey"` from the Fixtures.
2. WHEN the title is entered, THE SurveyBuilderPage SHALL assert that the title input field contains the value `"Automation Survey"`.

---

### Requirement 5: Adding Survey Controls

**User Story:** As a QA engineer, I want the automation to add the required controls to the survey in the correct order, so that the survey has the expected structure.

#### Acceptance Criteria

1. WHEN the survey builder interface is active, THE SurveyBuilderPage SHALL add a Text control as the first control in the survey.
2. WHEN the Text control is added, THE SurveyBuilderPage SHALL assert that the Text control is present in the survey canvas.
3. WHEN the Text control is confirmed, THE SurveyBuilderPage SHALL add a Single Select control as the second control in the survey.
4. WHEN the Single Select control is added, THE SurveyBuilderPage SHALL assert that the Single Select control is present in the survey canvas.
5. WHEN the Single Select control is confirmed, THE SurveyBuilderPage SHALL add a Rating control as the third control in the survey.
6. WHEN the Rating control is added, THE SurveyBuilderPage SHALL assert that the Rating control is present in the survey canvas.
7. IF a control addition action does not result in the control appearing in the survey canvas, THEN THE Framework SHALL fail the test with a descriptive assertion error message identifying the missing control type.
8. WHERE a Control requires mandatory configuration fields, THE SurveyBuilderPage SHALL populate those fields with valid sample data before proceeding to the next step.

---

### Requirement 6: Saving the Survey

**User Story:** As a QA engineer, I want the automation to save the survey, so that the survey persists and can be previewed or submitted.

#### Acceptance Criteria

1. WHEN all required controls have been added, THE SurveyBuilderPage SHALL locate and click the Save button.
2. WHEN the Save action is triggered, THE SurveyBuilderPage SHALL assert that a success message or confirmation indicator is visible, confirming the survey was saved.
3. IF no success message or confirmation indicator appears after the Save action, THEN THE Framework SHALL fail the test with a descriptive assertion error message.

---

### Requirement 7: Previewing the Survey

**User Story:** As a QA engineer, I want the automation to preview the survey, so that the correct controls are confirmed to be present before submission.

#### Acceptance Criteria

1. WHEN the survey is saved, THE SurveyBuilderPage SHALL locate and click the Preview button.
2. WHEN the Preview button is clicked, THE SurveyPreviewPage SHALL assert that the preview interface is visible.
3. WHEN the preview interface is visible, THE SurveyPreviewPage SHALL assert that the Text control is rendered in the preview.
4. WHEN the preview interface is visible, THE SurveyPreviewPage SHALL assert that the Single Select control is rendered in the preview.
5. WHEN the preview interface is visible, THE SurveyPreviewPage SHALL assert that the Rating control is rendered in the preview.
6. IF any of the three controls is not visible in the preview, THEN THE Framework SHALL fail the test with a descriptive assertion error message identifying which control is missing.

---

### Requirement 8: Submitting the Survey

**User Story:** As a QA engineer, I want the automation to fill in and submit the survey, so that the end-to-end submission workflow is validated.

#### Acceptance Criteria

1. WHEN the preview interface is active, THE SurveyPreviewPage SHALL populate the Text control with the value `"Playwright Automation Test"` from the Fixtures.
2. WHEN the Text control is populated, THE SurveyPreviewPage SHALL select the first available option in the Single Select control.
3. WHEN the Single Select option is chosen, THE SurveyPreviewPage SHALL select the highest available rating in the Rating control.
4. WHEN all controls are filled, THE SurveyPreviewPage SHALL locate and click the Submit button.
5. WHEN the Submit action is triggered, THE SurveyPreviewPage SHALL assert that a success confirmation message is visible, confirming the survey submission was accepted.
6. IF the success confirmation message is not visible after submission, THEN THE Framework SHALL fail the test with a descriptive assertion error message.

---

### Requirement 9: Error Handling and Robustness

**User Story:** As a QA engineer, I want the framework to handle unexpected situations gracefully, so that test failures are clearly reported and do not leave the browser in an inconsistent state.

#### Acceptance Criteria

1. WHEN an unhandled exception occurs during test execution, THE Framework SHALL catch the exception and report it with a descriptive error message before the test is marked as failed.
2. THE Framework SHALL ensure that the browser context is closed after each test run, regardless of whether the test passes or fails.
3. IF a page navigation results in an unexpected URL, THEN THE Framework SHALL fail the test with a descriptive assertion error message including the actual URL and the expected URL pattern.

---

### Requirement 10: Execution and Reporting

**User Story:** As a QA engineer, I want clear execution instructions and reporting, so that any team member can run the tests and interpret the results.

#### Acceptance Criteria

1. THE Framework SHALL include a `README.md` file that documents installation steps, environment variable configuration, and commands to run tests in both headless and headed modes.
2. THE Config SHALL configure Playwright to generate an HTML test report after each test run.
3. WHEN tests are executed in headless mode, THE Framework SHALL run without requiring a visible browser window.
4. WHEN tests are executed in headed mode, THE Framework SHALL display the browser window during execution.
5. THE Config SHALL specify Chromium as the sole browser for test execution.

---

### Requirement 11: Datastore Creation and Population

**User Story:** As a QA engineer, I want the automation to create a new datastore, configure its columns, populate employee records, and save it, so that the datastore workflow is validated end-to-end.

**Preconditions:** The existing automation steps up to and including the Login button click SHALL have been executed successfully. After successful login, the steps below SHALL be performed.

#### Acceptance Criteria

##### Step 1: Create Datastore

1. WHEN the user is logged in, THE Framework SHALL click the "Create Datastore" button using the locator `getByTitle('Create Datastore ')`.
2. WHEN the Create Datastore dialog is displayed, THE Framework SHALL locate the Enter name field using the XPath locator:
   ```
   //input[@class="mat-mdc-input-element ng-tns-c13-175 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine ng-invalid cdk-text-field-autofill-monitored ng-touched"]
   ```
3. WHEN the name field is located, THE Framework SHALL enter the value `"Automation datastore"`.
4. WHEN the name is entered, THE Framework SHALL click the "Create Datastore" button again using `getByTitle('Create Datastore ')`.

##### Step 2: Configure Columns

5. WHEN the datastore is created, THE Framework SHALL configure five columns in the following order:

   **Column 1 — Employee Name:**
   - Click the first Column name field using:
     ```
     //input[@class="mat-mdc-input-element ng-tns-c13-181 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine cdk-text-field-autofill-monitored ng-invalid ng-touched"]
     ```
   - Enter: `"Employee Name"`

   **Column 2 — Employee Email:**
   - Click the next Column name field using:
     ```
     //input[@class="mat-mdc-input-element ng-tns-c13-183 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine cdk-text-field-autofill-monitored ng-invalid ng-touched"]
     ```
   - Enter: `"Employee Email"`
   - Click the + button using: `//span[@class="mat-mdc-button-touch-target"]`

   **Column 3 — Employee phone number:**
   - Click the new Column name field using:
     ```
     //input[@class="mat-mdc-input-element ng-tns-c13-193 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine cdk-text-field-autofill-monitored ng-invalid ng-touched"]
     ```
   - Enter: `"Employee phone number"`
   - Click the + button using: `//span[@class="mat-mdc-button-touch-target"]`

   **Column 4 — Language:**
   - Click the new Column name field using:
     ```
     //input[@class="mat-mdc-input-element ng-tns-c13-195 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine cdk-text-field-autofill-monitored ng-invalid ng-touched"]
     ```
   - Enter: `"Language"`
   - Click the + button using: `//span[@class="mat-mdc-button-touch-target"]`

   **Column 5 — Channel:**
   - Click the new Column name field using:
     ```
     //input[@class="mat-mdc-input-element ng-tns-c13-197 ltr mat-mdc-form-field-input-control mdc-text-field__input ng-pristine cdk-text-field-autofill-monitored ng-invalid ng-touched"]
     ```
   - Enter: `"Channel"`

##### Step 3: Add Employee Rows

6. WHEN columns are configured, THE Framework SHALL use the horizontal scrollbar to scroll to the required position so that row controls and the Add row button are accessible.

7. THE Framework SHALL click the Add row button using `//span[@class="mat-mdc-button-touch-target"]` and populate four employee records in sequence:

   **Row 1:**
   | Column | Value |
   |--------|-------|
   | Employee Name | Suhaila |
   | Employee Email | Suhaila@mobilityeye.com |
   | Employee phone number | 0565106373 |
   | Language | En |
   | Channel | Email |

   **Row 2:**
   | Column | Value |
   |--------|-------|
   | Employee Name | Sneha |
   | Employee Email | Sneha@mobilityeye.com |
   | Employee phone number | 0565106373 |
   | Language | En |
   | Channel | Email |

   **Row 3:**
   | Column | Value |
   |--------|-------|
   | Employee Name | Anjana |
   | Employee Email | Anjana@mobilityeye.com |
   | Employee phone number | 0565106373 |
   | Language | En |
   | Channel | Email |

   **Row 4:**
   | Column | Value |
   |--------|-------|
   | Employee Name | Sri |
   | Employee Email | sri@mobilityeye.com |
   | Employee phone number | 0565106373 |
   | Language | En |
   | Channel | Email |

8. FOR each row, THE Framework SHALL click the Add row button before populating the row fields.

##### Step 4: Save

9. WHEN all four rows have been populated, THE Framework SHALL click the Save button located at the top-right of the page.
10. WHEN the Save action is triggered, THE Framework SHALL verify that the datastore is saved successfully.
11. IF the datastore is not saved successfully, THEN THE Framework SHALL fail the test with a descriptive assertion error message.

#### Expected Result

- The datastore `"Automation datastore"` SHALL be created with five columns: Employee Name, Employee Email, Employee phone number, Language, Channel.
- The datastore SHALL contain four employee records:
  - Suhaila — Suhaila@mobilityeye.com — 0565106373 — En — Email
  - Sneha — Sneha@mobilityeye.com — 0565106373 — En — Email
  - Anjana — Anjana@mobilityeye.com — 0565106373 — En — Email
  - Sri — sri@mobilityeye.com — 0565106373 — En — Email
- The datastore SHALL be successfully saved after all records are entered.

---

### Requirement 12: Answer Extension Creation and Configuration

**User Story:** As a QA engineer, I want the automation to create an Answer Extension linked to the previously created datastore, configure it with label matching, and then preview and answer the survey, so that the end-to-end Answer Extension workflow is validated.

**Preconditions:** The datastore creation (Requirement 11) SHALL have been completed successfully. The survey creation (Requirements 3–6) SHALL be performed after the datastore, but the survey answering/submission step SHALL be skipped.

#### Acceptance Criteria

##### Step 1: Create Datastore

1. THE Framework SHALL complete the existing datastore creation flow (Requirement 11) before proceeding.
2. THE Framework SHALL retain a reference to the created datastore name (`"Automation datastore"`) for use in subsequent steps.

##### Step 2: Create the Survey (Skip Answering)

3. THE Framework SHALL create the survey following the existing survey creation flow (Requirements 3–6).
4. WHEN the survey is saved, THE Framework SHALL skip the survey preview and submission steps (Requirements 7–8) at this point.

##### Step 3: Open Survey Options and Select Answer Extension

5. WHEN the survey is created and saved, THE Framework SHALL locate the survey card on the dashboard or builder.
6. IF the survey card's options panel is not already open, THE Framework SHALL click on the survey card to open the options.
7. WHEN the options panel is visible, THE Framework SHALL click "Answer Extension" using the locator:
   ```
   getByText('Answer Extension ')
   ```

##### Step 4: Create the Answer Extension

8. WHEN the Answer Extension panel is displayed, THE Framework SHALL click the "Create Answer Extension" button using the locator:
   ```
   getByText(' Create Answer Extension')
   ```

##### Step 5: Enter the Answer Extension Title

9. WHEN the Answer Extension creation form is displayed, THE Framework SHALL focus the "Enter Title" field using the locator:
   ```
   #mat-input-8
   ```
10. THE Framework SHALL enter the value `"Answer Extension_Employee"` in the title field.

##### Step 6: Select the Datastore

11. THE Framework SHALL click the "Select Datastores" field.
12. THE Framework SHALL select the datastore created in Step 1 (`"Automation datastore"`).
13. THE Framework SHALL NOT create or select a different datastore — it must use the previously created one.

##### Step 7: Select Labels

14. THE Framework SHALL click the "Select Label" field.
15. THE Framework SHALL select/check "Select All" to include all labels.
16. THE Framework SHALL close the label-selection panel.

##### Step 8: Configure Answer Matching

17. THE Framework SHALL click "Match answer for the label".
18. THE Framework SHALL select "Submitted By".
19. THE Framework SHALL click "Match Label".
20. THE Framework SHALL select "Employee Email".

##### Step 9: Save the Answer Extension

21. THE Framework SHALL click the "Next" button.
22. WHEN the following screen is displayed, THE Framework SHALL click "Save".
23. THE Framework SHALL verify that the Answer Extension is successfully created.
24. IF the Answer Extension is not saved successfully, THEN THE Framework SHALL fail the test with a descriptive assertion error message.

##### Step 10: Preview and Answer the Survey

25. THE Framework SHALL open the survey Preview.
26. THE Framework SHALL answer the survey using the same answering logic and data flow as defined in Requirement 8 (fill Text control, select first Single Select option, select max Rating, and submit).
27. THE Framework SHALL NOT introduce a separate or different answering logic for this flow.
28. THE Framework SHALL verify that the Answer Extension configuration is applied correctly during the preview/answering flow.
29. THE Framework SHALL assert that the submission is successful.

#### Expected Result

- The automation SHALL perform the following sequence:
  Create Datastore → Create Survey → Skip Survey Answering → Open Survey Options → Answer Extension → Create Answer Extension → Enter "Answer Extension_Employee" → Select Previously Created Datastore ("Automation datastore") → Select All Labels → Match "Submitted By" with "Employee Email" → Next → Save → Preview → Answer Using Previous-Step Logic
- The Answer Extension `"Answer Extension_Employee"` SHALL be linked to the datastore `"Automation datastore"`.
- The survey preview and submission SHALL succeed with the Answer Extension configuration applied.
