#!/usr/bin/env node
// verify — runs every check a system has, in order, and records the run.
//
// Three things went wrong with a hand-written `a && b && c` chain in Pane, and this replaces it:
//   1. The chain stopped at the first red, so one run showed one problem and the rest stayed unknown.
//      Here every step runs; a step only skips when a step it needs (a build) failed.
//   2. Gates ran with `--only <the ones that passed>`, so a new red gate never showed. Here gates run
//      in full; a gate that cannot pass yet goes in docs.advisory with a reason, visibly.
//   3. Source was edited while a 60-minute run was going, and the green that came back described code
//      that no longer existed. Here the source is hashed before and after; a changed hash marks the
//      run invalid.
// The run is written to system/reports/verify-latest.json; tooling/kiln/milestone.mjs reads it.
//
// Usage: node tooling/kiln/verify.mjs            full run (60–90 min with a browser on every page)
//        node tooling/kiln/verify.mjs --quick    builds, lint, types, reasons, conformance (minutes)
// Browser steps run at nice 19 so the machine stays usable. Never edit source during a full run.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT, sourceHash } from './config.mjs';

const QUICK = process.argv.includes('--quick');
const SYS = JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8'));
const pkg = (dir) => JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8')).name;
const DOCS = pkg(SYS.docs?.app ?? 'apps/docs');
const REACT = pkg('packages/react');
const TOKENS = pkg('packages/tokens');

// [id, command, { needs, after, browser, quick }]: needs = must have passed; after = runs once those ran, pass or fail,
// so a red evidence run still lets the gates and tone run and report everything in one pass
const STEPS = [
  ['tokens', ['pnpm', '--filter', TOKENS, 'build'], { quick: true }],
  ['engine', ['node', 'tooling/kiln/sync.mjs', '--check'], { quick: true }],
  ['lint', ['node', 'tooling/no-hardcode-lint.mjs'], { quick: true }],
  ['barrel', ['node', 'tooling/generate-barrel.mjs', '--check'], { quick: true }],
  ['token-contract', ['node', 'tooling/kiln/token-contract.mjs'], { needs: ['tokens'], quick: true }],
  ['typecheck', ['sh', '-c', `pnpm --filter ${REACT} typecheck && pnpm --filter ${DOCS} exec tsc --noEmit -p .`], { needs: ['tokens'], quick: true }],
  ['rationale', ['node', 'tooling/kiln/rationale.mjs'], { needs: ['tokens'], quick: true }],
  ['meta', ['node', 'tooling/kiln/meta.mjs'], { quick: true }],
  ['build', ['sh', '-c', `pnpm --filter ${REACT} build && pnpm --filter ${DOCS} build`], { needs: ['tokens', 'meta'], quick: true }],
  ['smoke-import', ['node', 'tooling/smoke-import.mjs'], { needs: ['build'] }],
  ['spec-capture', ['node', 'tooling/kiln/spec-capture.mjs'], { needs: ['build'], browser: true }],
  ['evidence', ['node', 'tooling/kiln/evidence.mjs'], { needs: ['build'], browser: true }],
  // specs.json and evidence.json are read by the book, so it is built again before anything reads the pages
  ['rebuild', ['pnpm', '--filter', DOCS, 'build'], { needs: ['build'], after: ['spec-capture', 'evidence'] }],
  ['conformance', ['node', 'tooling/kiln/conformance.mjs', '--no-build'], { needs: ['build'], browser: true, quick: true }],
  ['gates', ['node', 'tooling/kiln/gates.mjs', '--report'], { needs: ['rebuild'], browser: true }],
  ['tone', ['node', 'tooling/kiln/tone-gate.mjs'], { needs: ['rebuild'], browser: true }],
];

const before = sourceHash();
const started = new Date();
const status = {};
const steps = [];
for (const [id, cmd, o] of STEPS) {
  if (QUICK && !o.quick) continue;
  const blocked = (o.needs ?? []).filter((n) => n in status && status[n] !== 'pass');
  if (blocked.length) { status[id] = 'skipped'; steps.push({ id, status: 'skipped', because: blocked }); console.log(`- ${id}: skipped, needs ${blocked.join(', ')}`); continue; }
  const full = o.browser ? ['nice', '-n', '19', ...cmd] : cmd;
  const t0 = Date.now();
  console.log(`\n▶ ${id}: ${cmd.join(' ')}`);
  const r = spawnSync(full[0], full.slice(1), { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  process.stdout.write(out.split('\n').slice(-40).join('\n') + '\n');
  status[id] = r.status === 0 ? 'pass' : 'fail';
  const reds = out.split('\n').filter((l) => /^\s*✗/.test(l)).slice(0, 30);
  steps.push({ id, status: status[id], seconds: Math.round((Date.now() - t0) / 1000), reds, tail: out.split('\n').filter(Boolean).slice(-6) });
  console.log(`${status[id] === 'pass' ? '✓' : '✗'} ${id} (${Math.round((Date.now() - t0) / 1000)}s)`);
}
const after = sourceHash();
const ok = steps.every((s) => s.status === 'pass') && before === after;
const run = { kind: QUICK ? 'quick' : 'full', startedAt: started.toISOString(), finishedAt: new Date().toISOString(), sourceHash: after, sourceChanged: before !== after, ok, steps };
mkdirSync(path.join(ROOT, 'system', 'reports'), { recursive: true });
writeFileSync(path.join(ROOT, 'system', 'reports', `verify-${QUICK ? 'quick' : 'latest'}.json`), JSON.stringify(run, null, 2) + '\n');

console.log('\n' + steps.map((s) => `${s.status === 'pass' ? '✓' : s.status === 'skipped' ? '-' : '✗'} ${s.id}`).join('  '));
if (before !== after) console.log('✗ source changed while verify ran, so this result describes code that no longer exists. Run again without editing.');
console.log(`${ok ? '✓' : '✗'} verify (${run.kind}): ${steps.filter((s) => s.status === 'pass').length}/${steps.length} steps`);
process.exit(ok ? 0 : 1);
