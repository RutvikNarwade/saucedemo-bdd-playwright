import dotenv from 'dotenv';

// Load config/.env here too, so PARALLEL / RETRY / TAGS from that file are picked up
dotenv.config({ path: 'config/.env', quiet: true });

// Cucumber profiles. Pick one with: npx cucumber-js --profile <name>
const common = {
  requireModule: ['tsx/cjs'],
  require: ['support/**/*.ts', 'steps/**/*.ts'],
  format: [
    'progress-bar',
    'summary',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  parallel: Number(process.env.PARALLEL ?? 1),
  retry: Number(process.env.RETRY ?? 0),
};

export default {
  ...common,
  // @db needs a real database, so it only runs through the db profile
  tags: process.env.TAGS ?? 'not @db',
};

export const smoke = {
  ...common,
  tags: '@smoke and not @db',
};

export const db = {
  ...common,
  tags: '@db',
};
