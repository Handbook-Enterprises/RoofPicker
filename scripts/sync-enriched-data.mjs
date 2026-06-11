// Copy enriched JSONs into src/content/.
// Each `_hub.enriched.json` is diverted to src/data/hubs/<collection>.json
// because its shape doesn't match the per-item Zod schema.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.resolve(ROOT, '..', 'data-scraping-script', 'output');
const TARGET = path.resolve(ROOT, 'src', 'content');
const HUB_TARGET = path.resolve(ROOT, 'src', 'data', 'hubs');

const MAPPING = [
  { from: 'skus',                src: 'skus' },
  { from: 'Combination-S4',      src: 'combinations-s4' },
  { from: 'Combination-S5',      src: 'combinations-s5' },
  { from: 'Color-Gallery-Hub-S6', src: 'color-hubs' },
  { from: 'comparisons',         src: 'comparisons' },
];

// Atomic copy via tmp + rename so the dev watcher never reads a partial file.
// Retries cover Windows Defender / Indexer brief EPERM locks.
async function atomicCopy(src, dest) {
  const tmp = `${dest}.tmp-${process.pid}-${Date.now()}`;
  await fs.copyFile(src, tmp);
  let lastErr;
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      await fs.rename(tmp, dest);
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

async function copyJsonCollection(fromRel, toRel) {
  const fromAbs = path.join(SOURCE, fromRel);
  const toAbs = path.join(TARGET, toRel);
  let entries;
  try {
    entries = await fs.readdir(fromAbs, { withFileTypes: true });
  } catch (err) {
    console.warn(`[skip] ${fromRel} not present at ${fromAbs}`);
    return { items: 0, hub: false, written: new Set() };
  }
  await fs.mkdir(toAbs, { recursive: true });
  await fs.mkdir(HUB_TARGET, { recursive: true });
  let items = 0;
  let hub = false;
  const written = new Set();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.enriched.json')) continue;
    const sourcePath = path.join(fromAbs, entry.name);

    if (entry.name === '_hub.enriched.json') {
      // Diverted to src/data/hubs/<collection>.json
      const hubDest = path.join(HUB_TARGET, `${toRel}.json`);
      await atomicCopy(sourcePath, hubDest);
      hub = true;
      continue;
    }

    // Strip the `.enriched` suffix so the Astro slug matches the page url
    const cleanName = entry.name.replace(/\.enriched\.json$/, '.json');
    const destPath = path.join(toAbs, cleanName);
    await atomicCopy(sourcePath, destPath);
    written.add(cleanName);
    items++;
  }
  return { items, hub, written };
}

// Prune target files we didn't write this run. Runs after copy.
async function pruneStale(targetDir, written) {
  let pruned = 0;
  try {
    const existing = await fs.readdir(targetDir);
    for (const f of existing) {
      if (!f.endsWith('.json')) continue;
      if (written.has(f)) continue;
      // Leave temp files alone; they self-cleanup on next atomicCopy
      if (f.includes('.tmp-')) continue;
      await fs.unlink(path.join(targetDir, f));
      pruned++;
    }
  } catch (_) { /* dir may not exist yet on first run */ }
  return pruned;
}

async function main() {
  console.log(`Syncing from ${SOURCE}`);
  console.log(`         to  ${TARGET}`);
  console.log(`    hubs to  ${HUB_TARGET}`);
  for (const { from, src } of MAPPING) {
    const targetDir = path.join(TARGET, src);
    const { items, hub, written } = await copyJsonCollection(from, src);
    const pruned = await pruneStale(targetDir, written);
    const hubNote = hub ? `+ hub` : '';
    const pruneNote = pruned > 0 ? `(pruned ${pruned} stale)` : '';
    console.log(`  ${from.padEnd(28)} -> src/content/${src.padEnd(22)} ${items} files ${hubNote} ${pruneNote}`);
  }
  console.log('Sync done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
