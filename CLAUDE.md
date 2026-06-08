# CLAUDE.md

Wedding website for Zacharia Lorenz and Anna Kostina — December 5, 2026, Nha Trang, Vietnam.

## Stack

- **Framework:** [Astro](https://astro.build) (static pages + Node server for RSVP API)
- **Styling:** Bootstrap 5 + custom `src/styles/style.css` (ported from the former WordPress child theme)
- **Fonts:** Adobe Typekit (`hvt3dwm`) + self-hosted Remsen Script in `public/assets/fonts/`
- **Maps:** Google Maps JS API on Travel and Accommodation pages

## Development

```bash
npm install
cp .env.example .env   # add keys (see below)
npm run dev            # http://localhost:4321
```

Production build:

```bash
npm run build
npm start              # serves dist/server/entry.mjs
```

## Content

Page copy and ACF-style data live in `src/data/*.json`. To refresh from a running WordPress export (optional legacy step):

```bash
npm run export-content   # fetches http://localhost:8888/annaandzach/ and rewrites JSON
```

Edit JSON directly for day-to-day content changes.

## Environment variables

```bash
PUBLIC_GOOGLE_MAPS_API_KEY=   # browser maps (restrict by HTTP referrer)
AZ_TELEGRAM_BOT_TOKEN=
AZ_TELEGRAM_CHAT_ID=
AZ_SHEETS_WEBHOOK_URL=
AZ_SHEETS_SECRET=
AZ_RESEND_API_KEY=          # optional — guest RSVP confirmation email
AZ_RSVP_EMAIL_FROM=         # e.g. Anna & Zach <rsvp@annaandzach.love>
AZ_RSVP_REPLY_TO=           # optional reply-to for guests
AZ_SITE_URL=https://annaandzach.love
```

RSVP submissions POST to `/api/rsvp/` → Telegram + Google Sheets + optional confirmation email (Resend). Sheets use the same contract as the old Gravity Forms integration: GET to Apps Script, RFC3986 query string, upsert by email.

## Project layout

```
public/assets/     images, fonts, client JS (maps, FAQ, RSVP, nav)
src/data/          page content JSON
src/components/    shared UI
src/layouts/       BaseLayout.astro
src/pages/         routes (note: /accomodation/ spelling matches WP slug)
src/lib/           content helpers + RSVP server logic
src/styles/        theme CSS
scripts/           export-content.py
```

## Design

See “Creative Direction” in git history / prior docs. Tokens: cream background `#F0EBE3`, heading `#2C2420`, accent `#E8C4C8`, button `#2C2420`.
