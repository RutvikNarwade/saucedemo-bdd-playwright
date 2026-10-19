@db
Feature: Order is saved in the database
  SauceDemo has no database we can reach, so this feature shows the design.
  It is left out of the normal run and only runs with "npm run test:db"
  against a backend DB that has the orders tables (see "Database testing" in the README).

  Scenario: A completed order is stored with the right product
    Given I am logged in as the "standard" user
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I check out with "valid" customer details
    Then I should see the order confirmation page
    And the order should be saved in the database with status "COMPLETE"
    And the saved order should contain 1 x "Sauce Labs Backpack"
