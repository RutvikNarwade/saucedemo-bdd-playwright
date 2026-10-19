import { chromium, firefox, webkit, selectors, type Browser, type BrowserContext } from 'playwright';
import { config } from '../config/config';
import { logger } from './logger';

const launchers = { chromium, firefox, webkit };

// SauceDemo puts data-test="..." on its elements, so getByTestId() should read that attribute
selectors.setTestIdAttribute('data-test');

export async function launchBrowser(): Promise<Browser> {
  logger.info(`Launching ${config.browser} (headless: ${config.headless})`);
  return launchers[config.browser].launch({
    headless: config.headless,
    slowMo: config.slowMo,
  });
}

export async function newContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: config.baseUrl,
    viewport: { width: 1280, height: 720 },
  });
  context.setDefaultTimeout(config.actionTimeout);
  context.setDefaultNavigationTimeout(config.navigationTimeout);
  return context;
}
