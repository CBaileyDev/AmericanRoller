// Per-view behavior: counters, content presence (verified facts),
// tank crop, pin sync, form validation, reduced-motion sanity.

const { test, expect } = require('@playwright/test');
const { settle, gotoView } = require('../helpers');

test('home counters land on the verified numbers', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1600);
  const values = await page.$$eval('.count', (els) => els.map((e) => e.textContent));
  expect(values).toEqual(['1938', '15', '14', '8']);
});

test('all 14 industries and 8 product categories present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.ind-grid .tile')).toHaveCount(14);
  await expect(page.locator('#view-products [role="tab"]')).toHaveCount(8);
  await expect(page.locator('.loc-list li')).toHaveCount(13);
});

test('lining view carries the Duratech facts', async ({ page }) => {
  await page.goto('/');
  await gotoView(page, 'lining');
  const view = page.locator('#view-lining');
  await expect(view).toContainText('Duratech Systems');
  await expect(view).toContainText('313.937.3300');
  await expect(view).toContainText('Redford, Michigan');
  await view.locator('#ltab-contact').click();
  await expect(view).toContainText('12546 Beech Daly Rd');
});

test('tank svg crops to the wall band on mobile', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-390', 'mobile project only');
  await page.goto('/');
  const vb = await page.locator('.tank-svg').getAttribute('viewBox');
  expect(vb).toBe('180 170 240 250');
});

test('facility hover lights its map pin', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile-390', 'hover is desktop-only');
  await page.goto('/');
  await gotoView(page, 'locations');
  await page.locator('.loc-list li[data-pin="union-grove"]').hover();
  await expect(page.locator('.pin[data-pin="union-grove"]')).toHaveClass(/is-hot/);
});

test('quote form blocks invalid email and reports via live region', async ({ page }, info) => {
  await page.goto('/#/quote');
  await settle(page, 1100);
  await page.fill('#q-name', 'T');
  await page.fill('#q-email', 'not-an-email');
  if (info.project.name === 'mobile-390') {
    await page.locator('[data-step-next]').click();
  } else {
    await page.locator('.btn-submit:visible').click();
  }
  await expect(page.locator('[data-form-status]')).toContainText('VALID EMAIL');
  await expect(page.locator('#q-email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-quote-success]')).toBeHidden();
});

test('reduced motion: no infinite animations running', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced-motion', 'reduced-motion project only');
  await page.goto('/');
  await settle(page, 900);
  const anims = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getTiming().iterations === Infinity && a.playState === 'running')
      .map((a) => a.animationName || a.id || 'anim')
  );
  expect(anims).toEqual([]);
});
