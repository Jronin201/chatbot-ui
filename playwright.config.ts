import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/playwright-test/tests', // Only run Playwright tests
});
