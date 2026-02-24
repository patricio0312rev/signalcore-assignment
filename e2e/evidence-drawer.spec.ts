import { test, expect } from '@playwright/test';

test.describe('Evidence Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('signalcore_walkthrough_seen', 'true');
    });
    await page.goto('/');
  });

  test('opens drawer when clicking a score cell', async ({ page }) => {
    // Click first score cell
    const scoreCell = page.locator('[data-testid="score-cell"]').first();
    await scoreCell.click();

    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();
  });

  test('pressing Escape dismisses drawer', async ({ page }) => {
    const scoreCell = page.locator('[data-testid="score-cell"]').first();
    await scoreCell.click();

    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
  });

  test('screenshot: open drawer', async ({ page }) => {
    const scoreCell = page.locator('[data-testid="score-cell"]').first();
    await scoreCell.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/evidence-drawer.png', fullPage: true });
  });
});
