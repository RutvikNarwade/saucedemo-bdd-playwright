import type { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class CheckoutCompletePage extends BasePage {
  readonly path = '/checkout-complete.html';

  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }
}
