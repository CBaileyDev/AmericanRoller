// Visual regression baselines — generated LAST (after design settles)
// to avoid churn. Run with --update-snapshots to (re)create baselines.
// animations:'disabled' is mandatory: the sheen/helix/spin loops are
// infinite and would never produce a stable frame.

const { test, expect } = require('@playwright/test');
const { VIEWS, settle, gotoView } = require('../helpers');

const SHOT = { animations: 'disabled', maxDiffPixelRatio: 0.02 };

test.describe('visual baselines', () => {
  test('each view', async ({ page }) => {
    await page.goto('/');
    await settle(page, 1500);
    for (const slug of VIEWS) {
      await gotoView(page, slug);
      await expect(page).toHaveScreenshot(`${slug}.png`, SHOT);
    }
  });

  test('key states', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile-390', 'desktop states only');
    await page.goto('/');
    await settle(page, 1500);
    await page.locator('.view--home .signature').click();
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('home-exploded.png', SHOT);

    await gotoView(page, 'lining');
    await page.locator('#ltab-what').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('lining-what.png', SHOT);
    await page.locator('#ltab-contact').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('lining-contact.png', SHOT);

    await gotoView(page, 'industries');
    await page.locator('.ind-grid .tile').first().click();
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('industry-detail.png', SHOT);
    await page.keyboard.press('Escape');

    await gotoView(page, 'quote');
    await page.fill('#q-name', 'Baseline');
    await page.fill('#q-email', 'baseline@example.com');
    await page.locator('.btn-submit:visible').click();
    await page.waitForTimeout(900);
    await expect(page).toHaveScreenshot('quote-success.png', SHOT);
  });
});
