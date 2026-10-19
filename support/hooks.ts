import { After, AfterAll, Before, BeforeAll, Status } from '@cucumber/cucumber';
import type { Browser } from 'playwright';
import { config } from '../config/config';
import { launchBrowser } from './browserFactory';
import { closeDb } from './db/dbClient';
import { logger } from './logger';
import type { CustomWorld } from './world';

// One browser per worker (launching is slow). Each scenario still gets its own
// fresh context, so cookies, storage and the cart never carry over.
let browser: Browser;

BeforeAll(async function () {
  browser = await launchBrowser();
});

AfterAll(async function () {
  await browser?.close();
  await closeDb();
});

// Fail fast instead of running the whole UI flow and failing at the DB step
Before({ tags: '@db' }, function () {
  if (!config.db.enabled) {
    throw new Error('@db scenarios need a database. Set DB_ENABLED=true and the DB_* values in config/.env');
  }
});

Before(async function (this: CustomWorld, { pickle }) {
  logger.info(`START  ${pickle.name} (run id ${this.runId})`);
  await this.openPage(browser);
  // Record a trace for every scenario but only keep it if the scenario fails
  await this.context.tracing.start({ screenshots: true, snapshots: true });
});

After(async function (this: CustomWorld, { pickle, result }) {
  const status = result?.status ?? Status.UNKNOWN;
  const fileName = `${pickle.name.replace(/[^a-z0-9]+/gi, '_')}_${this.runId}`;

  try {
    if (!this.page) {
      // A Before hook failed before the page was opened, so there is nothing to capture
    } else if (status === Status.FAILED) {
      const screenshot = await this.page.screenshot({ path: `reports/screenshots/${fileName}.png`, fullPage: true });
      this.attach(screenshot, 'image/png');
      await this.context.tracing.stop({ path: `reports/traces/${fileName}.zip` });
      logger.error(`Saved reports/screenshots/${fileName}.png and reports/traces/${fileName}.zip`);
    } else {
      await this.context.tracing.stop();
    }
  } catch (error) {
    // Don't let a failed screenshot hide the real failure or skip the cleanup below
    logger.warn(`Could not save failure artifacts: ${(error as Error).message}`);
  }

  for (const cleanup of this.cleanupTasks.reverse()) {
    try {
      await cleanup();
    } catch (error) {
      logger.warn(`Cleanup failed: ${(error as Error).message}`);
    }
  }

  await this.context?.close();
  const seconds = ((Date.now() - this.startedAt) / 1000).toFixed(1);
  logger.info(`${status.padEnd(6)} ${pickle.name} (${seconds}s)`);
});
