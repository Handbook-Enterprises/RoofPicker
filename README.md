# RoofPicker Astro Static Site

Static-build Astro project that renders one HTML page per enriched JSON in
`../data-scraping-script/output/`. Deploys to Cloudflare Pages.

---

## Table of contents

- [Quickstart](#quickstart)
- [Build for Cloudflare Pages](#build-for-cloudflare-pages)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [What is wired up](#what-is-wired-up)
- [What is next](#what-is-next)
- [Security notes](#security-notes)
- [Updating data](#updating-data)

---

## Quickstart

```bash
# Prerequisites: Node 20+, npm
cd RoofPicker

# 1) Install deps
npm install

# 2) Copy env template (fill in for production; defaults work for dev)
cp .env.example .env

# 3) Local dev server (auto-runs sync + stamp-cdn first)
npm run dev
```

By default the dev server runs at <http://localhost:4321>. Hot reload works
for `.astro`, `.tsx`, and `.css` files.

`npm run sync` only needs to be run manually if `../data-scraping-script/output/`
has changed since your last `dev` / `build`. Both commands already run it for
you. The enriched JSON under `src/content/` is committed, so a fresh clone can
build without the upstream scraper checked out.

---

## Build for Cloudflare Pages

```bash
npm run build       # outputs to ./dist (pure static HTML + CSS + tiny JS)
npm run preview     # local preview of the production build
```

`dist/` is the publishable artifact. Cloudflare Pages either:

- builds it for you on Git push (recommended; set "Build command" to
  `npm run build` and "Build output directory" to `dist`); OR
- accepts it via `wrangler pages deploy dist --project-name roofpicker`.

`public/_headers` ships Content-Security-Policy and other security
headers; Cloudflare Pages honors that file automatically.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run sync` | Copies `../data-scraping-script/output/{skus,Combination-S4,Combination-S5,Color-Gallery-Hub-S6,comparisons}` into `src/content/`. Wipes target subfolders first; idempotent. |
| `npm run stamp-cdn` | Rewrites every `image_local_path` in `src/content/**/*.json` to its `image_cdn_url` using `scripts/cdn-manifest.json` from the R2 upload. |
| `npm run dev` | Runs `sync` + `stamp-cdn`, then `astro dev`. |
| `npm run build` | Runs `sync` + `stamp-cdn` + `astro check` (TS + content-schema validation) + `astro build`. |
| `npm run preview` | Serves `dist/` locally. |
| `npm run check` | Type-checks every `.astro` and `.tsx` file against the Zod content schemas. |

---

## Project layout

```
RoofPicker/
├── public/
│   ├── _headers              Cloudflare security headers + CSP
│   └── robots.txt
├── scripts/                  Node build-time helpers
│   ├── sync-enriched-data.mjs    pulls enriched JSON from scraper output
│   └── stamp-cdn-urls.mjs        rewrites local image paths to R2 URLs
├── src/
│   ├── content/              Zod schemas + synced enriched JSONs (committed)
│   ├── data/hubs/            Hub indexes consumed by listing pages
│   ├── layouts/              BaseLayout (head, nav, footer, visualizer script)
│   ├── components/
│   │   ├── sku/              SKU detail sections (hero, specs, gallery, pairs, similar, pricing)
│   │   ├── combo/            S4 + S5 combination page components
│   │   ├── hub/              S6 color-hub page component
│   │   ├── gallery/          GalleryMosaic
│   │   ├── faq/              FAQSection (SSR-only, no client JS)
│   │   ├── cta/              Closing CTA
│   │   ├── nav/              NavBar, Footer, Breadcrumb
│   │   └── visualizer/       VisualizerButton + global click-delegation script
│   ├── lib/                  breadcrumb.ts, cdn.ts, schema.ts (JSON-LD)
│   ├── pages/                Routes (one .astro file per URL pattern)
│   └── styles/               tokens.css, global.css, per-template stylesheets
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

---

## What is wired up

- **Foundation**: `BaseLayout`, navigation, footer, security headers, JSON-LD builder, sitemap (`@astrojs/sitemap`), content collections + Zod schemas, breadcrumb URL rewriter, image-URL resolver, visualizer click delegation script.
- **Strategy 2 (Comparisons)**: `src/pages/compare/index.astro` hub + `src/pages/compare/[slug].astro` detail. Dedupes by product pair so each card is unique.
- **Strategy 3 (SKU pages)**: full end-to-end. Every section in `SKU-Detail-Page-Template.html` is an Astro component bound to the enriched JSON. Route file `src/pages/shingles/[brand]/[line]/[color].astro` emits 233 pages on build.
- **Strategy 4 (House color × roof color)**: shared `S4Page.astro` component + the `/combinations/` hub index.
- **Strategy 5 (Home style × roof color)**: shared `S5Page.astro` component + the `/home-styles/` hub index.
- **Strategy 6 (Color-gallery hubs)**: `S6Page.astro` component + the `/roof-colors/` hub index.
- **Homepage**, **404**, and the **`/shingles/` brand index**.
- **FAQ accordion**: SSR-only Astro component. No client JS, no hydration flicker.
- **Visualizer**: every button carrying `data-visualizer={JSON}` is wired to a global click handler that opens the RoofKit embed.
- **RoofKit embed**: live. The inline embed and floating launcher build from `PUBLIC_ROOFKIT_ROOFER_ID` and `PUBLIC_ROOFKIT_LANDING_SLUG`; the floating widget loads from `PUBLIC_ROOFKIT_WIDGET_SRC`. Launcher buttons pass the right payload shape.

## What is next

- **Backfill missing swatch images**: a handful of SKUs are missing color-swatch photos and need a targeted re-scrape upstream in `data-scraping-script/`.

---

## Security notes

- `public/_headers` ships a CSP that whitelists self + R2 + RoofKit + YouTube. `.env.example` is empty by design. Fill in `PUBLIC_CDN_URL` (R2 public bucket), `PUBLIC_SITE_URL`, and the `PUBLIC_ROOFKIT_*` vars for your environment.
- We use `set:html` ONLY on internal `title_html`, `h1_html`, `h2_html` strings authored in the enricher (they contain `<em>` markup only). No user input flows through `set:html`.
- All external links in component data carry `rel="noopener noreferrer"` and `target="_blank"`.
- R2 credentials never reach the client bundle. Only env vars prefixed `PUBLIC_` are exposed by Astro.
- `astro check` runs on every build, so any malformed enriched JSON fails CI before it ships.

---

## Updating data

The enricher pipeline lives in `../data-scraping-script/`. After running
any `enrich_strategy_*.py` (or the image manifest/topup scripts), come
back here and run:

```bash
npm run sync && npm run build
```

The new pages appear automatically. No template changes required as
long as the JSON shape matches the Zod schemas in `src/content/config.ts`.
