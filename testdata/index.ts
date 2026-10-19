import users from './users.json';
import customers from './customers.json';

export interface User {
  username: string;
  password: string;
}

export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export function getUser(key: string): User {
  const user = (users as Record<string, User>)[key];
  if (!user) {
    throw new Error(`No user "${key}" in testdata/users.json. Available: ${Object.keys(users).join(', ')}`);
  }
  return user;
}

// Returns a copy of the customer with the scenario's run id added to the last name.
// That makes every order unique, so a DB check (or cleanup) only touches this scenario's data.
export function getCustomer(key: string, runId: string): Customer {
  const customer = (customers as Record<string, Customer>)[key];
  if (!customer) {
    throw new Error(`No customer "${key}" in testdata/customers.json. Available: ${Object.keys(customers).join(', ')}`);
  }
  return {
    ...customer,
    lastName: customer.lastName === '' ? '' : `${customer.lastName}-${runId}`,
  };
}
