import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { config, type DbConfig } from '../../config/config';
import { logger } from '../logger';

export class DbError extends Error {
  readonly sql?: string;

  constructor(message: string, sql?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DbError';
    this.sql = sql;
  }
}

const oneLine = (sql: string) => sql.replace(/\s+/g, ' ').trim();

// A refused connection to "localhost" can come back as an AggregateError (IPv6 + IPv4 tries)
// with an empty message, so dig out the real reasons
function describe(error: unknown): string {
  if (error instanceof AggregateError) return error.errors.map(describe).join('; ');
  if (error instanceof Error) return error.message || (error as NodeJS.ErrnoException).code || error.name;
  return String(error);
}

// Small wrapper around a pg connection pool. Settings come from config (DB_* env vars).
// The pool is created on first use, so runs that never touch the DB never connect.
export class DbClient {
  private readonly settings: DbConfig;
  private pool: Pool | undefined;

  constructor(settings: DbConfig) {
    this.settings = settings;
  }

  // Returns all rows. Always pass values as params ($1, $2...), never build SQL with strings.
  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.run<T>(sql, params);
    return result.rows;
  }

  async queryOne<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    if (rows.length > 1) {
      throw new DbError(`Expected at most 1 row but got ${rows.length}`, sql);
    }
    return rows[0];
  }

  // For INSERT / UPDATE / DELETE. Returns how many rows were affected.
  async execute(sql: string, params: unknown[] = []): Promise<number> {
    const result = await this.run(sql, params);
    return result.rowCount ?? 0;
  }

  async close(): Promise<void> {
    if (!this.pool) return;
    const pool = this.pool;
    this.pool = undefined;
    await pool.end();
    logger.info('DB pool closed');
  }

  private getPool(): Pool {
    if (!this.pool) {
      const { host, port, database, user, password, ssl, connectTimeout, queryTimeout } = this.settings;
      this.pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl,
        max: 5,
        connectionTimeoutMillis: connectTimeout,
        statement_timeout: queryTimeout,
      });
      // An idle connection can drop (DB restart, network blip). Log it instead of crashing the run.
      this.pool.on('error', (error) => logger.warn(`DB pool error: ${error.message}`));
      logger.info(`DB pool created for ${user}@${host}:${port}/${database}`);
    }
    return this.pool;
  }

  private async run<T extends QueryResultRow>(sql: string, params: unknown[]): Promise<QueryResult<T>> {
    const started = Date.now();
    try {
      const result = await this.getPool().query<T>(sql, params);
      logger.debug(`SQL ok (${Date.now() - started}ms): ${oneLine(sql)}`);
      return result;
    } catch (error) {
      const { user, host, port, database } = this.settings;
      // The SQL goes in the message, the param values don't (they can hold personal data)
      throw new DbError(
        `DB query failed on ${user}@${host}:${port}/${database}: ${describe(error)}\nSQL: ${oneLine(sql)}`,
        sql,
        { cause: error },
      );
    }
  }
}

// One shared client per worker. Closed in the AfterAll hook.
let sharedClient: DbClient | undefined;

export function getDb(): DbClient {
  if (!config.db.enabled) {
    throw new DbError('DB access is turned off. Set DB_ENABLED=true and the DB_* values in config/.env');
  }
  sharedClient ??= new DbClient(config.db);
  return sharedClient;
}

export async function closeDb(): Promise<void> {
  await sharedClient?.close();
  sharedClient = undefined;
}
