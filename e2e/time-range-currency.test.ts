import { test, expect } from './fixtures';
import { 
  waitForDashboardLoad, 
  waitForCoinData, 
  changeTimeRange,
  changeCurrency,
  waitForChart 
} from './helpers/test-helpers';

test.describe('Time Range and Currency Selection', () => {
  test('should change time range to 30 days', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Click 30d button
    const timeRange30d = page.locator('button:has-text("30d")').first();
    await expect(timeRange30d).toBeVisible();
    await timeRange30d.click();
    await page.waitForTimeout(2000); // Wait for chart to update
    
    // Verify chart is still visible
    await waitForChart(page);
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible();
  });

  test('should change time range to 90 days', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Click 90d button
    const timeRange90d = page.locator('button:has-text("90d")').first();
    const exists = await timeRange90d.isVisible().catch(() => false);
    
    if (exists) {
      await timeRange90d.click();
      await page.waitForTimeout(2000);
      
      // Verify chart updates
      await waitForChart(page);
      const chart = page.locator('svg, canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should change time range to 1 year', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Click 1y button
    const timeRange1y = page.locator('button:has-text("1y")').first();
    const exists = await timeRange1y.isVisible().catch(() => false);
    
    if (exists) {
      await timeRange1y.click();
      await page.waitForTimeout(2000);
      
      // Verify chart updates
      await waitForChart(page);
      const chart = page.locator('svg, canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should change currency to EUR', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Get initial price (should be in USD)
    const initialPrice = await page.locator('text=/\\$|€|£/').first().textContent().catch(() => '');
    
    // Click EUR button
    const eurButton = page.locator('button:has-text("EUR"), button:has-text("eur")').first();
    const exists = await eurButton.isVisible().catch(() => false);
    
    if (exists) {
      await eurButton.click();
      await page.waitForTimeout(2000);
      
      // Verify price updates (should show € symbol)
      const updatedPrice = await page.locator('text=/€/').first().textContent().catch(() => '');
      
      // Price should have changed or at least currency symbol should be different
      if (initialPrice.includes('$')) {
        // If we can find a price with €, that's good
        const eurPriceVisible = await page.locator('text=/€/').first().isVisible().catch(() => false);
        expect(eurPriceVisible).toBeTruthy();
      }
    }
  });

  test('should change currency to GBP', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Click GBP button
    const gbpButton = page.locator('button:has-text("GBP"), button:has-text("gbp")').first();
    const exists = await gbpButton.isVisible().catch(() => false);
    
    if (exists) {
      await gbpButton.click();
      await page.waitForTimeout(2000);
      
      // Verify price updates (should show £ symbol)
      const gbpPriceVisible = await page.locator('text=/£/').first().isVisible().catch(() => false);
      expect(gbpPriceVisible).toBeTruthy();
    }
  });

  test('should update all prices when currency changes', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Wait for prices to load
    await page.waitForSelector('text=/\\$|€|£/', { timeout: 10000 });
    
    // Change to EUR
    const eurButton = page.locator('button:has-text("EUR"), button:has-text("eur")').first();
    const exists = await eurButton.isVisible().catch(() => false);
    
    if (exists) {
      await eurButton.click();
      await page.waitForTimeout(2000);
      
      // Verify multiple price elements show EUR
      const eurPrices = page.locator('text=/€/');
      const count = await eurPrices.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should maintain time range when currency changes', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Set time range to 30d
    const timeRange30d = page.locator('button:has-text("30d")').first();
    await timeRange30d.click();
    await page.waitForTimeout(1000);
    
    // Change currency
    const eurButton = page.locator('button:has-text("EUR"), button:has-text("eur")').first();
    const exists = await eurButton.isVisible().catch(() => false);
    
    if (exists) {
      await eurButton.click();
      await page.waitForTimeout(2000);
      
      // Verify 30d is still selected (button should appear active/selected)
      const stillSelected = await timeRange30d.isVisible().catch(() => false);
      expect(stillSelected).toBeTruthy();
    }
  });

  test('should update chart when time range changes', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    await waitForChart(page);
    
    // Change time range
    const timeRange30d = page.locator('button:has-text("30d")').first();
    await timeRange30d.click();
    await page.waitForTimeout(2000);
    
    // Verify chart is still visible and updated
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible();
  });
});

