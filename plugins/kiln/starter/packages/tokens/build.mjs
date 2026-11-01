#!/usr/bin/env node
// Builds src/{primitive,semantic,component}.json (DTCG) into build/css/tokens.css + build/json/tokens.json.
// Enforces the three-tier rule (CLAUDE.md iron rule 1) at build time rather than by review:
// semantic tokens may only reference primitive ones, component tokens only semantic ones —
// a component token pointing at a primitive fails the build.
// Translucent surfaces (surface.glass*) get an opaque fallback emitted here, so no component can forget it.
// Tokens with $extensions["kiln.environment"] get one override block per environment; each environment
// value obeys the same tier rule as $value. kiln.theme and kiln.breakpoint work the same way.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// The theme that $value describes. Other themes come from kiln.theme overrides (system/kiln.config.json → tokens.baseTheme).
const CFG_FILE = path.join(ROOT, '..', '..', 'system', 'kiln.config.json');
let BASE = 'light';
let SCOPE = '[data-component]';
try { const t = JSON.parse(readFileSync(CFG_FILE, 'utf8')).tokens ?? {}; BASE = t.baseTheme ?? BASE; SCOPE = t.stateScope ?? SCOPE; } catch {}
const ext = (node, k) => node.$extensions?.[`kiln.${k}`];
const TIERS = ['primitive', 'semantic', 'component'];
const tokens = new Map(); // path -> { tier, type, raw, description }
const collisions = [];

function walk(node, tier, trail, inheritedType, inheritedWhy) {
  const type = node.$type ?? inheritedType;
  // kiln.why: the reason for a value, on the token or its nearest group (system/CONCEPT.md principles)
  const why = node.$extensions?.['kiln.why'] ?? inheritedWhy;
  if ('$value' in node) {
    const key = trail.join('.');
    if (tokens.has(key)) collisions.push(`${key} is defined in both ${tokens.get(key).tier} and ${tier} — paths must be unique across tiers`);
    tokens.set(trail.join('.'), { tier, type, raw: node.$value, description: node.$description, env: ext(node, 'environment'), bp: ext(node, 'breakpoint'), theme: ext(node, 'theme'), state: ext(node, 'state'), reduced: ext(node, 'reduced'), why });
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (!k.startsWith('$') && v && typeof v === 'object') walk(v, tier, [...trail, k], type, why);
  }
}
for (const tier of TIERS) walk(JSON.parse(readFileSync(path.join(ROOT, 'src', `${tier}.json`), 'utf8')), tier, [], undefined);

const REF = /^\{([^}]+)\}$/;
const errors = [...collisions];
const ALLOWED = { primitive: [], semantic: ['primitive'], component: ['semantic'] };
const checkRef = (p, t, raw, label) => {
  const m = typeof raw === 'string' && raw.match(REF);
  if (!m) { if (t.tier !== 'primitive') errors.push(`${t.tier} token ${p}${label} has a raw value — only primitives hold literals`); return; }
  const target = tokens.get(m[1]);
  if (!target) errors.push(`${p}${label} references missing token {${m[1]}}`);
  else if (!ALLOWED[t.tier].includes(target.tier)) errors.push(`${t.tier} token ${p}${label} -> ${target.tier} {${m[1]}} (allowed: ${ALLOWED[t.tier].join(', ') || 'none'})`);
};
for (const [p, t] of tokens) for (const [env, raw] of Object.entries(t.env ?? {})) checkRef(p, t, raw, ` [${env}]`);
for (const [p, t] of tokens) for (const [bp, raw] of Object.entries(t.bp ?? {})) checkRef(p, t, raw, ` [@${bp}]`);
for (const [p, t] of tokens) for (const [th, raw] of Object.entries(t.theme ?? {})) checkRef(p, t, raw, ` [theme ${th}]`);
for (const [p, t] of tokens) {
  const m = typeof t.raw === 'string' && t.raw.match(REF);
  if (!m) {
    if (t.tier !== 'primitive') errors.push(`${t.tier} token ${p} has a raw value — only primitives hold literals`);
    continue;
  }
  const target = tokens.get(m[1]);
  if (!target) errors.push(`${p} references missing token {${m[1]}}`);
  else if (!ALLOWED[t.tier].includes(target.tier)) errors.push(`${t.tier} token ${p} -> ${target.tier} {${m[1]}} (allowed: ${ALLOWED[t.tier].join(', ') || 'none'})`);
}
if (errors.length) {
  console.error(`✗ token build failed — ${errors.length} tier violation(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

const resolve = (p, seen = []) => {
  const t = tokens.get(p);
  const m = typeof t.raw === 'string' && t.raw.match(REF);
  if (!m) return t.raw;
  if (seen.includes(m[1])) throw new Error(`cycle: ${[...seen, m[1]].join(' -> ')}`);
  return resolve(m[1], [...seen, m[1]]);
};
const cssName = (p) => `--ds-${p.replace(/\./g, '-')}`;
const format = (type, v) => (type === 'cubicBezier' ? `cubic-bezier(${v.join(', ')})` : String(v));
const cssValue = (p) => {
  const t = tokens.get(p);
  const m = typeof t.raw === 'string' && t.raw.match(REF);
  return m ? `var(${cssName(m[1])})` : format(t.type, t.raw);
};

const lines = [...tokens.keys()].map((p) => `  ${cssName(p)}: ${cssValue(p)};`);
const glassSurfaces = [...tokens.keys()].filter((p) => p === 'surface.glass' || p.startsWith('surface.glass.'));
const glassBlurs = [...tokens.keys()].filter((p) => p.startsWith('glass.blur'));
const ENVS = [...new Set([...tokens.values()].flatMap((t) => Object.keys(t.env ?? {})))];
// A custom property holding var(--x) is resolved where it is declared (:root) and inherits as a
// finished value — overriding --x inside [data-environment] would not reach --ds-card-bg. So every
// token whose reference chain passes through an environment token is re-declared in each block.
const refOf = (p) => { const t = tokens.get(p); const m = typeof t.raw === 'string' && t.raw.match(REF); return m ? m[1] : null; };
const dependsOn = (p, target) => { for (let r = refOf(p); r; r = refOf(r)) if (r === target) return true; return false; };
const envBlocks = ENVS.map((env) => {
  const own = [...tokens].filter(([, t]) => t.env?.[env]);
  const deps = [...tokens.keys()].filter((p) => own.some(([o]) => dependsOn(p, o)));
  const body = [
    ...own.map(([p, t]) => `  ${cssName(p)}: var(${cssName(t.env[env].slice(1, -1))});`),
    ...deps.map((p) => `  ${cssName(p)}: ${cssValue(p)};`),
  ].join('\n');
  return `[data-environment="${env}"] {\n${body}\n}`;
}).join('\n');
const fallback = [
  ...glassSurfaces.map((p) => `  ${cssName(p)}: var(${cssName('surface.solid')});`),
  ...glassBlurs.map((p) => `  ${cssName(p)}: 0px;`),
  // opaque fallback: nothing to dim behind a solid surface
  ...[...tokens.keys()].filter((p) => p === 'glass.brightness').map((p) => `  ${cssName(p)}: 1;`),
].join('\n');

const css = `/* GENERATED by packages/tokens/build.mjs — do not hand-edit. */
:root {
${lines.join('\n')}
}

/* Environments: the app declares a context (such as how bright the world behind is) and tokens follow. */
${envBlocks}

/* Translucent surfaces: every way out of transparency lands on the opaque surface.
   Selectors repeat [data-environment] so the fallback outranks the environment blocks above. */
${fallback ? `@media (prefers-reduced-transparency: reduce) {
  :root:root, :root [data-environment], :root [data-theme] {
${fallback.replace(/^/gm, '  ')}
  }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  :root:root, :root [data-environment], :root [data-theme] {
${fallback.replace(/^/gm, '  ')}
  }
}
@media (forced-colors: active) {
  :root:root, :root [data-environment], :root [data-theme] {
${fallback.replace(/^/gm, '  ')}
  }
}` : '/* no translucent surfaces in this system */'}
`;

// Reduced motion: every duration collapses to 0 at the token level, so no component can forget it, except a
// token marked $extensions["kiln.reduced"]: "keep" (a colour or light fade that moves nothing; Pane D-039:
// zeroing those made every control snap for a user with Reduce motion on).
// a kept token keeps the primitives it reads too (its own value and each state's), or var() resolves to 0ms
const KEPT = new Set([...tokens].filter(([, t]) => t.reduced === 'keep').flatMap(([p, t]) => [p, refOf(p), ...Object.values(t.state ?? {}).map((r) => String(r).slice(1, -1))]).filter(Boolean));
const durations = [...tokens].filter(([p, t]) => t.type === 'duration' && !KEPT.has(p)).map(([p]) => `    ${cssName(p)}: 0ms;`).join('\n');
// State rhythm: $extensions["kiln.state"] gives a token another value while an element is in a state, such as
// motion.hover = {duration.linger} with { ":hover": "{duration.brisk}" }. A transition takes its duration from
// the state it goes to, so the element answers fast on the way in and settles slowly on the way out. The
// value is set on a component root (tokens.stateScope, default [data-component]) in the state, so every part
// the component restyles inherits it, and reset on any component root that is not, so a Button inside a
// hovered Card keeps its own rhythm. Tokens that depend on it are declared again beside it (a var()
// resolves where it is declared). Zero specificity.
const stated = [...tokens].filter(([, t]) => t.state && typeof t.state === 'object');
for (const [p, t] of stated) for (const [sel, raw] of Object.entries(t.state)) {
  const m = typeof raw === 'string' && raw.match(REF);
  if (!/^:(hover|active|focus-visible|focus-within|checked)$/.test(sel)) errors.push(`${p}: kiln.state selector ${sel} is not one of :hover :active :focus-visible :focus-within :checked`);
  else if (!m || !tokens.has(m[1])) errors.push(`${p}: kiln.state ${sel} must reference a token, got ${raw}`);
  else if (!ALLOWED[t.tier].includes(tokens.get(m[1]).tier) && tokens.get(m[1]).tier !== t.tier) errors.push(`${p}: kiln.state ${sel} -> ${tokens.get(m[1]).tier} ${m[1]}`);
}
if (errors.length) { console.error(`✗ token build failed:\n  ${errors.join('\n  ')}`); process.exit(1); }
const stateBlock = (list) => list.flatMap(([p, t]) => Object.entries(t.state).map(([sel, raw]) => {
  const deps = [...tokens.keys()].filter((d) => dependsOn(d, p)).map((d) => `${cssName(d)}: ${cssValue(d)};`).join(' ');
  return `:where(${SCOPE}${sel}) { ${cssName(p)}: var(${cssName(raw.slice(1, -1))}); ${deps} }\n:where(${SCOPE}:not(${sel})) { ${cssName(p)}: ${cssValue(p)}; ${deps} }`;
})).join('\n');
const keep = stated.filter(([, t]) => t.reduced === 'keep'), move = stated.filter(([, t]) => t.reduced !== 'keep');
const stateCss = stated.length ? `
/* State rhythm: fast into a state, slow out of it (kiln.state) */
${stateBlock(keep)}
${move.length ? `@media (prefers-reduced-motion: no-preference) {\n${stateBlock(move)}\n}` : ''}
` : '';

const motionCss = `
/* Reduced motion — durations are zero everywhere, except fades marked kiln.reduced "keep"; movement distances too. */
@media (prefers-reduced-motion: reduce) {
  :root, [data-environment] {
${durations}
${[...tokens.keys()].filter((p) => p.startsWith('distance.')).map((p) => `    ${cssName(p)}: 0px;`).join('\n')}
${[...tokens.keys()].filter((p) => p === 'scale.press').map((p) => `    ${cssName(p)}: 1;`).join('\n')}
  }
}
`;
// Themes: tokens with $extensions["kiln.theme"] get a value per theme; $value is the base theme (config).
// @scope gives proximity, so a [data-theme] element nested inside another theme wins for its own
// subtree (the component pages put light and dark cells side by side). Environment-dependent tokens
// keep their environment value in dark and take the theme value in light, so the environment blocks
// are repeated inside each theme scope. A page with no data-theme follows prefers-color-scheme.
const THEMES = [...new Set([...tokens.values()].flatMap((t) => Object.keys(t.theme ?? {})))];
const themed = [...tokens].filter(([, t]) => t.theme);
const themeDeps = [...tokens.keys()].filter((p) => themed.some(([o]) => dependsOn(p, o)));
const themeBody = (th, indent) => [
  ...themed.map(([p, t]) => `${indent}${cssName(p)}: ${th && t.theme[th] ? `var(${cssName(t.theme[th].slice(1, -1))})` : cssValue(p)};`),
  ...themeDeps.map((p) => `${indent}${cssName(p)}: ${cssValue(p)};`),
].join('\n');
const envUnderTheme = (th, indent) => ENVS.map((env) => {
  const own = [...tokens].filter(([, t]) => t.env?.[env]);
  const deps = [...tokens.keys()].filter((p) => own.some(([o]) => dependsOn(p, o)));
  const val = ([p, t]) => (th && t.theme?.[th] ? `var(${cssName(t.theme[th].slice(1, -1))})` : `var(${cssName(t.env[env].slice(1, -1))})`);
  return `${indent}[data-environment="${env}"] {\n${[...own.map((o) => `${indent}  ${cssName(o[0])}: ${val(o)};`), ...deps.map((d) => `${indent}  ${cssName(d)}: ${cssValue(d)};`)].join('\n')}\n${indent}}`;
}).join('\n');
const themeCss = [
  // color-scheme too, so native parts (select popups, scrollbars, date pickers) follow the theme
  ...THEMES.map((th) => `@scope ([data-theme="${th}"]) {\n  :scope {\n    color-scheme: ${th};\n${themeBody(th, '    ')}\n  }\n${envUnderTheme(th, '  ')}\n}`),
  `@scope ([data-theme="${BASE}"]) {\n  :scope {\n    color-scheme: ${BASE};\n${themeBody(null, '    ')}\n  }\n${envUnderTheme(null, '  ')}\n}`,
  ...THEMES.map((th) => `@media (prefers-color-scheme: ${th}) {\n  @scope (:root:not([data-theme])) {\n    :scope {\n      color-scheme: ${th};\n${themeBody(th, '      ')}\n    }\n${envUnderTheme(th, '    ')}\n  }\n}`),
].join('\n');

// Responsive tokens: $extensions["kiln.breakpoint"] → one @media block per breakpoint, at the
// min-width the breakpoint token itself resolves to — no breakpoint is typed twice. Dependents are
// re-declared for the same reason as in the environment blocks.
const BPS = [...new Set([...tokens.values()].flatMap((t) => Object.keys(t.bp ?? {})))]
  .sort((a, b) => parseFloat(resolve(`breakpoint.${a}`)) - parseFloat(resolve(`breakpoint.${b}`)));
const bpBlocks = BPS.map((bp) => {
  const own = [...tokens].filter(([, t]) => t.bp?.[bp]);
  const deps = [...tokens.keys()].filter((p) => own.some(([o]) => dependsOn(p, o)));
  const body = [
    ...own.map(([p, t]) => `    ${cssName(p)}: var(${cssName(t.bp[bp].slice(1, -1))});`),
    ...deps.map((p) => `    ${cssName(p)}: ${cssValue(p)};`),
  ].join('\n');
  return `@media (min-width: ${resolve(`breakpoint.${bp}`)}) {\n  :root {\n${body}\n  }\n}`;
}).join('\n');
// Grid spans: GridItem sets --ds-span-base(-md|-lg) inline (never --ds-span itself — inline would
// beat the media rules) plus data attributes; which one applies is decided
// here, from the same breakpoint tokens.
const spanCss = `
/* GridItem spans, generated from the breakpoint tokens */
${tokens.has('grid.columns') ? `[data-ds-span] { --ds-span: var(--ds-span-base, var(${cssName('grid.columns')})); grid-column: span min(var(--ds-span), var(${cssName('grid.columns')})); }\n${BPS.map((bp) => `@media (min-width: ${resolve(`breakpoint.${bp}`)}) { [data-ds-span-${bp}] { --ds-span: var(--ds-span-${bp}); } }`).join('\n')}` : ''}
`;
const json = Object.fromEntries(
  [...tokens].map(([p, t]) => [p, { tier: t.tier, type: t.type, value: format(t.type, resolve(p)), ref: typeof t.raw === 'string' && REF.test(t.raw) ? t.raw.slice(1, -1) : null, css: cssName(p), description: t.description ?? null, why: t.why ?? null, ...(t.state ? { state: t.state } : {}), ...(t.bp ? { breakpoints: Object.fromEntries(Object.entries(t.bp).map(([bp, r]) => [bp, { ref: r.slice(1, -1), value: format(t.type, resolve(r.slice(1, -1))) }])) } : {}), ...(t.theme ? { themes: Object.fromEntries(Object.entries(t.theme).map(([th, r]) => [th, { ref: r.slice(1, -1), value: format(t.type, resolve(r.slice(1, -1))) }])) } : {}) }]),
);

mkdirSync(path.join(ROOT, 'build', 'css'), { recursive: true });
mkdirSync(path.join(ROOT, 'build', 'json'), { recursive: true });
writeFileSync(path.join(ROOT, 'build', 'css', 'tokens.css'), css.replace('/* Translucent surfaces', `/* Themes: ${BASE} is the base ($value); others via [data-theme] or prefers-color-scheme */\n${themeCss}\n\n/* Translucent surfaces`) + motionCss + stateCss + '\n/* responsive layout */\n' + bpBlocks + '\n' + spanCss);

// ---- other formats for consuming projects: ESM + types, SCSS ----
mkdirSync(path.join(ROOT, 'build', 'js'), { recursive: true });
mkdirSync(path.join(ROOT, 'build', 'scss'), { recursive: true });
const flat = Object.fromEntries([...tokens.keys()].map((p) => [p, format(tokens.get(p).type, resolve(p))]));
const vars = Object.fromEntries([...tokens.keys()].map((p) => [p, `var(${cssName(p)})`]));
writeFileSync(path.join(ROOT, 'build', 'js', 'tokens.mjs'),
  `// GENERATED by packages/tokens/build.mjs\n/** Resolved value of every token, by DTCG path. */\nexport const tokens = ${JSON.stringify(flat, null, 2)};\n/** CSS custom property reference for every token — use these in styles so themes/environments apply. */\nexport const cssVar = ${JSON.stringify(vars, null, 2)};\nexport default tokens;\n`);
writeFileSync(path.join(ROOT, 'build', 'js', 'tokens.d.ts'),
  `// GENERATED by packages/tokens/build.mjs\nexport type TokenName =\n${[...tokens.keys()].map((p) => `  | '${p}'`).join('\n')};\nexport declare const tokens: Readonly<Record<TokenName, string>>;\nexport declare const cssVar: Readonly<Record<TokenName, \`var(--ds-\${string})\`>>;\nexport default tokens;\n`);
writeFileSync(path.join(ROOT, 'build', 'scss', '_tokens.scss'),
  `// GENERATED by packages/tokens/build.mjs — \$ds-* hold var() references (theme/environment aware);\n// \$ds-raw-* hold resolved values for places that cannot take a custom property (media queries).\n${[...tokens.keys()].map((p) => `\$ds-${p.replace(/\./g, '-')}: var(${cssName(p)});`).join('\n')}\n${[...tokens.keys()].map((p) => `\$ds-raw-${p.replace(/\./g, '-')}: ${format(tokens.get(p).type, resolve(p))};`).join('\n')}\n`);
writeFileSync(path.join(ROOT, 'build', 'json', 'tokens.json'), JSON.stringify(json, null, 2) + '\n');
const count = (tier) => [...tokens.values()].filter((t) => t.tier === tier).length;
console.log(`✓ ${tokens.size} tokens → css, json, js+d.ts, scss; themes: ${[BASE, ...THEMES].join(', ')}; breakpoints: ${BPS.join(', ')}; (${TIERS.map((t) => `${count(t)} ${t}`).join(', ')}), ${glassSurfaces.length} glass surface(s) with fallback, environments: ${ENVS.join(', ') || 'none'}`);

// ---- other platforms: Swift, Kotlin (Compose), Dart (Flutter), a Tailwind preset and Figma variables ----
// Semantic and component tokens only (what product code reads), one full set per theme. Colours that
// are not hex (oklch, color-mix) are left out of the native files and counted, so a system that
// targets native writes its colours as hex. Dimensions are pt/dp/logical pixels one to one with px.
{
  const out = (dir, file, text) => { mkdirSync(path.join(ROOT, 'build', dir), { recursive: true }); writeFileSync(path.join(ROOT, 'build', dir, file), text); };
  const PKG = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).name.replace(/-tokens$/, '');
  const NS = PKG.split(/[^a-zA-Z0-9]+/).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)).join('');
  const resolveIn = (p, th, seen = []) => {
    const t = tokens.get(p);
    const raw = th && t.theme?.[th] ? t.theme[th] : t.raw;
    const m = typeof raw === 'string' && raw.match(REF);
    if (!m) return format(t.type, raw);
    if (seen.includes(m[1])) throw new Error(`cycle: ${[...seen, m[1]].join(' -> ')}`);
    return resolveIn(m[1], th, [...seen, m[1]]);
  };
  const ALL = [BASE, ...THEMES];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const camel = (p) => p.split(/[.\-_]/).filter(Boolean).map((s, i) => (i === 0 ? s.toLowerCase() : cap(s))).join('').replace(/^(\d)/, '_$1');
  const argb = (h) => { const s = String(h).trim().replace(/^#/, '').toUpperCase(); if (!/^[0-9A-F]+$/.test(s)) return null; const f = s.length === 3 ? [...s].map((c) => c + c).join('') + 'FF' : s.length === 6 ? s + 'FF' : s.length === 8 ? s : null; return f && f.slice(6) + f.slice(0, 6); };
  const num = (v, unit) => { const m = String(v).trim().match(new RegExp(`^(-?[\\d.]+)${unit}$`)); return m ? +m[1] : null; };
  const rows = [...tokens.keys()].filter((p) => tokens.get(p).tier !== 'primitive').map((p) => ({ p, name: camel(p), type: tokens.get(p).type, v: Object.fromEntries(ALL.map((th) => [th, String(resolveIn(p, th === BASE ? null : th))])) }));
  const seen = new Set(); for (const r of rows) { while (seen.has(r.name)) r.name += '_'; seen.add(r.name); }
  let skipped = 0;
  const native = (line) => (r, v) => { const h = r.type === 'color' && argb(v); const d = r.type === 'dimension' ? num(v, 'px') : null; const ms = num(v, 'ms'); const out = line(r, { h, d, ms }); if (!out && r.type === 'color') skipped++; return out; };
  const emit = (head, open, close, line) => { const L = [...head]; const one = native(line); for (const th of ALL) { L.push(open(`${NS}${cap(th)}`)); for (const r of rows) { const x = one(r, r.v[th]); if (x) L.push(x); } L.push(close, ''); } return L.join('\n'); };
  const gen = `GENERATED by packages/tokens/build.mjs from the DTCG source; one full set per theme (${ALL.join(', ')})`;
  out('swift', 'Tokens.swift', emit([`// ${gen}.`, 'import SwiftUI', ''], (n) => `public enum ${n} {`, '}',
    (r, { h, d, ms }) => (h ? `  public static let ${r.name} = Color(.sRGB, red: ${(parseInt(h.slice(2, 4), 16) / 255).toFixed(4)}, green: ${(parseInt(h.slice(4, 6), 16) / 255).toFixed(4)}, blue: ${(parseInt(h.slice(6, 8), 16) / 255).toFixed(4)}, opacity: ${(parseInt(h.slice(0, 2), 16) / 255).toFixed(4)})`
      : d != null ? `  public static let ${r.name}: CGFloat = ${d}` : ms != null ? `  public static let ${r.name}: Double = ${ms / 1000}` : null)));
  out('kotlin', 'Tokens.kt', emit([`// ${gen}.`, `package tokens.${NS.toLowerCase()}`, '', 'import androidx.compose.ui.graphics.Color', 'import androidx.compose.ui.unit.dp', ''], (n) => `object ${n} {`, '}',
    (r, { h, d, ms }) => (h ? `  val ${r.name} = Color(0x${h})` : d != null ? `  val ${r.name} = ${d}.dp` : ms != null ? `  const val ${r.name}Ms = ${ms}L` : null)));
  out('dart', 'tokens.dart', emit([`// ${gen}.`, "import 'package:flutter/painting.dart';", ''], (n) => `class ${n} {\n  ${n}._();`, '}',
    (r, { h, d, ms }) => (h ? `  static const Color ${r.name} = Color(0x${h});` : d != null ? `  static const double ${r.name} = ${d};` : ms != null ? `  static const Duration ${r.name} = Duration(milliseconds: ${ms});` : null)));
  // Tailwind: every value is the CSS variable, so themes, environments and brands keep working.
  const pick = (test) => { const o = {}; for (const r of rows.filter(test)) { const parts = r.p.split('.'); let n = o; parts.slice(0, -2).forEach((k) => { n = n[k] = typeof n[k] === 'object' ? n[k] : {}; }); n[parts.length > 1 ? parts.slice(-2).join('-') : parts[0]] = `var(${cssName(r.p)})`; } return o; };
  const under = (re) => (r) => re.test(r.p.split('.')[0]);
  const preset = { theme: { extend: {
    colors: pick((r) => r.type === 'color' && tokens.get(r.p).tier === 'semantic'),
    spacing: pick((r) => r.type === 'dimension' && under(/^(space|spacing|gap)$/)(r)),
    borderRadius: pick((r) => r.type === 'dimension' && under(/^(radius|corner|rounded)$/)(r)),
    fontFamily: pick((r) => r.type === 'fontFamily'),
    transitionDuration: pick((r) => r.type === 'duration'),
  } } };
  out('tailwind', 'preset.cjs', `// ${gen}.\n// Load the CSS (./css) as well, then: presets: [require('${JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).name}/tailwind')]\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`);
  // Figma variables (DTCG with modes; Tokens Studio or the variables import): one collection, a mode per theme
  const figma = { $description: `${PKG} semantic and component tokens, one mode per theme.`, ...Object.fromEntries(ALL.map((th) => [cap(th), {}])) };
  for (const r of rows) for (const th of ALL) { let n = figma[cap(th)]; const parts = r.p.split('.'); parts.slice(0, -1).forEach((k) => { n = n[k] ??= {}; }); n[parts.at(-1)] = { $value: r.v[th], $type: r.type }; }
  out('figma', 'variables.json', JSON.stringify(figma, null, 2) + '\n');
  console.log(`✓ platforms: swift, kotlin, dart, tailwind, figma (${rows.length} tokens × ${ALL.length} themes${skipped ? `; ${skipped} non-hex colour values left out of the native files` : ''})`);
}
