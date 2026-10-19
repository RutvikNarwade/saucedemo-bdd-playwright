@checkout
Feature: Checkout form validation
  As a shopper
  I want to be told which detail is missing
  So that I can fix it and finish my order

  Background:
    Given I am logged in as the "standard" user
    And I add "Sauce Labs Backpack" to the cart
    And I open the cart

  @negative
  Scenario Outline: Checkout is blocked when <field> is missing
    When I submit checkout with "<customer>" customer details
    Then I should see the checkout error "<error>"

    Examples:
      | field       | customer            | error                          |
      | first name  | missing_first_name  | Error: First Name is required  |
      | last name   | missing_last_name   | Error: Last Name is required   |
      | postal code | missing_postal_code | Error: Postal Code is required |
