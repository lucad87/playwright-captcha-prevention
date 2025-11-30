// fixtures/captcha-fixtures.ts
import { test as base } from './page-fixtures'

// Extended fixtures for CAPTCHA-specific test scenarios
type CaptchaFixtures = {
  setupCaptchaPreventionSession: () => Promise<void>
  withHumanBehavior: () => Promise<void>
}

export const test = base.extend<CaptchaFixtures>({
  // Fixture for setting up enhanced CAPTCHA prevention session
  setupCaptchaPreventionSession: async ({ captchaPrevention, setupPage }, use) => {
    const setupSession = async () => {
      if (captchaPrevention) {
        console.log('Setting up enhanced CAPTCHA prevention session...')
        await captchaPrevention.warmupSession(setupPage)
        await captchaPrevention.enforceRateLimit()
      }
    }

    await use(setupSession)
  },

  // Fixture for adding human-like behaviors
  withHumanBehavior: async ({ captchaPrevention, setupPage }, use) => {
    const addHumanBehavior = async () => {
      if (captchaPrevention) {
        await captchaPrevention.addDelay('afterPageLoad')
        await captchaPrevention.addRandomBehavior(setupPage)
      }
    }

    await use(addHumanBehavior)
  }
})

export { expect } from '@playwright/test'
