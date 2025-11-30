// CAPTCHA Prevention Configuration
// This file contains settings for preventing CAPTCHAs from appearing

module.exports = {


  // CAPTCHA Prevention Strategies
  prevention: {
    // Request throttling
    delays: {
      enabled: true,
      betweenRequests: 1000, // 1 second delay between requests
      beforeSearch: 800,     // 0.8 second delay before searching
      afterPageLoad: 500     // 0.5 second after page loads
    },

    // Browser fingerprinting
    fingerprinting: {
      enabled: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 }, // Common screen resolution
      locale: 'en-US',
      timezone: 'America/New_York'
    },

    // Human-like behavior simulation
    humanBehavior: {
      enabled: true,
      mouseMovement: true,    // Simulate mouse movements
      typingDelay: true,      // Add delays between keystrokes
      scrolling: true,        // Scroll page naturally
      randomClicks: false     // Occasionally click on other elements
    },

    // Request headers
    headers: {
      enabled: true,
      acceptLanguage: 'en-US,en;q=0.9',
      acceptEncoding: 'gzip, deflate, br',
      cacheControl: 'no-cache',
      pragma: 'no-cache'
    },

    // Session management
    session: {
      enabled: true,
      reuseContext: true,     // Reuse browser context
      cookiesEnabled: true,   // Maintain cookies
      sessionDuration: 300000 // 5 minutes
    }
  }
};