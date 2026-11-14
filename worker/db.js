const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, count INTEGER NOT NULL, first INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS pageviews (id TEXT PRIMARY KEY, v TEXT NOT NULL, s TEXT NOT NULL, path TEXT NOT NULL, ts INTEGER NOT NULL, secs INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS pageviews_ts ON pageviews (ts)',
  'CREATE TABLE IF NOT EXISTS clicks (v TEXT NOT NULL, cta TEXT NOT NULL, source TEXT, path TEXT, ts INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS clicks_ts ON clicks (ts)',
];

let ready = null;

// The database is created empty by Cloudflare, so tables are set up on the first request each Worker instance handles.
export function ensureSchema(db) {
  ready ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export async function getSetting(db, key) {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return row ? JSON.parse(row.value) : null;
}

export function putSetting(db, key, value) {
  return db
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, JSON.stringify(value))
    .run();
}
