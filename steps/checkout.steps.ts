import { Then, When } from '@cucumber/cucumber';
import { getCustomer } from '../testdata';
import { expect } from '../support/expect';
import type { CustomWorld } from '../support/world';

// Full checkout from the cart page: details -> overview -> finish
When('I check out with {string} customer details', async function (this: CustomWorld, customerKey: string) {
  this.customer = getCustomer(customerKey, this.runId);
  await this.cartPage.checkout();
  await this.checkoutInfoPage.submit(this.customer);
  await this.checkoutOverviewPage.finish();
});

// Stops on the details form, for the validation scenarios
When('I submit checkout with {string} customer details', async function (this: CustomWorld, customerKey: string) {
  this.customer = getCustomer(customerKey, this.runId);
  await this.cartPage.checkout();
  await this.checkoutInfoPage.submit(this.customer);
});

Then('I should see the order confirmation page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(this.checkoutCompletePage.path);
  await expect(this.header.title).toHaveText('Checkout: Complete!');
  await expect(this.checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
});

Then('I should see the checkout error {string}', async function (this: CustomWorld, message: string) {
  await expect(this.checkoutInfoPage.errorMessage).toHaveText(message);
  await expect(this.page).toHaveURL(this.checkoutInfoPage.path);
});
