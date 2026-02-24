import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('signalcore_walkthrough_seen', 'true');
    });
    await page.goto('/');
  });

  test('loads with 4 vendor score cards', async ({ page }) => {
    const cards = page.locator('[data-testid="vendor-score-card"]');
    await expect(cards).toHaveCount(4);
  });

  test('displays comparison matrix with scores', async ({ page }) => {
    const matrix = page.locator('table');
    await expect(matrix).toBeVisible();

    // Should have requirement rows
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(6);
  });

  test('clicking a matrix cell opens evidence drawer', async ({ page }) => {
    // Click first score cell
    const scoreCell = page.locator('[data-testid="score-cell"]').first();
    await scoreCell.click();

    // Drawer should appear
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();
  });

  test('vendor toggle chips hide/show vendors', async ({ page }) => {
    const chips = page.locator('[data-testid="vendor-chip"]');
    await expect(chips).toHaveCount(4);

    // Click first chip to hide a vendor
    await chips.first().click();

    // Should have 3 visible score cards
    const visibleCards = page.locator('[data-testid="vendor-score-card"]');
    await expect(visibleCards).toHaveCount(3);
  });

  test('screenshot: full dashboard', async ({ page }) => {
    await page.waitForTimeout(1000); // wait for animations
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: true });
  });
});
