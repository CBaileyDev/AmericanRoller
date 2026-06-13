// Accessibility floor: landmarks, names, focus containment.

const { test, expect } = require('@playwright/test');
const { settle, gotoView } = require('../helpers');

test('landmarks present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header[role="banner"], header.site-header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer[role="contentinfo"], footer.utility-rail')).toHaveCount(1);
  await expect(page.locator('nav.main-nav')).toHaveCount(1);
  await expect(page.locator('nav.dot-rail')).toHaveCount(1);
});

test('every button and link has an accessible name', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  const nameless = await page.$$eval('button:not([hidden]), a:not([hidden])', (els) =>
    els
      .filter((el) => !el.closest('[hidden]'))
      .filter((el) => {
        const label = el.getAttribute('aria-label') || el.textContent.trim();
        return !label;
      })
      .map((el) => el.outerHTML.slice(0, 80))
  );
  expect(nameless).toEqual([]);
});

test('tab focus stays within chrome + active view', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  await gotoView(page, 'way');
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    const ok = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return true;
      return !!a.closest('.site-header, .utility-rail, .dot-rail, .view.is-active');
    });
    expect(ok).toBe(true);
  }
});

test('inactive views are inert', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  const inertCount = await page.$$eval('.view:not(.is-active)', (els) => els.filter((e) => e.inert).length);
  expect(inertCount).toBe(6);
});
