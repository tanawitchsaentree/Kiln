#!/usr/bin/env node
// token-contract — every `var(--ds-*)` the components and the docs book read must exist.
//
// A missing custom property fails silently in CSS: the declaration is dropped and the element falls
// back to the browser default. When kiln's starter was cut from Pane, the docs shell still read
// glass and card tokens the new system never had, and nothing said so until a page looked wrong.
// This reads the built tokens CSS, adds every `--ds-*` a scanned file declares itself (local
// variables such as a span count), and fails on any name used but declared nowhere.
//
// Usage: node tooling/kiln/token-contract.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { docsConfig, ROOT } from './config.mjs';

const C = docsConfig();
const TOKENS_CSS = path.join(ROOT, 'packages/tokens/build/css/tokens.css');
if (!existsSync(TOKENS_CSS)) { console.log('✗ token contract: build the tokens first (no packages/tokens/build/css/tokens.css)'); process.exit(1); }

const files = [];
const walk = (d) => {
  if (!existsSync(d)) return;
  for (const n of readdirSync(d)) {
    if (['node_modules', 'dist', 'public'].includes(n)) continue;
    const f = path.join(d, n);
    if (statSync(f).isDirectory()) walk(f); else if (/\.(css|tsx?|mjs)$/.test(n)) files.push(f);
  }
};
walk(path.join(C.abs(C.app), 'src'));
walk(C.abs(C.componentsDir));

const declared = new Set();
const decl = (text) => { for (const m of text.matchAll(/(--ds-[a-z0-9-]+)\s*:/g)) declared.add(m[1]); for (const m of text.matchAll(/['"`](--ds-[a-z0-9-]+)['"`]\s*[,:\]]/g)) declared.add(m[1]); };
decl(readFileSync(TOKENS_CSS, 'utf8'));
const uses = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  decl(text);
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/var\(\s*(--ds-[a-z0-9-]+)/g)) uses.push([m[1], `${path.relative(ROOT, f)}:${i + 1}`]);
  });
}
// names built at run time (`--ds-${x}`) can't be checked statically; a template prefix is reported once so it stays visible
const missing = uses.filter(([n]) => !declared.has(n) && !n.endsWith('-'));
const byName = new Map();
for (const [n, at] of missing) byName.set(n, [...(byName.get(n) ?? []), at]);
for (const [n, at] of byName) console.log(`✗ ${n} is read but no token or file declares it — ${at.slice(0, 3).join(', ')}${at.length > 3 ? ` (+${at.length - 3})` : ''}`);
console.log(`${byName.size ? '✗' : '✓'} token contract: ${new Set(uses.map(([n]) => n)).size} names read across ${files.length} files, ${byName.size} missing`);
process.exit(byName.size ? 1 : 0);
