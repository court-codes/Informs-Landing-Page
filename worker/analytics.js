import { json, noContent, readJson } from './http.js';

const CTAS = ['join', 'newsletter'];
const MAX_ENGAGEMENT_SECONDS = 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

const isId = (value) => typeof value === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(value);
const cleanPath = (value) => (typeof value === 'string' && value.startsWith('/') ? value.slice(0, 120) : null);

export async function pageview(request, env) {
  const { visitorId, sessionId, path: rawPath } = await readJson(request);
  const path = cleanPath(rawPath);
  if (!isId(visitorId) || !isId(sessionId) || !path) return json({ error: 'Invalid pageview' }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO pageviews (id, v, s, path, ts, secs) VALUES (?, ?, ?, ?, ?, 0)')
    .bind(id, visitorId, sessionId, path, Date.now())
    .run();
  return json({ id });
}

export async function engagement(request, env) {
  const { id, seconds: rawSeconds } = await readJson(request);
  const seconds = Number(rawSeconds);
  if (!isId(id) || !Number.isFinite(seconds) || seconds < 0) return new Response(null, { status: 400 });
  await env.DB.prepare('UPDATE pageviews SET secs = MAX(secs, ?) WHERE id = ?')
    .bind(Math.min(Math.round(seconds), MAX_ENGAGEMENT_SECONDS), id)
    .run();
  return noContent();
}

export async function click(request, env) {
  const { visitorId, cta, source, path: rawPath } = await readJson(request);
  if (!isId(visitorId) || !CTAS.includes(cta)) return new Response(null, { status: 400 });
  await env.DB.prepare('INSERT INTO clicks (v, cta, source, path, ts) VALUES (?, ?, ?, ?, ?)')
    .bind(visitorId, cta, typeof source === 'string' ? source.slice(0, 40) : cta, cleanPath(rawPath), Date.now())
    .run();
  return noContent();
}

export async function summary(request, env) {
  const params = new URL(request.url).searchParams;
  const days = Number(params.get('days')) || 0;
  const tzOffsetMin = Number(params.get('tz')) || 0;
  const now = Date.now();
  const start = days > 0 ? now - days * DAY_MS : 0;

  const [pageviewRows, clickRows, firstRow] = await env.DB.batch([
    env.DB.prepare('SELECT v, s, path, ts, secs FROM pageviews WHERE ts >= ?').bind(start),
    env.DB.prepare('SELECT v, cta, source FROM clicks WHERE ts >= ?').bind(start),
    env.DB.prepare('SELECT MIN(ts) AS ts FROM pageviews'),
  ]);
  const pageviews = pageviewRows.results;
  const clicks = clickRows.results;

  const visitors = new Set(pageviews.map((p) => p.v));
  const sessions = new Set(pageviews.map((p) => p.s));
  const totalSeconds = pageviews.reduce((sum, p) => sum + p.secs, 0);

  const dayKey = (ts) => new Date(ts - tzOffsetMin * 60_000).toISOString().slice(0, 10);
  const firstTs = days > 0 ? start : (firstRow.results[0]?.ts ?? now);
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

  return json({
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
}
