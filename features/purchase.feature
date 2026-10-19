@purchase
Feature: Purchase products
  As a shopper
  I want to add products to my cart and check out
  So that I can place an order

  @smoke @e2e
  Scenario: Successful purchase of a single product
    Given I am on the login page
    When I log in as the "standard" user
    Then I should see the products page
    When I add "Sauce Labs Backpack" to the cart
    Then the cart badge should show 1
    When I open the cart
    Then the cart should contain "Sauce Labs Backpack"
    When I check out with "valid" customer details
    Then I should see the order confirmation page
    And the cart badge should not be shown

  @e2e
  Scenario: Successful purchase of more than one product
    Given I am logged in as the "standard" user
    When I add these products to the cart:
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    Then the cart badge should show 2
    When I open the cart
    Then the cart should contain only these products:
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    When I check out with "valid" customer details
    Then I should see the order confirmation page
