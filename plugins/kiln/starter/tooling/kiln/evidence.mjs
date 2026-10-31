#!/usr/bin/env node
// evidence — text contrast measured on real pixels, never computed from tokens. For every mode ×
// theme × scene it loads the built docs (every route) and, if the system has one, its harness page,
// hides each text node, screenshots, and scores the text colour against the worst pixel under it
// (text-contrast.mjs). WCAG 4.5:1, large text 3:1; disabled controls are exempt (WCAG 1.4.3).
//
// A system with an accepted exception sets contrast.exception + contrast.exceptionFloor: text between
// the floor and its minimum is counted as "excepted", never as passing; anything under the floor fails.
// Harness groups listed in contrast.infoGroups (e.g. text on photos the system does not control) are
// reported, never hidden, never gating.
//
// Runs the built site only (build first). Writes <app>/public/evidence.json and
// system/reports/evidence-{date}.json. Exit 1 on any gating failure.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { docsConfig, routes, url, pool, routeFilter } from './config.mjs';
import { serveDist } from './serve-dist.mjs';
import { measurePageText } from './text-contrast.mjs';

const C = docsConfig();
const K = C.contrast;
const ROUTES = routeFilter(routes(C));
const PAR = Math.max(1, Number(C.parallel ?? 1)); // more than 1 only on a machine with room to spare (2026-10-29: 3 browsers at load 96 ran all night)
const SCENES = C.scenes.length ? C.scenes : [null];
const MODES = {
  normal: {},
  'reduced-transparency': { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] },
  'forced-colors': { forcedColors: 'active' },
};
const modes = C.modes.filter((m) => MODES[m]);
// Fallback modes paint opaque surfaces, so the backdrop stops mattering: one scene keeps the run bounded.
const docsScenes = (mode) => (mode === 'normal' ? SCENES : SCENES.slice(0, 1));
const isExcepted = (t) => K.exceptionFloor != null && t.min != null && t.min >= K.exceptionFloor && t.min < t.required;

const srv = await serveDist(C.abs(C.dist));
const browser = await chromium.launch();
const result = { generatedAt: new Date().toISOString(), browser: `chromium ${browser.version()}`, threshold: K.threshold, modes, themes: C.themes, scenes: C.scenes, harness: {}, docsPage: {}, failures: [], excepted: [], exception: K.exception, exceptionFloor: K.exceptionFloor };

async function open(mode, href) {
  const opt = MODES[mode];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, forcedColors: opt.forcedColors ?? 'none', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  if (opt.features) await (await ctx.newCDPSession(page)).send('Emulation.setEmulatedMedia', { features: opt.features });
  await page.goto(href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // folded sections are measured open, as a reader who opens them sees them
  await page.evaluate(() => { for (const d of document.querySelectorAll('details')) d.open = true; });
  const active = await page.evaluate((m) => ({ normal: true, 'reduced-transparency': matchMedia('(prefers-reduced-transparency: reduce)').matches, 'forced-colors': matchMedia('(forced-colors: active)').matches })[m], mode);
  if (!active) throw new Error(`mode ${mode} did not take effect in this browser`);
  return { page, close: () => ctx.close() };
}
const summarise = (ts) => {
  const scored = ts.filter((t) => t.min != null);
  return { texts: ts.length, worst: scored.length ? Math.min(...scored.map((t) => t.min)) : null, failures: ts.filter((t) => t.min == null || t.min < t.required).length, worstFive: [...scored].sort((a, b) => a.min - b.min).slice(0, 5).map((t) => `${t.label} ${t.min}`) };
};
const record = (where, t) => (isExcepted(t) ? result.excepted : result.failures).push(`${where}: "${t.label}" ${t.min}`);

try {
  for (const mode of modes) {
    result.harness[mode] = {};
    result.docsPage[mode] = {};
    for (const theme of C.themes) for (const scene of SCENES) {
      const key = scene ? `${theme}/${scene}` : theme;
      if (K.harness) {
        const h = await open(mode, url(srv.base, K.harness, { theme, scene }, C));
        const r = await measurePageText(h.page, K.threshold);
        await h.close();
        const groups = {};
        for (const g of [...K.gatingGroups, ...K.infoGroups]) groups[g] = summarise(r.all.filter((t) => t.group === g));
        result.harness[mode][key] = groups;
        for (const g of K.gatingGroups) for (const t of r.all.filter((x) => x.group === g && (x.min == null || x.min < x.required))) record(`[${mode}] harness ${key}/${g}`, t);
      }
      const agg = (result.docsPage[mode][key] = { textElements: 0, failures: 0, pages: 0 });
      // pages are measured PAR at a time, each in its own context, so a set takes about 1/PAR as long
      if (docsScenes(mode).includes(scene)) await pool(ROUTES, PAR, async (route) => {
        const d = await open(mode, url(srv.base, route, { theme, scene }, C));
        const dr = await measurePageText(d.page, K.threshold);
        await d.close();
        agg.textElements += dr.textElements;
        agg.pages += 1;
        // progress inside a set, so a long run never looks stuck
        if (agg.pages % 25 === 0) console.log(`  … ${mode} ${key} ${agg.pages}/${ROUTES.length} pages, ${agg.failures} failing so far`);
        for (const t of dr.failures.filter((x) => !K.infoGroups.includes(x.group))) { if (!isExcepted(t)) agg.failures += 1; record(`[${mode}] docs ${route} ${key}`, t); }
      });
      console.log(`${mode.padEnd(21)} ${key.padEnd(14)} ${K.harness ? `harness ${K.gatingGroups.map((g) => `${g} ${result.harness[mode][key][g].failures}/${result.harness[mode][key][g].texts}`).join(' · ')} | ` : ''}docs ${agg.failures}/${agg.textElements} over ${agg.pages} pages`);
    }
  }
} finally {
  await browser.close();
  srv.close();
}

const harnessTexts = Object.values(result.harness).reduce((n, m) => n + Object.values(m).reduce((k, s) => k + K.gatingGroups.reduce((j, g) => j + s[g].texts, 0), 0), 0);
const docsTexts = Object.values(result.docsPage).reduce((n, m) => n + Object.values(m).reduce((k, s) => k + s.textElements, 0), 0);
const total = harnessTexts + docsTexts;
const informational = [];
for (const [mode, m] of Object.entries(result.harness)) for (const [key, s] of Object.entries(m)) for (const g of K.infoGroups) if (s[g]?.failures) informational.push(`${mode}/${key} ${g} worst ${s[g].worst}:1`);
result.summary = { gatingChecks: total, gatingFailures: result.failures.length, excepted: result.excepted.length, informational };
if (total === 0) result.failures.push('NOTHING MEASURED, so nothing was proven');

// A run limited by KILN_ROUTES or KILN_SCENES measured part of the book. It must never replace the published
// full result (public/evidence.json is what the book shows): it goes to a partial report only, marked as
// such, and milestone.mjs refuses it. (Pane: a quick partial run overwrote the book's full evidence.)
result.partial = Boolean((process.env.KILN_ROUTES ?? '').trim() || (process.env.KILN_SCENES ?? '').trim());
if (result.partial) result.limitedTo = { routes: process.env.KILN_ROUTES || null, scenes: process.env.KILN_SCENES || null };
const day = result.generatedAt.slice(0, 10);
const outs = result.partial
  ? [path.join(C.root, 'system', 'reports', `evidence-partial-${day}.json`)]
  : [path.join(C.abs(C.app), 'public', 'evidence.json'), path.join(C.root, 'system', 'reports', `evidence-${day}.json`)];
if (result.partial) console.log(`partial run (${[result.limitedTo.routes && 'KILN_ROUTES', result.limitedTo.scenes && 'KILN_SCENES'].filter(Boolean).join(' + ')}): written to system/reports/evidence-partial-${day}.json only; public/evidence.json is left as it was`);
for (const out of outs) {
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
}
for (const f of result.failures.slice(0, 40)) console.log(`✗ ${f}`);
console.log(`\n${result.failures.length ? '✗' : '✓'} evidence: ${total - result.failures.length - result.excepted.length}/${total} text checks pass${K.exception ? `, ${result.excepted.length} excepted under ${K.exception} (≥${K.exceptionFloor}:1)` : ''} (${C.themes.length} themes × ${SCENES.length} scenes × ${modes.length} modes, ${result.browser})${informational.length ? `; reported only: ${informational.join(', ')}` : ''}`);
process.exit(result.failures.length ? 1 : 0);
