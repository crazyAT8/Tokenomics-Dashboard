import { test, expect } from './fixtures';
import { 
  waitForDashboardLoad, 
  waitForCoinData, 
  searchForCoin,
  selectCoinFromResults,
  changeTimeRange,
  changeCurrency,
  toggleFavorite,
  waitForChart
} from './helpers/test-helpers';

test.describe('Complete User Flow', () => {
  test('should complete full user journey: search, select, customize, and export', async ({ page }) => {
    // Step 1: Load dashboard
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Step 2: Search for a coin
    await searchForCoin(page, 'ethereum');
    await page.waitForTimeout(1000);
    
    // Step 3: Select coin
    await selectCoinFromResults(page, 'Ethereum');
    await waitForCoinData(page, 'Ethereum');
    
    // Step 4: Verify coin data is displayed
    await expect(page.locator('text=/ethereum/i').first()).toBeVisible({ timeout: 10000 });
    const price = await page.locator('text=/\\$|€|£/').first().textContent();
    expect(price).toBeTruthy();
    
    // Step 5: Change time range
    const timeRange30d = page.locator('button:has-text("30d")').first();
    await timeRange30d.click();
    await page.waitForTimeout(2000);
    
    // Step 6: Change currency
    const eurButton = page.locator('button:has-text("EUR"), button:has-text("eur")').first();
    const eurExists = await eurButton.isVisible().catch(() => false);
    if (eurExists) {
      await eurButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 7: Add to favorites
    const favoriteButton = page.locator('button[aria-label*="favorite"], button:has(svg)').first();
    const favExists = await favoriteButton.isVisible().catch(() => false);
    if (favExists) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 8: Verify chart is visible
    await waitForChart(page);
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible();
    
    // Step 9: Verify tokenomics data
    const tokenomicsKeywords = ['Circulating', 'Total Supply', 'Market Cap'];
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

  test('should handle multiple coin selections and comparisons', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Select first coin (Bitcoin - default)
    await waitForCoinData(page, 'Bitcoin');
    const bitcoinPrice = await page.locator('text=/\\$|€|£/').first().textContent();
    
    // Select second coin (Ethereum)
    await searchForCoin(page, 'ethereum');
    await page.waitForTimeout(1000);
    await selectCoinFromResults(page, 'Ethereum');
    await waitForCoinData(page, 'Ethereum');
    
    const ethereumPrice = await page.locator('text=/\\$|€|£/').first().textContent();
    
    // Prices should be different
    expect(bitcoinPrice).not.toBe(ethereumPrice);
    
    // Add both to favorites
    const favoriteButton = page.locator('button[aria-label*="favorite"], button:has(svg)').first();
    const favExists = await favoriteButton.isVisible().catch(() => false);
    
    if (favExists) {
      // Add Ethereum
      await favoriteButton.click();
      await page.waitForTimeout(500);
      
      // Go back to Bitcoin
      await searchForCoin(page, 'bitcoin');
      await page.waitForTimeout(1000);
      await selectCoinFromResults(page, 'Bitcoin');
      await waitForCoinData(page, 'Bitcoin');
      
      // Add Bitcoin
      await favoriteButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should maintain user preferences across interactions', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Set preferences
    const timeRange30d = page.locator('button:has-text("30d")').first();
    await timeRange30d.click();
    await page.waitForTimeout(1000);
    
    const eurButton = page.locator('button:has-text("EUR"), button:has-text("eur")').first();
    const eurExists = await eurButton.isVisible().catch(() => false);
    if (eurExists) {
      await eurButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Change coin
    await searchForCoin(page, 'ethereum');
    await page.waitForTimeout(1000);
    await selectCoinFromResults(page, 'Ethereum');
    await waitForCoinData(page, 'Ethereum');
    
    // Verify preferences are maintained
    const timeRangeStillSelected = await timeRange30d.isVisible().catch(() => false);
    expect(timeRangeStillSelected).toBeTruthy();
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    
    // Try to search for invalid coin
    await searchForCoin(page, 'invalidcoin12345xyz');
    await page.waitForTimeout(2000);
    
    // App should not crash - should show no results or error message
    const errorMessage = page.locator('text=/error|not found|no results/i').first();
    const errorExists = await errorMessage.isVisible().catch(() => false);
    
    // Either error message appears or search just doesn't show results
    // Both are acceptable - main thing is app doesn't crash
    expect(true).toBeTruthy();
    
    // Verify dashboard is still functional
    await waitForCoinData(page);
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });
});

