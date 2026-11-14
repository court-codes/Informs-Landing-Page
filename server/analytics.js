import crypto from 'node:crypto';
import { Router } from 'express';
import { analyticsDb } from './store.js';
import { requireAuth } from './auth.js';
import {
  FORMS,
  formStatus,
  getFormSecret,
  isScriptUrl,
  responseTimestamps,
  rotateFormSecret,
  setFormUrl,
  syncAll,
  syncForm,
} from './googleForms.js';

const CTAS = FORMS;
const MAX_EVENTS = 200_000;
const MAX_ENGAGEMENT_SECONDS = 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const SUMMARY_SYNC_WAIT_MS = 4000;

const isId = (value) => typeof value === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(value);
const cleanPath = (value) => (typeof value === 'string' && value.startsWith('/') ? value.slice(0, 120) : null);

function push(list, item) {
  list.push(item);
  if (list.length > MAX_EVENTS) list.splice(0, list.length - MAX_EVENTS);
  analyticsDb.save();
}

export const analyticsRouter = Router();

analyticsRouter.post('/pageview', (req, res) => {
  const { visitorId, sessionId } = req.body || {};
  const path = cleanPath(req.body?.path);
  if (!isId(visitorId) || !isId(sessionId) || !path) return res.status(400).json({ error: 'Invalid pageview' });
  const id = crypto.randomUUID();
  push(analyticsDb.data.pageviews, { id, v: visitorId, s: sessionId, path, ts: Date.now(), secs: 0 });
  res.json({ id });
});

analyticsRouter.post('/engagement', (req, res) => {
  const { id } = req.body || {};
  const seconds = Number(req.body?.seconds);
  if (!isId(id) || !Number.isFinite(seconds) || seconds < 0) return res.status(400).end();
  const pageviews = analyticsDb.data.pageviews;
  for (let i = pageviews.length - 1; i >= 0 && i >= pageviews.length - 5000; i--) {
    if (pageviews[i].id === id) {
      pageviews[i].secs = Math.max(pageviews[i].secs, Math.min(Math.round(seconds), MAX_ENGAGEMENT_SECONDS));
      analyticsDb.save();
      break;
    }
  }
  res.status(204).end();
});

analyticsRouter.post('/click', (req, res) => {
  const { visitorId, cta, source } = req.body || {};
  const path = cleanPath(req.body?.path);
  if (!isId(visitorId) || !CTAS.includes(cta)) return res.status(400).end();
  push(analyticsDb.data.clicks, {
    v: visitorId,
    cta,
    source: typeof source === 'string' ? source.slice(0, 40) : cta,
    path,
    ts: Date.now(),
  });
  res.status(204).end();
});

function formsPayload() {
  return {
    secret: getFormSecret(),
    secretFromEnv: Boolean(process.env.FORM_WEBHOOK_SECRET),
    forms: Object.fromEntries(FORMS.map((form) => [form, formStatus(form)])),
  };
}

analyticsRouter.get('/forms', requireAuth, async (req, res) => {
  await syncAll({ onlyStale: true });
  res.json(formsPayload());
});

analyticsRouter.post('/forms/sync', requireAuth, async (req, res) => {
  await syncAll();
  res.json(formsPayload());
});

analyticsRouter.put('/forms/:form', requireAuth, async (req, res) => {
  const { form } = req.params;
  if (!FORMS.includes(form)) return res.status(404).json({ error: 'Unknown form' });
  const url = String(req.body?.url || '').trim();
  if (url && !isScriptUrl(url)) {
    return res.status(400).json({
      error: 'That doesn’t look like a web app URL. It should start with https://script.google.com/ and end with /exec.',
    });
  }
  setFormUrl(form, url);
  await syncForm(form);
  res.json(formsPayload());
});

analyticsRouter.post('/forms/rotate-secret', requireAuth, async (req, res) => {
  if (process.env.FORM_WEBHOOK_SECRET) {
    return res.status(409).json({ error: 'The secret is set by FORM_WEBHOOK_SECRET on the server and can only be changed there.' });
  }
  rotateFormSecret();
  await syncAll();
  res.json(formsPayload());
});

analyticsRouter.get('/summary', requireAuth, async (req, res) => {
  await Promise.race([syncAll({ onlyStale: true }), new Promise((resolve) => setTimeout(resolve, SUMMARY_SYNC_WAIT_MS))]);
  const days = Number(req.query.days) || 0;
  const tzOffsetMin = Number(req.query.tz) || 0;
  const now = Date.now();
  const start = days > 0 ? now - days * DAY_MS : 0;

  const { pageviews: allPageviews, clicks: allClicks } = analyticsDb.data;
  const pageviews = allPageviews.filter((p) => p.ts >= start);
  const clicks = allClicks.filter((c) => c.ts >= start);

  const visitors = new Set(pageviews.map((p) => p.v));
  const sessions = new Set(pageviews.map((p) => p.s));
  const totalSeconds = pageviews.reduce((sum, p) => sum + p.secs, 0);

  const dayKey = (ts) => new Date(ts - tzOffsetMin * 60_000).toISOString().slice(0, 10);
  const firstTs = days > 0 ? start : (allPageviews[0]?.ts ?? now);
  const chartDays = Math.min(Math.max(Math.ceil((now - firstTs) / DAY_MS), 1), 365);
  const daily = new Map();
  for (let i = chartDays - 1; i >= 0; i--) {
    daily.set(dayKey(now - i * DAY_MS), { visitors: new Set(), pageviews: 0 });
  }
  for (const p of pageviews) {
    const bucket = daily.get(dayKey(p.ts));
    if (bucket) {
      bucket.visitors.add(p.v);
      bucket.pageviews += 1;
    }
  }

  const pages = new Map();
  for (const p of pageviews) {
    const page = pages.get(p.path) || { path: p.path, views: 0, visitors: new Set(), seconds: 0 };
    page.views += 1;
    page.visitors.add(p.v);
    page.seconds += p.secs;
    pages.set(p.path, page);
  }

  const conversions = Object.fromEntries(
    CTAS.map((cta) => {
      const ctaClicks = clicks.filter((c) => c.cta === cta);
      const clickers = new Set(ctaClicks.map((c) => c.v));
      const completions = responseTimestamps(cta).filter((ts) => ts >= start).length;
      const bySource = {};
      for (const c of ctaClicks) bySource[c.source] = (bySource[c.source] || 0) + 1;
      return [
        cta,
        {
          clicks: ctaClicks.length,
          uniqueClickers: clickers.size,
          clickRate: visitors.size ? clickers.size / visitors.size : 0,
          completions,
          completionRate: clickers.size ? completions / clickers.size : 0,
          bySource,
        },
      ];
    }),
  );

  res.json({
    range: { days, start, end: now },
    totals: {
      visitors: visitors.size,
      sessions: sessions.size,
      pageviews: pageviews.length,
      avgEngagementPerVisit: sessions.size ? totalSeconds / sessions.size : 0,
      avgEngagementPerPageview: pageviews.length ? totalSeconds / pageviews.length : 0,
    },
    daily: [...daily.entries()].map(([date, d]) => ({ date, visitors: d.visitors.size, pageviews: d.pageviews })),
    pages: [...pages.values()]
      .map((p) => ({ path: p.path, views: p.views, visitors: p.visitors.size, avgSeconds: p.views ? p.seconds / p.views : 0 }))
      .sort((a, b) => b.views - a.views),
    conversions,
    formsConnected: Object.fromEntries(FORMS.map((form) => [form, formStatus(form).connected])),
  });
});
