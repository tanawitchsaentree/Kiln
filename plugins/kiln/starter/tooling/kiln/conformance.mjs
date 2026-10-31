#!/usr/bin/env node
// conformance — behaviour checks run against the BUILT docs book in real Chromium (not jsdom).
//
// Component behaviour. The engine owns what every component chapter must have (generated props with
// JSDoc, the demo floor) and refuses a chapter nobody tests; the book-wide checks (shell, copy,
// themes, backdrops, controls, hit areas, axe) are gates.mjs. Each component's own behaviour (keys,
// roles, measured values) lives in the system: every `system/conformance/*.mjs` exports a default
// `async (t) => {}` that receives the same helpers and adds its checks. A component with a chapter
// and no system check file fails here, so a component cannot ship untested.
//
// Usage: node tooling/kiln/conformance.mjs [--no-build]
// Writes <docs.app>/public/conformance.json. Exit 1 on any failed check.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveDist } from './serve-dist.mjs';
import { createHash } from 'node:crypto';
import { docsConfig, componentPages, url, ROOT } from './config.mjs';

const C = docsConfig();
const SYS = JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8'));
if (!process.argv.includes('--no-build')) {
  const pkg = JSON.parse(readFileSync(path.join(C.abs(C.app), 'package.json'), 'utf8')).name;
  const r = spawnSync('pnpm', ['--filter', pkg, 'build'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Every check is stamped with when it ran and a hash of its component's source folder, so a result kept from
// an earlier run can be told apart from a fresh one and marked stale once the component changed under it.
const srcHashes = new Map();
function srcHash(component) {
  if (srcHashes.has(component)) return srcHashes.get(component);
  const dir = path.join(C.abs(C.componentsDir), component);
  let h = null;
  if (existsSync(dir)) {
    const x = createHash('sha256');
    const walk = (d) => { for (const n of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const p = path.join(d, n.name); if (n.isDirectory()) walk(p); else { x.update(n.name); x.update(readFileSync(p)); } } };
    walk(dir); h = x.digest('hex').slice(0, 12);
  }
  srcHashes.set(component, h);
  return h;
}
const RAN_AT = new Date().toISOString();
const checks = [];
async function check(component, name, fn) {
  const stamp = { ranAt: RAN_AT, srcHash: srcHash(component) };
  try {
    const detail = await fn();
    checks.push({ component, name, ok: true, ...(typeof detail === 'string' ? { detail } : {}), ...stamp });
  } catch (e) {
    checks.push({ component, name, ok: false, detail: String(e.message ?? e).split('\n')[0], ...stamp });
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
// Behaviour libraries move roving focus in a setTimeout, so selection lands a tick after the key press.
async function eventually(read, want, msg, ms = 1000) {
  const end = Date.now() + ms;
  let got;
  while (Date.now() < end) { if ((got = await read()) === want) return; await new Promise((r) => setTimeout(r, 25)); }
  throw new Error(`${msg} (got ${got})`);
}
// Press Tab until `locator` has focus: proves it is in the keyboard tab sequence.
async function tabTo(page, locator, max = 300) {
  await page.evaluate(() => (document.activeElement)?.blur());
  await page.locator('body').focus();
  const target = await locator.elementHandle();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((el) => document.activeElement === el, target)) return;
  }
  throw new Error(`not reached in ${max} Tab presses`);
}

const META = JSON.parse(readFileSync(C.abs(C.meta), 'utf8'));
const CHAPTERS = componentPages(C).map((p) => ({ name: p.title, slug: p.slug }));
const TOKENS = (() => {
  const f = [path.join(ROOT, 'packages/tokens/build/json/tokens.json')].find(existsSync);
  return f ? JSON.parse(readFileSync(f, 'utf8')) : {};
})();
for (const { name } of CHAPTERS) {
  await check(name, 'props table is generated from TS and every own prop is documented (JSDoc)', () => {
    expect(META.components?.[name], 'not in meta.json, so run tooling/kiln/meta.mjs');
    const own = META.components[name].exports.flatMap((e) => e.props);
    const undocumented = own.filter((p) => !p.description).map((p) => p.name);
    expect(undocumented.length === 0, `no JSDoc: ${undocumented.join(', ')}`);
    return own.length ? `${own.length} props` : 'no props of its own (pass-through only)';
  });
}

const SYSTEM_CHECKS = path.join(ROOT, 'system', 'conformance');
const systemFiles = existsSync(SYSTEM_CHECKS) ? readdirSync(SYSTEM_CHECKS).filter((f) => f.endsWith('.mjs')).sort() : [];
// a quick run for the pages being worked on (KILN_CHECKS=20,21 picks those check files; KILN_ROUTES limits
// the demo floor and coverage loops to those components); a full run, without them, is still the one that counts
const COVERED = new Set();
const ONLY_FILES = (process.env.KILN_CHECKS ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const ONLY_ROUTES = new Set((process.env.KILN_ROUTES ?? '').split(',').map((x) => x.trim()).filter(Boolean));
const inScope = (slug) => !ONLY_ROUTES.size || ONLY_ROUTES.has(`/components/${slug}`);
const runFiles = ONLY_FILES.length ? systemFiles.filter((f) => ONLY_FILES.some((k) => f.startsWith(k))) : systemFiles;

const srv = await serveDist(C.abs(C.dist));
const THEME = C.themes[0];
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const go = (route, theme = THEME) => page.goto(url(srv.base, route, { theme }, C), { waitUntil: 'networkidle' });
  const main = () => page.locator('main');

  for (const { name, slug } of CHAPTERS.filter((c) => inScope(c.slug))) {
    await check(name, `demo floor met (≥ variant dimensions + 3 = ${META.components?.[name]?.demoFloor})`, async () => {
      let n = 0;
      // examples load as their chunk arrives (the docs are code-split), so count once the number stops growing
      const settled = async () => { let last = -1; for (let i = 0; i < 20; i++) { const c = await main().locator('figure.example').count(); if (c === last) return c; last = c; await page.waitForTimeout(150); } return last; };
      for (const t of C.tabs) { await go(`${C.componentsBase}/${slug}/${t}`); n += await settled(); }
      expect(n >= META.components[name].demoFloor, `${n} demos across the tabs`);
      return `${n} demos`;
    });
  }

  // --- the system's own component checks ---------------------------------------------------------
  const covered = COVERED;
  const t = { check: async (component, name, fn) => { covered.add(component); return check(component, name, fn); }, expect, eventually, tabTo, page, go, main, browser, base: srv.base, url: (r, o) => url(srv.base, r, o, C), tokens: TOKENS, config: SYS, chapters: CHAPTERS };
  for (const f of runFiles) {
    const mod = await import(pathToFileURL(path.join(SYSTEM_CHECKS, f)).href);
    await page.setViewportSize({ width: 1440, height: 900 });
    await mod.default(t);
  }
  for (const { name } of CHAPTERS.filter((c) => inScope(c.slug))) {
    if (!covered.has(name)) await check(name, 'has behaviour checks in system/conformance/', () => expect(false, `no check names "${name}", so its keys, roles and measured values are untested`));
  }
} finally {
  await browser.close();
  srv.close();
}

// A limited run (KILN_CHECKS picks check files, KILN_ROUTES picks chapters) refreshes only the checks it
// ran and keeps every other result from the file, so a quick check never wipes the book's
// evidence for the rest (Pane: a KILN_ROUTES run dropped every other component). A kept result whose
// component source changed since it ran is marked stale; milestone.mjs refuses stale results.
const OUT = path.join(C.abs(C.app), 'public/conformance.json');
const partial = ONLY_FILES.length > 0 || ONLY_ROUTES.size > 0;
let keptCount = 0;
if (partial && existsSync(OUT)) {
  // merged check by check: a result this run produced replaces the old one, every other old result stays
  // (a full run is what drops a check that no longer exists)
  const key = (c) => `${c.component}\u0000${c.name}`;
  const refreshed = new Set(checks.map(key));
  const prev = JSON.parse(readFileSync(OUT, 'utf8')).checks ?? [];
  const kept = prev.filter((c) => !refreshed.has(key(c))).map((c) => {
    const { stale, ...rest } = c;
    const isStale = !c.ranAt || (srcHash(c.component) ?? null) !== (c.srcHash ?? null);
    return isStale ? { ...rest, stale: true } : rest;
  });
  keptCount = kept.length;
  checks.splice(0, checks.length, ...kept, ...checks);
}
const stale = checks.filter((c) => c.stale).length;
if (partial) console.log(`limited run: ${checks.length - keptCount} checks ran, ${keptCount} kept from the last run${stale ? `, ${stale} of them stale (their component changed since)` : ''}`);
const passed = checks.filter((c) => c.ok).length;
for (const c of checks) console.log(`${c.ok ? '✓' : '✗'} ${c.component}: ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
mkdirSync(path.join(C.abs(C.app), 'public'), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ generatedAt: RAN_AT, partial, stale, passed, total: checks.length, checks }, null, 2) + '\n',
);
console.log(`\n${passed === checks.length ? '✓' : '✗'} conformance: ${passed}/${checks.length}`);
process.exit(passed === checks.length ? 0 : 1);
