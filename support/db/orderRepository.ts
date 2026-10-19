import type { DbClient } from './dbClient';

// SauceDemo has no database we can reach. These queries are written against the sample
// "orders" schema in the README, to show how a real backend DB would be checked.

export interface OrderRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  postal_code: string;
  status: string;
  total_amount: string;
  created_at: Date;
}

export interface OrderItemRow {
  product_name: string;
  quantity: number;
  unit_price: string;
}

export class OrderRepository {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  // last_name carries the scenario's run id (see testdata/index.ts), so it is unique per scenario
  findLatestOrderByLastName(lastName: string): Promise<OrderRow | undefined> {
    return this.db.queryOne<OrderRow>(
      `SELECT id, username, first_name, last_name, postal_code, status, total_amount, created_at
         FROM orders
        WHERE last_name = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [lastName],
    );
  }

  findOrderItems(orderId: string): Promise<OrderItemRow[]> {
    return this.db.query<OrderItemRow>(
      `SELECT product_name, quantity, unit_price
         FROM order_items
        WHERE order_id = $1
        ORDER BY product_name`,
      [orderId],
    );
  }

  // order_items rows go too (ON DELETE CASCADE)
  deleteOrdersByLastName(lastName: string): Promise<number> {
    return this.db.execute(`DELETE FROM orders WHERE last_name = $1`, [lastName]);
  }
}
