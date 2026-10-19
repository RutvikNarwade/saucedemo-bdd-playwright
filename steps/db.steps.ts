import { Then } from '@cucumber/cucumber';
import { getDb } from '../support/db/dbClient';
import { type OrderRow, OrderRepository } from '../support/db/orderRepository';
import { expect } from '../support/expect';
import { pollUntil } from '../support/waits';
import type { CustomWorld } from '../support/world';

Then(
  'the order should be saved in the database with status {string}',
  async function (this: CustomWorld, expectedStatus: string) {
    const orders = new OrderRepository(getDb());
    const lastName = this.customer!.lastName;

    // Register cleanup first, so the rows are removed even if the checks below fail
    this.cleanupTasks.push(async () => {
      await orders.deleteOrdersByLastName(lastName);
    });

    // The backend may write the order a little after the UI shows "Thank you",
    // so poll until the row is there with the final status (or time out)
    const order = await pollUntil<OrderRow | undefined>(
      () => orders.findLatestOrderByLastName(lastName),
      (row) => row?.status === expectedStatus,
      { timeoutMs: 15_000, intervalMs: 1_000, description: `order for ${lastName} with status ${expectedStatus}` },
    );

    expect(order!.username).toBe('standard_user');
    expect(order!.postal_code).toBe(this.customer!.postalCode);
    this.savedOrderId = order!.id;
  },
);

Then(
  'the saved order should contain {int} x {string}',
  async function (this: CustomWorld, quantity: number, productName: string) {
    const orders = new OrderRepository(getDb());
    const items = await orders.findOrderItems(this.savedOrderId!);
    expect(items).toContainEqual(expect.objectContaining({ product_name: productName, quantity }));
  },
);
