import { type DataTable, Then, When } from '@cucumber/cucumber';
import { expect } from '../support/expect';
import type { CustomWorld } from '../support/world';

When('I add {string} to the cart', async function (this: CustomWorld, productName: string) {
  await this.inventoryPage.addToCart(productName);
});

When('I add these products to the cart:', async function (this: CustomWorld, table: DataTable) {
  for (const productName of table.raw().flat()) {
    await this.inventoryPage.addToCart(productName);
  }
});

When('I open the cart', async function (this: CustomWorld) {
  await this.header.openCart();
});

Then('the cart badge should show {int}', async function (this: CustomWorld, count: number) {
  await expect(this.header.cartBadge).toHaveText(String(count));
});

Then('the cart badge should not be shown', async function (this: CustomWorld) {
  await expect(this.header.cartBadge).toBeHidden();
});

Then('the cart should contain {string}', async function (this: CustomWorld, productName: string) {
  await expect(this.page).toHaveURL(this.cartPage.path);
  await expect(this.cartPage.cartItem(productName)).toBeVisible();
});

Then('the cart should contain only these products:', async function (this: CustomWorld, table: DataTable) {
  await expect(this.page).toHaveURL(this.cartPage.path);
  // Checks the exact list, in order, so an extra or missing item fails the step
  await expect(this.cartPage.itemNames).toHaveText(table.raw().flat());
});
