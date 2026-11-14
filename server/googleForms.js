import crypto from 'node:crypto';
import { analyticsDb, authDb } from './store.js';

export const FORMS = ['join', 'newsletter'];

const STALE_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const SCRIPT_URL = /^https:\/\/script\.google\.com\/(macros|a\/macros\/[^/]+)\/s\/[\w-]+\/exec$/;

export const isScriptUrl = (url) => SCRIPT_URL.test(url);

const connections = () => (authDb.data.formConnections ??= {});
const responses = () => (analyticsDb.data.formResponses ??= {});

export function getFormSecret() {
  if (process.env.FORM_WEBHOOK_SECRET) return process.env.FORM_WEBHOOK_SECRET;
  if (!authDb.data.formSecret) {
    authDb.data.formSecret = crypto.randomBytes(24).toString('hex');
    authDb.save();
  }
  return authDb.data.formSecret;
}

export function rotateFormSecret() {
  authDb.data.formSecret = crypto.randomBytes(24).toString('hex');
  authDb.save();
  return authDb.data.formSecret;
}

export function setFormUrl(form, url) {
  if (url === (connections()[form]?.url ?? '')) return;
  if (url) connections()[form] = { url };
  else delete connections()[form];
  delete responses()[form];
  authDb.save();
  analyticsDb.save();
}

export async function fetchTimestamps(url, secret, fetchImpl = fetch) {
  let res;
  try {
    res = await fetchImpl(`${url}?secret=${encodeURIComponent(secret)}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') throw new Error('Google didn’t respond in time. Try again in a minute.');
    throw new Error('Couldn’t reach Google. Check the internet connection of the computer running the site.');
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? 'Google returned a sign-in page instead of data. In the deployment settings, set “Who has access” to “Anyone”.'
        : `Google returned an error (${res.status}). Check that the web app URL is correct and the deployment is active.`,
    );
  }
  if (data.error) {
    throw new Error(
      data.error === 'Invalid secret'
        ? 'The form’s script has an old secret. Paste the latest script, then Deploy → Manage deployments → edit → New version.'
        : data.error,
    );
  }
  if (!Array.isArray(data.timestamps)) throw new Error('Unexpected response from the script. Make sure you pasted the latest script.');
  return data.timestamps.filter(Number.isFinite).sort((a, b) => a - b);
}

const inFlight = new Map();

export function syncForm(form, fetchImpl) {
  const url = connections()[form]?.url;
  if (!url) return Promise.resolve();
  if (inFlight.has(form)) return inFlight.get(form);

  const run = (async () => {
    const entry = responses()[form] ?? { timestamps: [] };
    try {
      entry.timestamps = await fetchTimestamps(url, getFormSecret(), fetchImpl);
      entry.error = null;
    } catch (err) {
      entry.error = err.message;
    }
    entry.syncedAt = Date.now();
    if (connections()[form]?.url === url) {
      responses()[form] = entry;
      analyticsDb.save();
    }
  })().finally(() => inFlight.delete(form));

  inFlight.set(form, run);
  return run;
}

export async function syncAll({ onlyStale = false } = {}) {
  const cutoff = Date.now() - STALE_MS;
  const due = FORMS.filter((form) => !onlyStale || !(responses()[form]?.syncedAt > cutoff));
  await Promise.all(due.map((form) => syncForm(form)));
}

export function formStatus(form) {
  const url = connections()[form]?.url ?? '';
  const entry = url ? responses()[form] : null;
  const timestamps = entry?.timestamps ?? [];
  return {
    url,
    connected: Boolean(entry?.syncedAt && !entry.error),
    error: entry?.error ?? null,
    syncedAt: entry?.syncedAt ?? null,
    totalResponses: timestamps.length,
    lastResponseAt: timestamps.at(-1) ?? null,
  };
}

export function responseTimestamps(form) {
  return connections()[form]?.url ? (responses()[form]?.timestamps ?? []) : [];
}
