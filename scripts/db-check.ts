// Quick check that the DB settings in config/.env work: connect, run one read-only query, close.
// Usage: npm run db:check
import { config } from '../config/config';
import { DbClient } from '../support/db/dbClient';
import { logger } from '../support/logger';

async function main(): Promise<void> {
  const db = new DbClient(config.db);
  try {
    const row = await db.queryOne<{ database: string; server_time: Date }>(
      'SELECT current_database() AS database, now() AS server_time',
    );
    logger.info(`DB connection OK. Database "${row?.database}", server time ${row?.server_time.toISOString()}`);
  } catch (error) {
    logger.error((error as Error).message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

void main();
