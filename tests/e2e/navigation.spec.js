// Navigation affordances: arrows, dot rail, hash deep links, intent
// cards, rapid-input lock safety, swipe (mobile project), back button.

const { test, expect } = require('@playwright/test');
const { VIEWS, settle } = require('../helpers');

const activeView = (page) => page.locator('.view.is-active').getAttribute('data-view');

test('arrow keys walk all views and clamp at the ends', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  for (let i = 1; i < VIEWS.length; i += 1) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(820);
    expect(await activeView(page)).toBe(VIEWS[i]);
  }
  await page.keyboard.press('ArrowRight'); // clamp
  await page.waitForTimeout(820);
  expect(await activeView(page)).toBe('quote');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(820);
  expect(await activeView(page)).toBe('locations');
});

test('hash deep link preselects quote type', async ({ page }) => {
  await page.goto('/#/quote?type=roller-repair');
  await settle(page, 1100);
  expect(await activeView(page)).toBe('quote');
  await expect(page.locator('input[name="rfq-type"][value="roller-repair"]')).toBeChecked();
});

test('home intent card deep-links with type preselected', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  await page.locator('.intent-card[href*="tank-lining"]').click();
  await page.waitForTimeout(900);
  expect(await activeView(page)).toBe('quote');
  await expect(page.locator('input[name="rfq-type"][value="tank-lining"]')).toBeChecked();
});

test('industry detail quote link preselects industry', async ({ page }) => {
  await page.goto('/#/industries');
  await settle(page, 1100);
  await page.locator('.ind-grid .tile:not([data-page-hidden])').first().click();
  await page.waitForTimeout(560);
  await page.locator('[data-ind-quote]').click();
  await page.waitForTimeout(900);
  expect(await activeView(page)).toBe('quote');
  const v = await page.locator('#q-industry').inputValue();
  expect(v).toBe('Battery & Power Storage');
});

test('rapid arrow hammering settles on one valid view', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1500);
  await expect(page.locator('.view.is-active')).toHaveCount(1);
  const slug = await activeView(page);
  expect(VIEWS).toContain(slug);
  // lock must be released:
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(850);
  const slug2 = await activeView(page);
  expect(VIEWS.indexOf(slug2)).toBeGreaterThanOrEqual(VIEWS.indexOf(slug));
});

test('browser back returns to previous view', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  await page.locator('.dot-rail [data-go="locations"]').click();
  await page.waitForTimeout(850);
  expect(await activeView(page)).toBe('locations');
  await page.goBack();
  await page.waitForTimeout(850);
  expect(await activeView(page)).toBe('home');
});

test('swipe advances exactly one view; in-grid swipe pages tiles', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-390', 'touch project only');
  await page.goto('/');
  await settle(page, 1100);

  const swipe = async (x1, x2, y) => {
    await page.touchscreen.tap(x1, y).catch(() => {});
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y }] });
    for (let i = 1; i <= 6; i += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x1 + ((x2 - x1) * i) / 6, y }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  await swipe(330, 60, 420);
  await page.waitForTimeout(900);
  expect(await activeView(page)).toBe('products');

  // in-grid swipe on industries pages tiles, not views
  await page.locator('.dot-rail [data-go="industries"]').click();
  await page.waitForTimeout(900);
  const gridBox = await page.locator('.ind-grid').boundingBox();
  await swipe(gridBox.x + gridBox.width - 30, gridBox.x + 30, gridBox.y + gridBox.height / 2);
  await page.waitForTimeout(500);
  expect(await activeView(page)).toBe('industries');
  await expect(page.locator('[data-ind-pager] .pager-status')).toHaveText('2 / 3');
});
