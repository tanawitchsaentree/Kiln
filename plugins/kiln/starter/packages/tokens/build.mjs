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
try { BASE = JSON.parse(readFileSync(CFG_FILE, 'utf8')).tokens?.baseTheme ?? BASE; } catch {}
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
    tokens.set(trail.join('.'), { tier, type, raw: node.$value, description: node.$description, env: ext(node, 'environment'), bp: ext(node, 'breakpoint'), theme: ext(node, 'theme'), why });
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

// Reduced motion: every duration collapses to 0 at the token level, so no component can forget it.
const durations = [...tokens].filter(([, t]) => t.type === 'duration').map(([p]) => `    ${cssName(p)}: 0ms;`).join('\n');
const motionCss = `
/* Reduced motion — durations are zero everywhere; movement distances too. */
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
  [...tokens].map(([p, t]) => [p, { tier: t.tier, type: t.type, value: format(t.type, resolve(p)), ref: typeof t.raw === 'string' && REF.test(t.raw) ? t.raw.slice(1, -1) : null, css: cssName(p), description: t.description ?? null, why: t.why ?? null, ...(t.bp ? { breakpoints: Object.fromEntries(Object.entries(t.bp).map(([bp, r]) => [bp, { ref: r.slice(1, -1), value: format(t.type, resolve(r.slice(1, -1))) }])) } : {}), ...(t.theme ? { themes: Object.fromEntries(Object.entries(t.theme).map(([th, r]) => [th, { ref: r.slice(1, -1), value: format(t.type, resolve(r.slice(1, -1))) }])) } : {}) }]),
);

mkdirSync(path.join(ROOT, 'build', 'css'), { recursive: true });
mkdirSync(path.join(ROOT, 'build', 'json'), { recursive: true });
writeFileSync(path.join(ROOT, 'build', 'css', 'tokens.css'), css.replace('/* Translucent surfaces', `/* Themes: ${BASE} is the base ($value); others via [data-theme] or prefers-color-scheme */\n${themeCss}\n\n/* Translucent surfaces`) + motionCss + '\n/* responsive layout */\n' + bpBlocks + '\n' + spanCss);

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
