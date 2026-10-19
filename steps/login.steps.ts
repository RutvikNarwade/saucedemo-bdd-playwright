import { Given, Then, When } from '@cucumber/cucumber';
import { getUser } from '../testdata';
import { expect } from '../support/expect';
import type { CustomWorld } from '../support/world';

Given('I am on the login page', async function (this: CustomWorld) {
  await this.loginPage.open();
});

// Shortcut for scenarios where login is just the starting point
Given('I am logged in as the {string} user', async function (this: CustomWorld, userKey: string) {
  const user = getUser(userKey);
  await this.loginPage.open();
  await this.loginPage.login(user.username, user.password);
  await expect(this.page).toHaveURL(this.inventoryPage.path);
});

When('I log in as the {string} user', async function (this: CustomWorld, userKey: string) {
  const user = getUser(userKey);
  await this.loginPage.login(user.username, user.password);
});

When('I try to log in with {string} credentials', async function (this: CustomWorld, userKey: string) {
  const user = getUser(userKey);
  await this.loginPage.login(user.username, user.password);
});

Then('I should see the products page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(this.inventoryPage.path);
  await expect(this.header.title).toHaveText('Products');
  await expect(this.inventoryPage.productCards).not.toHaveCount(0);
});

Then('I should see the login error {string}', async function (this: CustomWorld, message: string) {
  await expect(this.loginPage.errorMessage).toHaveText(message);
});

Then('I should still be on the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(this.loginPage.path);
  await expect(this.loginPage.loginButton).toBeVisible();
});
