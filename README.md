# SCU INFORMS Website

The public website and student-board dashboard for the Santa Clara University INFORMS chapter.

- **Audience side:** Home, About (SCU Chapter, Meet the Team, Join the Team), Events Schedule (upcoming list, monthly calendar, past events), Explore (Blog, Gallery), Contact, and Board Login.
- **Board side:** after logging in as `informs@scu.edu`, a top menu switches between **Analytics**, **Edit Content**, and **Audience View**.

Built with React + Vite on the front end and a small Express server that stores content, uploads, and analytics as JSON files in `data/`.

## Running it locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API runs on port 3001 and Vite proxies to it.

## Board account

1. Go to **Board Login** (top-right of the site).
2. The first time, you'll be asked to **register**: enter `informs@scu.edu` and choose a password (8+ characters). Only that email can register, and only once.
3. Then **log in** with the same email and password. You'll land on **Edit Content**.

Forgot the password? Stop the server, run `npm run reset-board`, start the server again, and register again.

## Editing content

Everything below is in **Edit Content**. Click **Save changes** to publish. Unsaved edits are kept while you flip to Audience View and back.

| Tab | What it controls |
| --- | --- |
| Page Text | Rich text (Title, Heading, Subheading, Normal text, bold, italics, lists) for every page section |
| Buttons & Links | Button text and links (Join INFORMS, Join Newsletter, etc.), social links, contact email |
| Events | Add events with name, location, start/end, details. They move to Past Events automatically when they end |
| Meet the Team | Profile photo, name, position, graduation year, major |
| SCU Chapter Photos | Images shown on About → SCU Chapter |
| Blog | Photo posts with a title, caption and multiple photos. The first photo is the thumbnail; visitors flip through the rest with arrows |
| Gallery | Photos and captions |
| Logos | SCU INFORMS header logo and the Santa Clara University footer logo |

While browsing the live site logged in, the **Edit this page** link in the board bar jumps straight to the right editor tab.

## Analytics

Visits by logged-in board members are not counted.

- **Engagement:** unique visitors, visits, page views, and a daily visitors chart.
- **Average engagement time:** active (tab-visible) time per visit, plus a per-page breakdown.
- **Conversion rate:** the click-through rate, meaning the share of visitors who clicked **Join INFORMS** or **Join Newsletter**.

## Contact form

Messages go to `informs@scu.edu`. To have the server send them directly, fill in the `SMTP_*` values in `.env` (for example a Gmail account with an App Password). Without SMTP settings, pressing **Submit** opens the visitor's email app with the message pre-filled to `informs@scu.edu`.

## Static hosts: GitHub Pages and Cloudflare Pages (public pages only)

The site detects when it's on a static host (no API server) and switches to a read-only preview. It shows the built-in starting content from `server/defaultContent.js`. Board login, editing, uploads and analytics don't work there, and the Contact form opens the visitor's email app. For the full site, deploy with a Node host as described below.

- **GitHub Pages:** every push to `main` builds the site and publishes it to `https://<your-username>.github.io/Informs-Landing-Page/` using `.github/workflows/deploy-pages.yml`. One-time setup: on GitHub, open the repo's **Settings → Pages** and set **Source** to **GitHub Actions**.
- **Cloudflare Pages:** connect the repo with build command `npm run build` and output directory `dist`. No environment variables are needed.

## Deploying

```bash
npm install
npm run build
npm start          # serves the site and API on PORT (default 3001)
```

Host it anywhere that runs a persistent Node process with a writable disk (Render, Railway, Fly.io, a VM, etc.). The `data/` folder holds all content, uploaded images, the board account and analytics, so keep it on persistent storage and back it up. Set `DATA_DIR` to put it somewhere else.
