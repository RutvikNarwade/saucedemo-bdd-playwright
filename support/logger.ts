import { config } from '../config/config';

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

const minLevel = levels[config.logLevel as Level] ?? levels.info;

function write(level: Level, message: string): void {
  if (levels[level] < minLevel) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string) => write('debug', message),
  info: (message: string) => write('info', message),
  warn: (message: string) => write('warn', message),
  error: (message: string) => write('error', message),
};
