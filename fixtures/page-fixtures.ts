// fixtures/page-fixtures.ts
import { test as base, Page } from '@playwright/test'
import { GoogleHomePage, GoogleSearchResultsPage, CaptchaHandler } from '../pages/google-page'

// Load CAPTCHA prevention utilities
async function loadCaptchaPrevention() {
  try {
    const preventionModule = await import('../captcha-prevention.js')
    return preventionModule.CaptchaPrevention
  } catch (e) {
    console.log('CAPTCHA prevention utilities not available')
    return null
  }
}

// Define the types for our fixtures
type PageFixtures = {
  googleHome: GoogleHomePage
  searchResults: GoogleSearchResultsPage
  captchaHandler: CaptchaHandler
  captchaPrevention: any
  setupPage: Page
}

// Create the test fixtures
export const test = base.extend<PageFixtures>({
  // CAPTCHA prevention fixture
  captchaPrevention: async ({ page }: { page: Page }, use: (r: any) => Promise<void>) => {
    const PreventionClass = await loadCaptchaPrevention()
    let prevention = null

    if (PreventionClass) {
      prevention = new PreventionClass()
      await prevention.configurePage(page)
    }

    await use(prevention)
  },

  // Setup page fixture that configures CAPTCHA prevention
  setupPage: async (
    { page, captchaPrevention }: { page: Page; captchaPrevention: any },
    use: (r: Page) => Promise<void>
  ) => {
    if (captchaPrevention) {
      // Warm up the session for tests that need it
      console.log('Setting up page with CAPTCHA prevention...')
    }

    await use(page)
  },

  // Google Home Page fixture
  googleHome: async (
    { setupPage }: { setupPage: Page },
    use: (r: GoogleHomePage) => Promise<void>
  ) => {
    const googleHome = new GoogleHomePage(setupPage)
    await use(googleHome)
  },

  // Search Results Page fixture
  searchResults: async (
    { setupPage }: { setupPage: Page },
    use: (r: GoogleSearchResultsPage) => Promise<void>
  ) => {
    const searchResults = new GoogleSearchResultsPage(setupPage)
    await use(searchResults)
  },

  // CAPTCHA Handler fixture
  captchaHandler: async (
    { setupPage }: { setupPage: Page },
    use: (r: CaptchaHandler) => Promise<void>
  ) => {
    const captchaHandler = new CaptchaHandler(setupPage)
    await use(captchaHandler)
  }
})

export { expect } from '@playwright/test'
