// Copy HTML templates into public/_templates/ so they serve verbatim at /_templates/.
// Run: node scripts/port-templates.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT, '..', 'HTML-Templates');
const OUT_DIR = path.resolve(ROOT, 'public', '_templates');

const PAGES = [
  { from: 'RoofPicker-Latest-HomePage-Vizualizer-5-13-26.html', to: 'homepage.html' },
  { from: 'Comparison-Page-Template.html',                       to: 'comparison.html' },
  { from: 'SKU-Detail-Page-Template.html',                       to: 'sku.html' },
  { from: 'Combination-Page-Template.html',                      to: 'combination.html' },
  { from: 'Color-Gallery-Hub-Template.html',                     to: 'color-hub.html' },
  { from: 'Universal-Hub-Template.html',                         to: 'universal-hub.html' },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  // Write a tiny index page so /_templates/ lists every reference
  const indexHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>RoofPicker design templates</title>
<style>
  body { font-family: ui-sans-serif, system-ui; background: #F2ECDE; color: #1A2236; margin: 0; padding: 60px 32px; max-width: 720px; margin-inline: auto; line-height: 1.55; }
  h1 { font-family: serif; font-weight: 400; font-size: 48px; margin: 0 0 24px; }
  ul { list-style: none; padding: 0; }
  li { padding: 14px 0; border-bottom: 1px solid #D9D0BC; }
  a { color: #B85A3C; text-decoration: none; font-size: 18px; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <h1>Design templates</h1>
  <p>Canonical HTML designs, copied verbatim from <code>HTML-Templates/</code>. Diff against the data-driven Astro routes to catch styling drift.</p>
  <ul>
${PAGES.map((p) => `    <li><a href="/_templates/${p.to}">${p.to}</a></li>`).join('\n')}
  </ul>
</body>
</html>`;
  await fs.writeFile(path.join(OUT_DIR, 'index.html'), indexHtml, 'utf-8');

  for (const { from, to } of PAGES) {
    const src = path.join(SRC_DIR, from);
    const dest = path.join(OUT_DIR, to);
    try {
      await fs.copyFile(src, dest);
      const stat = await fs.stat(dest);
      console.log(`  copied ${from.padEnd(50)} -> public/_templates/${to.padEnd(22)} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.warn(`  [skip] ${from}: ${err.message}`);
    }
  }
  console.log('Done. After `npm run dev`, visit http://localhost:4321/_templates/ to see all reference designs.');
}

main().catch((err) => { console.error(err); process.exit(1); });
