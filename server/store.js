import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultContent } from './defaultContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

class JsonFile {
  constructor(name, defaults) {
    this.file = path.join(DATA_DIR, name);
    this.timer = null;
    this.data = structuredClone(defaults);
    if (fs.existsSync(this.file)) {
      try {
        this.data = { ...this.data, ...JSON.parse(fs.readFileSync(this.file, 'utf8')) };
      } catch (err) {
        console.error(`Could not read ${this.file}; starting from defaults.`, err);
      }
    }
  }

  save() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 250);
  }

  flush() {
    clearTimeout(this.timer);
    this.timer = null;
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data));
    fs.renameSync(tmp, this.file);
  }
}

export const authDb = new JsonFile('auth.json', { user: null, sessions: {} });
export const contentDb = new JsonFile('content.json', { content: defaultContent });
export const analyticsDb = new JsonFile('analytics.json', {
  pageviews: [],
  clicks: [],
  formResponses: {},
});

contentDb.data.content = mergeDefaults(defaultContent, contentDb.data.content);

function mergeDefaults(defaults, value) {
  if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults;
  if (defaults && typeof defaults === 'object') {
    const out = {};
    const src = value && typeof value === 'object' ? value : {};
    for (const key of Object.keys(defaults)) out[key] = mergeDefaults(defaults[key], src[key]);
    for (const key of Object.keys(src)) if (!(key in out)) out[key] = src[key];
    return out;
  }
  return value === undefined ? defaults : value;
}

export function sanitizeContent(next) {
  return mergeDefaults(defaultContent, next);
}

function flushAll() {
  for (const db of [authDb, contentDb, analyticsDb]) if (db.timer) db.flush();
}

process.on('exit', flushAll);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    flushAll();
    process.exit(0);
  });
}
