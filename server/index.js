import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { contentDb, sanitizeContent, UPLOAD_DIR } from './store.js';
import { authRouter, requireAuth, BOARD_EMAIL } from './auth.js';
import { analyticsRouter } from './analytics.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '2mb', type: ['application/json', 'text/plain'] }));

app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/api/content', (req, res) => {
  res.json(contentDb.data.content);
});

app.put('/api/content', requireAuth, (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid content' });
  contentDb.data.content = sanitizeContent(req.body);
  contentDb.save();
  res.json(contentDb.data.content);
});

const IMAGE_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Boolean(IMAGE_TYPES[file.mimetype])),
});

app.post('/api/uploads', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Images must be under 8 MB.' : err.message });
    if (!req.file) return res.status(400).json({ error: 'Please choose a PNG, JPG, WebP, or GIF image.' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const mailer = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

app.post('/api/contact', async (req, res) => {
  const field = (name, max) => String(req.body?.[name] || '').trim().slice(0, max);
  const name = field('name', 120);
  const email = field('email', 200);
  const subject = field('subject', 200);
  const message = field('message', 5000);
  if (!name || !email || !subject || !message) return res.status(400).json({ error: 'Please fill in every field.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  if (!mailer) return res.json({ delivered: false });

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || BOARD_EMAIL,
      replyTo: `${name} <${email}>`,
      subject: `[SCU INFORMS Website] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    res.json({ delivered: true });
  } catch (err) {
    console.error('Failed to send contact email', err);
    res.json({ delivered: false });
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

if (isProduction) {
  const dist = path.join(ROOT, 'dist');
  app.use(express.static(dist, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`SCU INFORMS server running on http://localhost:${PORT}`);
  if (!smtpConfigured) console.log('SMTP is not configured: the Contact form will fall back to opening the visitor\'s email app.');
});
