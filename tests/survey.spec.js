// tests/survey.spec.js
// End-to-end test for the Software Company Role-Based Survey.
// Credentials are read exclusively from environment variables - never hardcoded.

'use strict';

const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const { allure } = require('allure-playwright');

const { LoginPage }         = require('../pages/LoginPage');
const { DashboardPage }     = require('../pages/DashboardPage');
const { SurveyBuilderPage } = require('../pages/SurveyBuilderPage');
const { SurveyPreviewPage } = require('../pages/SurveyPreviewPage');
const { LogicPage }         = require('../pages/LogicPage');
const { surveyData }        = require('../fixtures/surveyData');

dotenv.config({ override: true });

test.describe('Survey Module - End to End', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      console.error('Browser error:', err.message);
      
    });
  });

  test('Create Software Company Role-Based Survey', async ({ page, context }) => {
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const login   = new LoginPage(page);
    const dash    = new DashboardPage(page);
    const builder = new SurveyBuilderPage(page);

    await allure.epic('Survey Module');
    await allure.feature('Role-Based Survey Creation');
    await allure.story('Full Survey Build & Submit');
    await allure.severity('critical');
    await allure.owner('QA Team');

    // 1. Login
    await allure.step('Login to application', async () => {
      await login.navigate();
      await login.login(username, password);
      await dash.assertDashboardVisible();
    });

    // 2. Navigate to survey builder
    await allure.step('Navigate to survey builder', async () => {
      await dash.clickCreateNewForm();
      await builder.selectDoItYourself();
      await builder.assertBuilderVisible();
    });

    // 3. Enter survey title
    await allure.step('Enter survey title', async () => {
      await builder.enterTitle(surveyData.title);
    });

    // 4. Add Section Title
    await allure.step('Add Section Title: General Information', async () => {
      await builder.addSectionTitle(surveyData.sectionTitle);
    });

    // 5. Q1: Single Select - What is your role? (NO eye icon)
    await allure.step('Add Q1: What is your role? (Single Select)', async () => {
      await builder.addSingleSelectControl(surveyData.q1_title);
      await builder.addBulkOptions(surveyData.q1_options);
    });

    // 6. Q2: Rating - Development environment
    await allure.step('Add Q2: Rate development environment (Rating)', async () => {
      await builder.addRatingControl(surveyData.q2_title);
      await builder.clickEyeIcon();
    });

    // 7. Q3: Multiple Select - Technologies
    await allure.step('Add Q3: Technologies you work with (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q3_title);
      await builder.addBulkOptions(surveyData.q3_options);
      await builder.clickEyeIcon();
    });

    // 8. Q4: Multiple Select - Development challenges
    await allure.step('Add Q4: Development challenges (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q4_title);
      await builder.addBulkOptions(surveyData.q4_options);
      await builder.clickEyeIcon();
    });

    // 9. Q5: Multiple Select - Testing types
    await allure.step('Add Q5: Testing types (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q5_title);
      await builder.addBulkOptions(surveyData.q5_options);
      await builder.clickEyeIcon();
    });

    // 10. Q6: Rating - Requirements quality
    await allure.step('Add Q6: Rate requirements quality (Rating)', async () => {
      await builder.addRatingControl(surveyData.q6_title);
      await builder.clickEyeIcon();
    });

    // 11. Q7: Multiple Select - Testing challenges
    await allure.step('Add Q7: Testing challenges (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q7_title);
      await builder.addBulkOptions(surveyData.q7_options);
      await builder.clickEyeIcon();
    });

    // 12. Q8: Multiple Select - Areas you manage
    await allure.step('Add Q8: Areas you manage (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q8_title);
      await builder.addBulkOptions(surveyData.q8_options);
      await builder.clickEyeIcon();
    });

    // 13. Q9: Single Select - How gather requirements
    await allure.step('Add Q9: How gather requirements (Single Select)', async () => {
      await builder.addSingleSelectControl(surveyData.q9_title);
      await builder.addBulkOptions(surveyData.q9_options);
      await builder.clickEyeIcon();
    });

    // 14. Q10: Rating - Requirements clarity
    await allure.step('Add Q10: Requirements clarity (Rating)', async () => {
      await builder.addRatingControl(surveyData.q10_title);
      await builder.clickEyeIcon();
    });

    // 15. Q11: Multiple Select - How do you prioritize product features?
    await allure.step('Add Q11: How do you prioritize product features? (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q11_title);
      await builder.addBulkOptions(surveyData.q11_options);
      await builder.clickEyeIcon();
    });

    // 16. Q12: Multiple Select - Product challenges
    await allure.step('Add Q12: Product challenges (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q12_title);
      await builder.addBulkOptions(surveyData.q12_options);
      await builder.clickEyeIcon();
    });

    // 17. Q13: Multiple Select - Design activities
    await allure.step('Add Q13: Design activities (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q13_title);
      await builder.addBulkOptions(surveyData.q13_options);
      await builder.clickEyeIcon();
    });

    // 18. Q14: Multiple Select - Design process impacts
    await allure.step('Add Q14: Design process impacts (Multiple Select)', async () => {
      await builder.addMultiSelectControl(surveyData.q14_title);
      await builder.addBulkOptions(surveyData.q14_options);
      await builder.clickEyeIcon();
    });

    // 19. Navigate to Logic page and configure rules
    await allure.step('Navigate to Logic page', async () => {
      const logic = new LogicPage(page);
      await logic.navigateToLogic();

      // Select "What is your role?" question
      await allure.step('Add "What is your role?" to logic', async () => {
        await logic.addQuestionToLogic('What is your role?');
      });

      // Rule 1: Developer → Show development questions
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

      // Add row for Rule 2
      await logic.addRow(0);

      // Rule 2: QA Engineer → Show testing questions
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

      // Add row for Rule 3
      await logic.addRow(0);

      // Rule 3: DevOps Engineer → Show DevOps questions
      await allure.step('Configure Rule 3: DevOps Engineer', async () => {
        await logic.configureRule(0, 2, {
          value: 'DevOps Engineer',
          questions: [
            'Which areas do you manage?',
            'How do you gather requirements?',
          ],
        });
      });

      // Add row for Rule 4
      await logic.addRow(0);

      // Rule 4: Business Analyst → Show BA questions
      await allure.step('Configure Rule 4: Business Analyst', async () => {
        await logic.configureRule(0, 3, {
          value: 'Business Analyst',
          questions: [
            'How clear are business requirements before development starts?',
          ],
        });
      });

      // Add row for Rule 5
      await logic.addRow(0);

      // Rule 5: Product Manager → Show PM questions
      await allure.step('Configure Rule 5: Product Manager', async () => {
        await logic.configureRule(0, 4, {
          value: 'Product Manager',
          questions: [
            'How do you prioritize product features?',
          ],
        });
      });

      // Add row for Rule 6
      await logic.addRow(0);

      // Rule 6: Project Manager → Show PM questions
      await allure.step('Configure Rule 6: Project Manager', async () => {
        await logic.configureRule(0, 5, {
          value: 'Project Manager',
          questions: [
            'What are the biggest product challenges?',
          ],
        });
      });

      // Add row for Rule 7
      await logic.addRow(0);

      // Rule 7: UI/UX Designer → Show design questions
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

    // 20. After logic, go to Settings → Publish settings →
    // "Let GENFORMS Agent create declarations" → then Save survey.
    await allure.step('Configure Publish Settings and save', async () => {
      await builder.configurePublishSettings();
    });

    // 20b. Add translations: Translate → select Arabic + Chinese → save.
    await allure.step('Add translations (Arabic, Chinese)', async () => {
      await builder.configureTranslation(surveyData.title);
    });

    // 21. Open preview and verify logic for Developer
    await allure.step('Preview: Verify logic and submit as Developer', async () => {
      const [previewPage1] = await Promise.all([
        context.waitForEvent('page'),
        builder.clickPreview(),
      ]);
      await previewPage1.waitForLoadState('networkidle');
      const preview1 = new SurveyPreviewPage(previewPage1);
      await preview1.assertPreviewVisible();

      await allure.step('Select Developer role', async () => {
        await preview1.selectRadioOption('Developer');
      });

      await allure.step('Verify Developer questions visible', async () => {
        await preview1.assertQuestionVisible('How do you rate your current development environment?');
        await preview1.assertQuestionVisible('Which technologies do you mainly work with?');
        await preview1.assertQuestionVisible('What challenges do you face during development?');
      });

      await allure.step('Answer Developer questions', async () => {
        await preview1.selectRating(9);
        await preview1.selectCheckbox('Frontend technologies');
        await preview1.selectCheckbox('Mobile development');
        await preview1.selectCheckbox('Cloud platforms');
        await preview1.selectCheckbox('Changing requirements');
        await preview1.selectCheckbox('Collaboration issues');
      });

      await allure.step('Submit survey as Developer', async () => {
        await preview1.submit();
        await preview1.assertSubmissionSuccess();
      });

      await preview1.close();
    });

    // 22. Open preview and verify logic for QA Engineer
    await allure.step('Preview: Verify logic and submit as QA Engineer', async () => {
      const [previewPage2] = await Promise.all([
        context.waitForEvent('page'),
        builder.reopenPreview(),
      ]);
      await previewPage2.waitForLoadState('networkidle');
      const preview2 = new SurveyPreviewPage(previewPage2);
      await preview2.assertPreviewVisible();

      await allure.step('Select QA Engineer role', async () => {
        await preview2.selectRadioOption('QA Engineer');
      });

      await allure.step('Verify QA Engineer questions visible', async () => {
        await preview2.assertQuestionVisible('What type of testing do you perform?');
        await preview2.assertQuestionVisible('How do you rate the quality of requirements provided?');
        await preview2.assertQuestionVisible('What are your biggest testing challenges?');
      });

      await allure.step('Answer QA Engineer questions', async () => {
        await preview2.selectCheckbox('Regression testing');
        await preview2.selectCheckbox('UI testing');
        await preview2.selectCheckbox('Security testing');
        await preview2.selectRating(7);
        await preview2.selectCheckbox('Environment issues');
        await preview2.selectCheckbox('Communication gaps');
        await preview2.selectCheckbox('Lack of tools');
      });

      await allure.step('Submit survey as QA Engineer', async () => {
        await preview2.submit();
        await preview2.assertSubmissionSuccess();
      });

      await preview2.close();
    });

    // 23. Open preview and verify logic for UI/UX Designer
    await allure.step('Preview: Verify logic and submit as UI/UX Designer', async () => {
      const [previewPage3] = await Promise.all([
        context.waitForEvent('page'),
        builder.reopenPreview(),
      ]);
      await previewPage3.waitForLoadState('networkidle');
      const preview3 = new SurveyPreviewPage(previewPage3);
      await preview3.assertPreviewVisible();

      await allure.step('Select UI/UX Designer role', async () => {
        await preview3.selectRadioOption('UI/UX Designer');
      });

      await allure.step('Verify UI/UX Designer questions visible', async () => {
        await preview3.assertQuestionVisible('Which design activities do you perform?');
        await preview3.assertQuestionVisible('What impacts your design process?');
      });

      await allure.step('Answer UI/UX Designer questions', async () => {
        await preview3.selectCheckbox('Prototypes');
        await preview3.selectCheckbox('Usability testing');
        await preview3.selectCheckbox('Design systems');
        await preview3.selectCheckbox('Changing requirements');
        await preview3.selectCheckbox('Technical limitations');
        await preview3.selectCheckbox('Lack of design resources');
      });

      await allure.step('Submit survey as UI/UX Designer', async () => {
        await preview3.submit();
        await preview3.assertSubmissionSuccess();
      });

      await preview3.close();
    });

    // 24. Open preview and verify logic for DevOps Engineer
    await allure.step('Preview: Verify logic and submit as DevOps Engineer', async () => {
      const [previewPage4] = await Promise.all([
        context.waitForEvent('page'),
        builder.reopenPreview(),
      ]);
      await previewPage4.waitForLoadState('networkidle');
      const preview4 = new SurveyPreviewPage(previewPage4);
      await preview4.assertPreviewVisible();

      await allure.step('Select DevOps Engineer role', async () => {
        await preview4.selectRadioOption('DevOps Engineer');
      });

      await allure.step('Verify DevOps Engineer questions visible', async () => {
        await preview4.assertQuestionVisible('Which areas do you manage?');
        await preview4.assertQuestionVisible('How do you gather requirements?');
      });

      await allure.step('Answer DevOps Engineer questions', async () => {
        await preview4.selectCheckbox('CI/CD pipelines');
        await preview4.selectCheckbox('Cloud infrastructure');
        await preview4.selectCheckbox('Monitoring');
        await preview4.selectRadioOption('User interviews');
      });

      await allure.step('Submit survey as DevOps Engineer', async () => {
        await preview4.submit();
        await preview4.assertSubmissionSuccess();
      });

      await preview4.close();
    });

    // 25. Open preview and verify logic for Business Analyst
    await allure.step('Preview: Verify logic and submit as Business Analyst', async () => {
      const [previewPage5] = await Promise.all([
        context.waitForEvent('page'),
        builder.reopenPreview(),
      ]);
      await previewPage5.waitForLoadState('networkidle');
      const preview5 = new SurveyPreviewPage(previewPage5);
      await preview5.assertPreviewVisible();

      await allure.step('Select Business Analyst role', async () => {
        await preview5.selectRadioOption('Business Analyst');
      });

      await allure.step('Verify Business Analyst questions visible', async () => {
        await preview5.assertQuestionVisible('How clear are business requirements before development starts?');
      });

      await allure.step('Answer Business Analyst questions', async () => {
        await preview5.selectRating(8);
      });

      await allure.step('Submit survey as Business Analyst', async () => {
        await preview5.submit();
        await preview5.assertSubmissionSuccess();
      });

      await preview5.close();
    });

    // 26. Open preview and verify logic for Product Manager
    await allure.step('Preview: Verify logic and submit as Product Manager', async () => {
      const [previewPage6] = await Promise.all([
        context.waitForEvent('page'),
        builder.reopenPreview(),
      ]);
      await previewPage6.waitForLoadState('networkidle');
      const preview6 = new SurveyPreviewPage(previewPage6);
      await preview6.assertPreviewVisible();

      await allure.step('Select Product Manager role', async () => {
        await preview6.selectRadioOption('Product Manager');
      });

      await allure.step('Verify Product Manager questions visible', async () => {
        await preview6.assertQuestionVisible('How do you prioritize product features?');
      });

      await allure.step('Answer Product Manager questions', async () => {
        await preview6.selectCheckbox('Customer feedback');
        await preview6.selectCheckbox('Business value');
        await preview6.selectCheckbox('Market research');
      });

      await allure.step('Submit survey as Product Manager', async () => {
        await preview6.submit();
        await preview6.assertSubmissionSuccess();
      });

      await preview6.close();
    });

    // 27. Open preview and verify logic for Project Manager
    await allure.step('Preview: Verify logic and submit as Project Manager', async () => {
      const [previewPage7] = await Promise.all([
        context.waitForEvent('page'),
        builder.reopenPreview(),
      ]);
      await previewPage7.waitForLoadState('networkidle');
      const preview7 = new SurveyPreviewPage(previewPage7);
      await preview7.assertPreviewVisible();

      await allure.step('Select Project Manager role', async () => {
        await preview7.selectRadioOption('Project Manager');
      });

      await allure.step('Verify Project Manager questions visible', async () => {
        await preview7.assertQuestionVisible('What are the biggest product challenges?');
      });

      await allure.step('Answer Project Manager questions', async () => {
        await preview7.selectCheckbox('Changing customer needs');
        await preview7.selectCheckbox('Prioritization conflicts');
        await preview7.selectCheckbox('Resource limitations');
      });

      await allure.step('Submit survey as Project Manager', async () => {
        await preview7.submit();
        await preview7.assertSubmissionSuccess();
      });

      await preview7.close();
    });

    // 28. Open Answer Table from the survey card
    await allure.step('Open Answer Table for the survey', async () => {
      await builder.openAnswerTable(surveyData.title);
    });
  });

});
