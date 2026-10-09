import { test as base, expect, type Page } from '@playwright/test';

// Every test fails if the page throws, not just the ones that check for it.
export const test = base.extend<{ noPageErrors: void }>({
  noPageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// static=1 turns off entrance animations; rv=0 hides the design-notes review bar.
export async function openStats(page: Page, path: '/stats' | '/stats/player' | '/stats/team') {
  await page.goto(`${path}?static=1&rv=0`);
}
