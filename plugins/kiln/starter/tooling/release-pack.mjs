#!/usr/bin/env node
// release-pack — packs the tokens and React packages into ./release as installable tarballs,
// for handing to another project without publishing anywhere (publishing stays the user's call).
//   npm install ./release/<react package>-<version>.tgz   (one tarball carries the tokens too)
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'release');
// A package with underived components is not released (Pane, 2026-10-28: 0.3.0 and 0.4.0 were packed
// with ten components still awaiting their derivation round, and the user found them in a real app).
const cfg = JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8'));
const pending = cfg.docs?.rationale?.pendingDerivation ?? [];
if (pending.length && !process.argv.includes('--allow-pending')) {
  console.error(`✗ release-pack: ${pending.length} components still await their derivation round (${pending.join(', ')}). Derive them first; --allow-pending packs a local test build only.`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
for (const dir of ['tokens', 'react']) {
  const r = spawnSync('pnpm', ['pack', '--pack-destination', OUT], { cwd: path.join(ROOT, 'packages', dir), stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`\n✓ release/: ${readdirSync(OUT).filter((f) => f.endsWith('.tgz')).join(', ')}`);
