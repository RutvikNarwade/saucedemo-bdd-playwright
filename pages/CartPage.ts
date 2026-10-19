import type { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly path = '/cart.html';

  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
  }

  cartItem(productName: string): Locator {
    return this.cartItems.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
