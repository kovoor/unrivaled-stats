import { test, expect, openStats } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile (390px)', () => {
  test.beforeEach(async ({ page }) => {
    await openStats(page, '/stats/team');
  });

  test('a row expands to show its details', async ({ page }) => {
    const table = page.locator('[data-table="team"]');
    const open = table.locator('tbody tr.row').first().locator('.open');
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(table.locator('tr.line[data-open="true"]')).toBeVisible();
  });

  test('arrow keys open a filter menu and Escape closes it, keeping focus', async ({ page }) => {
    const season = page.locator('[data-filters="team"] [data-menu="season"]');
    await season.focus();
    await page.keyboard.press('ArrowDown');
    await expect(season).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(season).toBeFocused();
    await expect(season).toHaveAttribute('aria-expanded', 'false');
  });

  test('the page does not scroll sideways', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
