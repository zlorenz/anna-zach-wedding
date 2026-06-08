# Editing website content

A practical guide for updating copy, images, and page content on **annaandzach.love** without touching layout code.

> **For you (Zach), not for the AI.** Cursor rules in `.cursor/rules/` tell the assistant how to code; this file tells you where to edit content.

---

## Quick start

1. Start the site locally:
   ```bash
   npm run dev
   ```
2. Open **http://localhost:4321** and click through the page you’re editing.
3. Change the matching file under **`src/data/`** (or add images under **`public/assets/`**).
4. Save the file — the browser usually hot-reloads within a second or two.

You do **not** need to run a CSS build step. After content changes, a normal refresh is enough.

---

## Choose which photos appear where

### Photo preview tool (easiest)

With `npm run dev` running, open:

**http://localhost:4321/photos-preview/**

This page is **dev-only** (it won’t appear on the live site). Use it to:

- Browse all engagement photos
- Zoom, compare with ← →, favorite with the heart (saved in your browser)
- See which **slots** exist and which file each slot currently uses

When you’ve picked a filename (e.g. `20260404-NS-AZ-5398.jpg`), assign it in:

**`src/data/photos.yaml`**

Example — change the home hero background:

```yaml
slots:
  home.heroBackground:
    file: photos/engagement/20260404-NS-AZ-5122.jpg   # ← desktop hero (tablets & up)
    alt: Anna and Zach                                 # ← accessibility text

  home.heroBackgroundMobile:
    file: photos/engagement/20260404-NS-AZ-5398.jpg   # ← phones (≤768px); omit `file` to reuse desktop
    alt: Anna and Zach
```

Paths are relative to `public/assets/` (no leading slash).

### Current photo slots

| Slot ID | Where it shows |
|---------|----------------|
| `home.heroBackground` | Home page full-screen hero (desktop / tablet landscape) |
| `home.heroBackgroundMobile` | Home hero on phones (≤768px); falls back to desktop if `file` is empty |
| `home.heroWordmark` | Home hero logo (usually brand PNG, not engagement) |
| `travel.triptychLeft` | Travel page — left triptych image (desktop / tablet) |
| `travel.triptychCenter` | Travel page — center |
| `travel.triptychRight` | Travel page — right |
| `travel.triptychLeftMobile` | Travel top triptych — left image on phones (≤991px, two-up row); omit `file` to reuse desktop |
| `travel.triptychRightMobile` | Travel top triptych — right image on phones |
| `travel.offsetSmall` | Travel page — smaller offset image (desktop) |
| `travel.offsetLarge` | Travel page — larger offset image (desktop) |
| `travel.offsetMobile` | Travel offset divider — single image on phones (≤991px); omit `file` to reuse offsetLarge |

Nav logos use the `brand:` section in the same file (or `src/data/site.json` for full paths).

### Photo files on disk

| Folder | Purpose |
|--------|---------|
| `public/assets/photos/engagement/` | All engagement JPGs (`20260404-NS-AZ-*.jpg`) |
| `public/assets/brand/` | Nav + hero logos |
| `public/assets/images/` | One-off page images (e.g. FAQ dress-code collage) |

To add a **new** engagement photo: copy the JPG into `public/assets/photos/engagement/`, then reference it in `photos.yaml`.

To add a **one-off** image (not in the engagement set): put it in `public/assets/images/…` and reference that path in YAML/JSON (see FAQ below).

---

## Content files cheat sheet

All editable copy lives in **`src/data/`**.

| File | Page(s) | What you edit |
|------|---------|----------------|
| **`site.json`** | Every page (nav, footer name) | Site name, menu labels/links, brand image paths |
| **`home.json`** | Home | Event date/location line under the hero |
| **`home-welcome.yaml`** | Home | Welcome message paragraphs (below hero) |
| **`itinerary.yaml`** | Itinerary | Intro HTML, wedding-day timeline, multi-day schedule |
| **`travel.yaml`** | Travel | Airport, transfer, and essentials copy (`*Html` fields) |
| **`travel-map.json`** | Travel | Airport pin + driving route coordinates |
| **`accommodation.yaml`** | Accommodation | Intro, featured resort, quick-picks title, Airbnb note |
| **`accommodation-map.json`** | Accommodation | Hotel/terminal pins + journey legs for the map |
| **`accommodation-map.yaml`** | Accommodation | “Getting to the wedding venue” copy above the map |
| **`things-to-do.yaml`** | Things to Do | Intro HTML under the page title |
| **`things-to-do-places.json`** | Things to Do | Map pins (`places[]`) and map UI settings |
| **`things-to-do-map.yaml`** | Things to Do | Copy above the map (title, intro, legend labels) |
| **`faq.yaml`** | FAQ | Questions, answers, optional images, panel colors |
| **`photos.yaml`** | Site-wide images | Which file fills each photo slot |

### Live URLs (after deploy)

| Page | Path |
|------|------|
| Home | `/` |
| Itinerary | `/itinerary/` |
| Travel | `/travel/` |
| Accommodation | `/accomodation/` *(same spelling as before — one “m”)* |
| Things to Do | `/things-to-do/` |
| FAQ | `/faq/` |
| RSVP | `/rsvp/` |

---

## Site-wide settings — `site.json`

**File:** `src/data/site.json`

- **`name`** — Footer and default browser title
- **`nav`** — Array of `{ "href": "/travel/", "label": "Travel" }` — reorder or rename menu items here
- **`brandNavDark` / `brandNavLight` / `brandHeroWordmark`** — Paths under `/assets/brand/…`

Save → refresh any page to see nav/footer changes.

---

## Home — `home.json` and `home-welcome.yaml`

**Event line** — `src/data/home.json`

| Field | Use |
|-------|-----|
| `eventDate` | Home hero date — desktop/tablet (e.g. `December 5, 2026`) |
| `eventDateShort` | Home hero date on phones (e.g. `DEC 5, 2026`) |
| `eventLocation` | Home hero location — desktop/tablet (e.g. `Nha Trang, Vietnam`) |
| `eventLocationShort` | Home hero location on phones (e.g. `Nha Trang, VN`) |

**Welcome message** — `src/data/home-welcome.yaml`

Each list item under `paragraphs:` becomes one `<p>` on the home page. Edit with normal punctuation (`’`, `—`, etc.) — no HTML needed.

```yaml
paragraphs:
  - |
    First paragraph of your story…
  - |
    Second paragraph…
```

Add or remove list items to change how many paragraphs appear.

| Field | Use |
|-------|-----|
| `signature` | Script sign-off below the paragraphs (e.g. `from Anna & Zach`) |

Home **hero photos** → `photos.yaml` slots `home.heroBackground` (desktop) and `home.heroBackgroundMobile` (phones), not `home.json`.

Home **page links row** (Itinerary, Travel, etc.) → same labels as `site.json` `nav` — edit menu items there.

---

## Itinerary — `itinerary.yaml`

**File:** `src/data/itinerary.yaml`

Edit with normal punctuation (`ò`, `&`, `—`, etc.) — no JSON escape sequences.

| Section | Purpose |
|---------|---------|
| `introHtml` | Optional intro block above the timeline (HTML string; can be `""`) |
| `weddingDay` | Array of timeline items for the wedding day |
| `multiDay` | Other days (rehearsal, etc.) with nested `events` |

Each **wedding day** item:

| Field | Example |
|-------|---------|
| `time` | `"4:00 pm - 4:45 pm"` |
| `title` | `"Ceremony"` |
| `descriptionHtml` | `"<p>The wedding ceremony…</p>"` — include any extra copy here (no separate note field) |
| `location` | `"Marriott Hòn Tre"` or `""` |
| `featured` | `true` / `false` — visual emphasis |
| `typeClass` | `ceremony`, `reception`, `cocktails`, `photos`, `party`, `other` — affects icon styling |

**Multi-day** blocks use `label`, `date`, `events[]` with similar fields.

Preview: **http://localhost:4321/itinerary/**

---

## FAQ — `faq.yaml`

**File:** `src/data/faq.yaml`

YAML is easier than JSON for quotes and apostrophes (`'`, `—`, `"White Lotus"`).

Each question:

```yaml
  - question: What's the dress code?
    answer: We're leaning into an elegant island vibe…
    tooltipColor: blue_mist    # or pink_soft — background when expanded
    imagesGalleryAlt: Dress code inspiration — tropical resort and evening wear
    images:                    # optional 2×2 grid (row 1 = first two, row 2 = next two)
      - file: images/faq/dress-code-women-01.png
        alt: Women's tropical resort and evening wear
      - file: images/faq/dress-code-women-02.png
        alt: Women's dress code inspiration
      - file: images/faq/dress-code-men-01.png
        alt: Men's tropical resort wear
      - file: images/faq/dress-code-men-02.png
        alt: Men's dress code inspiration
```

- **`answer`** — Supports inline HTML (`<strong>`, `<a href="…">`, etc.). One paragraph per line; multiple paragraphs = blank line inside a `|` block (see comments at top of file). Internal links can use paths like `/rsvp/`.
- **`image`** / **`imageAlt`** — Optional single image below the answer (legacy).
- **`images`** — Optional grid: first two files = top row, next two = bottom row. Paths under `public/assets/`.
- **`imagesGalleryAlt`** — Screen-reader label for the whole grid.
- **`tooltipColor`** — `pink_soft` or `blue_mist` only.

Preview: **http://localhost:4321/faq/**

---

## Travel & Accommodation — YAML + map JSON

Page copy lives in YAML (like Itinerary). Map coordinates live in separate JSON files.

| File | Page |
|------|------|
| `src/data/travel.yaml` | Travel body copy |
| `src/data/travel-map.json` | Travel map pins + route |
| `src/data/accommodation.yaml` | Accommodation body copy |
| `src/data/accommodation-map.json` | Accommodation map pins + journey legs |

### Editing body copy

- Open the YAML file and edit plain text or `*Html` fields (same style as `itinerary.yaml`).
- Image breaks use **`photos.yaml`** slots — not inline paths in YAML.

### Maps

**Travel** — `travel-map.json` (airport, route, etc.)

**Accommodation** — `accommodation-map.json` → `places[]`

Each place includes `title`, `lat`, `lng`, `url`, optional `pricing`, and `areaLifestyle` (short blurb for map popups). Use `source`: `"pick"` (hotel), `"terminal"` (ferry/cable car terminal), or `"featured"` with `isWeddingVenue: true` for the resort.

**Door-to-door journey:** `mapConfig.journeyLegs` — array of legs:

- `mode: "driving"` — `origin` / `destination` lat/lng; blue line + car badge (time/distance from Google Directions).
- `mode: "crossing"` — mainland terminal → island station; teal dashed line + static badge (`durationText`, `distanceText`, e.g. `10 min` / `Cable car / ferry`).

Typical order: hotel cluster → Vinpearl Land Terminal (mainland) → **Vinpearl Internal Terminal** on Hon Tre (`12.2135707, 109.2398966`) → Marriott. Keep crossing `destination` and island drive `origin` on the same island terminal coords. Terminal pins are green on the map. Requires **Directions API** for driving legs.

Legacy `hotelToTerminalRoute` (single segment) still works if `journeyLegs` is omitted.

**Map zoom:** `mapConfig.mapUi.fitZoom` (default `15`) is the closest zoom the map tries after fitting all pins; `zoomLabelMin` is when hotel/terminal name labels appear. Routes do not change zoom.

Google Maps only loads when coordinates exist and `PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env`.

### Accommodation map section copy — `accommodation-map.yaml`

**File:** `src/data/accommodation-map.yaml`

Edit the dark “Getting to the wedding venue” block above the Google Map — same idea as FAQ: normal punctuation, no JSON escaping.

| Field | What it controls |
|-------|------------------|
| `title` | Main heading (e.g. Getting to the wedding venue) |
| `intro` | List of paragraphs (use `\|` blocks for each; HTML like `<strong>` is OK) |
| `legendRecommendedStays` | Text next to the red pin icon (mainland hotels) |
| `legendWeddingVenue` | Text next to ★ (wedding venue on the island) |
| `legendTerminal` | Text next to the green pin (Vinpearl ferry/cable car terminals) |
| `legendDriveRoute` | Blue route line in legend |
| `legendCrossingRoute` | Teal dashed route line in legend |

Save → refresh **http://localhost:4321/accomodation/**.

Preview:

- **http://localhost:4321/travel/**
- **http://localhost:4321/accomodation/**

---

## Things to Do — `things-to-do.yaml` + `things-to-do-places.json` + `things-to-do-map.yaml`

### Intro copy — `things-to-do.yaml`

**File:** `src/data/things-to-do.yaml`

| Field | What it controls |
|-------|------------------|
| `introHtml` | Paragraphs under the page title (HTML allowed) |

### Map pins — `things-to-do-places.json`

| Field | What it controls |
|-------|------------------|
| `places[]` | Pins on the Google Map (see below) |
| `mapUi.fitZoom` | Max zoom after fitting all pins (default `14`) |
| `mapUi.zoomLabelMin` | Zoom level when place name labels appear (default `16`) |

Preview: **http://localhost:4321/things-to-do/**

### Map section copy — `things-to-do-map.yaml`

**File:** `src/data/things-to-do-map.yaml`

| Field | What it controls |
|-------|------------------|
| `title` | Heading above the map |
| `intro` | Paragraphs (YAML `\|` blocks; HTML OK) |
| `legendRestaurants` / `legendNightlife` / `legendSightseeing` / `legendEntertainment` | Legend labels under the heading |

### Adding a place (restaurants, nightlife, sightseeing, entertainment)

In `things-to-do-places.json` → `places`, add an object:

```json
{
  "id": "my-spot",
  "title": "Lanterns Vietnamese Restaurant",
  "category": "restaurants",
  "mapsUrl": "https://maps.app.goo.gl/xxxxxxxx",
  "lat": 12.2410245,
  "lng": 109.1946719,
  "blurb": "One sentence for guests — shows in the map popup."
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `id` | Yes | Unique slug (`restaurant-lanterns`, `nightlife-rooftop`, …) |
| `title` | Yes | Pin label + popup heading |
| `category` | Yes | `restaurants`, `nightlife`, `sightseeing`, or `entertainment` (pin color) |
| `mapsUrl` | Yes | Share link from Google Maps (“Share” → copy link). Used for **Open in Google Maps** in the popup — paste the full place URL so guests see the business name, address, and reviews (not just coordinates). |
| `lat` / `lng` | Recommended | If omitted, the site tries to read them from `mapsUrl` when it’s a full Google URL |
| `blurb` | Optional | Short note in the popup |
| `note` | Optional | Extra muted line (hours, “cash only”, etc.) |

**Coordinates from a link**

1. Open the place in Google Maps → **Share** → copy the link.
2. Paste the **full** share link into `mapsUrl` (keep the long `/data=!4m6…` section — that’s what tells Google which business to open).
3. Either:
   - Paste `lat` / `lng` from the URL (look for `@12.24,109.19` or `!3d12.24!4d109.19`), or
   - Run locally: `npm run resolve-map-coords` — expands short links and writes `lat`/`lng` into `things-to-do-places.json`.

Short `maps.app.goo.gl` links usually need `resolve-map-coords` (or manual lat/lng).

The map loads when at least one place has valid coordinates and `PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env` (same key as Travel / Accommodation; enable **Maps JavaScript API**).

---

## RSVP page copy

| What | Where |
|------|--------|
| Page title, intro, and form copy | `src/pages/rsvp.astro` |
| Form fields / validation | `src/pages/rsvp.astro` + `public/assets/js/rsvp-form.js` |

RSVP **submissions** (Telegram, Google Sheet, email) are configured in **`.env`** — not in content files. See `.env.example`.

---

## Optional: re-export from old WordPress

Only if you still run the old site on MAMP (`http://localhost:8888/annaandzach`):

```bash
npm run export-content
```

This overwrites several `src/data/*.json` files from rendered HTML. **Back up your edits first** if you’ve changed JSON manually.

Day-to-day editing should be direct in `src/data/` — you don’t need WordPress for normal updates.

---

## Styling vs content

| You want to change… | Edit |
|---------------------|------|
| Wording, dates, FAQ, timeline | `src/data/*` |
| Colors, spacing, fonts | `src/styles/style.css` |
| Page structure / new sections | `src/pages/*.astro` (use Cursor) |

---

## Deploy reminder

Content changes are committed and deployed with the rest of the repo. After pushing to staging/production, no separate “WordPress admin” step — the built Astro site serves the updated JSON/YAML.

If something doesn’t update on the live site, confirm the deploy ran `npm run build` and restarted the Node server (`npm start`).








