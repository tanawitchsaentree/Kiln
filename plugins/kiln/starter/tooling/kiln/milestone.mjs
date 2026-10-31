#!/usr/bin/env node
// milestone — may the current milestone close? Reads what the runs recorded, never re-runs them.
//
// A milestone is a promise to the user, so it is defined here as checks rather than in prose
// (skill kiln, references/milestones.md, says what each one means and why):
//
//   M1  infrastructure + wave 1   concept and anchor locked, tokens with this system's own reasons in
//       every theme, the docs book at full depth, one-package install, a full verify green on the code
//       that is on disk now, and wave 1 (layout + atoms, including the controls the docs need) done.
//
// Usage: node tooling/kiln/milestone.mjs [M1]   (also prints the milestone's "still missing" menu)
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, docsConfig, componentPages, sourceHash } from './config.mjs';

const C = docsConfig();
const SYS = JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8'));
const M = process.argv[2] ?? SYS.milestone?.current ?? 'M1';
const DEF = { M1: { minComponents: 12, requires: ['Container', 'Grid', 'Stack'], controls: ['Select', 'Slider'] }, ...(SYS.milestone?.definitions ?? {}) }[M];
if (!DEF) { console.log(`✗ milestone ${M} has no definition (system/kiln.config.json milestone.definitions)`); process.exit(1); }
const json = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const text = (f) => (existsSync(path.join(ROOT, f)) ? readFileSync(path.join(ROOT, f), 'utf8') : '');

const rows = [];
const need = (ok, what, detail = '') => rows.push({ ok: !!ok, what, detail });

// 1. The run that says "green" must describe the code on disk.
const run = json(path.join(ROOT, 'system', 'reports', 'verify-latest.json'));
need(run, 'a full verify has been recorded (pnpm run verify)', run ? `${run.kind}, ${run.finishedAt}` : 'system/reports/verify-latest.json missing');
if (run) {
  need(run.kind === 'full', 'the recorded run is the full one, not --quick');
  need(run.ok, 'every verify step passed', run.steps.filter((s) => s.status !== 'pass').map((s) => `${s.id} ${s.status}`).join(', '));
  need(!run.sourceChanged, 'nothing was edited while it ran');
  const now = sourceHash();
  need(run.sourceHash === now, 'the source has not changed since that run', run.sourceHash === now ? '' : `run ${run.sourceHash}, disk ${now}: run verify again`);
}
const gates = json(path.join(C.abs(C.app), 'public', 'gates.json'));
need(gates && !gates.partial, 'docs gates ran in full (no --only)', gates?.partial ? 'partial run' : '');
const advRed = (gates?.results ?? []).filter((r) => !r.ok && r.id in (gates.advisory ?? {}));
need(gates && !advRed.length, 'no advisory gate is still red', advRed.map((r) => `${r.id} (${gates.advisory[r.id]})`).join('; '));
need(!Object.keys(C.advisory ?? {}).length, 'docs.advisory is empty', Object.keys(C.advisory ?? {}).join(', '));
// the book's published measurements are whole runs: a KILN_ROUTES/KILN_SCENES run writes a partial report
// only, and a conformance file merged from limited runs must hold no result older than its component
const evidence = json(path.join(C.abs(C.app), 'public', 'evidence.json'));
need(evidence && !evidence.partial, 'the published evidence is a full run (not KILN_ROUTES or KILN_SCENES)', evidence ? (evidence.partial ? 'partial run' : '') : 'public/evidence.json missing');
const conf = json(path.join(C.abs(C.app), 'public', 'conformance.json'));
need(conf && !conf.partial && !conf.stale, 'conformance is a full run with no stale result', conf ? [conf.partial && 'merged from a limited run', conf.stale && `${conf.stale} stale checks`].filter(Boolean).join(', ') : 'public/conformance.json missing');

// 2. The system is its own: no starter seed or placeholder left.
need(SYS.tokens?.allowSeed === false, 'tokens.allowSeed is false (every token has this system’s own reason)');
const tokensJson = json(path.join(ROOT, 'packages/tokens/build/json/tokens.json')) ?? {};
const seeds = Object.entries(tokensJson).filter(([, t]) => [].concat(t.why?.p ?? []).includes('SEED')).length;
need(seeds === 0, 'no token still carries the starter SEED reason', seeds ? `${seeds} tokens` : '');
need((SYS.docs?.rationale?.pendingDerivation ?? []).length === 0, 'no component is awaiting its derivation round', (SYS.docs?.rationale?.pendingDerivation ?? []).join(', '));
// a template placeholder is TODO(…), {{name}} or a short {label} such as {ชื่อ}
const PLACEHOLDER = /TODO\(|\{\{[^{}\n]{1,30}\}\}|\{[^{}\s"'`]{1,20}\}/;
for (const f of ['system/CONCEPT.md', 'system/INTAKE.md', 'system/STATE.md', 'system/NEXT.md']) {
  const t = text(f).replace(/<!--[\s\S]*?-->/g, '');
  const hit = t.match(PLACEHOLDER)?.[0];
  need(t && !hit, `${f} is written (no placeholder left)`, t ? (hit ? `still has ${hit}` : '') : 'missing');
}
const blank = text('system/INTAKE.md').split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l) && /\|\s*\|\s*$/.test(l));
need(!blank.length, 'every intake question has an answer', blank.map((l) => `#${l.split('|')[1].trim()}`).join(', '));
need(SYS.name && !/\{\{/.test(SYS.name), 'the system has a name in kiln.config.json');

// 3. Wave scope.
const chapters = componentPages(C).map((p) => p.title);
need(chapters.length >= DEF.minComponents, `at least ${DEF.minComponents} components at full depth`, `${chapters.length}: ${chapters.join(', ')}`);
for (const n of DEF.requires) need(chapters.includes(n), `${n} is built`);
// the docs' own controls are part of the wave, or G-N1 can only pass by hiding controls
const controls = text('apps/docs/src/system/controls.tsx');
need(controls && !/<select\b|type="range"/.test(controls), 'the docs controls (system/controls.tsx) are the system’s own components, not native elements');
for (const n of DEF.controls) need(chapters.includes(n) && new RegExp(`import[^;]*\\b${n}\\b[^;]*from '[^']+'`).test(controls), `${n} is built and system/controls.tsx imports it`);

// 4. Agent picks are open for the user's review.
if (SYS.autonomy?.picks === 'agent') {
  const review = text('system/REVIEW.md');
  const missing = chapters.filter((n) => !new RegExp(`\\|\\s*${n}\\s*\\|`).test(review));
  need(!missing.length, 'every component pick has a row in system/REVIEW.md', missing.join(', '));
}

for (const r of rows) console.log(`${r.ok ? '✓' : '✗'} ${r.what}${r.detail ? ` — ${r.detail}` : ''}`);
const bad = rows.filter((r) => !r.ok).length;
console.log(`\n${bad ? '✗' : '✓'} milestone ${M}: ${rows.length - bad}/${rows.length}${bad ? ', not done' : ', done. Hand the user system/REVIEW.md and the book.'}`);
// What is still missing against the benchmark: the menu for this milestone (docs/MILESTONES.md in kiln,
// milestone-menu.json here). The user ticks what the next milestone should take on; the agent writes the
// ticked items into BACKLOG.md and system/NEXT.md. Printed every run, done or not.
const MENU = json(path.join(path.dirname(new URL(import.meta.url).pathname), 'milestone-menu.json'));
if (MENU?.[M]?.length) {
  console.log(`\nStill missing against the benchmark after ${M}. Tick what comes next:`);
  for (const item of MENU[M]) console.log(`  [ ] ${item}`);
}
process.exit(bad ? 1 : 0);
