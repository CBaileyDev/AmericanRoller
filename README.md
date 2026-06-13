# American Roller Company — Website

Premium B2B marketing site for American Roller Company: a **viewport-locked,
zero-scroll single-page application**. Seven full-viewport views navigated by
animated transitions — header links, dot rail, arrow keys, swipe, and
(optionally) the wheel. No scrollbars exist anywhere, by design and by test.

## Run

```bash
npm install        # dev deps (@playwright/test)
npm run dev        # serves on http://127.0.0.1:4173
```

Pure static — no build step. `index.html` + `css/` + `js/` (native ES modules).
The only external dependency at runtime is Google Fonts.

## Test

```bash
npm test                 # full matrix
npm run test:noscroll    # the acceptance gate only
```

Playwright projects: `desktop-1440` (1440×900), `desktop-1280` (1280×800 — the
tightest stage: ~704px), `mobile-390` (390×844, touch), and `reduced-motion`.
Browsers are expected at `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (set
automatically by `playwright.config.js`; chromium-only environment).

## Architecture notes

- **Zero-scroll kit** (`css/base.css`): `overflow: clip` on html/body/stage/views
  (immune to programmatic scrolling), `touch-action: none` on the stage +
  non-passive `touchmove` guard (iOS rubber-band), `inert` on inactive views,
  `focus({preventScroll})` everywhere, metric-matched font fallbacks.
- **Density** is managed inside views with tabs, segmented controls, a FLIP
  grid→detail morph (Industries), and pagination — never `overflow: auto`.
- **Content budgets** are documented per view in `css/views.css`; the binding
  desktop case is 1280×800.
- All visuals are inline CSS/SVG: the layered roller cross-section (Home), the
  lined-tank cutaway (Tank & Rubber Lining), and a dot-matrix North America
  map (Locations) generated from an ASCII bitmap in `js/locations.js`.
- The quote flow is front-end only; deep links like `#/quote?type=tank-lining`
  preselect the RFQ type.

## Views

Home · Products & Services (8 categories) · Tank & Rubber Lining (Duratech
Systems, Redford MI) · Industries (14) · The American Roller Way · Locations
(facility map + list) · Request a Quote.
