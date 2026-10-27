#!/usr/bin/env node
// no-hardcode-lint v4 — v2 ปิดช่องโหว่ sizing + physical inset + inline style
// v3 เพิ่ม: (A) strip comments ก่อนสแกน กัน false positive จาก error message/JSDoc ที่มีคำว่า
//           "width:" หรือ "left:" ฯลฯ อยู่ใน prose (ไม่ใช่ CSS จริง)
//         (B) rule ตรวจจับ "background-color-only visual indicator" (ไม่มี border จริง) —
//           รันเป็น warning เท่านั้น (ไม่ increment n / ไม่ exit 1) เพราะ scope เป็น heuristic
//           กว้างเกินกว่าจะ enforce เป็น hard error ได้อย่างมั่นใจ 100%
// v4 แก้บั๊กจริงที่ code review เจอ: property-name list ของ v3 มีแค่ bare name ("margin",
//   "inset", "border-width") — "padding-inline-start:", "border-inline-end-width:",
//   "inset-block-end:" ไม่ match เพราะหลังคำ base ไม่ใช่ ":" ทันที เป็น "-inline-start:" —
//   เนื่องจากกฎเหล็กของระบบบังคับ logical properties เท่านั้น (ห้าม physical) แปลว่า raw-value
//   ส่วนใหญ่ในโค้ดจริงเขียนเป็น logical form ซึ่งหลุด regex เดิมไปเงียบๆ ทั้งหมด — เพิ่ม
//   LOGICAL_SUFFIXES ให้ margin/padding/inset ครบทุก edge + border-{edge}-{width|style|color}
//   (verified: `padding-inline-start: 24px` เคยผ่าน "✓ clean" ตอนนี้ถูกจับแล้ว, สแกนทั้งระบบ
//   197 ไฟล์ไม่มี false positive ใหม่จากการแก้นี้ — โค้ดจริงทุกตัวใช้ var(--ds-*) อยู่แล้ว)
// ใช้: node tooling/no-hardcode-lint.mjs [files...]
// ⚠ Gate Proof Rule (ds-conventions/SKILL.md): ถ้าแก้ RULES/regex/heuristic ใดในไฟล์นี้ ต้องเพิ่ม
//   case ใน tooling/no-hardcode-lint.selftest.mjs ที่ mutate ให้ผิดจริงแล้ว confirm ว่าแดง ก่อน
//   ถือว่าใช้งานได้ — รัน `node tooling/no-hardcode-lint.selftest.mjs` ให้ผ่านทุกครั้งที่แก้ไฟล์นี้
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const TARGETS = ['packages/react/src', 'packages/styles', 'packages/tokens/preview'];
const EXT = new Set(['.tsx', '.ts', '.css', '.scss']);

const SIZING = 'width|height|min-width|max-width|min-height|max-height|block-size|inline-size|min-inline-size|max-inline-size|min-block-size|max-block-size';

// เดิม (v3) มีแค่ base name เฉยๆ ("margin", "inset") — "padding-inline-start:" ไม่ match เพราะ
// หลังคำว่า "padding" ไม่ใช่ ":" ทันที (เป็น "-inline-start:") กฎเหล็กของระบบนี้บังคับ logical
// properties เท่านั้น (CLAUDE.md) แปลว่า raw-value ส่วนใหญ่ในโค้ดจริงจะเขียนเป็น -inline-start/-end/
// -block-start/-end ซึ่งหลุด regex เดิมไปเงียบๆ ทั้งหมด — ต้อง generate suffix variant ให้ครบ
const LOGICAL_SUFFIXES = ['', '-inline', '-block', '-inline-start', '-inline-end', '-block-start', '-block-end'];
const SPACING_LOGICAL_BASE = ['margin', 'padding', 'inset'];
const SPACING = [
  ...SPACING_LOGICAL_BASE.flatMap((p) => LOGICAL_SUFFIXES.map((s) => `${p}${s}`)),
  'gap', 'row-gap', 'column-gap', 'top', 'left', 'right', 'bottom',
].join('|');

// border-*-width/-style/-color แบบ logical (border-inline-end-width ฯลฯ) ไม่มีทางแมทช์กับ
// "border-width" bare เดิมได้เลยด้วยเหตุผลเดียวกัน — เพิ่มให้ครบ 4 edge × 3 sub-property
const BORDER_LOGICAL_EDGES = ['-inline-start', '-inline-end', '-block-start', '-block-end'];
const BORDER_LOGICAL = BORDER_LOGICAL_EDGES.flatMap((edge) =>
  ['width', 'style', 'color'].map((sub) => `border${edge}-${sub}`),
);
const OTHER = [
  'font-size', 'line-height', 'border-radius', 'border-width', 'letter-spacing', 'flex-basis',
  ...BORDER_LOGICAL,
].join('|');

const RULES = [
  { re: /#[0-9a-fA-F]{3,8}\b/g, msg: 'hex color ดิบ → var(--ds-*)' },
  { re: /\b(rgb|rgba|hsl|hsla|oklch|lab|lch)\(\s*[\d.]/g, msg: 'color function ดิบ → var(--ds-*)' },
  { re: new RegExp(`(?<![-\\w])(${SIZING}|${SPACING}|${OTHER})\\s*:\\s*(?!0\\b|auto|100%|inherit|initial|unset|var\\()[^;{}]*?[\\d.]+(px|rem|em)`, 'g'),
    msg: 'ค่าขนาด/ระยะดิบ → var(--ds-*)' },
  // Pane: opacity: 0.5 on disabled and scale(1.08) on a slider thumb slipped through, because only lengths were checked
  { re: /(?<![-\w])opacity\s*:\s*(?!var\()(0?\.\d+|0\.\d*|[1-9]\d*%)/g, msg: 'opacity ดิบ → var(--ds-opacity-*)' },
  { re: /\bscale[XYZ3d]*\(\s*(?!var\()\d*\.?\d+(?!\s*\))?/g, msg: 'scale() ดิบ → var(--ds-scale-*)' },
  { re: /\b(margin|padding|border)-(left|right)\b/g, msg: 'physical property → logical (-inline-start/-inline-end)' },
  { re: /(?<![-\w])(width|min-width|max-width|height|min-height|max-height)\s*:/g, msg: 'physical sizing → logical (inline-size/block-size)' },
  { re: /(?<![-\w])(left|right)\s*:/g, msg: 'physical inset → inset-inline-start/end' },
  { re: /\btext-align\s*:\s*(left|right)\b/g, msg: 'text-align physical → start/end' },
  { re: /style=\{\{[^}]*(background|color|padding|margin|width|height|boxShadow|borderRadius)/g, msg: 'inline style ที่มีค่าดีไซน์ → CSS Module' },
];
const SKIP_FILE = /(stories\.|test\.|spec\.|\.d\.ts|node_modules)/;

// ---------------------------------------------------------------------------
// งาน A — strip comments ก่อนสแกน โดยคง line number/ตำแหน่งเดิมเป๊ะ
// (แทนที่เนื้อใน comment ด้วย space ตัวต่อตัว ยกเว้น \n ที่คงไว้ เพื่อไม่ให้เลข
// บรรทัดขยับ และไม่ให้ column offset ของ match อื่นในบรรทัดเดียวกันเพี้ยนด้วย)
// ---------------------------------------------------------------------------
function blankOutRange(content, start, end) {
  // แทนที่ content[start..end) ด้วย space (คง \n ไว้)
  const chars = content.slice(start, end);
  let blanked = '';
  for (const ch of chars) blanked += ch === '\n' ? '\n' : ' ';
  return content.slice(0, start) + blanked + content.slice(end);
}

function blankBlockComments(content) {
  // /* ... */ (รวม multi-line และ JSDoc) — ใช้ regex หาตำแหน่งแล้ว blank ทีละ match
  // ทำแบบ loop ทีละ match (ไม่ใช้ replace ตรงๆ) เพื่อคุมความยาว/ตำแหน่งให้แม่นยำ
  const re = /\/\*[\s\S]*?\*\//g;
  let result = content;
  let match;
  re.lastIndex = 0;
  while ((match = re.exec(result))) {
    result = blankOutRange(result, match.index, match.index + match[0].length);
    re.lastIndex = match.index + match[0].length;
  }
  return result;
}

// heuristic สำหรับ // ใน TS/TSX: ต้องไม่ลบ // ที่อยู่ใน string literal
// (เช่น "https://example.com") — เช็คว่าจำนวน quote ที่ไม่ escaped ก่อนหน้า //
// ในบรรทัดนั้นเป็นเลขคู่ (ไม่อยู่ใน string) หรือคี่ (อยู่ใน string)
function blankLineComments(content) {
  const lines = content.split('\n');
  const out = lines.map((line) => {
    let quoteCount = 0;
    let inQuoteChar = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const prev = line[i - 1];
      if ((ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
        if (inQuoteChar === null) {
          inQuoteChar = ch;
          quoteCount++;
        } else if (inQuoteChar === ch) {
          inQuoteChar = null;
          quoteCount++;
        }
      } else if (ch === '/' && line[i + 1] === '/') {
        // เลขคู่ของ quote ที่เจอมาแล้ว = ไม่ได้อยู่ใน string ตอนนี้ (inQuoteChar === null)
        if (inQuoteChar === null) {
          // เจอ // นอก string → blank ตั้งแต่ตำแหน่งนี้ถึงจบบรรทัด
          return line.slice(0, i) + ' '.repeat(line.length - i);
        }
      }
    }
    return line;
  });
  return out.join('\n');
}

function stripComments(content, ext) {
  if (ext === '.css' || ext === '.scss') {
    return blankBlockComments(content);
  }
  if (ext === '.ts' || ext === '.tsx') {
    // ลำดับ: block comments (รวม JSDoc multi-line) ก่อน แล้วค่อย single-line //
    // (ทำ block ก่อนเพราะ /* ... */ อาจครอบหลายบรรทัดและมี // อยู่ข้างในโดยไม่ตั้งใจ)
    const noBlocks = blankBlockComments(content);
    return blankLineComments(noBlocks);
  }
  return content;
}

// ---------------------------------------------------------------------------
// งาน B — background-color-only visual indicator (ไม่มี border จริง)
// Heuristic กว้างๆ: selector ที่มีคำ indicator/thumb/dot/mark/track/line/check/dash
// (case-insensitive) + background(-color) ที่ resolve เป็นค่าจริง (ไม่ใช่ transparent/none/inherit)
// + ไม่มี border-*(-style/-width/-color) ที่ active (ไม่ใช่ 0/none) ใน block เดียวกัน
// รันเป็น warning เท่านั้น (ไม่ increment n / ไม่ exit 1) — ดูหมายเหตุ scope ท้ายไฟล์
// ---------------------------------------------------------------------------
// \b กัน substring match มั่ว เช่น "line" ใน "outline" (Button variant ไม่เกี่ยวกับ indicator เลย)
const INDICATOR_KEYWORDS = /\b(indicator|thumb|dot|mark|track|line|check|dash)\b/i;
const BLOCK_RE = /([^{}]+)\{([^}]*)\}/g;

function lineOfIndex(content, index) {
  // นับ \n ก่อน index เพื่อได้เลขบรรทัด (1-based)
  let line = 1;
  for (let i = 0; i < index; i++) if (content[i] === '\n') line++;
  return line;
}

function checkBgOnlyIndicator(file, content) {
  const warnings = [];
  BLOCK_RE.lastIndex = 0;
  let m;
  while ((m = BLOCK_RE.exec(content))) {
    const selector = m[1].trim();
    const body = m[2];
    const bodyStart = m.index + m[1].length + 1; // ตำแหน่ง '{' + 1 = ต้น body

    if (!selector || selector.startsWith('@')) continue; // ข้าม @media/@keyframes ฯลฯ (selector อยู่ชั้นนอก)
    if (!INDICATOR_KEYWORDS.test(selector)) continue;

    // หา background-color/background ที่มีค่าไม่ใช่ transparent/none/inherit
    const bgRe = /\bbackground(?:-color)?\s*:\s*([^;]+);/g;
    let bgMatch;
    let bgHit = null;
    while ((bgMatch = bgRe.exec(body))) {
      const val = bgMatch[1].trim();
      if (/^(transparent|none|inherit)\b/.test(val)) continue;
      bgHit = bgMatch;
      break; // ใช้ตัวแรกที่ resolve เป็นค่าจริง
    }
    if (!bgHit) continue;

    // เช็คว่ามี border ที่ active ใน block เดียวกันหรือไม่
    const borderRe = /\bborder(?:-color|-style|-width)?\s*:\s*([^;]+);/g;
    let hasActiveBorder = false;
    let borderMatch;
    while ((borderMatch = borderRe.exec(body))) {
      const val = borderMatch[1].trim();
      if (/^(none|0\b)/.test(val)) continue;
      hasActiveBorder = true;
      break;
    }
    if (hasActiveBorder) continue;

    const absoluteBgIndex = bodyStart + bgHit.index;
    const lineNo = lineOfIndex(content, absoluteBgIndex);
    const lineText = content.split('\n')[lineNo - 1]?.trim() ?? '';
    warnings.push({ file, line: lineNo, selector, text: lineText });
  }
  return warnings;
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, acc) : EXT.has(extname(p)) && acc.push(p);
  }
  return acc;
}

const argv = process.argv.slice(2).filter(f => EXT.has(extname(f)) && existsSync(f));
const files = argv.length ? argv : TARGETS.flatMap(t => walk(t));
let n = 0;
let warnCount = 0;
for (const file of files) {
  if (SKIP_FILE.test(file)) continue;
  const raw = readFileSync(file, 'utf8');
  const ext = extname(file);
  const clean = stripComments(raw, ext);
  const rawLines = raw.split('\n');

  clean.split('\n').forEach((line, i) => {
    // เช็ค no-hardcode-ok marker จากบรรทัดดิบเสมอ (ไม่ใช่บรรทัดที่ strip comment แล้ว)
    // เพราะ marker เองอยู่ใน comment — ถ้าเช็คจาก `line` (stripped) จะหา marker ไม่เจอ
    if (/no-hardcode-ok/.test(rawLines[i] ?? '')) return;
    for (const { re, msg } of RULES) {
      re.lastIndex = 0;
      if (re.test(line)) { console.error(`${file}:${i + 1}  ${msg}\n    ${(rawLines[i] ?? line).trim()}`); n++; }
    }
  });

  // งาน B — เฉพาะไฟล์ CSS/SCSS เท่านั้น (background-only indicator เป็นแนวคิดของ CSS rule block)
  if (ext === '.css' || ext === '.scss') {
    const bgWarnings = checkBgOnlyIndicator(file, clean);
    for (const w of bgWarnings) {
      // เช็ค no-hardcode-ok ที่บรรทัดเดียวกัน (raw, ไม่ strip) — ให้ suppress ได้ทีละจุดพร้อมเหตุผล
      // ติดกับโค้ด ไม่ใช่ปล่อย warning ลอยที่ไม่มีใครอ่านซ้ำ (ดู CLAUDE.md hardening notes)
      if (/no-hardcode-ok/.test(rawLines[w.line - 1] ?? '')) continue;
      console.warn(`⚠ ${w.file}:${w.line}  background-only visual indicator (selector: ${w.selector}) — ไม่มี border จริง จะหายไปใน forced-colors mode\n    ${w.text}`);
      warnCount++;
    }
  }
}
if (n) { console.error(`\n✗ ${n} violation(s) — ทุกค่าต้องมาจาก token, ทุก property ต้อง logical`); process.exit(1); }
if (warnCount) { console.warn(`\n⚠ ${warnCount} warning(s) — background-only indicator เสี่ยงหายใน forced-colors mode (ไม่ fail build, ตรวจสอบด้วยตา)`); }
console.log(`✓ clean (${files.length} files scanned)`);
