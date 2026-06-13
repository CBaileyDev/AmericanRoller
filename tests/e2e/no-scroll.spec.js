// THE acceptance gate: walk every view and every UI state at every
// viewport and prove that nothing can scroll and nothing overflows.

const { test, expect } = require('@playwright/test');
const { VIEWS, settle, gotoView, assertNoOverflow, assertNothingScrolled } = require('../helpers');

const isMobile = (info) => info.project.name === 'mobile-390';

test('no scroll in any view (plain walk)', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1200);
  await assertNoOverflow(page, 'boot/home');

  for (const slug of VIEWS) {
    await gotoView(page, slug);
    await expect(page.locator('.view.is-active')).toHaveCount(1);
    await assertNoOverflow(page, `view:${slug}`);
  }
});

test('no scroll across products tabs', async ({ page }) => {
  await page.goto('/');
  await gotoView(page, 'products');
  const tabs = page.locator('#view-products [role="tab"]');
  const n = await tabs.count();
  expect(n).toBe(8);
  for (let i = 0; i < n; i += 1) {
    await tabs.nth(i).click();
    await page.waitForTimeout(420);
    await assertNoOverflow(page, `products tab ${i}`);
  }
});

test('no scroll across lining sub-tabs and pages', async ({ page }, info) => {
  await page.goto('/');
  await gotoView(page, 'lining');
  const tabs = page.locator('#view-lining [role="tab"]');
  expect(await tabs.count()).toBe(3);
  for (let i = 0; i < 3; i += 1) {
    await tabs.nth(i).click();
    await page.waitForTimeout(420);
    await assertNoOverflow(page, `lining tab ${i}`);
  }
  if (isMobile(info)) {
    await tabs.nth(0).click();
    const next = page.locator('#lpanel-systems .pager [data-pg-next]');
    if (await next.isVisible()) {
      await next.click();
      await page.waitForTimeout(320);
      await assertNoOverflow(page, 'lining systems page 2');
    }
  }
  // explode the tank
  await page.locator('.signature--tank').click();
  await page.waitForTimeout(520);
  await assertNoOverflow(page, 'tank exploded');
});

test('no scroll across industries pages and FLIP detail', async ({ page }, info) => {
  await page.goto('/');
  await gotoView(page, 'industries');
  if (isMobile(info)) {
    const next = page.locator('[data-ind-pager] [data-pg-next]');
    await next.click();
    await page.waitForTimeout(320);
    await assertNoOverflow(page, 'industries page 2');
    await next.click();
    await page.waitForTimeout(320);
    await assertNoOverflow(page, 'industries page 3');
    await page.locator('[data-ind-pager] [data-pg-prev]').click();
    await page.locator('[data-ind-pager] [data-pg-prev]').click();
  }
  await page.locator('.ind-grid .tile:not([data-page-hidden])').first().click();
  await page.waitForTimeout(540);
  await assertNoOverflow(page, 'industry detail open');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(320);
  await assertNoOverflow(page, 'industry detail closed');
});

test('no scroll in way view (incl. mobile tiles)', async ({ page }, info) => {
  await page.goto('/');
  await gotoView(page, 'way');
  await assertNoOverflow(page, 'way');
  if (isMobile(info)) {
    const quads = page.locator('.quad');
    for (let i = 0; i < 4; i += 1) {
      await quads.nth(i).click();
      await page.waitForTimeout(180);
      await assertNoOverflow(page, `way quad ${i}`);
    }
  }
});

test('no scroll across locations pages', async ({ page }) => {
  await page.goto('/');
  await gotoView(page, 'locations');
  const next = page.locator('.loc-side .pager [data-pg-next]');
  let guard = 0;
  while (!(await next.isDisabled()) && guard < 6) {
    await next.click();
    await page.waitForTimeout(300);
    await assertNoOverflow(page, `locations page +${guard + 1}`);
    guard += 1;
  }
});

test('no scroll through quote flow, steps, and success', async ({ page }, info) => {
  await page.goto('/');
  await gotoView(page, 'quote');
  await assertNoOverflow(page, 'quote initial');

  if (isMobile(info)) {
    // invalid first — error state must not change height
    await page.locator('[data-step-next]').click();
    await page.waitForTimeout(220);
    await assertNoOverflow(page, 'quote step1 invalid');
    await page.fill('#q-name', 'Test Engineer');
    await page.fill('#q-email', 'engineer@example.com');
    await page.locator('[data-step-next]').click();
    await page.waitForTimeout(320);
    await assertNoOverflow(page, 'quote step2');
  } else {
    await page.fill('#q-name', 'Test Engineer');
    await page.fill('#q-email', 'engineer@example.com');
  }
  await page.locator('.btn-submit:visible').click();
  await page.waitForTimeout(700);
  await expect(page.locator('[data-quote-success]')).toBeVisible();
  await assertNoOverflow(page, 'quote success');
  await page.locator('[data-quote-reset]').click();
  await page.waitForTimeout(320);
  await assertNoOverflow(page, 'quote reset');
});

test('signature explode + programmatic scroll attempts stay locked', async ({ page }) => {
  await page.goto('/');
  await settle(page, 1100);
  await page.locator('.view--home .signature').click();
  await page.waitForTimeout(520);
  await assertNoOverflow(page, 'roller exploded');
  await assertNothingScrolled(page, 'home after wheel+tabs');
});
