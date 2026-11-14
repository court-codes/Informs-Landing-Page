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

Open the address Vite prints (usually http://localhost:5173). `npm run dev` runs the Worker locally too.

**Use the live board account and content on localhost (one time):** run `npm run link-cloudflare`. It signs you in to Cloudflare in your browser if needed, then points localhost at the live D1 database and photo storage by adding their IDs to `wrangler.jsonc`. Commit that change. After that, localhost and the live site share the same board login and content, so **edits made on localhost change the live site**. Until you link, localhost uses an empty local database in `.wrangler/`.

## Hosting on Cloudflare

The live site is the Cloudflare Worker `informs-landing-page`, connected to this GitHub repo. Every push to `main` rebuilds and deploys it (build command `npm run build`, deploy command `npx wrangler deploy`). On the first deploy Cloudflare automatically created the D1 database and KV storage listed in `wrangler.jsonc`.

Cloudflare's free plan covers a club site comfortably (100,000 requests a day, 5 GB of database storage, 1 GB of photo storage).

## Board account

There's one board account, `informs@scu.edu`. Go to **Board Login** (top-right of the site), enter the email and password, and you'll land on **Edit Content**. There's no sign-up page.

Forgot the password? Run `npm run set-board-password`. It asks for a new password and saves it to the live database, which signs everyone out. Site content isn't affected.

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
