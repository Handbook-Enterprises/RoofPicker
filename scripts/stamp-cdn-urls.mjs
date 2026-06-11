// Walks src/content/, stamps R2 CDN URLs from cdn-manifest.json. Idempotent.
// Host portion of every URL is rewritten with PUBLIC_CDN_URL from .env so the
// manifest stays portable across CDN cutovers.

import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.resolve(ROOT, 'src', 'content');

// Read PUBLIC_CDN_URL from process.env first; fall back to a minimal .env
// parse so this script works when run directly via node (not through Astro).
function loadCdnBase() {
  if (process.env.PUBLIC_CDN_URL) return process.env.PUBLIC_CDN_URL.replace(/\/+$/, '');
  try {
    const raw = readFileSync(path.resolve(ROOT, '.env'), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*PUBLIC_CDN_URL\s*=\s*(.*?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
    }
  } catch (_) {
    // .env missing is fine in some build contexts
  }
  return '';
}
const CDN_BASE = loadCdnBase();
if (!CDN_BASE) {
  console.warn('PUBLIC_CDN_URL is not set; manifest URLs will be copied verbatim.');
}

// Rewrite the host of a manifest URL so the result always points at CDN_BASE.
// Keeps the path identical so the underlying R2 object key never moves.
function rehost(cdnUrl) {
  if (!CDN_BASE || typeof cdnUrl !== 'string') return cdnUrl;
  try {
    const u = new URL(cdnUrl);
    return `${CDN_BASE}${u.pathname}`;
  } catch (_) {
    return cdnUrl;
  }
}

// Manifest from data-scraping-script; local copy in scripts/ as fallback.
const EXTERNAL_MANIFEST = path.resolve(
  ROOT, '..', 'data-scraping-script', 'output', 'cdn-manifest.json'
);
const LOCAL_MANIFEST = path.resolve(ROOT, 'scripts', 'cdn-manifest.json');

async function loadManifest() {
  for (const candidate of [EXTERNAL_MANIFEST, LOCAL_MANIFEST]) {
    try {
      const raw = await fs.readFile(candidate, 'utf-8');
      console.log(`Loaded manifest from ${candidate}`);
      return JSON.parse(raw);
    } catch (_) {
      // try next
    }
  }
  console.error('Could not find cdn-manifest.json in either:');
  console.error(`  ${EXTERNAL_MANIFEST}`);
  console.error(`  ${LOCAL_MANIFEST}`);
  console.error('Run upload_images_to_r2.py in data-scraping-script first.');
  process.exit(1);
}

function walk(node, manifest, stats) {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, manifest, stats));
    return;
  }
  if (node && typeof node === 'object') {
    // Stamp every `<prefix>image_local_path` field with its paired
    // `<prefix>image_cdn_url`. Covers both the nested object shape
    // ({ image_local_path, image_cdn_url }) and the flat-suffixed shape
    // used by hero / preview / swatch slots
    // ({ hero_image_local_path, hero_image_cdn_url }).
    for (const key of Object.keys(node)) {
      if (!key.endsWith('image_local_path')) continue;
      const lp = node[key];
      if (typeof lp !== 'string' || lp.length === 0) continue;
      const cdnUrl = manifest[lp];
      const pairedKey = key.slice(0, -'image_local_path'.length) + 'image_cdn_url';
      if (cdnUrl) {
        node[pairedKey] = rehost(cdnUrl);
        stats.stamped++;
      } else {
        stats.missing++;
      }
    }
    for (const key of Object.keys(node)) {
      walk(node[key], manifest, stats);
    }
  }
}

// Atomic write via tmp + rename. Retries cover Windows EPERM locks.
async function atomicWrite(fp, content) {
  const tmp = `${fp}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, content, 'utf-8');
  let lastErr;
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      await fs.rename(tmp, fp);
      return;
    } catch (err) {
      lastErr = err;
      if (err.code !== 'EPERM' && err.code !== 'EBUSY' && err.code !== 'EACCES') break;
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
  }
  try { await fs.unlink(tmp); } catch (_) { /* best-effort cleanup */ }
  throw lastErr;
}

async function main() {
  const manifest = await loadManifest();
  const stats = { stamped: 0, missing: 0, files: 0 };
  const collections = await fs.readdir(CONTENT, { withFileTypes: true });
  for (const c of collections) {
    if (!c.isDirectory()) continue;
    const collectionDir = path.join(CONTENT, c.name);
    const files = await fs.readdir(collectionDir);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      // Skip any leftover temp files from an interrupted previous run.
      if (f.includes('.tmp-')) continue;
      const fp = path.join(collectionDir, f);
      const data = JSON.parse(await fs.readFile(fp, 'utf-8'));
      walk(data, manifest, stats);
      await atomicWrite(fp, JSON.stringify(data, null, 2));
      stats.files++;
    }
  }
  console.log(`Stamped CDN URLs:`);
  console.log(`  files processed   : ${stats.files}`);
  console.log(`  image refs stamped: ${stats.stamped}`);
  console.log(`  manifest misses   : ${stats.missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
