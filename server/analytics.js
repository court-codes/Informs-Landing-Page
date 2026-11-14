import crypto from 'node:crypto';
import { Router } from 'express';
import { analyticsDb } from './store.js';
import { requireAuth } from './auth.js';

const CTAS = ['join', 'newsletter'];
const MAX_EVENTS = 200_000;
const MAX_ENGAGEMENT_SECONDS = 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

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

analyticsRouter.get('/summary', requireAuth, (req, res) => {
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
      const bySource = {};
      for (const c of ctaClicks) bySource[c.source] = (bySource[c.source] || 0) + 1;
      return [
        cta,
        {
          clicks: ctaClicks.length,
          uniqueClickers: clickers.size,
          clickRate: visitors.size ? clickers.size / visitors.size : 0,
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
  });
});
