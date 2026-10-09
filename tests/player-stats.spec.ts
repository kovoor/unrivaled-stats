import { test, expect, openStats } from './helpers';

test.describe('Player Stats', () => {
  test('a club filter narrows the rows and keeps the sort', async ({ page }) => {
    await openStats(page, '/stats/player');
    const table = page.locator('[data-table="player"]');
    await table.locator('[data-sort="ast"]').click();
    await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
    const before = await table.locator('tbody tr.row').count();

    const filters = page.locator('[data-filters="player"]');
    await filters.locator('[data-menu="club"]').click();
    await filters.locator('[role="menuitemradio"][data-key="club"]').nth(1).click();

    expect(await table.locator('tbody tr.row').count()).toBeLessThan(before);
    await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
  });
});
