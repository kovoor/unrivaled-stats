import { test, expect, openStats } from './helpers';

test.describe('Leaders', () => {
  test.beforeEach(async ({ page }) => {
    await openStats(page, '/stats');
  });

  test('shows a card for each stat', async ({ page }) => {
    await expect(page.locator('.lead')).toHaveCount(8);
  });

  test('"Complete leaders" opens Player Stats sorted by that stat', async ({ page }) => {
    await page.locator('[data-lead-all="ast"]').click();
    await expect(page.locator('[data-tab-panel="player"]')).toBeVisible();
    await expect(page.locator('[data-table="player"] th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
  });
});
