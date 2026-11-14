# SCU INFORMS Website

The public website and student-board dashboard for the Santa Clara University INFORMS chapter.

- **Audience side:** Home, About (SCU Chapter, Meet the Team, Join the Team), Events Schedule (upcoming list, monthly calendar, past events), Explore (Blog, Gallery), Contact, and Board Login.
- **Board side:** after logging in as `informs@scu.edu`, a top menu switches between **Analytics**, **Edit Content**, and **Audience View**.

Built with React + Vite on the front end and a Cloudflare Worker (`worker/`) for the API. Content, the board account and analytics live in a Cloudflare D1 database; uploaded photos live in Cloudflare KV.

## Running it locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). `npm run dev` runs the Worker locally too, with a local database and photo storage kept in `.wrangler/`. Nothing you do locally touches the live site.

## Hosting on Cloudflare

The live site is the Cloudflare Worker `informs-landing-page`, connected to this GitHub repo. Every push to `main` rebuilds and deploys it (build command `npm run build`, deploy command `npx wrangler deploy`). On the first deploy Cloudflare automatically creates the D1 database and KV storage listed in `wrangler.jsonc`; their IDs are only shown in the Cloudflare dashboard.

**One-time setup: the board setup code.** On the live site, registering the board account requires a private setup code so nobody else can claim it first. In the Cloudflare dashboard, open **Workers & Pages → informs-landing-page → Settings → Variables and Secrets → Add**, choose type **Secret**, name it `BOARD_SETUP_CODE`, and enter a code only the board knows. Until it's added, registration on the live site is locked. (Locally no code is needed unless you put `BOARD_SETUP_CODE=...` in a `.dev.vars` file.)

Cloudflare's free plan covers a club site comfortably (100,000 requests a day, 5 GB of database storage, 1 GB of photo storage).

## Board account

1. Go to **Board Login** (top-right of the site).
2. The first time, you'll be asked to **register**: enter the setup code, `informs@scu.edu`, and a password (8+ characters). Only that email can register, and only once.
3. Then **log in** with the same email and password. You'll land on **Edit Content**.

Forgot the password? In the Cloudflare dashboard, open **Storage & Databases → D1**, choose this site's database, open **Console**, run `DELETE FROM settings WHERE key = 'board_user'; DELETE FROM sessions;`, then register again with the setup code. Site content isn't affected.

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
| Gallery | Photo posts with a title, date, caption and multiple photos. Each post is a card; clicking it opens the photos full-screen with arrows |
| Logos | SCU INFORMS header logo and the Santa Clara University footer logo |

While browsing the live site logged in, the **Edit this page** link in the board bar jumps straight to the right editor tab.

## Analytics

Visits by logged-in board members are not counted.

- **Engagement:** unique visitors, visits, page views, and a daily visitors chart.
- **Average engagement time:** active (tab-visible) time per visit, plus a per-page breakdown.
- **Conversion rate:** the click-through rate, meaning the share of visitors who clicked **Join INFORMS** or **Join Newsletter**.

## Contact form

Pressing **Submit** opens the visitor's email app with the message pre-filled to the contact email (`informs@scu.edu` by default).

## GitHub Pages (read-only preview)

Every push to `main` also publishes a static copy to `https://<your-username>.github.io/Informs-Landing-Page/` using `.github/workflows/deploy-pages.yml` (one-time setup: **Settings → Pages → Source: GitHub Actions**). That copy shows only the built-in starting content from `shared/defaultContent.js`; board login, editing, uploads and analytics work only on the Cloudflare site.
