import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration with CAPTCHA prevention
 * This config includes stealth settings and anti-detection measures
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially to avoid rate limiting
  forbidOnly: false,
  retries: 1,
  workers: 1, // Use only 1 worker to avoid triggering rate limits
  reporter: [
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never' }]
  ],

  // Global timeout settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  use: {
    // Global test settings with anti-detection
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Browser settings to avoid detection
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Additional stealth settings
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: false }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: false }
    },
    {
      name: 'chromium-stealth',
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // CRITICAL: Stealth mode requires headed=false to avoid CAPTCHA detection
        // Additional Chrome flags for stealth
        launchOptions: {
          args: [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-component-extensions-with-background-pages',
            '--autoplay-policy=user-gesture-required',
            '--disable-background-timer-throttling',
            '--disable-client-side-phishing-detection',
            '--disable-default-apps',
            '--disable-hang-monitor',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-web-security',
            '--enable-automation=false',
            '--exclude-switches=enable-automation'
          ]
        }
      }
    }
  ]
})
