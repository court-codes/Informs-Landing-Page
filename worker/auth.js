import { HttpError, cookie, getCookie, json, randomHex, readJson } from './http.js';
import { getSetting } from './db.js';

const SESSION_COOKIE = 'informs_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;
// Cloudflare Workers caps PBKDF2 at 100,000 iterations.
const PBKDF2_ITERATIONS = 100_000;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'local';

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));

async function hashPassword(password, saltHex = randomHex(16)) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return { salt: saltHex, hash: toHex(bits) };
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const session = await env.DB.prepare('SELECT email, expires FROM sessions WHERE token = ?').bind(token).first();
  if (!session || session.expires < Date.now()) return null;
  return session;
}

export async function requireAuth(request, env) {
  if (!(await getSession(request, env))) throw new HttpError(401, 'Please log in as the INFORMS board.');
}

export async function status(request, env) {
  const session = await getSession(request, env);
  return json({
    authenticated: Boolean(session),
    email: session?.email ?? null,
  });
}

export async function login(request, env) {
  const ip = clientIp(request);
  const now = Date.now();
  const attempts = await env.DB.prepare('SELECT count, first FROM login_attempts WHERE ip = ?').bind(ip).first();
  const activeAttempts = attempts && now - attempts.first < LOCKOUT_MS ? attempts : null;
  if (activeAttempts && activeAttempts.count >= MAX_ATTEMPTS) {
    return json({ error: 'Too many attempts. Please wait 15 minutes and try again.' }, 429);
  }

  const user = await getSetting(env.DB, 'board_user');
  if (!user) return json({ error: 'Incorrect email or password.' }, 401);

  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const { hash } = await hashPassword(String(body.password || ''), user.salt);
  if (email !== user.email || !safeEqual(hash, user.hash)) {
    await env.DB.prepare(
      'INSERT INTO login_attempts (ip, count, first) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET count = ?, first = ?',
    )
      .bind(ip, now, (activeAttempts?.count ?? 0) + 1, activeAttempts?.first ?? now)
      .run();
    return json({ error: 'Incorrect email or password.' }, 401);
  }

  const token = randomHex(32);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip),
    env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (token, email, expires) VALUES (?, ?, ?)').bind(token, user.email, now + SESSION_TTL_SECONDS * 1000),
  ]);
  return json({ ok: true, email: user.email }, 200, { 'Set-Cookie': cookie(request, SESSION_COOKIE, token, SESSION_TTL_SECONDS) });
}

export async function logout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, SESSION_COOKIE, '', 0) });
}
