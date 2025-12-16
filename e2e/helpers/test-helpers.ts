import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

export async function waitForDashboardLoad(page: Page) {
  // Wait for the main dashboard content to load
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 }).catch(() => {
    // Fallback: wait for coin selector or any main content
    return page.waitForSelector('input[placeholder*="Search"], input[placeholder*="coin"]', { timeout: 10000 });
  });
}

export async function waitForCoinData(page: Page, coinName: string = 'Bitcoin') {
  // Wait for coin data to load - look for coin name or price
  await page.waitForSelector(`text=${coinName}`, { timeout: 15000 }).catch(() => {
    // Fallback: wait for any price or market data
    return page.waitForSelector('text=/\\$|€|£/', { timeout: 15000 });
  });
}

export async function searchForCoin(page: Page, coinQuery: string) {
  // Find and interact with the coin search input
  const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="coin"], input[type="search"]').first();
  await searchInput.fill(coinQuery);
  await page.waitForTimeout(500); // Wait for search results
}

export async function selectCoinFromResults(page: Page, coinName: string) {
  // Wait for search results and click on the coin
  await page.waitForSelector(`text=${coinName}`, { timeout: 5000 });
  await page.locator(`text=${coinName}`).first().click();
  await page.waitForTimeout(1000); // Wait for coin data to load
}

export async function changeTimeRange(page: Page, timeRange: string) {
  // Find and click the time range selector
  const timeRangeButton = page.locator(`button:has-text("${timeRange}")`).first();
  await timeRangeButton.click();
  await page.waitForTimeout(1000); // Wait for chart to update
}

export async function changeCurrency(page: Page, currency: string) {
  // Find and click the currency selector
  const currencyButton = page.locator(`button:has-text("${currency.toUpperCase()}")`).first();
  await currencyButton.click();
  await page.waitForTimeout(1000); // Wait for data to update
}

export async function changeChartType(page: Page, chartType: string) {
  // Find and click the chart type selector
  const chartTypeButton = page.locator(`button:has-text("${chartType}")`).first();
  await chartTypeButton.click();
  await page.waitForTimeout(1000); // Wait for chart to update
}

export async function toggleFavorite(page: Page) {
  // Find and click the favorite/star button
  const favoriteButton = page.locator('button[aria-label*="favorite"], button:has(svg)').first();
  await favoriteButton.click();
  await page.waitForTimeout(500);
}

export async function waitForChart(page: Page) {
  // Wait for chart to render
  await page.waitForSelector('svg, canvas, [data-testid="chart"]', { timeout: 10000 });
}

export async function getCoinPrice(page: Page): Promise<string | null> {
  // Try to find the coin price in various formats
  const priceSelectors = [
    'text=/\\$[0-9,]+/',
    'text=/€[0-9,]+/',
    'text=/£[0-9,]+/',
    '[data-testid="coin-price"]',
    '[data-testid="current-price"]',
  ];

  for (const selector of priceSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      return await element.textContent();
    }
  }
  return null;
}

export async function verifyMetricCard(page: Page, metricName: string) {
  // Verify that a metric card exists and is visible
  const metricCard = page.locator(`text=${metricName}`).first();
  await expect(metricCard).toBeVisible({ timeout: 5000 });
}

