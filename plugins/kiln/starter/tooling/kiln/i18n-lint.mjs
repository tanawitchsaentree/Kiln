#!/usr/bin/env node
// i18n-lint (G-I18N): no reader-facing text is written into a component. Every word a component shows or
// speaks on its own comes from the message catalog (or from a prop the product fills), so a Thai product
// never shows "Previous month". Pane, 2026-10-30: 87 English strings were found baked into 40 components.
// Reads the TypeScript syntax tree of every component file and flags
//   - JSX text with letters,
//   - string or template literals in reader-facing JSX attributes (aria-label, aria-valuetext, title,
//     placeholder, alt, label and *Label, *Text),
//   - defaults in destructured props whose name says they are words (label, title, placeholder, empty,
//     *Label, *Text, *Title, finishLabel …).
// A literal that is only punctuation, digits or a single symbol is allowed; so is anything inside a
// call to t(…) / msg(…) or a `messages.` member.
// Usage: node tooling/kiln/i18n-lint.mjs [--json] [--list]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { docsConfig } from './config.mjs';

const C = docsConfig();
const require = createRequire(path.join(C.root, 'package.json'));
let ts;
try { ts = require('typescript'); } catch { console.log('NO typescript in the system; i18n-lint skipped'); process.exit(0); }
const roots = [C.abs(C.componentsDir ?? 'packages/react/src/components'), path.join(C.root, 'packages/react/src/chart')].filter((d) => { try { return statSync(d).isDirectory(); } catch { return false; } });
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f) && !/\.d\.ts$/.test(f) && !/\.test\./.test(f)) files.push(p); } };
roots.forEach(walk);
const WORDS = /[A-Za-z฀-๿]{2,}/;
const ATTR = /^(aria-label|aria-valuetext|aria-roledescription|aria-description|title|placeholder|alt|label|[a-z]+Label|[a-z]+Text)$/;
const PROP = /^(label|title|placeholder|empty|emptyText|[a-z]+Label|[a-z]+Text|[a-z]+Title)$/;
const inCatalogCall = (n) => { for (let p = n.parent; p; p = p.parent) { if (ts.isCallExpression(p) && /^(t|msg|format)$/.test(p.expression.getText())) return true; if (ts.isPropertyAccessExpression(p) && /^(messages|m)$/.test(p.expression.getText())) return true; if (ts.isJsxAttribute(p) || ts.isFunctionLike(p)) break; } return false; };
const textOf = (n) => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : ts.isTemplateExpression(n) ? [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' ') : '');
const hits = [];
for (const f of files) {
  const src = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = path.relative(C.root, f);
  const add = (n, why) => { const { line } = src.getLineAndCharacterOfPosition(n.getStart()); hits.push({ file: rel, line: line + 1, why, text: n.getText().slice(0, 70) }); };
  const visit = (n) => {
    if (ts.isJsxText(n) && WORDS.test(n.text)) add(n, 'JSX text');
    if (ts.isJsxAttribute(n) && ATTR.test(n.name.getText()) && n.initializer) {
      const v = ts.isJsxExpression(n.initializer) ? n.initializer.expression : n.initializer;
      if (v && WORDS.test(textOf(v)) && !inCatalogCall(v)) add(v, `attribute ${n.name.getText()}`);
    }
    if (ts.isBindingElement(n) && n.initializer && PROP.test((n.propertyName ?? n.name).getText()) && WORDS.test(textOf(n.initializer))) add(n.initializer, `default of ${n.name.getText()}`);
    // a sentence in a string anywhere (a status line, a button word kept in a constant): two or more words
    // starting with a capital, which is how reader-facing text is written and code identifiers are not
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && /^[A-Z][a-z']+( [a-z'0-9,]+)+[.?!…]?$/.test(n.text) && !ts.isImportDeclaration(n.parent) && !(ts.isJsxAttribute(n.parent) && !ATTR.test(n.parent.name.getText())) && !inCatalogCall(n) && !hits.some((h) => h.file === rel && h.line === src.getLineAndCharacterOfPosition(n.getStart()).line + 1)) add(n, 'sentence');
    // a word shown as a JSX child through an expression, such as {open ? 'Hide' : 'Show'}
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && WORDS.test(n.text) && /^[A-Z]/.test(n.text) && ts.isConditionalExpression(n.parent) && ts.isJsxExpression(n.parent.parent) && !ts.isJsxAttribute(n.parent.parent.parent) && !hits.some((h) => h.file === rel && h.text === n.getText().slice(0, 70))) add(n, 'JSX child');
    ts.forEachChild(n, visit);
  };
  visit(src);
}
if (process.argv.includes('--json')) { console.log(JSON.stringify(hits)); process.exit(hits.length ? 1 : 0); }
if (process.argv.includes('--list')) for (const h of hits) console.log(`${h.file}:${h.line}  ${h.why}  ${h.text}`);
const files_ = new Set(hits.map((h) => h.file)).size;
console.log(hits.length ? `✗ i18n: ${hits.length} built-in strings in ${files_} files (run with --list)` : `✓ i18n: no built-in strings in ${files.length} component files`);
process.exit(hits.length ? 1 : 0);
