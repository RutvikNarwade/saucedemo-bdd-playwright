@login
Feature: Login
  As a shopper
  I want only valid accounts to get into the store
  So that nobody can use my account but me

  Background:
    Given I am on the login page

  @smoke
  Scenario: Standard user can log in
    When I log in as the "standard" user
    Then I should see the products page

  @smoke @negative
  Scenario: Invalid login shows an error
    When I try to log in with "wrong_password" credentials
    Then I should see the login error "Epic sadface: Username and password do not match any user in this service"
    And I should still be on the login page

  @negative
  Scenario Outline: Login is rejected for <case>
    When I try to log in with "<credentials>" credentials
    Then I should see the login error "<error>"
    And I should still be on the login page

    Examples:
      | case              | credentials      | error                                                                     |
      | an unknown user   | unknown_user     | Epic sadface: Username and password do not match any user in this service |
      | a locked out user | locked_out       | Epic sadface: Sorry, this user has been locked out.                       |
      | an empty username | missing_username | Epic sadface: Username is required                                        |
      | an empty password | missing_password | Epic sadface: Password is required                                        |
