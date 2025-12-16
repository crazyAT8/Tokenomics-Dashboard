import { test, expect } from './fixtures';
import { waitForDashboardLoad, waitForCoinData, getCoinPrice, verifyMetricCard } from './helpers/test-helpers';

test.describe('Dashboard Load and Initial Display', () => {
  test('should load dashboard and display default coin data', async ({ page }) => {
    await page.goto('/');
    
    // Wait for dashboard to load
    await waitForDashboardLoad(page);
    
    // Verify page title or heading
    await expect(page).toHaveTitle(/Tokenomics|Dashboard/i);
    
    // Wait for coin data to load (default is Bitcoin)
    await waitForCoinData(page, 'Bitcoin');
    
    // Verify coin name is displayed
    await expect(page.locator('text=/bitcoin/i').first()).toBeVisible({ timeout: 10000 });
    
    // Verify price is displayed
    const price = await getCoinPrice(page);
    expect(price).toBeTruthy();
    expect(price).toMatch(/[\$€£][0-9,]+/);
  });

  test('should display key metrics', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Verify key metric cards are displayed
    const metricNames = ['Market Cap', 'Volume', 'Supply', 'Price'];
    
    for (const metric of metricNames) {
      // Try to find the metric - it might be in different formats
      const metricElement = page.locator(`text=${metric}`).first();
      const isVisible = await metricElement.isVisible().catch(() => false);
      
      if (!isVisible) {
        // Try alternative selectors
        const altMetric = page.locator(`[data-testid*="${metric.toLowerCase()}"]`).first();
        await expect(altMetric.or(metricElement)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display price chart', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Wait for chart to render
    await page.waitForSelector('svg, canvas', { timeout: 10000 });
    
    // Verify chart is visible
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible();
  });

  test('should display tokenomics overview', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Look for tokenomics-related content
    const tokenomicsKeywords = ['Circulating', 'Total Supply', 'Market Cap', 'Tokenomics'];
    
    let foundTokenomics = false;
    for (const keyword of tokenomicsKeywords) {
      const element = page.locator(`text=${keyword}`).first();
      if (await element.isVisible().catch(() => false)) {
        foundTokenomics = true;
        break;
      }
    }
    
    expect(foundTokenomics).toBeTruthy();
  });

  test('should display coin selector', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    
    // Verify coin search/selector is visible
    const coinSelector = page.locator('input[placeholder*="Search"], input[placeholder*="coin"], input[type="search"]').first();
    await expect(coinSelector).toBeVisible();
  });

  test('should display time range selector', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    
    // Look for time range buttons (7d, 30d, etc.)
    const timeRangeOptions = ['7d', '30d', '90d', '1y'];
    
    let foundTimeRange = false;
    for (const option of timeRangeOptions) {
      const button = page.locator(`button:has-text("${option}")`).first();
      if (await button.isVisible().catch(() => false)) {
        foundTimeRange = true;
        break;
      }
    }
    
    expect(foundTimeRange).toBeTruthy();
  });

  test('should display currency selector', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    
    // Look for currency selector (USD, EUR, etc.)
    const currencyOptions = ['USD', 'EUR', 'GBP'];
    
    let foundCurrency = false;
    for (const currency of currencyOptions) {
      const button = page.locator(`button:has-text("${currency}")`).first();
      if (await button.isVisible().catch(() => false)) {
        foundCurrency = true;
        break;
      }
    }
    
    expect(foundCurrency).toBeTruthy();
  });

  test('should handle loading state', async ({ page }) => {
    await page.goto('/');
    
    // Check if loading indicator appears (might be brief)
    const loadingIndicator = page.locator('text=/loading|Loading/i, [data-testid="loading"]').first();
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    
    // If loading indicator was visible, wait for it to disappear
    if (isLoading) {
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }
    
    // Verify content eventually loads
    await waitForCoinData(page);
  });
});

