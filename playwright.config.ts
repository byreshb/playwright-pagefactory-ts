import { defineConfig } from '@playwright/test';

// Playwright's runner ignores `experimentalDecorators`, so these specs import the library and
// example page objects from the tsc-compiled output in dist-e2e (see `npm run test:playwright`).
export default defineConfig({
  testDir: './test/playwright',
  testMatch: '**/*.spec.ts',
});
