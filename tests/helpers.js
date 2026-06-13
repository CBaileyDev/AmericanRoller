// Shared test helpers. The core acceptance gate is assertNoOverflow:
// nothing on the page may be scrollable or scrolled, ever.

const { expect } = require('@playwright/test');

const VIEWS = ['home', 'products', 'lining', 'industries', 'way', 'locations', 'quote'];

async function settle(page, ms = 1250) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms); // outlast view transition + stagger tail
}

async function gotoView(page, slug) {
  await page.locator(`.dot-rail [data-go="${slug}"]`).click();
  await page.waitForFunction(
    (s) => document.querySelector(`.view[data-view="${s}"]`)?.classList.contains('is-active'),
    slug
  );
  await settle(page);
}

async function collectOverflows(page) {
  return page.evaluate(() => {
    const bad = [];
    const doc = document.scrollingElement;
    if (doc.scrollHeight > doc.clientHeight + 1 || doc.scrollWidth > doc.clientWidth + 1) {
      bad.push(`document ${doc.scrollWidth}x${doc.scrollHeight} > ${doc.clientWidth}x${doc.clientHeight}`);
    }
    if (window.scrollX !== 0 || window.scrollY !== 0) bad.push(`window scrolled ${window.scrollX},${window.scrollY}`);

    const describe = (el) => {
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/).slice(0, 3).join('.')}` : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    };

    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[hidden]') || el.hidden) continue;
      // Inactive views are inert and (about to be) visibility:hidden;
      // their children intentionally rest in pre-entrance transform
      // states, which extend scroll geometry without being scrollable.
      if (el.closest('.view:not(.is-active)')) continue;
      // SR-only boxes are 1×1 with clipped content by definition.
      if (el.closest('.visually-hidden')) continue;
      // CSS overflow does not apply inside SVG: descendants report
      // glyph/geometry bounds, not scrollable boxes, and the svg root
      // (which IS checked) clips them. Skip svg internals.
      if (el.ownerSVGElement) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      // -webkit-line-clamp boxes clip by design (they cannot scroll);
      // visible "…" is reviewed in screenshots instead.
      const clamped = (s) => s.webkitLineClamp && s.webkitLineClamp !== 'none';
      if (clamped(cs)) continue;
      if (el.parentElement && clamped(getComputedStyle(el.parentElement))) continue;
      // No element may even be *able* to scroll.
      if (['auto', 'scroll'].includes(cs.overflowX) || ['auto', 'scroll'].includes(cs.overflowY)) {
        if (el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT') {
          bad.push(`overflow:${cs.overflowX}/${cs.overflowY} on ${describe(el)}`);
        }
      }
      // And nothing visible may have content larger than its box
      // (clipped hosts whose inner content is intentionally larger
      // are still a layout bug in this design — budget overruns).
      const fudge = 1;
      if (
        (el.scrollWidth > el.clientWidth + fudge || el.scrollHeight > el.clientHeight + fudge) &&
        el.clientWidth > 0 &&
        !el.hasAttribute('data-bleed') &&
        el.tagName !== 'TEXTAREA'
      ) {
        bad.push(
          `${describe(el)} content ${el.scrollWidth}x${el.scrollHeight} > box ${el.clientWidth}x${el.clientHeight}`
        );
      }
    }
    return bad;
  });
}

async function assertNoOverflow(page, label = '') {
  const bad = await collectOverflows(page);
  expect(bad, `overflow check failed ${label}:\n${bad.join('\n')}`).toEqual([]);
}

async function assertNothingScrolled(page, label = '') {
  // Try hard to scroll, then verify nothing moved anywhere.
  await page.mouse.wheel(0, 800).catch(() => {});
  for (let i = 0; i < 40; i += 1) await page.keyboard.press('Tab');
  const scrolled = await page.evaluate(() => {
    const out = [];
    if (window.scrollX !== 0 || window.scrollY !== 0) out.push(`window ${window.scrollX},${window.scrollY}`);
    for (const el of document.querySelectorAll('body, body *')) {
      if (el.scrollTop !== 0 || el.scrollLeft !== 0) {
        out.push(`${el.tagName}.${String(el.className).split(' ')[0]} ${el.scrollLeft},${el.scrollTop}`);
      }
    }
    return out;
  });
  const { expect: e } = require('@playwright/test');
  e(scrolled, `programmatic scroll leaked ${label}:\n${scrolled.join('\n')}`).toEqual([]);
}

module.exports = { VIEWS, settle, gotoView, assertNoOverflow, assertNothingScrolled, collectOverflows };
