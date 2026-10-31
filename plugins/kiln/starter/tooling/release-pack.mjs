#!/usr/bin/env node
// release-pack — packs the tokens and React packages into ./release as installable tarballs,
// for handing to another project without publishing anywhere (publishing stays the user's call).
//   npm install ./release/<react package>-<version>.tgz   (one tarball carries the tokens too)
import { mkdirSync, readdirSync, readFileSync, copyFileSync } from 'node:fs';
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

// Released means on the user's screen (Pane, 2026-10-29: 0.4.0 was announced while the app the user
// judged by still installed 0.3.0). --consumers installs the React tarball into every app listed in
// kiln.config.json `consumers` ([{ "path": "../my-app", "vendor": "vendor" }]) and typechecks it there;
// the agent then screenshots each app in both themes before calling the release done.
if (process.argv.includes('--consumers')) {
  const react = readdirSync(OUT).filter((f) => f.endsWith('.tgz') && f.includes('react')).sort().pop();
  for (const c of cfg.consumers ?? []) {
    const app = path.resolve(ROOT, c.path);
    const dest = path.join(app, c.vendor ?? 'vendor'); mkdirSync(dest, { recursive: true });
    copyFileSync(path.join(OUT, react), path.join(dest, react));
    const i = spawnSync('npm', ['install', `./${path.relative(app, path.join(dest, react))}`, '--no-audit', '--no-fund'], { cwd: app, stdio: 'inherit' });
    const t = spawnSync('npx', ['tsc', '--noEmit'], { cwd: app, stdio: 'inherit' });
    console.log(`${i.status || t.status ? '✗' : '✓'} ${c.path}: ${react} installed${t.status ? ', typecheck failed' : ', typechecks'}; now screenshot it in both themes`);
  }
  if (!(cfg.consumers ?? []).length) console.log('! no consumers listed in kiln.config.json; add the apps that use this system');
}
