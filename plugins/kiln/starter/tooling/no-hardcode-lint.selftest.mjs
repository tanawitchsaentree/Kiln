#!/usr/bin/env node
// Gate Proof Rule (ds-conventions/SKILL.md) applied to no-hardcode-lint.mjs itself.
// แต่ละ case = mutate (fixture ที่ตั้งใจทำผิด) → confirm red (ต้อง exit code / output ที่คาด) →
// เก็บเป็น automated regression permanent (ไม่ใช่รันมือครั้งเดียวทิ้ง) ตามกฎที่ล็อกไว้ใน
// ds-conventions หลังจาก no-hardcode-lint มีรูสองรอบ (W1 sizing/physical-inset, w5-preflight
// logical-property regex) ที่เจอด้วยรีวิว+โชค ไม่ใช่ด้วยระบบตรวจตัวเอง — ไฟล์นี้คือระบบนั้น
//
// ใช้: node tooling/no-hardcode-lint.selftest.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LINT_PATH = fileURLToPath(new URL('./no-hardcode-lint.mjs', import.meta.url));

function runLint(filePath) {
  // ใช้ spawnSync ไม่ใช่ execFileSync — เจอเองตอนรัน self-test รอบแรกว่า execFileSync().stdout
  // (ตอน exit code = 0, ไม่ throw) คืนแค่ stdout string ตรงๆ ไม่มีทางเข้าถึง stderr ได้เลย (เป็น
  // ข้อจำกัดของ Node API เอง ไม่ใช่ config ผิด) แปลว่า console.warn() ของ lint tool (เขียนไป
  // stderr) หายไปจาก assertion ทุกครั้งที่ exit code เป็น 0 — เคสที่ควร "warn แต่ไม่ fail build"
  // จึงดู FAIL ทั้งที่ lint ทำงานถูกจริง (verify แล้วด้วยการรัน lint ตรงๆ ใน shell เทียบกับรันผ่าน
  // execFileSync แบบ isolate — เห็นผลต่างกันจริง) spawnSync คืน { stdout, stderr, status } ให้
  // ครบทั้งสอง stream ไม่ว่า exit code จะเป็นอะไร นี่คือตัวอย่างจริงของ Gate Proof Rule ที่ต้องใช้
  // กับตัว test harness เองด้วย ไม่ใช่แค่กับ lint rule ที่มันทดสอบ
  const result = spawnSync('node', [LINT_PATH, filePath], { encoding: 'utf8' });
  return { exitCode: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

const dir = mkdtempSync(join(tmpdir(), 'lint-selftest-'));
let failures = 0;
let total = 0;

function assertCase(name, filename, content, expect) {
  total++;
  const filePath = join(dir, filename);
  writeFileSync(filePath, content);
  const result = runLint(filePath);
  const combined = result.stdout + result.stderr;
  const ok = expect(result, combined);
  if (!ok) {
    failures++;
    console.error(`✗ FAIL: ${name}`);
    console.error(`  exit=${result.exitCode}\n  output:\n${combined.split('\n').map((l) => '    ' + l).join('\n')}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// ---------------------------------------------------------------------------
// v4 fix — logical-property raw values ที่หลุด regex v3 (ที่มาของ Gate Proof Rule นี้)
// ---------------------------------------------------------------------------
assertCase(
  'จับ padding-inline-start ค่าดิบได้ (v3 เคยพลาด)',
  'logical-padding.module.css',
  '.a {\n  padding-inline-start: 24px;\n}\n',
  (r) => r.exitCode === 1,
);

assertCase(
  'จับ border-inline-end-width ค่าดิบได้ (v3 เคยพลาด)',
  'logical-border.module.css',
  '.b {\n  border-inline-end-width: 5px;\n}\n',
  (r) => r.exitCode === 1,
);

assertCase(
  'จับ inset-block-end ค่าดิบได้ (v3 เคยพลาด)',
  'logical-inset.module.css',
  '.c {\n  inset-block-end: 10px;\n}\n',
  (r) => r.exitCode === 1,
);

assertCase(
  'ไม่ false-positive กับ var(--ds-*) ที่ใช้ logical property ถูกต้อง',
  'logical-clean.module.css',
  '.d {\n  padding-inline-start: var(--ds-space-300);\n  border-inline-end-width: var(--ds-border-width-hairline);\n  inset-block-end: var(--ds-space-100);\n}\n',
  (r) => r.exitCode === 0,
);

// ---------------------------------------------------------------------------
// v3 (A) — comment stripping ต้องไม่ false-positive จาก prose ใน docstring/comment
// ---------------------------------------------------------------------------
assertCase(
  'ไม่ false-positive จากคำว่า "width:"/"left:" ใน CSS block comment',
  'comment-css.module.css',
  '/**\n * เอกสาร: อธิบายว่า width: 999px และ left: 10px เคยเป็นปัญหา (ข้อความล้วน ไม่ใช่โค้ด)\n */\n.e {\n  inline-size: var(--ds-size-icon-md);\n}\n',
  (r) => r.exitCode === 0,
);

assertCase(
  'ไม่ false-positive จาก JSDoc ที่มีคำว่า "padding:" ใน .tsx',
  'comment-tsx.tsx',
  '/**\n * คำอธิบาย: อ้าง padding: 16px ในเอกสารเฉยๆ ไม่ใช่โค้ดจริง\n */\nexport const X = () => null;\n',
  (r) => r.exitCode === 0,
);

assertCase(
  'ยังจับค่าดิบจริงได้แม้ไฟล์มี comment ปนอยู่ (comment-strip ไม่กลืนโค้ดจริงไปด้วย)',
  'comment-plus-real.module.css',
  '/* comment เฉยๆ พูดถึง width: 10px */\n.f {\n  padding-inline-start: 12px;\n}\n',
  (r) => r.exitCode === 1,
);

// ---------------------------------------------------------------------------
// v3 (B) — background-only visual indicator (warning, ไม่ fail build)
// ---------------------------------------------------------------------------
assertCase(
  'เตือน background-color-only indicator ที่ไม่มี border ในบล็อกเดียวกัน',
  'bg-only.module.css',
  '.thumb {\n  background-color: #000000ff;\n}\n',
  (r, combined) => r.exitCode === 1 && /background-only visual indicator/.test(combined),
  // หมายเหตุ: exit 1 มาจาก hex ดิบ (#000000ff) ที่เป็นกฎ error อยู่แล้ว ไม่ใช่จาก warning เอง —
  // ใช้ var() แทนเพื่อแยกให้เห็นว่า warning ทำงานเดี่ยวๆ ได้โดยไม่ fail build (case ถัดไป)
);

assertCase(
  'background-only indicator ที่ใช้ var() (ไม่ผิด hardcode) ยัง warn แต่ไม่ fail build',
  'bg-only-token.module.css',
  '.dot {\n  background-color: var(--ds-color-danger-500);\n}\n',
  (r, combined) => r.exitCode === 0 && /background-only visual indicator/.test(combined),
);

assertCase(
  'ไม่ warn ถ้ามี border จริงในบล็อกเดียวกัน (false positive guard)',
  'bg-with-border.module.css',
  '.track {\n  background-color: var(--ds-color-neutral-100);\n  border-width: var(--ds-border-width-hairline);\n  border-style: solid;\n}\n',
  (r, combined) => r.exitCode === 0 && !/background-only visual indicator/.test(combined),
);

assertCase(
  'ไม่ warn ถ้า selector ไม่มี indicator keyword เลย (scope ต้องแคบ)',
  'bg-no-keyword.module.css',
  '.panel {\n  background-color: var(--ds-color-surface-raised);\n}\n',
  (r, combined) => r.exitCode === 0 && !/background-only visual indicator/.test(combined),
);

assertCase(
  'no-hardcode-ok suppress background-only warning ได้ทีละจุด (inline บนบรรทัดเดียวกัน)',
  'bg-suppressed.module.css',
  '.thumb {\n  background-color: var(--ds-color-danger-500); /* no-hardcode-ok: proof of suppression mechanism */\n}\n',
  (r, combined) => r.exitCode === 0 && !/background-only visual indicator/.test(combined),
);

assertCase('จับ opacity ดิบ', 'op.module.css', '.root:disabled {\n  opacity: 0.5;\n}\n', (r) => r.exitCode === 1);
assertCase('opacity จาก token ผ่าน', 'op-ok.module.css', '.root:disabled {\n  opacity: var(--ds-opacity-disabled);\n}\n', (r) => r.exitCode === 0);
assertCase('จับ scale() ดิบ', 'sc.module.css', '.thumb:active {\n  transform: scale(1.08);\n}\n', (r) => r.exitCode === 1);
assertCase('scale() จาก token ผ่าน', 'sc-ok.module.css', '.thumb:active {\n  transform: scale(var(--ds-scale-press));\n}\n', (r) => r.exitCode === 0);

rmSync(dir, { recursive: true, force: true });

console.log(`\n${total - failures}/${total} gate-proof cases passed`);
if (failures) {
  console.error(`✗ ${failures} gate-proof case(s) FAILED — no-hardcode-lint.mjs ไม่ผ่าน Gate Proof Rule ของตัวเอง`);
  process.exit(1);
}
console.log('✓ no-hardcode-lint.mjs ผ่าน Gate Proof Rule ครบทุก rule ที่มี (mutate→confirm-red→revert แบบ automated)');
