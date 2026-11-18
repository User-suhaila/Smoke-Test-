// fixtures/surveyData.js
// Central test data for the Software Company Role-Based Survey.

const surveyData = {
  title: 'Software Company Role-Based Survey',
  sectionTitle: 'Section 1: General Information',

  // Question 1: Single Select
  q1_title: 'What is your role?',
  q1_options: [
    'Developer',
    'QA Engineer',
    'DevOps Engineer',
    'Business Analyst',
    'Product Manager',
    'Project Manager',
    'UI/UX Designer',
  ],

  // Question 2: Rating
  q2_title: 'How do you rate your current development environment?',

  // Question 3: Multi Select
  q3_title: 'Which technologies do you mainly work with?',
  q3_options: [
    'Frontend technologies',
    'Backend technologies',
    'Mobile development',
    'Database technologies',
    'Cloud platforms',
    'AI / Machine Learning',
  ],

  // Question 4: Multi Select
  q4_title: 'What challenges do you face during development?',
  q4_options: [
    'Changing requirements',
    'Technical complexity',
    'Performance issues',
    'Lack of documentation',
    'Collaboration issues',
    'Time constraints',
    'Infrastructure issues',
  ],

  // Question 5: Multi Select
  q5_title: 'What type of testing do you perform?',
  q5_options: [
    'Functional testing',
    'Regression testing',
    'API testing',
    'UI testing',
    'Performance testing',
    'Security testing',
    'User acceptance testing',
  ],

  // Question 6: Rating
  q6_title: 'How do you rate the quality of requirements provided?',

  // Question 7: Multi Select
  q7_title: 'What are your biggest testing challenges?',
  q7_options: [
    'Incomplete requirements',
    'Limited testing time',
    'Environment issues',
    'Communication gaps',
    'Test data issues',
    'Lack of tools',
  ],

  // Question 8: Multi Select
  q8_title: 'Which areas do you manage?',
  q8_options: [
    'CI/CD pipelines',
    'Cloud infrastructure',
    'Monitoring',
    'Security',
    'Deployment processes',
    'Container management',
    'Infrastructure automation',
  ],

  // Question 9: Single Select
  q9_title: 'How do you gather requirements?',
  q9_options: [
    'User interviews',
    'Business meetings',
    'Documentation review',
    'Customer feedback',
    'Data analysis',
  ],

  // Question 10: Rating
  q10_title: 'How clear are business requirements before development starts?',

  // Question 11: Multi Select
  q11_title: 'How do you prioritize product features?',
  q11_options: [
    'Customer feedback',
    'Business value',
    'Market research',
    'Technical feasibility',
    'Competitor analysis',
    'Data insights',
  ],

  // Question 12: Multi Select (same title, different options)
  q12_title: 'What are the biggest product challenges?',
  q12_options: [
    'Changing customer needs',
    'Prioritization conflicts',
    'Resource limitations',
    'Market competition',
    'Stakeholder alignment',
  ],

  // Question 13: Multi Select
  q13_title: 'Which design activities do you perform?',
  q13_options: [
    'User research',
    'Wireframes',
    'Prototypes',
    'UI design',
    'Usability testing',
    'Design systems',
  ],

  // Question 14: Multi Select
  q14_title: 'What impacts your design process?',
  q14_options: [
    'Limited user feedback',
    'Changing requirements',
    'Technical limitations',
    'Short timelines',
    'Lack of design resources',
  ],
};

const datastoreData = {
  name: 'Automation datastore',
  columns: ['Employee Name', 'Employee Email', 'Employee phone number', 'Language', 'Channel', 'Employee Role'],
  employees: [
    { name: 'Suhaila', email: 'Suhaila@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'Developer' },
    { name: 'Sneha', email: 'Sneha@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'DevOps Engineer' },
    { name: 'Anjana', email: 'Anjana@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'Product Manager' },
    { name: 'Sri', email: 'sri@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'UI/UX Designer' },
    { name: 'Arshad', email: 'arshad@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'Business Analyst' },
    { name: 'Ismail', email: 'ismail@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'Project Manager' },
    { name: 'Pooja', email: 'pooja@mobilityeye.com', phone: '0565106373', language: 'En', channel: 'Email', role: 'QA Engineer' },
  ],
};

const advanceLogicData = {
  questionField: 'Employee Name',
  condition: 'Equals to',
  action: 'Select Options',
  targetQuestion: 'What is your role?',
  rules: [
    { employee: 'Sneha', role: 'DevOps Engineer' },
    { employee: 'Pooja', role: 'QA Engineer' },
    { employee: 'Arshad', role: 'Business Analyst' },
    { employee: 'Sri', role: 'UI/UX Designer' },
    { employee: 'Ismail', role: 'Project Manager' },
    { employee: 'Suhaila', role: 'Developer' },
    { employee: 'Anjana', role: 'Product Manager' },
  ],
};

const answerExtensionData = {
  title: 'Answer Extension_Employee',
  datastoreName: 'Automation datastore',
  matchAnswer: 'Submitted By',
  matchLabel: 'Employee Email',
};

const templateData = {
  name: 'Employee Template',
  // Exact content and line breaks — placeholders preserved as-is.
  textContent: [
    'Dear ##Name##,',
    'I hope you’re doing well.',
    '',
    'We are conducting a short survey to better understand the experiences, responsibilities, challenges, and feedback of employees across different roles in our company.',
    '',
    'Name: ##Employee Name##',
    'Role: ##role##',
    '',
    'Your feedback will help us identify areas for improvement and better understand the needs of each role within the organization.',
    '',
    'Please take a few minutes to complete the survey using the link below:',
    '',
    'Thank you for your time and valuable feedback. Your input is greatly appreciated and will contribute to making our workplace and processes better.',
    '',
    'Best regards,',
    'Manager',
  ].join('\n'),
  // Background color for the container (right-side properties panel)
  backgroundColor: 'rgb(231, 230, 230)',
  // Button color
  buttonColor: 'rgb(112, 173, 71)',
};

const campaignData = {
  name: 'Company Based Campaign',
  // Campaign field -> datastore field mappings
  mappings: {
    Name: 'Employee Name',
    Email: 'Employee Email',
    Mobile: 'Employee phone number',
  },
  // Email template field configuration
  templateFields: {
    Name: 'Employee name',
    Role: 'Employee Role',
  },
};

module.exports = { surveyData, datastoreData, advanceLogicData, answerExtensionData, templateData, campaignData };
