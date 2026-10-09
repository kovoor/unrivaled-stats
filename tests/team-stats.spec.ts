import { test, expect, openStats } from './helpers';

test.describe('Team Stats', () => {
  test.beforeEach(async ({ page }) => {
    await openStats(page, '/stats/team');
  });

  test('shows all eight clubs', async ({ page }) => {
    await expect(page.locator('[data-table="team"] tbody tr.row')).toHaveCount(8);
  });

  test('clicking a stat header sorts descending, then ascending', async ({ page }) => {
    const table = page.locator('[data-table="team"]');
    await table.locator('[data-sort="ast"]').click();
    await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
    await table.locator('[data-sort="ast"]').click();
    await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'ascending');
  });

  test('switching to totals adds the games-played column', async ({ page }) => {
    const filters = page.locator('[data-filters="team"]');
    await filters.locator('[data-menu="perMode"]').click();
    await filters.locator('[data-value="Total"]').click();
    await expect(page.locator('[data-table="team"] thead .gp')).toBeVisible();
  });

  test('an unplayed season shows the empty state and recovers', async ({ page }) => {
    const table = page.locator('[data-table="team"]');
    const filters = page.locator('[data-filters="team"]');
    await filters.locator('[data-menu="season"]').click();
    await filters.locator('[data-value="2027"]').click();
    await expect(page.getByText('Season 3 has not tipped off')).toBeVisible();
    await page.locator('[data-set-season]').click();
    await expect(table).toBeVisible();
    await page.reload();
    await expect(table.locator('tbody tr.row')).toHaveCount(8);
  });
});
