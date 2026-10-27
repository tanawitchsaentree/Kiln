#!/usr/bin/env node
// Gate Proof Rule (ds-conventions/SKILL.md) applied to doc-count-check.mjs.
//
// This gate guards the most-repeated bug in the repo's history — a count typed into prose drifting
// away from the thing it counts, five separate confirmed instances — so it matters more than usual
// that it can actually go red. The failure it guards is invisible in every other signal: the docs
// render, the build passes, the tests pass, and the number is simply wrong.
//
// Each case writes a synthetic mini-repo in a temp dir (its own CATALOG.md, README.md, manifest, …)
// and calls the real run() against that root, so no mutation ever touches the real docs and a
// fixture can declare a catalog that is deliberately inconsistent with its own prose.
//
// This file is itself gate-proofed. doc-count-check.mjs was mutated eight ways — one per branch that
// can independently make the gate toothless — and the suite went red for every one, then reverted
// byte-identical (sha256 14ef56ff…). To repeat by hand, edit tooling/doc-count-check.mjs, run this
// file, then restore the tool:
//   M1  final `return errors` -> `return []`            the gate can never fail at all     → 9/16
//   M2  drop the `waveLines.length === 0` guard         scanning no waves reads as pass    → 15/16
//   M3  drop the CATALOG title-vs-wave-sum comparison   the title can drift freely         → 14/16
//   M4  drop the `if (!found)` missing-claim branch     deleting a count evades the gate   → 15/16
//   M5  `SUPERSEDED = [108]` -> `[]`                    a NEW doc can repeat 108           → 15/16
//   M6  drop the `ปรับจาก|was |เดิม` history allowance   honest history reads as drift      → 15/16
//   M7  wave regex accepts the `N, was M` second number "was 10" becomes the live count    → 15/16
//   M8  `expected === null` -> `false` (compare anyway) a missing manifest asserts NaN     → 15/16
//
// M1 is the two-sided proof and its number needs reading carefully: 9/16, not 8/16. Eight of those
// nine are the cases that assert GREEN — so the seven others are reading the result rather than
// passing by coincidence. The ninth is 'a CATALOG with no parseable wave lines', which stays red
// under M1 because that branch returns early at the wave-guard rather than falling through to the
// mutated final `return`. That is the correct behaviour (an unparseable catalog must fail before
// anything downstream trusts its total), and M2 proves that branch on its own.
//
// M2, M4, M5, M6, M7 and M8 each taking out exactly one case means no case is doing double duty —
// one branch, one proof. M3 takes two because a drifted title and the message that names the wave
// breakdown are two assertions on the same branch, deliberately: the count alone does not tell you
// which wave line to go fix.
//
// M7 is the one that would otherwise be easy to get wrong: CATALOG.md's real W4 and W5 lines read
// `(6, was 10 — D-017 …)` and `(9, was 10 — D-022 …)`, so a regex that grabs the wrong number sums
// to 108 — the exact superseded total — and the gate would then certify the stale number as correct
// while reporting green. That is worse than no gate at all.
//
// ใช้: node tooling/doc-count-check.selftest.mjs
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { run } from './doc-count-check.mjs';

let failures = 0;
let total = 0;

// A catalog whose per-wave counts sum to `total`, in the real file's format. `waves` maps a label to
// either a number or a string like '6, was 10 — D-017 ตัด mobile-only ออก' so a fixture can reproduce
// the superseded-count annotation that M7 exists to guard.
function catalogFile(title, waves) {
  const lines = Object.entries(waves).map(
    ([label, count]) => `**${label} (${count}):** Foo, Bar, Baz`
  );
  return `# Component Catalog — ${title} ตัว จัดเป็น 10 waves ตาม dependency\n> header line\n\n${lines.join('\n')}\n`;
}

const DEFAULT_WAVES = { W1: 10, W2: 12, W3: 11 }; // sums to 33

// `files` maps a repo-relative path to content. Every file the checker knows about is written with a
// consistent value by default, so a case's own edit is the only possible source of red.
function makeWorld(files = {}, { waves = DEFAULT_WAVES, title = null, manifest = true } = {}) {
  const sum = Object.values(waves).reduce(
    (s, v) => s + Number(String(v).match(/^(\d+)/)[1]),
    0
  );
  const root = mkdtempSync(join(tmpdir(), 'doc-count-'));
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };

  const defaults = {
    'docs/CATALOG.md': catalogFile(title ?? sum, waves),
    'README.md': `# Repo\n├── CATALOG.md   component inventory ${sum} ตัว / 10 waves\n`,
    'docs/BLUEPRINT.md': `## 5. Inventory\nCatalog เต็มอยู่ที่ \`docs/CATALOG.md\` (${sum} ตัว / 10 waves เป็น default) โครง tier:\n`,
    'docs/DISTRIBUTION.md': `## differentiator\n4. **สเกลได้จริง** — ${sum} components / 10 waves โดย user ตัดสินใจ ~10 ครั้ง\n`,
    'docs/ROADMAP.md': `Counts come from the locked catalog (${sum} components total, D-001 through D-024).\n`,
    'packages/react/CHANGELOG.md': `# Changelog\n\n## 0.1.0\n\n3 components (4 named exports — Toast ships two) covering Layout:\n`,
  };

  for (const [rel, content] of Object.entries({ ...defaults, ...files })) {
    if (content === null) continue; // explicit null means "do not write this file at all"
    write(rel, content);
  }

  if (manifest) {
    write(
      'packages/react/src/barrel.manifest.mjs',
      `export const BARREL_MANIFEST = [\n  { header: 'W1', components: ['Box', 'Flex'] },\n  { raw: 'export type { Foo };' },\n  { header: 'W2', components: ['Text'] },\n];\n`
    );
  }

  return root;
}

async function check(label, { expectRed, files, opts } = {}) {
  total += 1;
  const root = makeWorld(files, opts);
  let errors;
  try {
    errors = await run(root);
  } catch (err) {
    failures += 1;
    console.error(`  ✗ ${label}\n      threw unexpectedly: ${err.message}`);
    rmSync(root, { recursive: true, force: true });
    return null;
  }
  rmSync(root, { recursive: true, force: true });

  const isRed = errors.length > 0;
  if (isRed !== expectRed) {
    failures += 1;
    console.error(
      `  ✗ ${label}\n      expected ${expectRed ? 'RED' : 'GREEN'}, got ${isRed ? 'RED' : 'GREEN'}` +
        (isRed ? `\n      errors: ${errors.join(' | ')}` : '')
    );
    return errors;
  }
  console.log(`  ✓ ${label}`);
  return errors;
}

// A red case whose MESSAGE must also match — a gate that goes red for the wrong reason is not
// proving the branch the case was written for.
async function checkRedMatching(label, pattern, { files, opts } = {}) {
  const errors = await check(label, { expectRed: true, files, opts });
  if (errors === null || errors.length === 0) return;
  if (!errors.some((e) => pattern.test(e))) {
    failures += 1;
    console.error(`  ✗ ${label} — went red, but no message matched ${pattern}\n      got: ${errors.join(' | ')}`);
  }
}

console.log('doc-count-check selftest\n');

// --- green: the consistent world, and the shapes that must NOT be read as drift ---------------
await check('a fully consistent world is green', { expectRed: false });

await check('a wave line annotated "6, was 10" reads 6, not 10', {
  expectRed: false,
  opts: { waves: { W1: 10, W2: 12, W3: '11, was 15 — D-017 ตัดออก' } }, // sums to 33 either way only if 11 is read
});

await check('an absent optional doc is not drift', {
  expectRed: false,
  files: { 'docs/ROADMAP.md': null },
});

await check('a missing barrel manifest skips the shipped-count claim rather than asserting NaN', {
  expectRed: false,
  opts: { manifest: false },
  files: { 'packages/react/CHANGELOG.md': '# Changelog\n\n99 components covering everything:\n' },
});

await check('a superseded number labelled as history ("ปรับจาก 108 เดิม") is allowed', {
  expectRed: false,
  files: {
    'README.md': '# Repo\n├── CATALOG.md   component inventory 33 ตัว / 10 waves (ปรับจาก 108 เดิม)\n',
  },
});

await check('a superseded number labelled with "was" is allowed', {
  expectRed: false,
  files: {
    'docs/ROADMAP.md': 'Counts come from the locked catalog (33 components total; was 108 components before D-017).\n',
  },
});

await check('the bare number 108 outside a count context is not flagged', {
  expectRed: false,
  files: {
    'docs/QUICKSTART.md': '# Quickstart\nRun on port 108 and see 108 log lines. Not a component count.\n',
  },
});

await check('a doc the checker has no claim for is left alone', {
  expectRed: false,
  files: { 'docs/PORTABILITY.md': '# Portability\nsays nothing about counts\n' },
});

// --- red: one case per branch ------------------------------------------------------------------
await checkRedMatching(
  "CATALOG's own title disagreeing with its wave sum is red",
  /title says 40 components, but its own per-wave counts sum to 33/,
  { opts: { title: 40 } }
);

await checkRedMatching(
  'the title-mismatch message names the wave breakdown so the wrong line can be found',
  /W1=10 \+ W2=12 \+ W3=11/,
  { opts: { title: 40 } }
);

await checkRedMatching('README quoting a stale catalog total is red', /README\.md: says 108/, {
  files: { 'README.md': '# Repo\n├── CATALOG.md   component inventory 108 ตัว / 10 waves\n' },
});

await checkRedMatching(
  'BLUEPRINT describing CATALOG with the wrong number is red',
  /BLUEPRINT\.md: says 108/,
  { files: { 'docs/BLUEPRINT.md': 'Catalog เต็มอยู่ที่ `docs/CATALOG.md` (108 ตัว / 10 waves เป็น default)\n' } }
);

await checkRedMatching(
  'a NEW doc repeating the superseded number as live fact is red',
  /DISTRIBUTION\.md:2: still uses the superseded count "108 components"/,
  { files: { 'docs/DISTRIBUTION.md': '## differentiator\n4. **สเกลได้จริง** — 108 components / 10 waves\n' } }
);

await checkRedMatching(
  'CHANGELOG counting components by export rather than by component is red',
  /CHANGELOG\.md: says 4 for the shipped component count.*real number is 3/s,
  { files: { 'packages/react/CHANGELOG.md': '# Changelog\n\n4 components covering Layout:\n' } }
);

await checkRedMatching(
  'deleting the count from a doc is red, not silently green',
  /README\.md: expected to find a catalog total matching/,
  { files: { 'README.md': '# Repo\n├── CATALOG.md   component inventory / 10 waves\n' } }
);

await checkRedMatching(
  'a CATALOG with no parseable wave lines is red — scanning nothing must not read as a pass',
  /found no .*wave lines to sum/,
  { files: { 'docs/CATALOG.md': '# Component Catalog — 33 ตัว จัดเป็น 10 waves\nno wave markers here at all\n' } }
);

console.log(`\ndoc-count-check selftest: ${total - failures}/${total} passed`);
if (failures > 0) process.exit(1);
