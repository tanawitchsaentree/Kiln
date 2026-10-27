#!/usr/bin/env node
// Gate Proof Rule (ds-conventions/SKILL.md) applied to pack-verify.mjs.
//
// pack-verify is the last gate before npm: it runs in both packages' `prepublishOnly`, and it is
// the only thing standing between a broken `exports` map and a published package that throws
// ERR_MODULE_NOT_FOUND on `import 'dial-react'`. It was written after the dial-tokens exports bug
// and then only ever run against trees that pass — the state the Gate Proof Rule exists to reject:
// "กฎที่ไม่เคยเห็นตัวเองแดง = ยังไม่พิสูจน์ว่ามีอยู่จริง".
//
// Each case builds a tiny synthetic package in a temp dir and runs the REAL script with that dir as
// cwd (pack-verify reads ./package.json and packs cwd), so the mutations are on throwaway packages
// and packages/tokens + packages/react are never touched. `npm pack` + `npm install` run for real —
// no mocking, because the bug class this catches is precisely "the file is in the repo but not in
// the tarball", which only a real pack can see.
//
// This file is itself gate-proofed. pack-verify.mjs was mutated five ways and the suite went red
// for each, then reverted byte-identical (sha256 221e27c3…ea79). To repeat by hand, edit
// tooling/pack-verify.mjs, run this file, then restore the tool:
//   M1  `if (failures > 0)` -> `if (false)`              gate can never fail      → 2/14
//   M2  drop the `stat.size === 0` branch                empty build output passes → 13/14
//   M3  collectExports object branch -> `.import ?? .require ?? .default` only     → 10/14
//   M4  drop the `pathsToCheck.length === 0` guard       no entry points passes    → 13/14
//   M5  drop the `stat.isDirectory()` branch             a directory passes        → 13/14
// M1 dropping to 2/14 is the number that matters: only the two cases asserting green stayed green,
// so the other twelve are reading the exit code rather than passing by coincidence. M3 taking out
// four cases at once is why each condition (types/import/require) gets its own case instead of one
// combined fixture — a single fixture would have reported this as one failure and hidden the shape.
//
// ใช้: node tooling/pack-verify.selftest.mjs   (~9 วินาที — npm pack/install จริงทุกเคส ไม่ mock)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REAL_SCRIPT = fileURLToPath(new URL('./pack-verify.mjs', import.meta.url));

let failures = 0;
let total = 0;

// A fixture package: `pkg` is written as package.json, `files` is a map of relative path -> content
// ('' means a 0-byte file, null means "create as a directory instead of a file").
function makePackage({ pkg, files = {} }) {
  const root = mkdtempSync(join(tmpdir(), 'pack-verify-selftest-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify(pkg, null, 2));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    if (content === null) {
      mkdirSync(abs, { recursive: true });
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

function run(root) {
  const r = spawnSync('node', [REAL_SCRIPT], { cwd: root, encoding: 'utf8' });
  return { exitCode: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function assertCase(name, fixture, expect) {
  total++;
  const root = makePackage(fixture);
  try {
    const result = run(root);
    const ok = expect(result, result.out);
    if (!ok) {
      failures++;
      console.error(`✗ FAIL: ${name}`);
      console.error(`  exit=${result.exitCode}\n  output:\n${result.out.split('\n').map((l) => '    ' + l).join('\n')}`);
    } else {
      console.log(`✓ ${name}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const BASE = {
  name: 'pack-verify-fixture',
  version: '1.0.0',
  private: false,
  files: ['dist'],
};

// ---------------------------------------------------------------------------
// REVERT side first. Without a green case, every red below proves nothing: a script that always
// exits 1 would pass the whole mutation set.
// ---------------------------------------------------------------------------
assertCase(
  'REVERT: package ที่ทุก path มีจริง → เขียว (พิสูจน์ว่าไม่ได้แดงทุกกรณี)',
  {
    pkg: { ...BASE, main: './dist/index.cjs', types: './dist/index.d.ts', exports: { '.': './dist/index.cjs' } },
    files: { 'dist/index.cjs': 'module.exports = {};\n', 'dist/index.d.ts': 'export {};\n' },
  },
  (r, out) => r.exitCode === 0 && /all 3 declared entry point\(s\) resolve/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 1: the original bug, reproduced. dial-tokens' exports map named files the build never
// emitted. This is the case that justifies the script existing at all.
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: exports ชี้ไฟล์ที่ build ไม่เคยสร้าง (บั๊กเดิมของ tokens package ตัวแรก) → ต้องแดง',
  {
    pkg: { ...BASE, exports: { './css': './build/css/variables.css' } },
    files: { 'dist/index.cjs': 'module.exports = {};\n' },
  },
  (r, out) =>
    r.exitCode === 1 && /variables\.css does NOT exist/.test(out) && /1 broken path/.test(out),
);

assertCase(
  'MUTATE: main ชี้ไฟล์ที่ไม่มี → ต้องแดง (main ไม่ได้ถูกข้ามเพราะมี exports)',
  {
    pkg: { ...BASE, main: './dist/missing.cjs', exports: { '.': './dist/index.cjs' } },
    files: { 'dist/index.cjs': 'module.exports = {};\n' },
  },
  (r, out) => r.exitCode === 1 && /main -> \.\/dist\/missing\.cjs/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 2: the file is in the repo but NOT in the tarball, because `files` excludes it. This is
// the failure mode that only a real `npm pack` can see — existsSync on the source tree would call
// it fine. dial-react's `files` array carries three negations, so this is a live risk there.
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: ไฟล์มีอยู่จริงในโปรเจกต์ แต่ files[] ไม่รวมเข้า tarball → ต้องแดง (นี่คือเหตุผลที่ต้อง pack จริง)',
  {
    pkg: { ...BASE, files: ['dist'], main: './lib/index.cjs' },
    files: { 'dist/index.cjs': 'module.exports = {};\n', 'lib/index.cjs': 'module.exports = {};\n' },
  },
  (r, out) => r.exitCode === 1 && /lib\/index\.cjs does NOT exist/.test(out),
);

assertCase(
  'MUTATE: files[] ปฏิเสธไฟล์ด้วย negation pattern (แบบที่ react package ตัวแรกใช้จริง) → ต้องแดง',
  {
    pkg: { ...BASE, files: ['dist', '!dist/style.css'], exports: { './styles.css': './dist/style.css' } },
    files: { 'dist/index.cjs': 'module.exports = {};\n', 'dist/style.css': ':root { color: red; }\n' },
  },
  (r, out) => r.exitCode === 1 && /style\.css does NOT exist/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 3: the path resolves to something that is not a usable file. A build that ran and emitted
// nothing leaves a 0-byte file; a mis-specified exports entry can name a directory. Both import-fail
// for the consumer, and existsSync alone would have passed both.
// ---------------------------------------------------------------------------
assertCase(
  'MUTATE: ไฟล์มีจริงแต่ 0 ไบต์ (build รันแล้วไม่ได้เขียนอะไร) → ต้องแดง ไม่ใช่ผ่านเพราะ path มีอยู่',
  {
    pkg: { ...BASE, main: './dist/index.cjs' },
    files: { 'dist/index.cjs': '' },
  },
  (r, out) => r.exitCode === 1 && /is empty \(0 bytes\)/.test(out),
);

assertCase(
  'MUTATE: path ชี้ไปที่ directory ไม่ใช่ไฟล์ → ต้องแดง',
  {
    pkg: { ...BASE, main: './dist/index.cjs', exports: { '.': './dist' } },
    files: { 'dist/index.cjs': 'module.exports = {};\n' },
  },
  (r, out) => r.exitCode === 1 && /is a directory, not a file/.test(out),
);

// ---------------------------------------------------------------------------
// MUTATE 4: conditional exports. dial-react's "." has types + import + require, so a gate that
// checks one condition per subpath leaves two unchecked. Each condition gets its own case, with the
// other two pointing at real files, so nothing but the intended leaf can supply the red.
// ---------------------------------------------------------------------------
const REACT_SHAPED = {
  'dist/index.cjs': 'module.exports = {};\n',
  'dist/index.mjs': 'export {};\n',
  'dist/index.d.ts': 'export {};\n',
};
for (const condition of ['types', 'import', 'require']) {
  const exportsMap = {
    '.': { types: './dist/index.d.ts', import: './dist/index.mjs', require: './dist/index.cjs' },
  };
  exportsMap['.'][condition] = './dist/gone.js';
  assertCase(
    `MUTATE: conditional exports — เฉพาะ "${condition}" พัง อีกสองอันดี → ต้องแดง (ห้ามเช็คแค่ condition เดียวต่อ subpath)`,
    { pkg: { ...BASE, exports: exportsMap }, files: REACT_SHAPED },
    (r, out) => r.exitCode === 1 && /gone\.js does NOT exist/.test(out) && new RegExp(`\\.${condition}`).test(out),
  );
}

assertCase(
  'MUTATE: exports เป็น array ของ fallback — ตัวที่พังต้องถูกจับ',
  {
    pkg: { ...BASE, exports: { '.': ['./dist/gone.js', './dist/index.cjs'] } },
    files: REACT_SHAPED,
  },
  (r, out) => r.exitCode === 1 && /gone\.js does NOT exist/.test(out),
);

assertCase(
  'MUTATE: nested condition (exports["."].import.default) ต้องถูกไล่ลงไปถึงใบ',
  {
    pkg: { ...BASE, exports: { '.': { import: { default: './dist/gone.mjs' }, require: './dist/index.cjs' } } },
    files: REACT_SHAPED,
  },
  (r, out) => r.exitCode === 1 && /gone\.mjs does NOT exist/.test(out),
);

// ---------------------------------------------------------------------------
// A package with nothing to verify must not report success. "all 0 declared entry point(s) resolve"
// is the most dangerous green a gate can print, because it looks identical to a real pass.
// ---------------------------------------------------------------------------
assertCase(
  'GUARD: package ที่ไม่ประกาศ main/exports เลย → ต้องแดง ไม่ใช่ "all 0 paths resolve"',
  { pkg: { ...BASE }, files: { 'dist/index.cjs': 'module.exports = {};\n' } },
  (r, out) => r.exitCode === 1 && /nothing to verify/.test(out) && !/all 0 declared/.test(out),
);

// ---------------------------------------------------------------------------
// Multiple broken paths must all be reported in one run, not just the first. A gate that stops at
// the first failure turns one fix-and-rerun cycle into four.
// ---------------------------------------------------------------------------
assertCase(
  'หลาย path พังพร้อมกัน → รายงานทุกอันในรอบเดียว (ไม่ใช่หยุดที่อันแรก)',
  {
    pkg: {
      ...BASE,
      main: './dist/a.cjs',
      types: './dist/b.d.ts',
      exports: { '.': './dist/c.mjs' },
    },
    files: { 'dist/index.cjs': 'module.exports = {};\n' },
  },
  (r, out) => r.exitCode === 1 && /3 broken path/.test(out),
);

console.log(`\n${total - failures}/${total} gate-proof cases passed`);
if (failures) {
  console.error(`✗ ${failures} gate-proof case(s) FAILED — pack-verify.mjs ไม่ผ่าน Gate Proof Rule ของตัวเอง`);
  process.exit(1);
}
console.log('✓ pack-verify.mjs ผ่าน Gate Proof Rule (mutate→confirm-red→revert แบบ automated)');
