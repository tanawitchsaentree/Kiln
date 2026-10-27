#!/usr/bin/env node
// Gate Proof for tooling/hooks/* — feeds each hook the same stdin JSON Claude Code sends and
// asserts the exit code. Every "must block" case is a real mutation that has to go red (exit 2);
// every "must allow" case proves the hook doesn't block legitimate work.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

const HOOKS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'hooks');
const run = (hook, payload) =>
  spawnSync(process.execPath, [path.join(HOOKS, hook)], { input: JSON.stringify(payload), encoding: 'utf8' });

const world = mkdtempSync(path.join(tmpdir(), 'kiln-hooks-'));
mkdirSync(path.join(world, 'system'));
const DEC = path.join(world, 'system', 'DECISIONS.md');
const HEAD = '# DECISIONS\n## Format\n### D-{nnn}: {หัวข้อ}\n---\n';
const entry = (n) =>
  `\n### D-${n}: x\n- **วันที่:** 2026-10-26 · **Phase:** 1\n- **เลือก:** a / **เพราะ:** b / **ตัวเลือกที่ตัดทิ้ง:** c / **กระทบ:** d\n`;
const base = HEAD + entry('001');
writeFileSync(DEC, base);

const css = path.join(world, 'Bad.module.css');
writeFileSync(css, '.a { color: #ff0000; }\n');
const okCss = path.join(world, 'Good.module.css');
writeFileSync(okCss, '.a { color: var(--ds-color-text); }\n');

const edit = (old_string, new_string) => ({ tool_name: 'Edit', cwd: world, tool_input: { file_path: DEC, old_string, new_string } });
const tail = entry('001');

const cases = [
  // guard-decisions — must block
  ['guard', 'blocks rewriting an old entry', edit('**เลือก:** a', '**เลือก:** z'), 2],
  ['guard', 'blocks inserting mid-file', edit('## Format', '## Format\nextra'), 2],
  ['guard', 'blocks a skipped number', edit(tail, tail + entry('003')), 2],
  ['guard', 'blocks an entry missing กระทบ', edit(tail, tail + entry('002').replace(' / **กระทบ:** d', '')), 2],
  ['guard', 'blocks Write that drops content', { tool_name: 'Write', cwd: world, tool_input: { file_path: DEC, content: HEAD } }, 2],
  // guard-decisions — must allow
  ['guard', 'allows a proper append via Edit', edit(tail, tail + entry('002')), 0],
  ['guard', 'allows a proper append via Write', { tool_name: 'Write', cwd: world, tool_input: { file_path: DEC, content: base + entry('002') } }, 0],
  ['guard', 'ignores other files', { tool_name: 'Edit', cwd: world, tool_input: { file_path: css, old_string: 'a', new_string: 'b' } }, 0],
  // post-edit-lint
  ['lint', 'blocks a raw hex', { tool_name: 'Edit', cwd: world, tool_input: { file_path: css } }, 2],
  ['lint', 'allows token-only css', { tool_name: 'Edit', cwd: world, tool_input: { file_path: okCss } }, 0],
  ['lint', 'ignores non-code files', { tool_name: 'Write', cwd: world, tool_input: { file_path: DEC } }, 0],
];

let fail = 0;
for (const [h, name, payload, want] of cases) {
  const r = run(h === 'guard' ? 'guard-decisions.mjs' : 'post-edit-lint.mjs', payload);
  const ok = r.status === want;
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${h}: ${name} (exit ${r.status}, want ${want})${ok ? '' : `\n   ${r.stderr.trim()}`}`);
}
if (fail) { console.error(`\n✗ ${fail} hook case(s) failed`); process.exit(1); }
console.log(`\n✓ ${cases.length}/${cases.length} hook cases`);
