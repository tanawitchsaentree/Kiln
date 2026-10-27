#!/usr/bin/env node
// Computes real WCAG contrast ratios from the built token CSS — replaces the by-hand
// relative-luminance arithmetic component-engineer.md currently asks every agent to redo per
// component (found duplicated, with the same formula re-derived from scratch, in at least 7
// component tokens' $description fields: alert/card/dialog/popover/rating/toast/tooltip.json).
//
// Usage:
//   node tooling/contrast-check.mjs <fg-var> <bg-var> [...more fg:bg pairs]
//   node tooling/contrast-check.mjs --var color-border-interactive:color-surface-canvas ...
//
// Resolves each `--ds-*` custom property from both packages/tokens/build/css/{light,dark}.css
// (following var() aliases down to a literal hex) and prints the ratio in both themes plus a
// PASS/FAIL against the 4.5:1 (text) / 3:1 (UI) minimums.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_DIR = path.join(__dirname, '..', 'packages', 'tokens', 'build', 'css');

function parseVars(css) {
  // Only the base :root block — stop before any @media override (e.g. postbuild-contrast-media.mjs's
  // `prefers-contrast: more` block redefines some of these names with different values).
  const base = css.split(/@media/)[0];
  const vars = new Map();
  for (const m of base.matchAll(/--ds-([a-z0-9-]+):\s*([^;]+);/g)) {
    vars.set(m[1], m[2].trim());
  }
  return vars;
}

function resolve(name, vars, seen = new Set()) {
  if (seen.has(name)) throw new Error(`circular var reference: ${[...seen, name].join(' -> ')}`);
  seen.add(name);
  const raw = vars.get(name);
  if (!raw) throw new Error(`--ds-${name} not found`);
  const varRef = raw.match(/^var\(--ds-([a-z0-9-]+)\)$/);
  if (varRef) return resolve(varRef[1], vars, seen);
  if (!/^#[0-9a-f]{6}$/i.test(raw)) throw new Error(`--ds-${name} resolved to non-hex value "${raw}" (only color vars supported)`);
  return raw.toLowerCase();
}

function luminance(hex) {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(hex1, hex2) {
  const [l1, l2] = [luminance(hex1), luminance(hex2)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

function stripPrefix(name) {
  return name.replace(/^--ds-/, '').replace(/^ds-/, '');
}

const pairs = process.argv.slice(2).map((arg) => {
  const [fg, bg] = arg.split(':');
  if (!fg || !bg) throw new Error(`bad pair "${arg}" — expected fg-var:bg-var`);
  return [stripPrefix(fg), stripPrefix(bg)];
});

if (pairs.length === 0) {
  console.error('Usage: node tooling/contrast-check.mjs <fg-var>:<bg-var> [...]');
  console.error('Example: node tooling/contrast-check.mjs color-border-interactive:color-surface-canvas');
  process.exit(1);
}

const themes = {
  light: parseVars(readFileSync(path.join(CSS_DIR, 'light.css'), 'utf8')),
  dark: parseVars(readFileSync(path.join(CSS_DIR, 'dark.css'), 'utf8')),
};

let anyFail = false;
for (const [fg, bg] of pairs) {
  console.log(`\n${fg} on ${bg}:`);
  for (const [theme, vars] of Object.entries(themes)) {
    const fgHex = resolve(fg, vars);
    const bgHex = resolve(bg, vars);
    const ratio = contrast(fgHex, bgHex);
    const passText = ratio >= 4.5;
    const passUI = ratio >= 3;
    const status = passText ? 'PASS text+UI' : passUI ? 'PASS UI only (3:1), FAIL text (4.5:1)' : 'FAIL both';
    if (!passUI) anyFail = true;
    console.log(`  ${theme}: ${fgHex} / ${bgHex} = ${ratio.toFixed(3)}:1 — ${status}`);
  }
}

if (anyFail) {
  console.log('\n✗ at least one pairing fails the 3:1 UI-component minimum in at least one theme');
  process.exit(1);
}
console.log('\n✓ all pairings clear at least 3:1 (UI) in both themes');
