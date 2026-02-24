import { test, expect } from '@playwright/test';

test.describe('Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('signalcore_walkthrough_seen', 'true');
    });
    await page.goto('/');
  });

  test('chat panel opens on click', async ({ page }) => {
    const chatToggle = page.locator('[data-testid="chat-toggle"]');
    await chatToggle.click();

    const chatPanel = page.locator('[data-testid="chat-panel"]');
    await expect(chatPanel).toBeVisible();
  });

  test('suggestion chips trigger responses', async ({ page }) => {
    const chatToggle = page.locator('[data-testid="chat-toggle"]');
    await chatToggle.click();

    // Click first suggestion chip
    const chip = page.locator('[data-testid="suggestion-chip"]').first();
    await chip.click();

    // Wait for response
    const messages = page.locator('[data-testid="chat-message"]');
    await expect(messages.first()).toBeVisible({ timeout: 5000 });
  });

  test('screenshot: chat interaction', async ({ page }) => {
    const chatToggle = page.locator('[data-testid="chat-toggle"]');
    await chatToggle.click();
    await page.waitForTimeout(500);

    const chip = page.locator('[data-testid="suggestion-chip"]').first();
    await chip.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e/screenshots/chat-panel.png', fullPage: true });
  });
});
