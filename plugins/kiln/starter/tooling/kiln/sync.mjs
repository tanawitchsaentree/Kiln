#!/usr/bin/env node
// sync — installs kiln's docs engine into a system repo, one direction only.
//
// A system never edits engine files. It gets a read-only copy under <system>/tooling/kiln/ plus
// ENGINE.json (kiln commit + sha256 of every file). `--check` run inside the system fails if any
// engine file was edited there: the fix belongs in kiln, then sync again. This keeps the boundary
// Dial lacked: the engine lives in kiln, the system lives in its repo, and nothing flows backwards.
//
// Usage (from kiln):   node tooling/engine/sync.mjs <path-to-system-repo>
// Usage (in a system): node tooling/kiln/sync.mjs --check
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
// engine code and its own data files (milestone-menu.json); the manifest itself is written, never copied
const engineFiles = (dir) => readdirSync(dir).filter((n) => n.endsWith('.mjs') || (n.endsWith('.json') && n !== 'ENGINE.json'));

if (process.argv.includes('--check')) {
  const manifest = path.join(HERE, 'ENGINE.json');
  if (!existsSync(manifest)) { console.log('✗ engine check: no ENGINE.json, this copy was not installed by kiln sync'); process.exit(1); }
  const m = JSON.parse(readFileSync(manifest, 'utf8'));
  const bad = Object.entries(m.files).filter(([n, h]) => !existsSync(path.join(HERE, n)) || sha(path.join(HERE, n)) !== h).map(([n]) => n);
  const extra = engineFiles(HERE).filter((n) => !(n in m.files));
  for (const n of bad) console.log(`✗ ${n} differs from kiln ${m.kiln}. Change it in kiln and sync again.`);
  for (const n of extra) console.log(`✗ ${n} is not part of the engine. System tooling goes in tooling/, not tooling/kiln/.`);
  console.log(`${bad.length || extra.length ? '✗' : '✓'} engine check: ${Object.keys(m.files).length} files match kiln ${m.kiln}`);
  process.exit(bad.length || extra.length ? 1 : 0);
}

const target = process.argv[2];
if (!target || !existsSync(target)) { console.error('usage: node tooling/engine/sync.mjs <path-to-system-repo>'); process.exit(1); }
const dest = path.join(path.resolve(target), 'tooling', 'kiln');
mkdirSync(dest, { recursive: true });
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: HERE, encoding: 'utf8' }).trim() + (execSync('git status --porcelain .', { cwd: HERE, encoding: 'utf8' }).trim() ? '+dirty' : ''); } catch {}
const files = {};
for (const n of engineFiles(HERE)) { copyFileSync(path.join(HERE, n), path.join(dest, n)); files[n] = sha(path.join(dest, n)); }
// Reference data the gates measure against travels with the engine, so a system never points at a
// path inside someone else's checkout: the Carbon depth benchmark, the topic lists and the catalog.
const KIT = path.join(HERE, '..', '..');
const DATA = [
  [path.join(KIT, 'marketplace/plugins/kiln/skills/docs-engine/benchmarks'), ''],
  [path.join(KIT, 'docs/CATALOG.md'), 'CATALOG.md'],
];
const copyData = (src, rel) => {
  if (!existsSync(src)) return;
  if (statSync(src).isDirectory()) { for (const n of readdirSync(src)) copyData(path.join(src, n), path.join(rel, n)); return; }
  const to = path.join(dest, 'data', rel);
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(src, to);
  files[path.join('data', rel)] = sha(to);
};
for (const [src, rel] of DATA) copyData(src, rel);
writeFileSync(path.join(dest, 'ENGINE.json'), JSON.stringify({ kiln: commit, syncedAt: new Date().toISOString(), files }, null, 2) + '\n');
writeFileSync(path.join(dest, 'README.md'), `# kiln docs engine (read-only copy)\n\nInstalled by kiln \`tooling/engine/sync.mjs\` from kiln ${commit}. Do not edit these files here: change them in kiln and sync again. \`node tooling/kiln/sync.mjs --check\` fails on any local edit.\n`);
console.log(`✓ synced ${Object.keys(files).length} engine and data files to ${path.relative(process.cwd(), dest)} (kiln ${commit})`);
