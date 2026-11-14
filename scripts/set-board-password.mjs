// Sets (or resets) the board account's password in the live Cloudflare database.
// Usage: npm run set-board-password            (live site)
//        npm run set-board-password -- --local (local-only database in .wrangler/)
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import readline from 'node:readline';

const BOARD_EMAIL = 'informs@scu.edu';
const DB_NAME = 'informs-landing-page-db';
// Must match PBKDF2_ITERATIONS in worker/auth.js.
const PBKDF2_ITERATIONS = 100_000;
const MIN_PASSWORD_LENGTH = 8;

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(question);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await askHidden('New board password: ');
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
if ((await askHidden('Type it again: ')) !== password) {
  console.error('Passwords do not match.');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
const value = JSON.stringify({ email: BOARD_EMAIL, salt, hash, createdAt: new Date().toISOString() });

const sql = [
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  `INSERT INTO settings (key, value) VALUES ('board_user', '${value}') ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  'DELETE FROM sessions',
].join('; ');

const target = process.argv.includes('--local') ? '--local' : '--remote';
execFileSync('npx', ['wrangler', 'd1', 'execute', DB_NAME, target, '--yes', '--command', sql], { stdio: 'inherit' });
console.log(`\nDone. Log in as ${BOARD_EMAIL} with the new password${target === '--remote' ? ' on the live site and on localhost' : ' on localhost'}.`);
