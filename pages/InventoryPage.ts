import type { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

// The "Products" page you land on after login
export class InventoryPage extends BasePage {
  readonly path = '/inventory.html';

  readonly productCards: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.getByTestId('inventory-item');
  }

  // One product card, found by its exact visible name (not by position on the page)
  productCard(productName: string): Locator {
    return this.productCards.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  // Preferred locator strategy: scope to the product's card, then find the button
  // by its role and label. See "Locator Strategy" in the README.
  addToCartButton(productName: string): Locator {
    return this.productCard(productName).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(productName: string): Locator {
    return this.productCard(productName).getByRole('button', { name: 'Remove' });
  }

  async addToCart(productName: string): Promise<void> {
    await this.addToCartButton(productName).click();
  }
}
