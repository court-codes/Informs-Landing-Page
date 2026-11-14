import { withDefaults } from '../shared/content.js';
import { HttpError, json, randomHex, readJson } from './http.js';
import { ensureSchema, getSetting, putSetting } from './db.js';
import * as auth from './auth.js';
import * as analytics from './analytics.js';

const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

async function getContent(request, env) {
  return json(withDefaults(await getSetting(env.DB, 'content')));
}

async function saveContent(request, env) {
  await auth.requireAuth(request, env);
  const body = await readJson(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid content' }, 400);
  const content = withDefaults(body);
  await putSetting(env.DB, 'content', content);
  return json(content);
}

async function upload(request, env) {
  await auth.requireAuth(request, env);
  let file;
  try {
    file = (await request.formData()).get('image');
  } catch {
    file = null;
  }
  if (!file || typeof file === 'string' || !IMAGE_TYPES[file.type]) {
    return json({ error: 'Please choose a PNG, JPG, WebP, or GIF image.' }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: 'Images must be under 8 MB.' }, 400);
  const key = `${Date.now()}-${randomHex(6)}.${IMAGE_TYPES[file.type]}`;
  await env.UPLOADS.put(key, await file.arrayBuffer(), { metadata: { type: file.type } });
  return json({ url: `/uploads/${key}` }, 201);
}

async function serveUpload(key, env) {
  const { value, metadata } = await env.UPLOADS.getWithMetadata(key, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: { 'Content-Type': metadata?.type || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

async function contact(request) {
  const body = await readJson(request);
  const field = (name, max) => String(body[name] || '').trim().slice(0, max);
  const [name, email, subject, message] = [field('name', 120), field('email', 200), field('subject', 200), field('message', 5000)];
  if (!name || !email || !subject || !message) return json({ error: 'Please fill in every field.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
  // No email service is configured, so the browser opens the visitor's email app instead.
  return json({ delivered: false });
}

const ROUTES = {
  'GET /api/content': getContent,
  'PUT /api/content': saveContent,
  'POST /api/uploads': upload,
  'POST /api/contact': contact,
  'GET /api/auth/status': auth.status,
  'POST /api/auth/login': auth.login,
  'POST /api/auth/logout': auth.logout,
  'POST /api/analytics/pageview': analytics.pageview,
  'POST /api/analytics/engagement': analytics.engagement,
  'POST /api/analytics/click': analytics.click,
  'GET /api/analytics/summary': async (request, env) => {
    await auth.requireAuth(request, env);
    return analytics.summary(request, env);
  },
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/uploads/') && request.method === 'GET') {
      return serveUpload(decodeURIComponent(pathname.slice('/uploads/'.length)), env);
    }
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const handler = ROUTES[`${request.method} ${pathname}`];
    if (!handler) return json({ error: 'Not found' }, 404);
    try {
      await ensureSchema(env.DB);
      return await handler(request, env);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  },
};
