#!/usr/bin/env node
// PreToolUse hook (Edit|Write|MultiEdit) — mechanical half of skill lock-decision.
// system/DECISIONS.md is long-term memory: append-only, one fixed entry format, D-numbers in
// sequence. Superseding an old decision = a new entry that says so, never an edit of the old one.
// Anything else exits 2 (blocks the tool call, reason goes back to the agent on stderr).
// Whether the user actually confirmed the decision is not machine-checkable — that stays with
// lock-decision step 1.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const FIELDS = ['วันที่', 'Phase', 'เลือก', 'เพราะ', 'ตัวเลือกที่ตัดทิ้ง', 'กระทบ'];
const HEADER = /^### D-(\d{3}):/gm;

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}
const ti = input?.tool_input ?? {};
const file = ti.file_path;
if (!file) process.exit(0);
const abs = path.resolve(input.cwd || process.cwd(), file);
if (!abs.endsWith(path.join('system', 'DECISIONS.md'))) process.exit(0);

const block = (msg) => {
  process.stderr.write(`DECISIONS.md guard: ${msg}\nเขียนผ่าน skill lock-decision เท่านั้น — append-only, format ตามหัวไฟล์\n`);
  process.exit(2);
};

const current = existsSync(abs) ? readFileSync(abs, 'utf8') : '';

// Work out the text being appended; anything that isn't a pure append is blocked.
let appended;
if (input.tool_name === 'Write') {
  if (current && !ti.content.startsWith(current.trimEnd())) block('Write นี้แก้/ลบเนื้อหาเดิม (อนุญาตแค่เพิ่มต่อท้าย)');
  appended = ti.content.slice(current.trimEnd().length);
} else {
  const edits = input.tool_name === 'MultiEdit' ? ti.edits ?? [] : [ti];
  appended = '';
  for (const e of edits) {
    const oldS = e.old_string ?? '';
    const newS = e.new_string ?? '';
    if (!newS.startsWith(oldS)) block('Edit นี้แก้/ลบข้อความเดิม (new_string ต้องขึ้นต้นด้วย old_string ทั้งก้อน)');
    if (!current.trimEnd().endsWith(oldS.trimEnd())) block('Edit นี้แทรกกลางไฟล์ (อนุญาตแค่เพิ่มต่อท้ายไฟล์)');
    appended += newS.slice(oldS.length);
  }
}

const existingNums = [...current.matchAll(HEADER)].map((m) => Number(m[1]));
let next = (existingNums.length ? Math.max(...existingNums) : 0) + 1;

const heads = [...appended.matchAll(HEADER)];
for (let i = 0; i < heads.length; i++) {
  const n = Number(heads[i][1]);
  if (n !== next) block(`เลขไม่ต่อเนื่อง: ได้ D-${heads[i][1]} แต่ต้องเป็น D-${String(next).padStart(3, '0')}`);
  const body = appended.slice(heads[i].index, heads[i + 1]?.index ?? appended.length);
  const missing = FIELDS.filter((f) => !body.includes(`**${f}:**`));
  if (missing.length) block(`D-${heads[i][1]} ขาดช่อง: ${missing.join(', ')}`);
  next++;
}
process.exit(0);
