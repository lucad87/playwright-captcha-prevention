// CAPTCHA Prevention Utilities
// This module implements strategies to avoid triggering CAPTCHAs

let config
try {
  config = require('./captcha.config.local.js')
} catch (e) {
  config = require('./captcha.config.js')
}

class CaptchaPrevention {
  constructor() {
    this.config = config.prevention
    this.lastRequestTime = 0
  }

  // Configure browser with stealth settings
  async configureBrowser(browser, context) {
    if (!this.config.fingerprinting.enabled) return

    const fp = this.config.fingerprinting

    // Set user agent
    if (fp.userAgent) {
      await context.setExtraHTTPHeaders({
        'User-Agent': fp.userAgent
      })
    }

    // Set viewport
    if (fp.viewport) {
      const pages = context.pages()
      for (const page of pages) {
        await page.setViewportSize(fp.viewport)
      }
    }

    // Set geolocation and timezone
    if (fp.locale && fp.timezone) {
      await context.setGeolocation({
        latitude: 40.7128, // New York coordinates
        longitude: -74.006
      })

      await context.grantPermissions(['geolocation'])
    }
  }

  // Configure page with anti-detection settings
  async configurePage(page) {
    // Remove webdriver flag
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      })
    })

    // Override languages
    if (this.config.fingerprinting.enabled) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        })
      })
    }

    // Set headers
    if (this.config.headers.enabled) {
      const headers = { ...this.config.headers }
      delete headers.enabled // Remove the enabled flag before setting headers
      await page.setExtraHTTPHeaders(headers)
    }

    // Override permissions
    await page.addInitScript(() => {
      const originalQuery = window.navigator.permissions.query
      window.navigator.permissions.query = parameters =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
    })
  }

  // Add human-like delays
  async addDelay(type = 'betweenRequests') {
    if (!this.config.delays.enabled) return

    const delay = this.config.delays[type] || this.config.delays.betweenRequests
    const randomFactor = 0.5 + Math.random() // 50%-150% of base delay
    const actualDelay = Math.floor(delay * randomFactor)

    console.log(`Adding ${actualDelay}ms delay (${type})`)
    await new Promise(resolve => setTimeout(resolve, actualDelay))
  }

  // Simulate human-like typing
  async humanType(locator, text, options = {}) {
    if (!this.config.humanBehavior.enabled || !this.config.humanBehavior.typingDelay) {
      await locator.fill(text, options)
      return
    }

    await locator.click()
    await locator.fill('') // Clear first

    for (let i = 0; i < text.length; i++) {
      await locator.pressSequentially(text[i])
      // Random delay between 50-150ms per character
      const delay = 50 + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Simulate human-like mouse movement
  async humanClick(locator, options = {}) {
    if (!this.config.humanBehavior.enabled || !this.config.humanBehavior.mouseMovement) {
      await locator.click({ ...options, force: true })
      return
    }

    try {
      // Try normal hover first
      await locator.hover({ timeout: 5000 })
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

      // Try normal click first
      await locator.click({
        ...options,
        timeout: 5000
      })
    } catch (e) {
      // If normal click fails, force it
      console.log('Normal click failed, using force click')
      await locator.click({ ...options, force: true })
    }
  }

  // Simulate natural scrolling
  async humanScroll(page, direction = 'down', distance = 300) {
    if (!this.config.humanBehavior.enabled || !this.config.humanBehavior.scrolling) {
      return
    }

    const steps = 5 + Math.floor(Math.random() * 5) // 5-10 steps
    const stepDistance = distance / steps

    for (let i = 0; i < steps; i++) {
      if (direction === 'down') {
        await page.mouse.wheel(0, stepDistance)
      } else {
        await page.mouse.wheel(0, -stepDistance)
      }
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    }
  }

  // Rate limiting based on previous requests
  async enforceRateLimit() {
    if (!this.config.delays.enabled) return

    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const minInterval = this.config.delays.betweenRequests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      console.log(`Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }

  // Random user behavior to look more human
  async addRandomBehavior(page) {
    if (!this.config.humanBehavior.enabled) return

    const behaviors = []

    if (this.config.humanBehavior.mouseMovement) {
      behaviors.push(async () => {
        // Random mouse movement
        const x = Math.floor(Math.random() * 800)
        const y = Math.floor(Math.random() * 600)
        await page.mouse.move(x, y)
      })
    }

    if (this.config.humanBehavior.scrolling) {
      behaviors.push(async () => {
        // Random scroll
        await this.humanScroll(page, Math.random() > 0.5 ? 'down' : 'up', 100 + Math.random() * 200)
      })
    }

    // Execute 1-2 random behaviors
    const numBehaviors = 1 + Math.floor(Math.random() * 2)
    for (let i = 0; i < numBehaviors && behaviors.length > 0; i++) {
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
      try {
        await behavior()
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      } catch (e) {
        // Ignore errors in random behaviors
      }
    }
  }

  // Session warming - visit pages normally before testing (simplified)
  async warmupSession(page) {
    if (!this.config.session.enabled) return

    console.log('Warming up session...')

    try {
      // Quick visit to Google homepage
      await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await this.addDelay('afterPageLoad')

      // Simple mouse movement to show activity
      await page.mouse.move(100, 100)
      await page.mouse.move(200, 200)

      console.log('Session warmup complete')
    } catch (e) {
      console.log('Warmup failed, continuing without warmup...')
    }
  }
}

module.exports = { CaptchaPrevention }
