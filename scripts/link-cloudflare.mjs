// Points local development at the live Cloudflare database and photo storage,
// so `npm run dev` uses the same board account and content as the live site.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const CONFIG = new URL('../wrangler.jsonc', import.meta.url);
const WORKER_NAME = 'informs-landing-page';
const DB_NAME = 'informs-landing-page-db';

const wrangler = (args, stdio = ['inherit', 'pipe', 'inherit']) =>
  execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio });

// Wrangler can print notices before the JSON, so parse from the first bracket.
const parseList = (output) => JSON.parse(output.slice(output.indexOf('[')));

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

try {
  if (/not authenticated/i.test(wrangler(['whoami']))) throw new Error();
} catch {
  console.log('Opening your browser to sign in to Cloudflare…');
  wrangler(['login'], 'inherit');
}

const db = parseList(wrangler(['d1', 'list', '--json'])).find((d) => d.name === DB_NAME);
if (!db) fail(`Couldn't find the "${DB_NAME}" database in this Cloudflare account. Is this the account the site is deployed to?`);

const namespaces = parseList(wrangler(['kv', 'namespace', 'list'])).filter((n) => n.title.toLowerCase().includes(WORKER_NAME));
const kv = namespaces.length === 1 ? namespaces[0] : namespaces.find((n) => /upload/i.test(n.title));
if (!kv) {
  fail(
    `Couldn't tell which KV namespace holds the site's photos. Found: ${namespaces.map((n) => n.title).join(', ') || 'none'}.\n` +
      'Find it under Storage & Databases → KV in the Cloudflare dashboard and add its ID to wrangler.jsonc by hand.',
  );
}

const config = fs
  .readFileSync(CONFIG, 'utf8')
  .replace(/^(\s*)\/\/ No IDs on purpose.*$/m, '$1// The live database and photo storage. "remote": true makes `npm run dev` use them too.')
  .replace(/\{\s*"binding":\s*"DB"[^}]*\}/, `{ "binding": "DB", "database_name": "${DB_NAME}", "database_id": "${db.uuid}", "remote": true }`)
  .replace(/\{\s*"binding":\s*"UPLOADS"[^}]*\}/, `{ "binding": "UPLOADS", "id": "${kv.id}", "remote": true }`);
fs.writeFileSync(CONFIG, config);

console.log(`\nLinked localhost to the live site:\n  database  ${db.name} (${db.uuid})\n  photos    ${kv.title} (${kv.id})`);
console.log('\nRun `npm run dev` and log in with the board account. Edits on localhost now change the live site.');
