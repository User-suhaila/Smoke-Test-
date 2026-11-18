// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');

dotenv.config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 600000, // 10 minutes per test
  workers: 1, // Run tests sequentially with a single worker
  reporter: [
    ['html'],
    ['allure-playwright'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://stg-genforms.mobilityeye.com/',
    headless: process.env.HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: null, // Use full browser window size
        deviceScaleFactor: undefined, // Required: can't use deviceScaleFactor with null viewport
        launchOptions: {
          args: ['--start-maximized', '--disable-dev-shm-usage', '--no-sandbox'],
        },
      },
    },
  ],
});
