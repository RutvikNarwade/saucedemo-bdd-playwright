import path from 'node:path';
import dotenv from 'dotenv';

// Values already set in the shell (or in CI) win over config/.env
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

function readString(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function readNumber(name: string, fallback: number): number {
  const raw = readString(name, String(fallback));
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Config error: ${name} must be a positive number, got "${raw}"`);
  }
  return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = readString(name, String(fallback)).toLowerCase();
  if (raw !== 'true' && raw !== 'false') {
    throw new Error(`Config error: ${name} must be true or false, got "${raw}"`);
  }
  return raw === 'true';
}

function readBrowser(): BrowserName {
  const browser = readString('BROWSER', 'chromium').toLowerCase();
  if (browser !== 'chromium' && browser !== 'firefox' && browser !== 'webkit') {
    throw new Error(`Config error: BROWSER must be chromium, firefox or webkit, got "${browser}"`);
  }
  return browser;
}

export const config = {
  baseUrl: readString('BASE_URL', 'https://www.saucedemo.com'),
  browser: readBrowser(),
  headless: readBoolean('HEADLESS', true),
  slowMo: readNumber('SLOW_MO', 0),

  // Timeouts in ms. Playwright waits up to these limits; nothing sleeps for a fixed time.
  actionTimeout: readNumber('ACTION_TIMEOUT', 10_000),
  navigationTimeout: readNumber('NAVIGATION_TIMEOUT', 30_000),
  expectTimeout: readNumber('EXPECT_TIMEOUT', 5_000),
  stepTimeout: readNumber('STEP_TIMEOUT', 60_000),

  logLevel: readString('LOG_LEVEL', 'info'),

  db: {
    enabled: readBoolean('DB_ENABLED', false),
    host: readString('DB_HOST', 'localhost'),
    port: readNumber('DB_PORT', 5432),
    database: readString('DB_NAME', 'shop'),
    user: readString('DB_USER', 'test_user'),
    password: readString('DB_PASSWORD', ''),
    ssl: readBoolean('DB_SSL', false),
    connectTimeout: readNumber('DB_CONNECT_TIMEOUT', 5_000),
    queryTimeout: readNumber('DB_QUERY_TIMEOUT', 10_000),
  },
};

export type DbConfig = typeof config.db;
