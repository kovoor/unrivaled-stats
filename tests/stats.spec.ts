import { test, expect } from '@playwright/test';

test('team filters, sorting, totals, and empty-state recovery', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?static=1&rv=0');
  const table = page.locator('[data-table="team"]');
  await expect(table.locator('tbody tr.row')).toHaveCount(8);
  await table.locator('[data-sort="ast"]').click();
  await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
  await table.locator('[data-sort="ast"]').click();
  await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'ascending');
  const filters = page.locator('[data-filters="team"]');
  await filters.locator('[data-menu="perMode"]').click();
  await filters.locator('[data-value="Total"]').click();
  await expect(table.locator('thead .gp')).toBeVisible();
  await filters.locator('[data-menu="season"]').click();
  await filters.locator('[data-value="2027"]').click();
  await expect(page.getByText('Season 3 has not tipped off')).toBeVisible();
  await page.locator('[data-set-season]').click();
  await expect(table).toBeVisible();
  await page.reload();
  await expect(table.locator('tbody tr.row')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('leaders open a sorted player table and clubs filter league ranks', async ({ page }) => {
  await page.goto('/stats?static=1&rv=0');
  await expect(page.locator('.lead')).toHaveCount(8);
  await page.locator('[data-lead-all="ast"]').click();
  await expect(page.locator('[data-tab-panel="player"]')).toBeVisible();
  const table = page.locator('[data-table="player"]');
  await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
  const before = await table.locator('tbody tr.row').count();
  const filters = page.locator('[data-filters="player"]');
  await filters.locator('[data-menu="club"]').click();
  await filters.locator('[role="menuitemradio"][data-key="club"]').nth(1).click();
  expect(await table.locator('tbody tr.row').count()).toBeLessThan(before);
  await expect(table.locator('th[data-col="ast"]')).toHaveAttribute('aria-sort', 'descending');
});

test('mobile row details, keyboard menus, and viewport fit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?static=1&rv=0');
  const table = page.locator('[data-table="team"]');
  const row = table.locator('tbody tr.row').first();
  await row.locator('.open').click();
  await expect(row.locator('.open')).toHaveAttribute('aria-expanded', 'true');
  await expect(table.locator('tr.line[data-open="true"]')).toBeVisible();
  const season = page.locator('[data-filters="team"] [data-menu="season"]');
  await season.focus();
  await page.keyboard.press('ArrowDown');
  await expect(season).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(season).toBeFocused();
  await expect(season).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
