#!/usr/bin/env node
// Gate Proof Rule (ds-conventions/SKILL.md) applied to contrast-check.mjs.
// contrast-check.mjs shipped without ever having been seen red — the only evidence it worked was
// that its output looked plausible on a pairing that passes. Under the Gate Proof Rule that is
// exactly the state v3's logical-property regex was in: "ดูสมเหตุสมผลตอนเขียน" ไม่ใช่หลักฐาน
//
// The mutation this file automates: write a token CSS pair whose real contrast ratio is BELOW the
// 3:1 UI minimum and confirm the tool exits 1 and says so. Done against synthetic CSS in a temp
// dir rather than by editing packages/tokens/build/css — mutating the real build would leave the
// repo dirty if the run died halfway, and the tool's CSS_DIR is derived from its own location, so
// the fixture has to live next to a copy of the script anyway.
//
// Reproduce by hand: node tooling/contrast-check.mjs color-border-interactive:color-surface-canvas
// against a light.css where --ds-color-border-interactive is set to #f2efeb (same as the canvas).
//
// This file is itself gate-proofed — a suite of fixtures proves nothing until the suite has been seen
// red for a tool that is actually broken. contrast-check.mjs was mutated seven ways, one per part that
// can independently make the tool lie, the suite went red for every one, and the tool was reverted
// byte-identical (sha256 00e0c0d7…4d63). To repeat by hand, edit tooling/contrast-check.mjs, run this
// file, then restore the tool:
//   M1  `if (anyFail)` -> `if (false)`            fails computed, then not reported      → 9/14
//   M2  `ratio >= 3` -> `ratio >= 0`              the UI minimum is no minimum           → 9/14
//   M3  `if (varRef) return resolve(…)` -> a hex  var() aliases not followed             → 12/14
//   M4  luminance -> `(r + g + b) / 3`            no sRGB gamma: wrong ratio, still plausible → 13/14
//   M5  drop the `dark:` themes entry             only light.css is ever checked         → 12/14
//   M6  drop the `!fg || !bg` throw               a pair with no colon skipped silently  → 13/14
//   M7  `if (pairs.length === 0)` -> `if (false)` zero pairs prints a pass               → 13/14
// M1 and M2 both landing on 9/14 is expected — each makes every failing pairing report as fine, so
// they take out the same five red-asserting cases. The rest cost 1-2 cases apiece, which is what says
// those cases test one thing each. M4 is the mutation worth having: a wrong luminance formula still
// prints a confident ratio to three decimals, and no other signal in the repo would catch it.
//
// ใช้: node tooling/contrast-check.selftest.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REAL_SCRIPT = fileURLToPath(new URL('./contrast-check.mjs', import.meta.url));

let failures = 0;
let total = 0;

// The tool resolves CSS_DIR relative to its own file (../packages/tokens/build/css), so a fixture
// world is a temp dir containing tooling/contrast-check.mjs + packages/tokens/build/css/*.css.
function makeWorld({ light, dark }) {
  const root = mkdtempSync(join(tmpdir(), 'contrast-selftest-'));
  const toolingDir = join(root, 'tooling');
  const cssDir = join(root, 'packages', 'tokens', 'build', 'css');
  mkdirSync(toolingDir, { recursive: true });
  mkdirSync(cssDir, { recursive: true });
  copyFileSync(REAL_SCRIPT, join(toolingDir, 'contrast-check.mjs'));
  writeFileSync(join(cssDir, 'light.css'), light);
  writeFileSync(join(cssDir, 'dark.css'), dark);
  return { root, script: join(toolingDir, 'contrast-check.mjs') };
}

function run(world, args) {
  const r = spawnSync('node', [world.script, ...args], { encoding: 'utf8' });
  return { exitCode: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function assertCase(name, { light, dark }, args, expect) {
  total++;
  const world = makeWorld({ light, dark });
  try {
    const result = run(world, args);
    const ok = expect(result, result.out);
    if (!ok) {
      failures++;
      console.error(`✗ FAIL: ${name}`);
      console.error(`  exit=${result.exitCode}\n  output:\n${result.out.split('\n').map((l) => '    ' + l).join('\n')}`);
    } else {
      console.log(`✓ ${name}`);
    }
  } finally {
    rmSync(world.root, { recursive: true, force: true });
  }
}

// Ratios below are computed from the WCAG formula independently of the tool (values chosen from
// the real palette so the numbers mean something):
//   #f2efeb (neutral-50) on #f2efeb        = 1.000:1  → fails both
//   #7e7a74 on #f2efeb                     = 3.722:1  → passes UI, fails text
//   #292723 (neutral-900-ish) on #f2efeb    > 4.5:1   → passes both
const css = (vars) => `:root {\n${Object.entries(vars).map(([k, v]) => `  --ds-${k}: ${v};`).join('\n')}\n}\n`;

const PASS_BOTH = {
  'color-border-interactive': '#292723',
  'color-surface-canvas': '#f2efeb',
};
const PASS_UI_ONLY = {
  'color-border-interactive': '#7e7a74',
  'color-surface-canvas': '#f2efeb',
};
const FAIL_BOTH = {
  'color-border-interactive': '#f2efeb',
  'color-surface-canvas': '#f2efeb',
};

// ---------------------------------------------------------------------------
// The mutation that matters: contrast actually below 3:1 must exit 1.
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: contrast ตกใต้ 3:1 ใน light theme → ต้องแดง (exit 1)',
  { light: css(FAIL_BOTH), dark: css(PASS_BOTH) },
  ['color-border-interactive:color-surface-canvas'],
  (r, out) => r.exitCode === 1 && /FAIL both/.test(out) && /fails the 3:1/.test(out),
);

assertCase(
  'MUTATE: contrast ตกใต้ 3:1 ใน dark theme เท่านั้น → ยังต้องแดง (ห้ามเช็คแค่ light)',
  { light: css(PASS_BOTH), dark: css(FAIL_BOTH) },
  ['color-border-interactive:color-surface-canvas'],
  (r, out) => r.exitCode === 1 && /FAIL both/.test(out),
);

// REVERT side of the rule: the same pairing, unmutated, must be green — otherwise "red" above
// proves nothing (a tool that always exits 1 would pass the case above).
assertCase(
  'REVERT: ค่าเดิมที่ผ่าน 4.5:1 → เขียว (exit 0) พิสูจน์ว่าไม่ได้แดงทุกกรณี',
  { light: css(PASS_BOTH), dark: css(PASS_BOTH) },
  ['color-border-interactive:color-surface-canvas'],
  (r, out) => r.exitCode === 0 && /PASS text\+UI/.test(out),
);

// ---------------------------------------------------------------------------
// The 3:1-vs-4.5:1 boundary is the tool's actual verdict logic, and it is the part most likely to
// be read wrong by a caller: UI-only is reported but NOT a build failure (Card's border lives
// exactly here — see system/EXCEPTIONS.md). Both halves need proving.
// ---------------------------------------------------------------------------
assertCase(
  'BOUNDARY: 3:1 ≤ ratio < 4.5:1 → รายงาน "UI only" แต่ไม่ fail build (exit 0)',
  { light: css(PASS_UI_ONLY), dark: css(PASS_UI_ONLY) },
  ['color-border-interactive:color-surface-canvas'],
  (r, out) => r.exitCode === 0 && /PASS UI only \(3:1\), FAIL text \(4\.5:1\)/.test(out),
);

// ---------------------------------------------------------------------------
// Resolution machinery. Each of these is a way the tool could silently report a WRONG ratio
// rather than no ratio — the failure mode that matters, since a wrong number still looks like a
// working gate. A var() alias chain resolving to the wrong end would do exactly that.
// ---------------------------------------------------------------------------
assertCase(
  'ALIAS: var() chain ถูกไล่ลงไปถึง hex จริง (semantic -> primitive)',
  {
    light: css({
      'color-neutral-50': '#f2efeb',
      'color-neutral-900': '#292723',
      'color-surface-canvas': 'var(--ds-color-neutral-50)',
      'color-border-interactive': 'var(--ds-color-neutral-900)',
    }),
    dark: css(PASS_BOTH),
  },
  ['color-border-interactive:color-surface-canvas'],
  (r, out) => r.exitCode === 0 && /#292723 \/ #f2efeb/.test(out),
);

assertCase(
  'ALIAS: chain ที่ปลายทางเป็นสี fail จริง ยังแดง (alias ไม่ได้กลืน mutation)',
  {
    light: css({
      'color-neutral-50': '#f2efeb',
      'color-surface-canvas': 'var(--ds-color-neutral-50)',
      'color-border-interactive': 'var(--ds-color-neutral-50)',
    }),
    dark: css(PASS_BOTH),
  },
  ['color-border-interactive:color-surface-canvas'],
  (r) => r.exitCode === 1,
);

assertCase(
  'GUARD: circular var reference ตายพร้อมข้อความ ไม่ใช่วนไม่จบหรือคืนเลขมั่ว',
  {
    light: css({
      'color-surface-canvas': 'var(--ds-color-border-interactive)',
      'color-border-interactive': 'var(--ds-color-surface-canvas)',
    }),
    dark: css(PASS_BOTH),
  },
  ['color-border-interactive:color-surface-canvas'],
  (r, out) => r.exitCode !== 0 && /circular var reference/.test(out),
);

assertCase(
  'GUARD: var ที่ไม่มีอยู่ ต้องแดงพร้อมชื่อ ไม่ใช่ผ่านเงียบ',
  { light: css(PASS_BOTH), dark: css(PASS_BOTH) },
  ['color-does-not-exist:color-surface-canvas'],
  (r, out) => r.exitCode !== 0 && /not found/.test(out),
);

assertCase(
  'GUARD: ค่าที่ไม่ใช่ hex (เช่น token ที่เป็น px) ต้องแดง ไม่ใช่คิด luminance จากขยะ',
  {
    light: css({ 'border-width-hairline': '1px', 'color-surface-canvas': '#f2efeb' }),
    dark: css({ 'border-width-hairline': '1px', 'color-surface-canvas': '#f2efeb' }),
  },
  ['border-width-hairline:color-surface-canvas'],
  (r, out) => r.exitCode !== 0 && /non-hex value/.test(out),
);

// ---------------------------------------------------------------------------
// @media handling. parseVars() deliberately reads only the base :root block because
// postbuild-contrast-media.mjs appends a `prefers-contrast: more` block that redefines the same
// names. If that split ever breaks, the tool starts reporting the high-contrast value as if it
// were the default — a wrong-number failure, invisible without this case.
// ---------------------------------------------------------------------------
// Both themes carry the @media override on purpose. The first version of this case gave only
// `light` the override and left `dark` as a plain failing pair — so when the base/@media split was
// mutated away, `dark` still failed, the command still exited 1, and the case stayed green while
// the leak it exists to catch was fully present (verified: the mutated tool reported 13.006:1
// instead of 1.000:1 for light and this assertion did not notice). A theme that fails for an
// unrelated reason cannot be allowed to supply the red. Asserting the ratio itself, per theme,
// rather than only the exit code, is what closes that hole.
const MEDIA_OVERRIDE = `\n@media (prefers-contrast: more) {\n  :root {\n    --ds-color-border-interactive: #292723;\n  }\n}\n`;
assertCase(
  'MEDIA: ค่าใน @media prefers-contrast ไม่ทับค่า base (ไม่งั้นรายงานเลขผิดโดยไม่มีใครรู้)',
  {
    light: css(FAIL_BOTH) + MEDIA_OVERRIDE,
    dark: css(FAIL_BOTH) + MEDIA_OVERRIDE,
  },
  ['color-border-interactive:color-surface-canvas'],
  // base pair is #f2efeb on itself = 1.000:1 in BOTH themes. If @media leaked in, both read
  // #292723 and report 13.006:1 — so assert the ratio, not just that something went red.
  (r, out) =>
    r.exitCode === 1 &&
    (out.match(/1\.000:1/g) ?? []).length === 2 &&
    !/13\.006:1/.test(out),
);

// ---------------------------------------------------------------------------
// CLI contract used by component-engineer.md (multiple pairs in one call, --ds- prefix tolerated).
// ---------------------------------------------------------------------------
assertCase(
  'CLI: หลายคู่ในคำสั่งเดียว — คู่ที่ fail คู่เดียวก็ต้องทำให้ทั้งคำสั่งแดง',
  {
    light: css({ ...PASS_BOTH, 'color-text-muted': '#f2efeb' }),
    dark: css({ ...PASS_BOTH, 'color-text-muted': '#292723' }),
  },
  ['color-border-interactive:color-surface-canvas', 'color-text-muted:color-surface-canvas'],
  (r) => r.exitCode === 1,
);

assertCase(
  'CLI: รับชื่อที่มี --ds- นำหน้าได้ (เอกสารเขียนทั้งสองแบบ)',
  { light: css(PASS_BOTH), dark: css(PASS_BOTH) },
  ['--ds-color-border-interactive:--ds-color-surface-canvas'],
  (r) => r.exitCode === 0,
);

assertCase(
  'CLI: ไม่ใส่ argument เลย → exit 1 พร้อม usage (ไม่ใช่เขียวเพราะไม่มีอะไรให้เช็ค)',
  { light: css(PASS_BOTH), dark: css(PASS_BOTH) },
  [],
  (r, out) => r.exitCode === 1 && /Usage:/.test(out),
);

assertCase(
  'CLI: pair ที่พิมพ์ผิดรูป (ไม่มี colon) ต้องแดง ไม่ใช่ข้ามเงียบ',
  { light: css(PASS_BOTH), dark: css(PASS_BOTH) },
  ['color-border-interactive'],
  (r, out) => r.exitCode !== 0 && /bad pair/.test(out),
);

console.log(`\n${total - failures}/${total} gate-proof cases passed`);
if (failures) {
  console.error(`✗ ${failures} gate-proof case(s) FAILED — contrast-check.mjs ไม่ผ่าน Gate Proof Rule ของตัวเอง`);
  process.exit(1);
}
console.log('✓ contrast-check.mjs ผ่าน Gate Proof Rule (mutate→confirm-red→revert แบบ automated)');
