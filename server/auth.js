import crypto from 'node:crypto';
import { Router } from 'express';
import { authDb } from './store.js';

export const BOARD_EMAIL = 'informs@scu.edu';
const SESSION_COOKIE = 'informs_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

const loginAttempts = new Map();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, { salt, hash }) {
  const candidate = Buffer.from(hashPassword(password, salt).hash, 'hex');
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createSession(res, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_TTL_MS;
  authDb.data.sessions[token] = { email, expires };
  for (const [key, session] of Object.entries(authDb.data.sessions)) {
    if (session.expires < Date.now()) delete authDb.data.sessions[key];
  }
  authDb.save();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
  });
}

export function getSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const session = authDb.data.sessions[token];
  if (!session || session.expires < Date.now()) return null;
  return session;
}

export function requireAuth(req, res, next) {
  if (!getSession(req)) return res.status(401).json({ error: 'Please log in as the INFORMS board.' });
  next();
}

export const authRouter = Router();

authRouter.get('/status', (req, res) => {
  const session = getSession(req);
  res.json({
    registered: Boolean(authDb.data.user),
    authenticated: Boolean(session),
    email: session?.email ?? null,
  });
});

authRouter.post('/register', (req, res) => {
  if (authDb.data.user) {
    return res.status(409).json({ error: 'The board account has already been registered. Please log in.' });
  }
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (email !== BOARD_EMAIL) {
    return res.status(403).json({ error: `Only ${BOARD_EMAIL} can register as the board account.` });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }
  authDb.data.user = { email, ...hashPassword(password), createdAt: new Date().toISOString() };
  authDb.save();
  res.status(201).json({ ok: true });
});

authRouter.post('/login', (req, res) => {
  const ip = req.ip;
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.count >= MAX_ATTEMPTS && Date.now() - attempts.first < LOCKOUT_MS) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' });
  }

  const user = authDb.data.user;
  if (!user) return res.status(400).json({ error: 'No board account exists yet. Please register first.' });

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (email !== user.email || !verifyPassword(password, user)) {
    const current = attempts && Date.now() - attempts.first < LOCKOUT_MS ? attempts : { count: 0, first: Date.now() };
    current.count += 1;
    loginAttempts.set(ip, current);
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  loginAttempts.delete(ip);
  createSession(res, user.email);
  res.json({ ok: true, email: user.email });
});

authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    delete authDb.data.sessions[token];
    authDb.save();
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});
