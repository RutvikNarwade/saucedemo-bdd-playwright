# SauceDemo BDD Test Framework

BDD UI tests for [saucedemo.com](https://www.saucedemo.com) built with **Playwright + TypeScript + Cucumber**.
This is my submission for the QA Automation Engineer take-home test.

**Walkthrough video (7:50):** [download / watch SauceDemo-Walkthrough.mp4](https://github.com/RutvikNarwade/saucedemo-bdd-playwright/releases/download/v1.0/SauceDemo-Walkthrough.mp4) (attached to the [v1.0 release](https://github.com/RutvikNarwade/saucedemo-bdd-playwright/releases/tag/v1.0))

## Contents
- [What's covered](#whats-covered)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Setup](#setup)
- [How to run the tests](#how-to-run-the-tests)
- [Changing browser and headless mode](#changing-browser-and-headless-mode)
- [Reports, screenshots and traces](#reports-screenshots-and-traces)
- [Locator Strategy for Adding “Sauce Labs Backpack”](#locator-strategy-for-adding-sauce-labs-backpack)
- [Database testing](#database-testing)
- [Engineering Notes](#engineering-notes)
- [Assumptions](#assumptions)
- [AI usage](#ai-usage)

## What's covered

| Feature file | Scenarios | Tags |
|---|---|---|
| `login.feature` | Valid login. Invalid login (wrong password). Outline: unknown user, locked out user, empty username, empty password | `@login @smoke @negative` |
| `purchase.feature` | End-to-end purchase of the Backpack (login, products page, add, badge, cart, checkout, complete). Purchase of two products from a data table | `@purchase @smoke @e2e` |
| `checkout-validation.feature` | Outline: missing first name, last name, postal code | `@checkout @negative` |
| `order-db-validation.feature` | Purchase, then check the order in the database (design demo, see [Database testing](#database-testing)) | `@db` |

That's 11 scenarios in the normal run. The `@db` one is left out unless you ask for it.

## Tech stack

- **Playwright** (used as a library) for the browser
- **@cucumber/cucumber** for Gherkin, hooks, tags, parallel runs, retries and the HTML report
- **TypeScript**, run directly through `tsx` (no build step)
- **pg** for the PostgreSQL DB client
- **dotenv** for config, **cross-env** so the npm scripts work on Windows too
- **GitHub Actions** for CI

## Project structure

```
features/            Gherkin only. No code.
steps/               Step definitions. They call page methods and assert. No selectors here.
pages/               Page objects. The only place with locators.
  components/        Header (title, cart link, cart badge) shared by all logged-in pages
support/
  browserFactory.ts  Launches chromium / firefox / webkit from config, creates contexts
  world.ts           Per-scenario state: page, page objects, run id, cleanup list
  hooks.ts           BeforeAll/AfterAll (browser, DB pool), Before/After (context, trace, screenshot on failure, cleanup)
  expect.ts          Playwright's expect, with the timeout from config
  waits.ts           pollUntil() for things the UI can't wait for, like a DB row
  logger.ts          Small levelled logger with timestamps
  db/dbClient.ts     DB connection utility (pg pool, queries, errors, teardown)
  db/orderRepository.ts  The SQL used by the @db scenario
config/
  config.ts          Reads and validates every setting (env vars > config/.env > defaults)
  .env.example       All settings with safe placeholder values
testdata/
  users.json         Login accounts (valid, locked out, invalid ones)
  customers.json     Checkout details (valid, and one per missing field)
  index.ts           getUser() / getCustomer() with clear errors for unknown keys
scripts/db-check.ts  npm run db:check, a quick DB connection test
.github/workflows/   CI pipeline
cucumber.mjs         Cucumber profiles: default, smoke, db
```

## Setup

You need **Node.js 20 or newer** (I used Node 24) and git.

```bash
git clone https://github.com/RutvikNarwade/saucedemo-bdd-playwright.git
cd saucedemo-bdd-playwright
npm ci
npx playwright install chromium      # add "firefox webkit" if you want to run those too
```

Config is optional. The defaults work out of the box. If you want to change something:

```bash
cp config/.env.example config/.env     # Windows: copy config\.env.example config\.env
```

## How to run the tests

| Command | What it runs |
|---|---|
| `npm test` | Everything except `@db`, Chromium, headless |
| `npm run test:smoke` | Only `@smoke` scenarios |
| `npm run test:headed` | Same as `npm test` but you can watch the browser |
| `npm run test:firefox` / `npm run test:webkit` | Full run on another browser |
| `npm run test:parallel` | Full run with 3 parallel workers |
| `npm run test:db` | The `@db` scenario (needs a database, see below) |
| `npm run db:check` | Connects to the DB from config and runs one read-only query |
| `npm run typecheck` | TypeScript check |

Some other handy ones:

```bash
npx cucumber-js features/login.feature          # one feature file
npx cucumber-js --tags "@negative"              # by tag (adds to the default "not @db")
npx cucumber-js --name "single product"         # by scenario name
```

On my machine (Windows 11, Node 24) a full run takes about 13 s on Chromium, 28 s on Firefox, 24 s on WebKit, and about 9 s with 3 workers.

## Changing browser and headless mode

Every setting is read in `config/config.ts`. The order is: **shell env var > `config/.env` > default**. Bad values fail fast with a clear message (for example `BROWSER=edge`).

| Setting | Default | Values |
|---|---|---|
| `BROWSER` | `chromium` | `chromium`, `firefox`, `webkit` |
| `HEADLESS` | `true` | `true`, `false` |
| `SLOW_MO` | `0` | ms between actions, handy for demos |
| `BASE_URL` | `https://www.saucedemo.com` | any env of the same app |
| `ACTION_TIMEOUT` / `NAVIGATION_TIMEOUT` / `EXPECT_TIMEOUT` | `10000` / `30000` / `5000` | ms |
| `PARALLEL` / `RETRY` | `1` / `0` | workers / retries of a failed scenario |

So to change the browser or headless mode, either edit `config/.env`:

```
BROWSER=firefox
HEADLESS=false
```

or set it for one run:

```bash
# bash / Git Bash / macOS / Linux
BROWSER=webkit HEADLESS=false npm test
```

```powershell
# PowerShell
$env:BROWSER="webkit"; $env:HEADLESS="false"; npm test
Remove-Item Env:BROWSER, Env:HEADLESS     # back to the defaults
```

## Reports, screenshots and traces

After a run, everything is in `reports/` (git ignores it):

- `reports/cucumber-report.html`: open it in a browser. Every step is listed, and failed scenarios have the screenshot embedded.
- `reports/screenshots/*.png`: full-page screenshot of every failed scenario.
- `reports/traces/*.zip`: Playwright trace of every failed scenario. Open it with `npx playwright show-trace reports/traces/<file>.zip` to step through each action with DOM snapshots and network calls.
- `reports/cucumber-report.json`: for other tools.

A trace is recorded for every scenario but only saved when the scenario fails, so passing runs don't fill the disk.

## Locator Strategy for Adding “Sauce Labs Backpack”

SauceDemo shows six products on one page, and every card has the same "Add to cart" button. So the real problem is: how do I click the button for **this** product without depending on where it sits on the page?

### 1. Preferred: scope to the product card by its name, then find the button by role (this is what the code uses)

```ts
// pages/InventoryPage.ts
productCard(productName: string): Locator {
  return this.productCards.filter({ has: this.page.getByText(productName, { exact: true }) });
}

addToCartButton(productName: string): Locator {
  return this.productCard(productName).getByRole('button', { name: 'Add to cart' });
}
```

`productCards` is `page.getByTestId('inventory-item')` (SauceDemo's `data-test` attribute).

Why I prefer it:
- It finds the product the way a person does: by its name. The same name comes straight from the feature file, so one method works for all six products.
- Position doesn't matter. If products are re-sorted (there's a sort dropdown on this page) or new ones are added, it still finds the right card.
- The button is found by role and visible label, inside that one card only, so "Add to cart" matches exactly one button. The label matters here: the product image and title links in each card also have `role="button"`, so `getByRole('button')` on its own would match three elements in the card.
- `exact: true` stops "Sauce Labs Backpack" from also matching a longer name that contains it.
- After the click the same card's button becomes "Remove", and I can check that with the same pattern (`removeButton()`).

### 2. Fallback: the developer test id for that button

```ts
page.getByTestId('add-to-cart-sauce-labs-backpack')
// same thing in CSS: page.locator('[data-test="add-to-cart-sauce-labs-backpack"]')
```

It's acceptable because `data-test` attributes are there for testing and are quite stable. But it's less ideal:
- The id is built from the product name with the developers' own rule (lowercase, spaces to dashes). For a product like "Test.allTheThings() T-Shirt (Red)" the id is `add-to-cart-test.allthethings()-t-shirt-(red)`, which is easy to get wrong in a step.
- It changes to `remove-sauce-labs-backpack` after the click, so it only finds one state of the button.
- It's one string with nothing to fall back on. If a developer renames it, the test just fails.

I didn't chain the two with Playwright's `.or()`. A silent fallback can hide a real UI change. I'd rather the test fail, and then I fix one line in the page object.

### What I avoided
- **Index-based**: `page.locator('.inventory_item').nth(0)`. This breaks as soon as the sort order or the catalog changes.
- **Long XPath chains**: `//div[@id='inventory_container']/div/div[1]/div[2]/div[2]/button`. This breaks on any layout change and nobody can read it.
- **Text alone**: `page.getByText('Add to cart')`. This matches six buttons.

The same rules are used everywhere: `data-test` first, then role and accessible name, then scoping by visible text. Locators only live in `pages/`.

## Database testing

SauceDemo has no database I can reach. So this part shows **how** I'd check the DB from a UI test. The DB client itself is real, working code.

### What's in the repo

| File | What it does |
|---|---|
| `support/db/dbClient.ts` | The DB connection utility (details below) |
| `support/db/orderRepository.ts` | The SQL for the orders check, written against the sample schema below |
| `features/order-db-validation.feature` + `steps/db.steps.ts` | The full scenario: buy in the UI, then check the order in the DB |
| `scripts/db-check.ts` | `npm run db:check`: connect, run `SELECT current_database(), now()`, close |
| `.github/workflows/e2e.yml` (`db-check` job) | Starts a real Postgres container in CI and runs `db:check` against it |

**DB connection utility (`DbClient`)**
- **Config-driven**: host, port, name, user, password, SSL and timeouts come from `DB_*` settings (`config/.env` or env vars). No credentials in code. `.env.example` only has placeholders.
- **Query functions**: `query()` returns rows, `queryOne()` returns one row or `undefined` (and errors if there's more than one), `execute()` returns the affected row count. Values always go in as parameters (`$1`, `$2`), never by building strings, so there's no SQL injection and quoting is never an issue.
- **Error handling**: every failure is wrapped in a `DbError` that says which DB it was talking to, the real reason and the SQL. Param values are left out because they can hold personal data. There are connect and statement timeouts so a stuck DB can't hang the run, and the pool has an `error` listener so a dropped idle connection gets logged instead of crashing the process. Example with no DB running:
  ```
  [ERROR] DB query failed on test_user@localhost:5432/shop: connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432
  SQL: SELECT current_database() AS database, now() AS server_time
  ```
- **Clean teardown**: the pool is created on first use (runs that don't touch the DB never connect), shared per worker, and closed in the `AfterAll` hook. `db:check` closes in a `finally`.

### Sample schema (my assumption of what the shop backend would have)

```sql
CREATE TABLE orders (
  id           BIGSERIAL PRIMARY KEY,
  username     TEXT          NOT NULL,
  first_name   TEXT          NOT NULL,
  last_name    TEXT          NOT NULL,
  postal_code  TEXT          NOT NULL,
  status       TEXT          NOT NULL,          -- PENDING -> COMPLETE
  total_amount NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_last_name ON orders (last_name);

CREATE TABLE order_items (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT          NOT NULL,
  quantity     INT           NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL
);
```

### How the UI test validates the DB record (pseudocode)

```
Scenario: completed order is saved in the DB

  runId    = unique per scenario, e.g. "e2e-mvezspom-k37z"         (world.ts)
  customer = testdata "valid", lastName = "Buyer-" + runId         (isolation key)

  UI   login as standard_user
  UI   add "Sauce Labs Backpack" -> open cart -> checkout with customer -> finish
  UI   assert "Thank you for your order!" is shown

  register cleanup: delete orders where last_name = customer.lastName
                    (runs in the After hook whether the scenario passes or fails)

  order = pollUntil(
            fetch:    SELECT ... FROM orders WHERE last_name = $1
                      ORDER BY created_at DESC LIMIT 1,
            done:     order.status == "COMPLETE",
            timeout:  15 s, interval: 1 s)          -> clear error if it never gets there

  assert order.username    == "standard_user"
  assert order.postal_code == customer.postalCode

  items = SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = $1
  assert items contains { product_name: "Sauce Labs Backpack", quantity: 1 }
```

### Sample SQL

```sql
-- find this scenario's order (isolation: last_name carries the run id)
SELECT id, username, first_name, last_name, postal_code, status, total_amount, created_at
  FROM orders
 WHERE last_name = $1
 ORDER BY created_at DESC
 LIMIT 1;

-- check the line items
SELECT product_name, quantity, unit_price
  FROM order_items
 WHERE order_id = $1
 ORDER BY product_name;

-- cleanup (order_items go too, ON DELETE CASCADE)
DELETE FROM orders WHERE last_name = $1;
```

### Isolation strategy
- Every scenario gets its own run id, and it goes into the customer's last name (`testdata/index.ts`). So every query and every delete only touches **this scenario's** rows. That's what makes it safe to run in parallel or while other people use the same environment.
- Many scenarios log in as the same `standard_user`, so filtering by user alone would mix orders up. That's why I tag the data, not the user.
- The test never truncates or reseeds shared tables. If a team can give us one, a throwaway DB per CI run (a container with migrations applied) is even better. The CI `db-check` job already starts one.

### Cleanup strategy
- The cleanup is registered **before** the assertions, and the `After` hook runs all registered cleanups even if the scenario failed. A cleanup error is logged, not thrown, so it can't hide the real failure.
- It deletes by the run-id key only, never "everything older than X" from inside a test.
- As a safety net for runs that get killed half way, a nightly job could remove leftovers:
  `DELETE FROM orders WHERE last_name LIKE 'Buyer-e2e-%' AND created_at < now() - interval '1 day';`

### Eventual consistency (retry logic)
- The backend might save the order a moment after the UI says "Thank you" (for example through a queue). Checking only once would make the test flaky.
- `pollUntil()` in `support/waits.ts` re-runs the query every second until the order reaches the **final** status (not just "a row exists"), with a hard 15 s limit. It also retries if a query throws, like a short connection blip.
- If it times out, the error says what it waited for, how many attempts it made and the last value it saw, for example:
  `Timed out after 15000ms (15 attempts) waiting for order for Buyer-e2e-mvezt1sh-2eov with status COMPLETE. Last value: undefined.`

### How this was tested without a SauceDemo database
The `@db` scenario was run against a local throwaway PostgreSQL 18 with the schema above, plus a small fake "backend" hook (kept outside the repo, it's not real test code) that inserts the order as `PENDING` right after checkout and switches it to `COMPLETE` 3 seconds later. The poll saw `PENDING` three times, then `COMPLETE`. The item check passed, and the cleanup deleted both rows. With nothing writing the order, the same scenario failed after 15 s with the timeout message above, and the screenshot and trace were saved. `npm run db:check` with no DB running gives the clean `ECONNREFUSED` error shown earlier and exits with code 1.

To try it yourself against a DB that has these tables: set the `DB_*` values in `config/.env`, then run `npm run db:check` and `npm run test:db`.

## Engineering Notes

**1. Why did you choose this framework structure?**

Each folder has one job, which is also the split the brief asks for. Feature files are plain English and don't know anything about Playwright. Steps are the glue: they read the Gherkin, call page methods and do the checks. Page objects are the only place that knows about the HTML. So when the UI changes I fix one page file, and the features and steps stay the same. Config and test data sit outside the code, so changing the browser or a user doesn't need a code change.

I used Playwright as a library under cucumber-js (not playwright-bdd) because the brief asks for a driver factory and Before/After hooks. That maps one to one to cucumber's own hooks, and cucumber gives me tags, parallel runs, retries and the HTML report with no extra tools. Playwright and TypeScript is also what I've used most at work.

**2. How does your wait strategy prevent flakiness?**

There are no fixed sleeps in the UI code. Before every click or fill, Playwright waits until the element is visible, enabled and not moving. Every check is a web-first assertion like `expect(locator).toHaveText(...)`, which keeps retrying until it passes or `EXPECT_TIMEOUT` (5 s) runs out. So the test moves on the moment the page is ready, instead of sleeping 3 seconds and hoping that was enough. Key checks also look at the URL (after login, in the cart, on the confirmation page), so a step can't pass while the browser is still on the old page.

All timeouts come from config, so a slow environment just needs a bigger number, not code changes. The only pause in the whole framework is inside `pollUntil()` for the DB, which waits 1 s between queries and has a hard limit. And every scenario gets a fresh browser context, so nothing left over from a previous test (cookies, cart) can cause a random failure.

**3. How does your locator strategy improve stability?**

I use the `data-test` attributes SauceDemo already has. They exist for testing, so they don't change when someone restyles the page or renames a CSS class. When I need one item out of a list, I find it by its visible name and not its position, so re-sorting or adding products doesn't break anything. There's no XPath and no `nth()`. All locators live in page objects, so a fix is one line in one file. The full reasoning is in the [locator section](#locator-strategy-for-adding-sauce-labs-backpack).

**4. How would you scale this to 50+ scenarios?**

The structure already holds up. Mostly it's about keeping it tidy as it grows:
- One feature file per business area, and tags for suites (`@smoke`, `@regression`, `@checkout`), so CI runs a quick smoke on every PR and everything nightly.
- Reuse steps. Keep step text generic with parameters and data tables, and check whether a step already exists before writing a new one.
- Skip the UI login where login isn't what's being tested. Log in once, save the storage state (cookies) and reuse it. This is the biggest time saver once there are lots of scenarios.
- Run in parallel (already there with `PARALLEL`) and split the run across CI machines with cucumber's `--shard`.
- Keep test data unique per scenario (the run id already does this) so parallel runs never clash, and move to small data builders if the JSON files grow too much.
- Add ESLint and a pre-commit hook once more people work on it.

**5. How would you execute this in CI/CD?**

There's a working GitHub Actions pipeline in `.github/workflows/e2e.yml`. On every push to `main` and every PR, it installs dependencies and the browser, type-checks, and runs the suite on Chromium and Firefox at the same time (2 workers each, 1 retry). The HTML report, screenshots and traces are uploaded as artifacts even when tests fail, so I can see what happened without re-running. A second job starts a Postgres container and runs `npm run db:check`. You can also start it by hand with a tag filter (`workflow_dispatch`).

In a real team I'd make `@smoke` a required check on PRs, run the full suite nightly and after every deploy to staging, keep passwords and DB credentials in GitHub Secrets, and post the result to the team's Slack or Teams channel.

**6. Two improvements you would make with more time**

1. **Faster, focused scenarios**: log in through a saved storage state instead of the login page for every non-login scenario, and add API calls for setup (for example filling the cart). This cuts run time a lot and makes each scenario test only one thing.
2. **Better reporting and history**: keep the reports of every run instead of overwriting `reports/` (for example a folder per run, or Allure with history), and show trends of failures and flaky tests. This actually happened during this project: one WebKit run had a failure, the reports folder was cleared for the re-run before anyone read it, and it couldn't be reproduced in 9 more WebKit runs.

## Assumptions

- SauceDemo is a public demo site. Its password (`secret_sauce`) is printed on its own login page, so I kept it in `testdata/users.json`. For a real app the passwords would come from env vars or CI secrets, not from the repo.
- SauceDemo has no database. The schema, the `PENDING`/`COMPLETE` statuses and the idea that the backend saves orders a bit later are my assumptions, to show the design.
- The tests run against the live public site, so an outage there will fail them. Timeouts are generous for that, and CI retries a failed scenario once.
- Product names and error messages in the feature files were checked against the live site on 19 Oct 2026.
- Node.js 20 or newer.

### Known issue
- On WebKit, one full run had one failed scenario. It didn't come back in the next 9 WebKit runs (6 normal, 3 parallel), and the reports folder was cleared before the failure was read, so the cause is unknown. Chromium (3 runs), Firefox and parallel runs were all green.
- Later the same day, one run had `page.goto` timeouts (30 s, waiting for the page `load` event) in several scenarios at once. A minute later the site loaded in about 1.4 s and the same run passed. So the live site does have slow moments, and the WebKit failure may have been one of them, though I can't prove that.

## AI usage

**Yes, I used AI.** The brief allows it with disclosure, so here's exactly how.

- **Tool**: Claude Code (Anthropic's coding assistant for the terminal), running on my machine. No other AI tools.
- **How I used it**: I gave it the assignment PDF and asked for a plan first, before any code. I chose the stack (Playwright + TypeScript + Cucumber, because that's what I use most) and to submit through GitHub. Then it wrote the code in steps (each commit in the history is one step) and ran the scenarios against the live site after each feature was added.
- **Parts that were AI-assisted**: most of the code (config, support layer, page objects, steps, feature files, DB client, CI workflow) and the first draft of this README.
- **How the output was checked**:
  - Before any locator was written, it opened SauceDemo in a headless browser and listed the real `data-test` attributes and error messages, so locators and expected texts come from the live site, not guesses.
  - Every scenario was run against the live site: Chromium 3 times, Firefox, WebKit and parallel.
  - The DB client was run against a real local Postgres (details above), and `tsc` type-checks the whole project.
- **Problems found and fixed during the work**:
  1. When Postgres wasn't running, the DB error message was **empty**. On Windows, `localhost` tries IPv6 and IPv4, and `pg` throws an `AggregateError` with no message. Fixed by pulling the real reasons out of the inner errors.
  2. When a `Before` hook failed before the page was opened, the `After` hook still tried to take a screenshot and logged a confusing warning. It now skips that.
  3. Cucumber printed a warning when running a single feature file, because the paths were set in the config too. I removed them from the config, since `features/**` is the default anyway.
  4. The one WebKit failure in [Known issue](#known-issue).
- **What I did myself and why**: I didn't edit the code by hand. My part was the decisions: Playwright + TypeScript + Cucumber because it's what I know best, GitHub for the submission, and keeping the framework small enough that I can explain and change any part of it. I also recorded the walkthrough video myself.
