import { test, expect } from '../fixtures/page-fixtures';



test.describe('Google Search', () => {
  test('shows search box on homepage', async ({ googleHome, captchaPrevention }) => {
    // Navigate and verify
    await googleHome.navigate();
    
    if (captchaPrevention) {
      await captchaPrevention.addDelay('afterPageLoad');
    }
    
    await googleHome.acceptConsentIfPresent();
    await googleHome.verifySearchBoxVisible();
  });

  test('returns results for Playwright query', async ({ 
    googleHome, 
    searchResults, 
    captchaHandler, 
    captchaPrevention,
    setupPage 
  }) => {
    // Set a longer timeout for this test
    test.setTimeout(60000);
    
    // Set up enhanced CAPTCHA prevention for this test
    if (captchaPrevention) {
      console.log('Setting up human-like browsing session...');
      await captchaPrevention.warmupSession(setupPage);
      await captchaPrevention.enforceRateLimit();
    }
    
    // Navigate and setup
    await googleHome.navigate();
    
    if (captchaPrevention) {
      await captchaPrevention.addDelay('afterPageLoad');
      await captchaPrevention.addRandomBehavior(setupPage);
    }
    
    await googleHome.acceptConsentIfPresent();

    // Perform search
    await googleHome.search('Playwright test runner', captchaPrevention);
    
    // Handle CAPTCHA if present
    if (await captchaHandler.isCaptchaPresent()) {
      console.log('CAPTCHA detected, attempting to solve...');
      
      let captchaSolved = false;
      try {
        captchaSolved = await Promise.race([
          captchaHandler.attemptSolve(),
          setupPage.waitForTimeout(20000).then(() => false)
        ]);
      } catch (error) {
        console.log('CAPTCHA solving failed with error:', error);
      }
      
      if (!captchaSolved) {
        test.fixme(true, 'Google rate-limiting/CAPTCHA detected and could not be solved automatically');
        return;
      }
      
      console.log('CAPTCHA solved, continuing with test...');
      
      // Retry search if needed
      if (!setupPage.url().includes('/search')) {
        console.log('Back on homepage, retrying search...');
        await googleHome.acceptConsentIfPresent();
        await googleHome.search('Playwright test runner', captchaPrevention);
      }
    }

    await googleHome.acceptConsentIfPresent();
    
    // Verify results
    await searchResults.verifyResultsPresent();
    await searchResults.verifyPageTitle(/Playwright/i);
  });
});
