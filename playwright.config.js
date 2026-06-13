// Browsers are preinstalled in this environment.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    // The sandbox proxy MITMs Google Fonts; trust it so tests measure
    // layout with the real production fonts.
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: 'npx http-server -p 4173 -c-1 .',
    port: 4173,
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'desktop-1280',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-390',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'reduced-motion',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
        contextOptions: { reducedMotion: 'reduce' },
      },
    },
  ],
});
