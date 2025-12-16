# E2E Tests

This directory contains end-to-end (E2E) tests for the Tokenomics Dashboard using Playwright.

## Setup

1. Install Playwright browsers (if not already installed):
   ```bash
   npx playwright install --with-deps
   ```

2. Make sure the development server is running or will be started automatically:
   ```bash
   npm run dev
   ```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Test Structure

- `dashboard-load.test.ts` - Tests for initial dashboard load and data display
- `coin-selection.test.ts` - Tests for coin search and selection functionality
- `time-range-currency.test.ts` - Tests for time range and currency selection
- `chart-interactions.test.ts` - Tests for chart type switching and technical indicators
- `favorites.test.ts` - Tests for favorites functionality
- `portfolio.test.ts` - Tests for portfolio management
- `data-export.test.ts` - Tests for data export (CSV, PDF, Image)
- `user-flow-complete.test.ts` - Complete end-to-end user journey tests

## Test Helpers

The `helpers/test-helpers.ts` file contains reusable helper functions for:
- Waiting for dashboard to load
- Waiting for coin data
- Searching for coins
- Changing time ranges and currencies
- Toggling favorites
- And more...

## Configuration

Tests are configured in `playwright.config.ts` at the root of the project. The configuration includes:
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Automatic dev server startup
- Screenshot on failure
- Trace collection on retry

## Writing New Tests

When writing new E2E tests:

1. Import fixtures from `./fixtures`
2. Use helper functions from `./helpers/test-helpers.ts` when possible
3. Follow the existing test structure and naming conventions
4. Use descriptive test names that explain what is being tested
5. Add appropriate waits for async operations
6. Use data-testid attributes when possible for more reliable selectors

## Best Practices

- Use `waitForDashboardLoad()` before interacting with the page
- Use `waitForCoinData()` after selecting a coin
- Add appropriate timeouts for async operations
- Use `page.waitForTimeout()` sparingly - prefer waiting for specific elements
- Test both success and error scenarios
- Keep tests independent - each test should be able to run in isolation

