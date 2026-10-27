#!/usr/bin/env node
// Gate Proof Rule (ds-conventions/SKILL.md) applied to generate-barrel.mjs --check.
//
// `barrel:check` is wired into the react package's prepublishOnly, so it is the thing standing between a
// stale index.ts and a published package that silently omits a component. It had never been seen
// red: it was written, run once against an already-correct tree, and shipped. Same state v3's
// logical-property regex was in.
//
// The mutations automated here are the three ways the barrel and the manifest can diverge:
//   1. index.ts edited by hand (the exact thing the manifest was introduced to stop)
//   2. manifest gains a component but index.ts is not regenerated (a batch forgetting the last step)
//   3. manifest names a component whose directory has no index.ts (typo / renamed folder)
// Each mutates a COPY of the real tree in a temp dir — the real packages/react is never touched,
// so a crashed run cannot leave the repo dirty.
//
// This file is itself gate-proofed, since a selftest that cannot fail is the same unproven thing
// it was written to replace. generate-barrel.mjs was mutated four ways and the suite went red for
// each, then reverted byte-identical (sha256 b256a4b2…52c0). To repeat by hand, edit
// tooling/generate-barrel.mjs, run this file, then `git checkout` the tool:
//   M1  `if (current !== output)` -> `if (false)`         gate can never fail   → 2/10
//   M2  compare `s.split('\n').sort().join('\n')`         order stops mattering → 9/10
//   M3  barrelLine's `throw` -> `return ''`               missing dir skipped   → 9/10
//   M4  add `writeFileSync(OUTPUT_PATH, output)` in --check   gate repairs      → 9/10
// M1 dropping to 2/10 is the useful number: only the two cases that assert green stayed green,
// which is what proves the other eight are reading the exit code and not passing by accident.
//
// ใช้: node tooling/generate-barrel.selftest.mjs
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLING_DIR = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(TOOLING_DIR, '..');
// A self-contained fixture tree (tooling/__fixtures__/barrel), not the system's real packages/react —
// the engine ships with no system, and a gate-proof that needs one can't run on a blank kiln.
const FIXTURE_REACT = join(TOOLING_DIR, '__fixtures__', 'barrel', 'packages', 'react');
const REAL_REACT_SRC = join(FIXTURE_REACT, 'src');

let failures = 0;
let total = 0;

// The script derives REACT_SRC from its own location, so a fixture world needs the same shape:
// <root>/tooling/generate-barrel.mjs + <root>/packages/react/src/{index.ts,barrel.manifest.mjs,components/}
// Only index.ts, barrel.manifest.mjs and each component's index.ts matter, so copy just those —
// copying all of src/ would pull in every .tsx/.css/.test file for no benefit.
function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), 'barrel-selftest-'));
  const toolingDir = join(root, 'tooling');
  const srcDir = join(root, 'packages', 'react', 'src');
  mkdirSync(toolingDir, { recursive: true });
  mkdirSync(join(srcDir, 'components'), { recursive: true });
  cpSync(join(TOOLING_DIR, 'generate-barrel.mjs'), join(toolingDir, 'generate-barrel.mjs'));
  cpSync(join(FIXTURE_REACT, 'package.json'), join(root, 'packages', 'react', 'package.json'));
  cpSync(join(REAL_REACT_SRC, 'index.ts'), join(srcDir, 'index.ts'));
  cpSync(join(REAL_REACT_SRC, 'barrel.manifest.mjs'), join(srcDir, 'barrel.manifest.mjs'));
  // every component directory's own index.ts (the files barrelLine() checks for existence)
  const componentsRoot = join(REAL_REACT_SRC, 'components');
  let copied = 0;
  for (const entry of readdirSync(componentsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const from = join(componentsRoot, entry.name, 'index.ts');
    if (!existsSync(from)) continue;
    mkdirSync(join(srcDir, 'components', entry.name), { recursive: true });
    cpSync(from, join(srcDir, 'components', entry.name, 'index.ts'));
    copied++;
  }
  // Fail loudly rather than silently building an empty world: with no component index.ts files,
  // barrelLine() throws on the first name in the manifest and EVERY case below goes red for that
  // reason instead of the one it is testing — a green-looking mutation suite that proves nothing.
  // (This is exactly how the first draft of this file behaved: readdirSafe() swallowed a `require`
  // that does not exist in ESM and returned [], and 8 of 10 cases failed identically.)
  if (copied === 0) {
    throw new Error(`makeWorld copied no component index.ts from ${componentsRoot}`);
  }
  return { root, script: join(toolingDir, 'generate-barrel.mjs'), srcDir };
}

function runCheck(world) {
  const r = spawnSync('node', [world.script, '--check'], { encoding: 'utf8' });
  return { exitCode: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function runWrite(world) {
  const r = spawnSync('node', [world.script], { encoding: 'utf8' });
  return { exitCode: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function assertCase(name, mutate, expect) {
  total++;
  const world = makeWorld();
  try {
    mutate(world);
    const result = runCheck(world);
    const ok = expect(result, result.out, world);
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

// ---------------------------------------------------------------------------
// REVERT side first: an untouched copy of the real tree must be green. Without this, every "red"
// below proves nothing — a --check that always exits 1 would pass all the mutation cases.
// ---------------------------------------------------------------------------
assertCase(
  'REVERT: tree ที่ไม่ได้แก้อะไร → เขียว (พิสูจน์ว่าไม่ได้แดงทุกกรณี)',
  () => {},
  (r, out) => r.exitCode === 0 && /up to date/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 1: index.ts hand-edited. This is the precise failure the manifest exists to prevent, and
// the only one a human is likely to cause (an agent appending its own export line mid-batch).
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: index.ts ถูกแก้มือ (เพิ่ม export เอง) → ต้องแดง',
  (w) => {
    const p = join(w.srcDir, 'index.ts');
    writeFileSync(p, readFileSync(p, 'utf8') + "\nexport * from './components/HandEdited';\n");
  },
  (r, out) => r.exitCode === 1 && /stale/.test(out),
);

assertCase(
  'MUTATE: index.ts ถูกลบ export ออกหนึ่งบรรทัด → ต้องแดง (ของหายก็ต้องจับได้ ไม่ใช่แค่ของเกิน)',
  (w) => {
    const p = join(w.srcDir, 'index.ts');
    const lines = readFileSync(p, 'utf8').split('\n');
    const i = lines.findIndex((l) => l.startsWith("export * from './components/"));
    lines.splice(i, 1);
    writeFileSync(p, lines.join('\n'));
  },
  (r, out) => r.exitCode === 1 && /stale/.test(out),
);

assertCase(
  'MUTATE: สลับลำดับ export สองบรรทัด → ต้องแดง (ลำดับใน manifest คือ contract ไม่ใช่รสนิยม)',
  (w) => {
    const p = join(w.srcDir, 'index.ts');
    const lines = readFileSync(p, 'utf8').split('\n');
    const idx = lines.reduce((acc, l, i) => (l.startsWith("export * from './components/") ? [...acc, i] : acc), []);
    const [a, b] = [idx[0], idx[1]];
    [lines[a], lines[b]] = [lines[b], lines[a]];
    writeFileSync(p, lines.join('\n'));
  },
  (r, out) => r.exitCode === 1 && /stale/.test(out),
);

assertCase(
  'MUTATE: แก้แค่ comment header ใน index.ts → ต้องแดง (generated file ห้ามต่างจาก generator แม้บรรทัดเดียว)',
  (w) => {
    const p = join(w.srcDir, 'index.ts');
    writeFileSync(p, readFileSync(p, 'utf8').replace('// fixture-react — public entry point.', '// fixture-react entry'));
  },
  (r, out) => r.exitCode === 1 && /stale/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 2: manifest moves, index.ts does not. This is the batch-forgot-the-last-step case, and
// the reason --check is in prepublishOnly rather than only in CI.
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: manifest เพิ่ม component แต่ไม่ regenerate → ต้องแดง',
  (w) => {
    // a real directory with a real index.ts, so the generator gets past its existence check and
    // the ONLY difference is that index.ts was never regenerated
    const dir = join(w.srcDir, 'components', 'ZzTestOnly');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.ts'), 'export const ZzTestOnly = null;\n');
    const p = join(w.srcDir, 'barrel.manifest.mjs');
    const s = readFileSync(p, 'utf8');
    writeFileSync(
      p,
      s.replace(/\]\s*;?\s*$/, `  { components: ['ZzTestOnly'] },\n];\n`),
    );
  },
  (r, out) => r.exitCode === 1 && /stale/.test(out),
);

assertCase(
  'MUTATE: manifest ลบ component ออกแต่ index.ts ยัง export อยู่ → ต้องแดง',
  (w) => {
    // Drop the last name of Wave 1 from the list. The component's directory and index.ts stay in
    // place, so the generator raises no existence error — the only difference is one missing
    // `export *` line, which is the whole point: a component silently dropped from the public API
    // is worse than one that fails to build.
    const p = join(w.srcDir, 'barrel.manifest.mjs');
    const s = readFileSync(p, 'utf8');
    const mutated = s.replace(", 'VisuallyHidden']", ']');
    if (mutated === s) throw new Error("fixture assumption broken: no \", 'VisuallyHidden']\" in barrel.manifest.mjs");
    writeFileSync(p, mutated);
  },
  (r, out) => r.exitCode === 1 && /stale/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 3: manifest points at a directory that has no index.ts. The generator throws rather than
// writing a barrel that imports nothing — worth pinning, since "throws with the name in the
// message" is the difference between a five-second fix and a confusing build failure.
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: manifest ชี้ component ที่ไม่มี index.ts → ต้องแดงพร้อมชื่อ component',
  (w) => {
    const p = join(w.srcDir, 'barrel.manifest.mjs');
    const s = readFileSync(p, 'utf8');
    writeFileSync(p, s.replace("components: ['Box'", "components: ['NoSuchComponent', 'Box'"));
  },
  (r, out) => r.exitCode !== 0 && /NoSuchComponent/.test(out) && /doesn't exist/.test(out),
);

// ---------------------------------------------------------------------------
// --check must not write. If it "fixed" the file it would report success on the next run and a
// stale barrel would reach npm — the exact outcome the gate exists to prevent.
// ---------------------------------------------------------------------------
assertCase(
  '--check ห้ามเขียนไฟล์ (ถ้ามันแก้ให้เอง รอบหน้าจะเขียวโดยที่ barrel ยัง stale)',
  (w) => {
    const p = join(w.srcDir, 'index.ts');
    writeFileSync(p, readFileSync(p, 'utf8') + '\n// hand edit\n');
    w.before = readFileSync(p, 'utf8');
  },
  (r, out, w) => r.exitCode === 1 && readFileSync(join(w.srcDir, 'index.ts'), 'utf8') === w.before,
);

// ---------------------------------------------------------------------------
// The generator's write mode has to actually repair what --check rejects, otherwise the error
// message ("run `node tooling/generate-barrel.mjs`") sends the reader nowhere.
// ---------------------------------------------------------------------------
total++;
{
  const world = makeWorld();
  try {
    const p = join(world.srcDir, 'index.ts');
    writeFileSync(p, readFileSync(p, 'utf8') + '\n// hand edit\n');
    const red = runCheck(world);
    const write = runWrite(world);
    const green = runCheck(world);
    const ok = red.exitCode === 1 && write.exitCode === 0 && green.exitCode === 0;
    if (!ok) {
      failures++;
      console.error('✗ FAIL: รัน generator ตามที่ error message บอก แล้วต้องเขียวจริง');
      console.error(`  red=${red.exitCode} write=${write.exitCode} green=${green.exitCode}`);
    } else {
      console.log('✓ รัน generator ตามที่ error message บอก แล้วเขียวจริง (คำแนะนำใน error ใช้ได้จริง)');
    }
  } finally {
    rmSync(world.root, { recursive: true, force: true });
  }
}

console.log(`\n${total - failures}/${total} gate-proof cases passed`);
if (failures) {
  console.error(`✗ ${failures} gate-proof case(s) FAILED — generate-barrel.mjs --check ไม่ผ่าน Gate Proof Rule ของตัวเอง`);
  process.exit(1);
}
console.log('✓ generate-barrel.mjs --check ผ่าน Gate Proof Rule (mutate→confirm-red→revert แบบ automated)');
