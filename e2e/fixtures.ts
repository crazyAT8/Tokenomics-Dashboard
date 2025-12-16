import { test as base } from '@playwright/test';

/**
 * Custom fixtures for E2E tests
 */
export const test = base.extend({
  // Add custom fixtures here if needed
  // For example: authenticatedPage, mockApi, etc.
});

export { expect } from '@playwright/test';

