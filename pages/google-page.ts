// pages/google-page.ts
import { Page, Locator } from '@playwright/test';

export class GoogleHomePage {
  readonly page: Page;
  readonly searchBox: Locator;
  readonly consentButtons: string[];
  readonly url: string;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.locator('textarea[name="q"]');
    this.url = 'https://www.google.com/?hl=en&gl=US&gws_rd=ssl';
    this.consentButtons = [
      'button:has-text("Accept all")',
      'button:has-text("I agree")',
      '#L2AGLb'
    ];
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async acceptConsentIfPresent(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    for (const frame of this.page.frames()) {
      for (const selector of this.consentButtons) {
        const button = frame.locator(selector).first();
        if (await button.isVisible().catch(() => false)) {
          await button.click();
          await this.page.waitForLoadState('domcontentloaded');
          return;
        }
      }
    }
  }

  async search(query: string, prevention?: any): Promise<void> {
    if (prevention) {
      await prevention.humanType(this.searchBox, query);
      await prevention.addDelay('beforeSearch');
      await this.searchBox.press('Enter');
    } else {
      await this.searchBox.fill(query);
      await this.searchBox.press('Enter');
    }
    
    await this.page.waitForLoadState('domcontentloaded');
  }

  getSearchBox(): Locator {
    return this.searchBox;
  }
}

export class GoogleSearchResultsPage {
  readonly page: Page;
  readonly searchSelectors: string[];
  readonly resultSelectors: string[];

  constructor(page: Page) {
    this.page = page;
    this.searchSelectors = ['#search', '#rso', '.g', '[data-async-context]'];
    this.resultSelectors = ['a h3', '#search a h3', '.g a h3', '[data-async-context] a h3'];
  }

  async getSearchResultsContainer(): Promise<Locator> {
    // Find search results container
    for (const selector of this.searchSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        return element;
      }
    }

    // Fallback to generic selector
    return this.page.locator('div[data-async-context], .g, #rso, #search').first();
  }

  async getFirstResult(): Promise<Locator | null> {
    // Find first search result
    for (const selector of this.resultSelectors) {
      const elements = this.page.locator(selector);
      if (await elements.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        return elements.first();
      }
    }
    return null;
  }

  getPage(): Page {
    return this.page;
  }
}

export class CaptchaHandler {
  readonly page: Page;
  readonly captchaSelectors: string[];
  readonly recaptchaSelectors: string[];
  readonly checkboxSelectors: string[];
  readonly submitSelectors: string[];

  constructor(page: Page) {
    this.page = page;
    this.captchaSelectors = [
      'text=Our systems have detected unusual traffic',
      'iframe[title*="reCAPTCHA"]',
      'iframe[src*="recaptcha"]'
    ];
    this.recaptchaSelectors = [
      'iframe[title*="reCAPTCHA"]',
      'iframe[src*="recaptcha"]',
      'iframe[name="a-"]'
    ];
    this.checkboxSelectors = [
      'div[role="checkbox"]',
      '.recaptcha-checkbox',
      '.recaptcha-checkbox-border',
      '#recaptcha-anchor'
    ];
    this.submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("Continue")',
      'button:has-text("Submit")',
      'button:has-text("Verify")',
      '#submit-button',
      '.submit-button'
    ];
  }

  async isCaptchaPresent(): Promise<boolean> {
    return (
      this.page.url().includes('/sorry/index') ||
      await this.page.locator('text=Our systems have detected unusual traffic').isVisible().catch(() => false)
    );
  }

  async attemptSolve(): Promise<boolean> {
    try {
      console.log('Attempting CAPTCHA solve...');
      await this.page.waitForTimeout(1000);

      // Method 1: Try reCAPTCHA checkbox
      if (await this.tryRecaptchaCheckbox()) {
        return true;
      }

      // Method 2: Try form submission
      if (await this.tryFormSubmission()) {
        return true;
      }

      // Method 3: Try page refresh
      if (await this.tryPageRefresh()) {
        return true;
      }

      // Method 4: Try homepage redirect
      if (await this.tryHomepageRedirect()) {
        return true;
      }

      console.log('All CAPTCHA solving methods failed');
      return false;
    } catch (error) {
      console.log('Error attempting to solve CAPTCHA:', error);
      return false;
    }
  }

  private async tryRecaptchaCheckbox(): Promise<boolean> {
    for (const iframeSelector of this.recaptchaSelectors) {
      try {
        const recaptchaFrame = this.page.frameLocator(iframeSelector).first();
        
        for (const checkboxSelector of this.checkboxSelectors) {
          const checkbox = recaptchaFrame.locator(checkboxSelector);
          if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Found reCAPTCHA checkbox: ${checkboxSelector}`);
            await checkbox.click();
            await this.page.waitForTimeout(5000);
            
            if (await this.isSolved()) {
              console.log('reCAPTCHA appears to be solved!');
              return true;
            }
          }
        }
      } catch (e) {
        // Continue trying other methods
      }
    }
    return false;
  }

  private async tryFormSubmission(): Promise<boolean> {
    for (const selector of this.submitSelectors) {
      const button = this.page.locator(selector);
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Trying submit button: ${selector}`);
        await button.click();
        await this.page.waitForTimeout(3000);
        
        if (await this.isSolved()) {
          console.log('CAPTCHA bypassed with submit button!');
          return true;
        }
      }
    }
    return false;
  }

  private async tryPageRefresh(): Promise<boolean> {
    try {
      console.log('Trying page refresh approach...');
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);
      
      if (await this.isSolved()) {
        console.log('CAPTCHA cleared after refresh!');
        return true;
      }
    } catch (e) {
      console.log('Refresh failed...');
    }
    return false;
  }

  private async tryHomepageRedirect(): Promise<boolean> {
    try {
      console.log('Attempting to bypass by returning to homepage...');
      await this.page.goto('https://www.google.com/?hl=en&gl=US&gws_rd=ssl', { 
        waitUntil: 'domcontentloaded' 
      });
      await this.page.waitForTimeout(2000);
      
      if (await this.isSolved()) {
        console.log('Successfully bypassed by returning to homepage!');
        return true;
      }
    } catch (e) {
      console.log('Homepage redirect failed...');
    }
    return false;
  }

  private async isSolved(): Promise<boolean> {
    const checks = [
      !await this.page.locator('text=Our systems have detected unusual traffic').isVisible().catch(() => false),
      !this.page.url().includes('/sorry/index'),
      await this.page.locator('textarea[name="q"]').isVisible().catch(() => false)
    ];
    
    return checks.some(check => check);
  }
}