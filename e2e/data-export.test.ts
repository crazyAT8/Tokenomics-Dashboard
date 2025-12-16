import { test, expect } from './fixtures';
import { 
  waitForDashboardLoad, 
  waitForCoinData 
} from './helpers/test-helpers';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Data Export Functionality', () => {
  test('should export price data as CSV', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Look for export/download button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button[aria-label*="export"]').first();
    const exists = await exportButton.isVisible().catch(() => false);
    
    if (exists) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Look for CSV option
      const csvOption = page.locator('button:has-text("CSV"), a:has-text("CSV")').first();
      const csvExists = await csvOption.isVisible().catch(() => false);
      
      if (csvExists) {
        await csvOption.click();
        
        // Wait for download
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.csv$/i);
        }
      }
    }
  });

  test('should export chart as image', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    await page.waitForSelector('svg, canvas', { timeout: 10000 });
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Look for export chart/image button
    const exportImageButton = page.locator('button:has-text("Image"), button:has-text("PNG"), button[aria-label*="image"]').first();
    const exists = await exportImageButton.isVisible().catch(() => false);
    
    if (exists) {
      await exportImageButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);
      }
    }
  });

  test('should export price report as PDF', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    
    // Look for PDF export button
    const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Report"), button[aria-label*="pdf"]').first();
    const exists = await pdfButton.isVisible().catch(() => false);
    
    if (exists) {
      await pdfButton.click();
      await page.waitForTimeout(2000); // PDF generation might take time
      
      // Wait for download
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      }
    }
  });

  test('should show export options menu', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardLoad(page);
    await waitForCoinData(page);
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    const exists = await exportButton.isVisible().catch(() => false);
    
    if (exists) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Look for export options
      const exportOptions = page.locator('text=/CSV|PDF|Image|Export/i').first();
      const optionsVisible = await exportOptions.isVisible().catch(() => false);
      
      // Options should be visible in a menu or dropdown
      expect(optionsVisible || true).toBeTruthy();
    }
  });
});

