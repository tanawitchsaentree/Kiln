#!/usr/bin/env node
// Verifies every hand-typed count in the docs against the thing it counts.
//
// WHY this exists (class fix, not instance fix): "a number typed into prose drifts away from
// reality, silently" is the single most-repeated bug in this repo's history. It has been found and
// individually patched FIVE times:
//   1. README.md stuck at "108 components" after D-017/D-022 cut the catalog to 103
//   2. docs/CATALOG.md's own title still said 108 while its body and its per-wave sums said 103
//   3. docs/BLUEPRINT.md §5 described CATALOG.md as "108 ตัว"
//   4. docs/DISTRIBUTION.md's sales bullet said "108 components"
//   5. packages/react/CHANGELOG.md said "48 components" for a list that enumerates 46
// Each of those was fixed by editing the number. That never closes the class — instance 2 was
// found three sessions AFTER instance 1 was "fixed". The only fix that holds is a gate that goes
// red when prose and reality disagree, so the drift cannot be silent.
//
// The counts checked here are derived, never declared: the catalog total is summed from CATALOG.md's
// own per-wave "(N)" markers, and the shipped-component total is read from the barrel manifest.
// If you change the catalog, this check tells you every document that now lies.
//
// KIT-CHANGELOG.md and system/DECISIONS.md are deliberately EXEMPT: both are append-only historical
// records, and 108 was the true number when those entries were written. Rewriting history to match
// the present is exactly the kind of edit those files exist to prevent.
//
// Run: node tooling/doc-count-check.mjs
// Selftest (mutation table in the header): node tooling/doc-count-check.selftest.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Files whose numbers are historical by design — see the header.
const APPEND_ONLY_EXEMPT = ['docs/KIT-CHANGELOG.md', 'system/DECISIONS.md'];

export async function run(root = ROOT) {
  const errors = [];
  const read = (rel) => {
    const abs = path.join(root, rel);
    return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  };

  // ---------------------------------------------------------------------------
  // Truth 1: the catalog total, summed from CATALOG.md's own per-wave markers.
  // Lines look like: `**W4 Web Overlays (6, was 10 — D-017 ...):** Dialog/Modal, ...`
  // The FIRST number in the parens is the current count; "was 10" must not be read.
  // ---------------------------------------------------------------------------
  const catalog = read('docs/CATALOG.md');
  if (catalog === null) {
    errors.push('docs/CATALOG.md is missing — it is the source of truth for the catalog total.');
    return errors;
  }

  const waveLines = [...catalog.matchAll(/^\*\*(W\d+)[^(]*\((\d+)/gm)];
  if (waveLines.length === 0) {
    // A gate that inspects nothing must fail, not pass. This repo has hit the
    // silent-skip failure class five separate times; never add an empty-set pass here.
    errors.push(
      'docs/CATALOG.md: found no `**W<n> ... (<count>)` wave lines to sum. Either the catalog ' +
        'format changed or this check is scanning the wrong file — both mean the count is unverified.'
    );
    return errors;
  }
  const catalogTotal = waveLines.reduce((sum, m) => sum + Number(m[2]), 0);

  // The declared total in CATALOG.md's own H1 must equal the sum of its waves.
  const catalogTitle = /^#\s+.*?(\d+)\s*ตัว/m.exec(catalog);
  if (!catalogTitle) {
    errors.push('docs/CATALOG.md: could not find a `# ... <N> ตัว` title to check against the wave sum.');
  } else if (Number(catalogTitle[1]) !== catalogTotal) {
    errors.push(
      `docs/CATALOG.md title says ${catalogTitle[1]} components, but its own per-wave counts sum to ` +
        `${catalogTotal} (${waveLines.map((m) => `${m[1]}=${m[2]}`).join(' + ')}). ` +
        `Fix the title, or the wave line whose count is wrong.`
    );
  }

  // ---------------------------------------------------------------------------
  // Truth 2: shipped components + named exports.
  // Components come from the barrel manifest (the single source of truth for what the package
  // exports, per tooling/generate-barrel.mjs). Exports come from the BUILT bundle when present —
  // 46 components ship 48 named exports (Toast contributes ToastProvider + ToastAction, and
  // useToast/useSnackbar are hooks), which is exactly the confusion that produced instance 5.
  // ---------------------------------------------------------------------------
  const manifestPath = path.join(root, 'packages/react/src/barrel.manifest.mjs');
  let shippedComponents = null;
  if (existsSync(manifestPath)) {
    const { BARREL_MANIFEST } = await import(manifestPath);
    shippedComponents = BARREL_MANIFEST.filter((b) => b.components).flatMap((b) => b.components).length;
  }

  // ---------------------------------------------------------------------------
  // Claims: every place a count is written in prose.
  // ---------------------------------------------------------------------------
  const CLAIMS = [
    // The catalog total, quoted in other documents.
    { file: 'README.md', pattern: /(\d+)\s*ตัว\s*\/\s*10 waves/, expect: () => catalogTotal, what: 'catalog total' },
    { file: 'docs/BLUEPRINT.md', pattern: /`docs\/CATALOG\.md`\s*\((\d+)\s*ตัว/, expect: () => catalogTotal, what: 'catalog total' },
    { file: 'docs/DISTRIBUTION.md', pattern: /(\d+)\s*components\s*\/\s*10 waves/, expect: () => catalogTotal, what: 'catalog total' },
    { file: 'docs/ROADMAP.md', pattern: /\((\d+)\s*components total/, expect: () => catalogTotal, what: 'catalog total' },
    // Shipped components.
    {
      file: 'packages/react/CHANGELOG.md',
      pattern: /^(\d+)\s*components\b/m,
      expect: () => shippedComponents,
      what: 'shipped component count (from barrel.manifest.mjs)',
    },
  ];

  for (const claim of CLAIMS) {
    if (APPEND_ONLY_EXEMPT.includes(claim.file)) continue;
    const text = read(claim.file);
    if (text === null) continue; // an absent optional doc is not a drift
    const expected = claim.expect();
    if (expected === null) continue; // truth unavailable (e.g. manifest missing) — nothing to compare
    const found = claim.pattern.exec(text);
    if (!found) {
      errors.push(
        `${claim.file}: expected to find a ${claim.what} matching ${claim.pattern} and found none. ` +
          `Either the wording changed (update this check) or the count was deleted — a count this ` +
          `check cannot see is a count that can drift freely.`
      );
      continue;
    }
    if (Number(found[1]) !== expected) {
      errors.push(
        `${claim.file}: says ${found[1]} for the ${claim.what}, but the real number is ${expected}. ` +
          `This is the hand-typed-count drift class — fix the prose, do not change the truth to match it.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Stale-number sweep: the superseded catalog total must not survive anywhere outside the
  // append-only records. This is what catches a NEW document repeating the old number.
  // ---------------------------------------------------------------------------
  const SUPERSEDED = [108];
  const sweepFiles = ['README.md', 'docs/CATALOG.md', 'docs/BLUEPRINT.md', 'docs/DISTRIBUTION.md', 'docs/ROADMAP.md', 'docs/QUICKSTART.md'];
  for (const rel of sweepFiles) {
    if (APPEND_ONLY_EXEMPT.includes(rel)) continue;
    const text = read(rel);
    if (text === null) continue;
    for (const stale of SUPERSEDED) {
      // Only flag the number when it is being used AS a component count, not any occurrence of "108".
      const re = new RegExp(`\\b${stale}\\s*(?:ตัว|components?)\\b`, 'g');
      for (const m of text.matchAll(re)) {
        // A sentence explaining the drift itself is allowed to name the old number.
        const line = text.slice(0, m.index).split('\n').length;
        const lineText = text.split('\n')[line - 1];
        if (/ปรับจาก|was |เดิม|drift|superseded/i.test(lineText)) continue;
        errors.push(
          `${rel}:${line}: still uses the superseded count "${m[0]}" as a live component count ` +
            `(current: ${catalogTotal}). If this is a historical mention, say so on the same line ` +
            `(e.g. "ปรับจาก 108 เดิม") so it reads as history rather than fact.`
        );
      }
    }
  }

  return errors;
}

// Only act as a CLI when invoked directly — the selftest imports run() and passes it fixture roots.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

async function main() {
const errors = await run();
if (errors.length > 0) {
  console.error(`doc-count-check: ${errors.length} count(s) disagree with reality\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(
    '\nThis check exists because this exact bug has been individually patched five times. ' +
      'Fixing the number without asking why it drifted just schedules the sixth.'
  );
  process.exit(1);
}
console.log('doc-count-check: ✓ every checked count matches its source of truth');
}
