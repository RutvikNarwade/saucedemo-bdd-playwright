import type { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

// Checkout step two: "Overview"
export class CheckoutOverviewPage extends BasePage {
  readonly path = '/checkout-step-two.html';

  readonly itemNames: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemNames = page.getByTestId('inventory-item-name');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
