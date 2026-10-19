import { setDefaultTimeout, setWorldConstructor, World } from '@cucumber/cucumber';
import type { Browser, BrowserContext, Page } from 'playwright';
import { config } from '../config/config';
import { CartPage } from '../pages/CartPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { Header } from '../pages/components/Header';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import type { Customer } from '../testdata';
import { newContext } from './browserFactory';

setDefaultTimeout(config.stepTimeout);

// Cucumber creates a new World for every scenario, so nothing here leaks between scenarios.
export class CustomWorld extends World {
  // Set in the Before hook (support/hooks.ts)
  context!: BrowserContext;
  page!: Page;

  header!: Header;
  loginPage!: LoginPage;
  inventoryPage!: InventoryPage;
  cartPage!: CartPage;
  checkoutInfoPage!: CheckoutInfoPage;
  checkoutOverviewPage!: CheckoutOverviewPage;
  checkoutCompletePage!: CheckoutCompletePage;

  // Unique per scenario, used to tag test data so parallel runs never clash
  readonly runId = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  readonly startedAt = Date.now();
  customer?: Customer;
  savedOrderId?: string;

  // Cleanup callbacks registered by steps, run by the After hook even if the scenario fails
  readonly cleanupTasks: Array<() => Promise<void>> = [];

  async openPage(browser: Browser): Promise<void> {
    this.context = await newContext(browser);
    this.page = await this.context.newPage();

    this.header = new Header(this.page);
    this.loginPage = new LoginPage(this.page);
    this.inventoryPage = new InventoryPage(this.page);
    this.cartPage = new CartPage(this.page);
    this.checkoutInfoPage = new CheckoutInfoPage(this.page);
    this.checkoutOverviewPage = new CheckoutOverviewPage(this.page);
    this.checkoutCompletePage = new CheckoutCompletePage(this.page);
  }
}

setWorldConstructor(CustomWorld);
