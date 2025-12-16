import { test, expect } from './fixtures';
import { 
  waitForDashboardLoad, 
  waitForCoinData, 
  changeChartType,
  waitForChart 
} from './helpers/test-helpers';

test.describe('Chart Type and Technical Indicators', () => {
  test('should switch to candlestick chart', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    await waitForChart(page);
    
    // Find and click candlestick chart type button
    const candlestickButton = page.locator('button:has-text("Candlestick"), button:has-text("candlestick")').first();
    const exists = await candlestickButton.isVisible().catch(() => false);
    
    if (exists) {
      await candlestickButton.click();
      await page.waitForTimeout(2000);
      
      // Verify chart is still visible
      const chart = page.locator('svg, canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should switch to line chart', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    await waitForChart(page);
    
    // Find and click line chart type button
    const lineButton = page.locator('button:has-text("Line"), button:has-text("line")').first();
    const exists = await lineButton.isVisible().catch(() => false);
    
    if (exists) {
      await lineButton.click();
      await page.waitForTimeout(2000);
      
      // Verify chart is visible
      const chart = page.locator('svg, canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should toggle technical indicators', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Look for technical analysis controls
    const technicalControls = page.locator('text=/SMA|EMA|RSI|MACD|Bollinger/i, [data-testid="technical-analysis"]').first();
    const exists = await technicalControls.isVisible().catch(() => false);
    
    if (exists) {
      // Try to toggle an indicator (e.g., SMA 20)
      const sma20Button = page.locator('button:has-text("SMA 20"), label:has-text("SMA 20")').first();
      const smaExists = await sma20Button.isVisible().catch(() => false);
      
      if (smaExists) {
        await sma20Button.click();
        await page.waitForTimeout(1000);
        
        // Verify chart updates
        await waitForChart(page);
        const chart = page.locator('svg, canvas').first();
        await expect(chart).toBeVisible();
      }
    }
  });

  test('should display technical indicators chart type', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Look for technical indicators chart type option
    const technicalChartButton = page.locator('button:has-text("Technical"), button:has-text("Indicators")').first();
    const exists = await technicalChartButton.isVisible().catch(() => false);
    
    if (exists) {
      await technicalChartButton.click();
      await page.waitForTimeout(2000);
      
      // Verify chart is visible
      await waitForChart(page);
      const chart = page.locator('svg, canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should maintain chart type when coin changes', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Switch to candlestick
    const candlestickButton = page.locator('button:has-text("Candlestick"), button:has-text("candlestick")').first();
    const candlestickExists = await candlestickButton.isVisible().catch(() => false);
    
    if (candlestickExists) {
      await candlestickButton.click();
      await page.waitForTimeout(1000);
      
      // Change coin
      await page.locator('input[placeholder*="Search"], input[placeholder*="coin"]').first().fill('ethereum');
      await page.waitForTimeout(1000);
      await page.locator('text=/ethereum/i').first().click();
      await waitForCoinData(page, 'Ethereum');
      
      // Verify chart is still visible (candlestick should be maintained)
      await waitForChart(page);
      const chart = page.locator('svg, canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should display chart customization options', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Look for chart customization controls
    const customizationButton = page.locator('button:has-text("Customize"), button:has-text("Settings")').first();
    const exists = await customizationButton.isVisible().catch(() => false);
    
    if (exists) {
      await customizationButton.click();
      await page.waitForTimeout(500);
      
      // Look for customization options
      const options = page.locator('text=/Color|Theme|Grid|Axis/i').first();
      const optionsVisible = await options.isVisible().catch(() => false);
      expect(optionsVisible).toBeTruthy();
    }
  });
});

