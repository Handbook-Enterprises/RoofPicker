# RoofPicker — Astro Static Site

Static-build Astro project that renders one HTML page per enriched JSON in
`../data-scraping-script/output/`. Deploys to Cloudflare Pages.

---

## Table of contents

- [Quickstart](#quickstart)
- [Build for Cloudflare Pages](#build-for-cloudflare-pages)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [What is wired up so far](#what-is-wired-up-so-far)
- [What is next](#what-is-next)
- [Security notes](#security-notes)
- [Updating data](#updating-data)

---

## Quickstart

```bash
# Prerequisites: Node 20+, npm
cd RoofPicker-AstroJS

# 1) Install deps
npm install

# 2) Copy env template (no secrets needed for dev)
cp .env.example .env

# 3) Sync enriched JSONs from the scraper output folder
npm run sync

# 4) Local dev server
npm run dev
```

By default the dev server runs at <http://localhost:4321>. Hot reload works
for `.astro`, `.tsx`, and `.css` files. If you change anything in
`../data-scraping-script/output/`, run `npm run sync` again.

---

## Build for Cloudflare Pages

```bash
npm run build       # outputs to ./dist (pure static HTML + CSS + tiny JS)
npm run preview     # local preview of the production build
```

`dist/` is the publishable artifact. Cloudflare Pages either:

- builds it for you on Git push (recommended — set "Build command" to
  `npm run build` and "Build output directory" to `dist`); OR
- accepts it via `wrangler pages deploy dist --project-name roofpicker`.

`public/_headers` ships Content-Security-Policy and other security
headers; Cloudflare Pages honors that file automatically.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run sync` | Copies `../data-scraping-script/output/{skus,Combination-S4,...}` into `src/content/`. Wipes target subfolders first; idempotent. |
| `npm run dev` | Runs sync, then `astro dev`. |
| `npm run build` | Runs sync + `astro check` (TS + content-schema validation) + `astro build`. |
| `npm run preview` | Serves `dist/` locally. |
| `npm run check` | Type-checks every `.astro` and `.tsx` file against the Zod content schemas. |
| `npm run stamp-cdn` | (Phase 2) Rewrites `image_cdn_url` in every `src/content/**/*.json` once R2 upload is complete. |

---

## Project layout

```
RoofPicker-AstroJS/
├── public/             Static assets and Cloudflare _headers file
├── scripts/            Node build-time helpers (sync, R2 upload, CDN stamp)
├── src/
│   ├── content/        Zod schemas + synced enriched JSONs
│   ├── layouts/        BaseLayout (head, nav, footer, visualizer script)
│   ├── components/     Reusable UI (sku/, gallery/, faq/, nav/, ...)
│   ├── lib/            schema.ts (JSON-LD), cdn.ts (image URL resolver)
│   ├── pages/          Routes (one .astro file per URL pattern)
│   └── styles/         tokens.css + global.css
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

---

## What is wired up so far

- **Foundation**: `BaseLayout`, navigation, footer, security headers, JSON-LD builder, content collections + Zod schemas, image-URL resolver, visualizer click delegation script.
- **Strategy 3 (SKU pages)**: full end-to-end — every section in `SKU-Detail-Page-Template.html` is an Astro component bound to the enriched JSON. Route file `src/pages/shingles/[brand]/[line]/[color].astro` emits 233 pages on build.
- **Homepage** and **404** placeholders.
- **FAQ accordion** as a React island (`client:idle`) — only ~5 KB of client JS, hydrated after the page is idle.
- **Visualizer**: every button on the site that carries `data-visualizer={JSON}` is wired to a global click handler. Placeholder shows the payload; replace with Lucas's `RoofKit.open()` when his script lands by setting `PUBLIC_ROOFKIT_EMBED_SRC` in `.env`.

## What is next

- **Strategy 4 + 5** combination pages (share template, different data collections).
- **Strategy 6** color-hub pages.
- **Strategy 2** comparison pages.
- **Image pipeline**: `scripts/upload-images-to-r2.mjs` and `scripts/stamp-cdn-urls.mjs` once R2 credentials are available. Until then the dev server uses local image paths.
- **RoofKit embed**: drop the actual snippet URL into `PUBLIC_ROOFKIT_EMBED_SRC` once Lucas provides it; the launcher buttons already pass the right payload shape.

---

## Security notes

- `public/_headers` ships a CSP that whitelists self + R2 + RoofKit + YouTube.
- We use `set:html` ONLY on internal `title_html`, `h1_html`, `h2_html` strings that we author in the enricher (they contain `<em>` markup only). No user input flows through `set:html`.
- All external links in component data carry `rel="noopener noreferrer"` and `target="_blank"`.
- R2 credentials never reach the client bundle — only env vars prefixed `PUBLIC_` are exposed by Astro.
- `astro check` runs on every build, so any malformed enriched JSON fails CI before it ships.

---

## Updating data

The enricher pipeline lives in `../data-scraping-script/`. After running
any `enrich_strategy_*.py` (or the image manifest/topup scripts), come
back here and run:

```bash
npm run sync && npm run build
```

The new pages appear automatically — no template changes required as
long as the JSON shape matches the Zod schemas in `src/content/config.ts`.
