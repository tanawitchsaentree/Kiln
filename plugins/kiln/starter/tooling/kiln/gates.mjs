#!/usr/bin/env node
// gates — kiln's docs gates, run against any system's BUILT docs through the page contract
// (docs-engine/references/page-contract.md). Nothing here knows a system's class names; a gate that
// finds none of its markers fails with NOTHING FOUND. Component behaviour (keyboard, roles) is the
// system's own conformance suite; this file owns what every kiln docs site must be.
//
//   shell        G-P0 G-D3 G-S1 G-S2 G-S3 G-S5 G-S6 (nothing spills out of the page column)          copy        G-C1 G-C2
//   reading      G-R1 (size, leading, measure)      affordance  G-A1      loading  G-PF1 G-PF2
//   chrome       G-SH1 plain opaque shell; the system's look lives in demo stages only
//   foundations  G-F1 G-N1                          themes      G-T1
//   components   G-K1–G-K8 G-B1 G-L1 demo floor     reference   G-M1 G-IA1      a11y  axe ×2
//   identity     G-X1 habitual patterns (accent stripe, icon-disc alert) need a derivation that justifies them
//   diagrams     G-NT1 graphic parts ≥3:1 off their ground (WCAG 1.4.11)
//   benchmarks   G-BT1 every reference topic for a page covered or declined (benchmarks/topics)
//   reasons      G-W1 (Why column, component reasons section; data from rationale.mjs)
//   claims       G-CL1 every hex in the book is a current token value
//   non-text     G-NT2 form-control edges ≥3:1 in every theme · G-NR1 flyout rows nest the flyout's corner
//   inset        G-IN1 text inside a control ≥8px (and ≥ half the end radius) from the control's edge
//   travel       G-SL1 a slider ≥200px long, and it and its pane keep their size from Home to End
//   states       G-SV1 every promised state is present, visible and announced (state matrix)
//   material     G-MT1 one material per screen, no glass beside solid · G-GR1 glass uses the shared recipe
//   surfaces     G-BR1 a bare subject paints its surface; no live text straight on the photo
//   mesh         G-MS1 a mesh gradient covers at most 10% of its region, never a wallpaper
//   anchor       G-AN1 the card's body and rim stay within set deltas of the locked anchor
//   icons        G-IC1 every icon in a component is drawn at a size
//   overlap      G-OV1 neighbours in a demo never overlap
//   leaks        G-LK1 page styles never reach inside a component (clone outside main, compare layout)
//   nesting      G-NC1 a shape near a rounded parent's corner nests it (even inset, inner = outer − inset)
//   text fields  G-TX1 fields hold Thai marks and keep their size while typing
//   glow         G-GL1 only [data-glow] parts emit light in dark, visibly and within reach; text never; nothing in light
//   rhythm       G-RH1 a stage and a tab bar ≥24px from neighbouring blocks (own code/caption/heading ≥8, intro ≥16)
//   address      G-ST1 no default written into the URL; stale or unknown values fall back and are dropped
//   stack        G-EL1 stacked glass levels a measured step apart, a scrim under an overlay
//   install      G-PWA1 installable app: manifest, 192/512/maskable icons, service worker, offline page
//   milestone    G-TODO1 no starter placeholder or seed reason left · G-PUB1 no registry install of an unpublished package   reach  G-NAV1 G-SM1   touch  G-TT1
//
// Usage: node tooling/engine/gates.mjs [--only G-K2,G-K3] [--report]
//   --report  also writes system/reports/docs-audit-{date}.md, a ranked punch list
// Writes <app>/public/gates.json. Exit 1 on any failed gate.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { docsConfig, routes, componentPages, url, routeFilter } from './config.mjs';
import { serveDist } from './serve-dist.mjs';
import { glassCssProblems, glassRecipeProbe, bareSurfaceProbe, meshShareProbe, cardStats, anchorDrift } from './surface-probes.mjs';

const C = docsConfig();
const ROUTES = routeFilter(routes(C));
const COMPONENTS = componentPages(C).filter((pg) => ROUTES.some((r) => r === pg.path || r.startsWith(`${pg.path}/`)));
const META = existsSync(C.abs(C.meta)) ? JSON.parse(readFileSync(C.abs(C.meta), 'utf8')) : { components: {} };
const BENCH = C.benchmark && existsSync(C.abs(C.benchmark)) ? JSON.parse(readFileSync(C.abs(C.benchmark), 'utf8')).components : {};
const ONLY = process.argv.includes('--only') ? new Set(process.argv[process.argv.indexOf('--only') + 1].split(',')) : null;
const THEME = C.themes[0];
const SCENE = C.scenes[0];
// what marks a component that paints its own surface (G-MT1, G-BR1, G-AN1). Generic [data-surface]; a system
// that names it differently sets docs.surfaceSelector (an older system keeps its own attribute this way).
const SURFACE = C.surfaceSelector ?? '[data-surface]';

const results = [];
// Sharding: `--shard k/n` runs every n-th gate (from k) and writes its results for `--merge n`, so
// gates-run.mjs can run n browsers side by side and the full set finishes in a fraction of the time.
const SHARD = process.argv.includes('--shard') ? process.argv[process.argv.indexOf('--shard') + 1].split('/').map(Number) : null;
const MERGE = process.argv.includes('--merge') ? Number(process.argv[process.argv.indexOf('--merge') + 1]) : null;
const shardFile = (k) => path.join(C.root, 'system', 'reports', `.gates-shard-${k}.json`);
let gateIndex = -1;
async function gate(id, name, fn) {
  gateIndex++;
  if (MERGE != null) return;
  if (SHARD && gateIndex % SHARD[1] !== SHARD[0]) return;
  if (ONLY && !ONLY.has(id)) return;
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ id, name, ok: true, detail: typeof detail === 'string' ? detail : undefined, order: gateIndex });
  } catch (e) {
    const msg = String(e.message ?? e).split('\n')[0];
    // a run limited to some routes (KILN_ROUTES, verify --changed) skips a gate whose subject is not among them
    if (process.env.KILN_ROUTES && /^NO [A-Z]/.test(msg)) results.push({ id, name, ok: true, skipped: true, detail: `skipped: nothing it checks is in the limited routes`, order: gateIndex });
    else results.push({ id, name, ok: false, detail: msg, problems: e.problems, order: gateIndex });
  }
  // progress as each gate finishes; the full table still prints at the end
  const r = results.at(-1);
  console.log(`  ${r.ok ? 'pass' : 'FAIL'} ${id} (${Math.round((Date.now() - t0) / 1000)}s)${r.ok ? '' : `: ${r.detail.slice(0, 120)}`}`);
}
// Fail with a list: the punch list keeps every item, the console shows the first few.
function fail(problems, what = 'problems') {
  if (!problems.length) return;
  const e = new Error(`${problems.length} ${what}: ${problems.slice(0, 4).join(' | ')}`);
  e.problems = problems;
  throw e;
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
async function eventually(read, want, msg, ms = 1500) {
  const end = Date.now() + ms; let got;
  while (Date.now() < end) { if ((got = await read()) === want) return; await new Promise((r) => setTimeout(r, 25)); }
  throw new Error(`${msg} (got ${got})`);
}
const tabRoute = (slug, tab) => `${C.componentsBase}/${slug}/${tab}`;
const hasTabs = (pg) => Array.isArray(pg.tabs) && pg.tabs.length > 0;
const usageRoute = (pg) => (hasTabs(pg) ? tabRoute(pg.slug, 'usage') : pg.path);
const metaOf = (pg) => META.components[pg.title] ?? META.components[pg.slug.replace(/(^|-)(\w)/g, (_, __, ch) => ch.toUpperCase())];

const srv = await serveDist(C.abs(C.dist));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
// folded sections are opened before anything is measured, so every check sees all of a page's content
const unfold = (pg) => pg.evaluate(() => { for (const d of document.querySelectorAll('details')) d.open = true; });
const go = async (route, opts = {}) => { const r = await page.goto(url(srv.base, route, { theme: THEME, scene: SCENE, ...opts }, C), { waitUntil: 'networkidle' }); await unfold(page); return r; };

try {
  // ------------------------------------------------------------------ shell
  await gate('G-P0', 'every page renders: a <main>, a heading and no uncaught error', async () => {
    const bad = [];
    const errs = [];
    const onErr = (e) => errs.push(String(e.message ?? e).slice(0, 80));
    page.on('pageerror', onErr);
    try {
      for (const r of ROUTES) {
        errs.length = 0;
        await go(r);
        const ok = await page.evaluate(() => !!document.querySelector('main h1'));
        if (!ok || errs.length) bad.push(`${r}: ${ok ? '' : 'no main h1 (page crashed?) '}${errs.join(' / ')}`.trim());
      }
    } finally { page.off('pageerror', onErr); }
    fail(bad, 'broken pages');
    return `${ROUTES.length} pages`;
  });
  await gate('G-D3', 'no literal backtick in rendered text', async () => {
    const bad = [];
    for (const r of ROUTES) {
      await go(r);
      const hits = await page.evaluate(() => { if (!document.querySelector('main')) return ['NO MAIN, see G-P0']; const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); const out = []; for (let n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.includes('`') && !n.parentElement.closest('pre, code')) out.push(n.textContent.trim().slice(0, 40)); return out; });
      hits.forEach((h) => bad.push(`${r}: ${h}`));
    }
    fail(bad, 'backticks');
    return `${ROUTES.length} pages`;
  });

  await gate('G-S1', 'a chapter opens as a new page at the top with its heading focused (375/768/1280px)', async () => {
    const target = COMPONENTS[0] ?? null;
    expect(target, 'NO COMPONENT PAGE FOUND to navigate to');
    const out = [];
    for (const w of [375, 768, 1280]) {
      await page.setViewportSize({ width: w, height: 800 });
      await go('/');
      await page.evaluate(() => scrollTo({ top: 600, behavior: 'instant' }));
      const menu = page.locator('button[data-menu-toggle]');
      if (await menu.isVisible()) { await menu.click(); await page.waitForTimeout(150); }
      // a folding nav may hide the link in a closed part: open its folds first, as a reader would
      await page.evaluate((t) => { const a = [...document.querySelectorAll('nav[data-book-nav] a')].find((x) => x.textContent.trim() === t || x.firstChild?.textContent?.trim() === t); for (let el = a?.parentElement; el; el = el.parentElement) if (el.hidden || el.inert) { const b = document.querySelector(`[aria-controls="${el.id}"]`); b?.click(); } }, target.title);
      await page.waitForTimeout(150);
      // the exact name first: a substring match finds ButtonGroup before Button once both exist (a New badge stops exact matching, so fall back)
      const exact = page.locator('nav[data-book-nav]').getByRole('link', { name: target.title, exact: true });
      await ((await exact.count()) ? exact : page.locator('nav[data-book-nav]').getByRole('link', { name: new RegExp(`^${target.title}\\b(?!\\w)`) })).first().click();
      await eventually(() => page.locator('#page-title').textContent(), target.title, `heading did not change at ${w}px`);
      await page.waitForTimeout(100);
      const st = await page.evaluate(() => { const h = document.getElementById('page-title'); const r = h.getBoundingClientRect(); return { y: scrollY, top: r.top, vh: innerHeight, focused: document.activeElement === h }; });
      if (!(st.y === 0 && st.top >= 0 && st.top < st.vh * 0.5 && st.focused)) out.push(`${w}px: scrollY ${st.y}, top ${Math.round(st.top)}, focused ${st.focused}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    fail(out, 'widths');
  });

  await gate('G-S2', 'on narrow screens Esc closes the menu and returns focus to the Menu button', async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    await go('/');
    const menu = page.locator('button[data-menu-toggle]');
    expect(await menu.count(), 'NO MENU BUTTON FOUND ([data-menu-toggle])');
    await menu.click();
    await page.keyboard.press('Escape');
    await eventually(() => page.evaluate(() => document.activeElement?.hasAttribute('data-menu-toggle') ?? false), true, 'focus did not return to Menu');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  await gate('G-S3', 'no two surfaces touch (<8px) or overlap, every page, 375 and 1280px', async () => {
    const bad = [];
    let seen = 0;
    for (const w of [375, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const r of ROUTES) {
        await go(r);
        const res = await page.evaluate(() => {
          const s = [...document.querySelectorAll('main [data-surface]')].filter((c) => c.getBoundingClientRect().width > 0);
          const out = [];
          for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
            const a = s[i], b = s[j];
            if (a.contains(b) || b.contains(a)) continue;
            const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            const gap = Math.max(Math.max(rb.left - ra.right, ra.left - rb.right), Math.max(rb.top - ra.bottom, ra.top - rb.bottom));
            if (gap < 8) out.push(`${(a.textContent || '').trim().slice(0, 16)} ↔ ${(b.textContent || '').trim().slice(0, 16)} (${Math.round(gap)}px)`);
          }
          return { n: s.length, out };
        });
        seen += res.n;
        res.out.forEach((h) => bad.push(`${w}px ${r}: ${h}`));
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(seen > 0, 'NO SURFACES FOUND ([data-surface])');
    fail(bad, 'collisions');
  });

  await gate('G-S5', 'a new chapter is fully visible on its first painted frame with motion on', async () => {
    const free = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await free.newPage();
    await p2.goto(url(srv.base, '/', { theme: THEME, scene: SCENE }, C), { waitUntil: 'networkidle' });
    const bad = [];
    for (const pg of COMPONENTS.slice(0, 3)) {
      const fading = await p2.evaluate(async (n) => {
        const link = [...document.querySelectorAll('nav[data-book-nav] a')].find((a) => a.textContent.trim() === n || a.firstChild?.textContent?.trim() === n); // a link may carry a New badge after its name
        if (!link) return -1;
        link.click();
        while (document.getElementById('page-title')?.textContent !== n) await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        // an aria-hidden affordance held at opacity 0 until hover (a heading's # link) is not content fading in
        const els = [...document.querySelectorAll('main *')].filter((e) => { const b = e.getBoundingClientRect(); const o = Number(getComputedStyle(e).opacity); return b.top < innerHeight && b.bottom > 0 && o < 1 && !(o === 0 && e.closest('[aria-hidden="true"]')) && !e.closest('[data-example-live], :disabled'); });
        return els.length ? `${els.length} elements below full opacity, first <${els[0].tagName.toLowerCase()} class="${els[0].className}">` : 0;
      }, pg.title);
      if (fading) bad.push(`${pg.title}: ${fading === -1 ? 'no nav link' : fading}`);
    }
    await free.close();
    fail(bad, 'chapters');
  });

  // ------------------------------------------------------------------ reading, affordance, loading
  await gate('G-R1', 'long-form text is readable: ≥16px, line height ≥1.5, lines ≤ 80 characters', async () => {
    const bad = []; let n = 0;
    for (const r of ROUTES) {
      await go(r);
      const res = await page.evaluate(() => [...document.querySelectorAll('main p')].filter((p) => p.textContent.trim().split(/\s+/).length >= 20 && !p.closest('[data-example-live], [data-cell], pre, table')).map((p) => {
        const cs = getComputedStyle(p); const fs = parseFloat(cs.fontSize); const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
        // real characters per line: lay the text out, group its line boxes, and scale the character
        // count by the widest line's share of the total text width
        // (text nodes only: a range over elements returns each inline element's box as well, counted twice)
        const rows = new Map();
        const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        for (let t = tw.nextNode(); t; t = tw.nextNode()) { const range = document.createRange(); range.selectNodeContents(t); for (const r of range.getClientRects()) { const k = Math.round(r.top / 4); rows.set(k, (rows.get(k) ?? 0) + r.width); } }
        const widths = [...rows.values()]; const total = widths.reduce((a, b) => a + b, 0);
        const ch = widths.length > 1 ? (p.textContent.trim().length * Math.max(...widths)) / total : 0;
        return { fs, lh: lh / fs, ch: Math.round(ch), t: p.textContent.trim().slice(0, 30) };
      }));
      n += res.length;
      for (const x of res) if (x.fs < 16 || x.lh < 1.5 || x.ch > 80) bad.push(`${r} "${x.t}": ${x.fs}px, ${x.lh.toFixed(2)} leading, ~${x.ch} ch`);
    }
    expect(n > 0, 'NO LONG PARAGRAPHS FOUND');
    fail(bad, 'paragraphs');
  });

  await gate('G-A1', 'in the nav, what you can press looks different from what you cannot, and reacts to hover', async () => {
    await go('/');
    const r = await page.evaluate(() => {
      const nav = document.querySelector('nav[data-book-nav]');
      const link = nav?.querySelector('a:not([aria-current])'); const title = nav?.querySelector('[data-nav-part]');
      if (!link || !title) return { missing: true };
      const a = getComputedStyle(link), t = getComputedStyle(title);
      const diffs = ['fontSize', 'fontWeight', 'textTransform', 'color', 'letterSpacing'].filter((k) => a[k] !== t[k]);
      return { diffs, titleCursor: t.cursor, titleInteractive: !!title.closest('a, button'), titleDisclosure: !!title.closest('button[aria-expanded]') };
    });
    expect(!r.missing, 'NO NAV LINK OR PART TITLE FOUND ([data-nav-part])');
    const link = page.locator('nav[data-book-nav] a:not([aria-current])').first();
    const before = await link.evaluate((e) => { const c = getComputedStyle(e); return `${c.backgroundColor}|${c.color}|${c.textDecorationLine}|${c.boxShadow}`; });
    await link.hover(); await page.waitForTimeout(500);
    const after = await link.evaluate((e) => { const c = getComputedStyle(e); return `${c.backgroundColor}|${c.color}|${c.textDecorationLine}|${c.boxShadow}`; });
    const bad = [];
    if (r.diffs.length < 2) bad.push(`links and part titles differ only in ${r.diffs.join(', ') || 'nothing'}`);
    // a folding nav (Pane NavTree) makes part titles disclosure buttons: allowed when they say they open with aria-expanded
    if ((r.titleCursor === 'pointer' || r.titleInteractive) && !r.titleDisclosure) bad.push('part title looks pressable');
    if (before === after) bad.push('links do not react to hover');
    fail(bad, 'problems');
    return `differ in ${r.diffs.join(', ')}`;
  });

  await gate('G-PF1', 'the first painted frame is the final page: right theme, all content, no layout shift', async () => {
    const bad = [];
    for (const theme of C.themes) for (const r of [ROUTES[0], ...COMPONENTS.slice(0, 2).map(usageRoute), ROUTES.find((x) => x.startsWith(`${C.foundationsBase}/`))].filter(Boolean)) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme === 'light' ? 'light' : 'dark' });
      const p = await c.newPage();
      await p.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
        const tick = () => { const m = document.querySelector('main'); if (m && m.children.length) window.__first = { theme: document.documentElement.dataset.theme, text: m.innerText.length }; else requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
      await p.goto(url(srv.base, r, { theme, scene: SCENE }, C), { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      const m = await p.evaluate(() => ({ first: window.__first, theme: document.documentElement.dataset.theme, text: document.querySelector('main').innerText.length, cls: window.__cls }));
      await c.close();
      if (!m.first) { bad.push(`${theme} ${r}: main never painted`); continue; }
      if (m.first.theme !== m.theme) bad.push(`${theme} ${r}: first frame ${m.first.theme}, then ${m.theme}`);
      if (m.first.text < m.text * 0.98) bad.push(`${theme} ${r}: first frame had ${Math.round((m.first.text / m.text) * 100)}% of the text`);
      if (m.cls > 0.02) bad.push(`${theme} ${r}: layout shift ${m.cls.toFixed(3)}`);
    }
    fail(bad, 'pages');
  });

  await gate('G-PF2', 'page weight: no image over 300 kB, no page over 1.5 MB transferred (gzip counted)', async () => {
    const bad = [];
    for (const r of ROUTES) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await c.newPage();
      const sizes = [];
      p.on('response', async (res) => { try { const b = await res.body(); const gz = /javascript|css|json|html|svg/.test(res.headers()['content-type'] ?? ''); sizes.push({ url: res.url(), bytes: gz ? Math.round(b.length * 0.3) : b.length, image: /image\//.test(res.headers()['content-type'] ?? '') }); } catch {} });
      await p.goto(url(srv.base, r, { theme: THEME, scene: SCENE }, C), { waitUntil: 'networkidle' });
      await c.close();
      for (const s of sizes.filter((x) => x.image && x.bytes > 300 * 1024)) bad.push(`${r}: ${s.url.split('/').pop()} ${Math.round(s.bytes / 1024)} kB`);
      const total = sizes.reduce((n, s) => n + s.bytes, 0);
      if (total > 1.5 * 1024 * 1024) bad.push(`${r}: ${Math.round(total / 1024)} kB total`);
    }
    fail([...new Set(bad)], 'over budget');
  });

  await gate('G-SH1', 'the docs chrome is plain and opaque: no blur or see-through surface outside demo stages', async () => {
    const bad = [];
    for (const r of ROUTES) {
      await go(r);
      const hits = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('body *')) {
          if (e.closest('[data-example-live], [data-cell], [data-preview], [data-harness]')) continue;
          const cs = getComputedStyle(e);
          if ((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')) out.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} blurs what is behind it`);
        }
        const bg = getComputedStyle(document.body).backgroundColor;
        const a = bg.match(/rgba?\(([^)]+)\)/)?.[1].split(',').map(Number)[3] ?? 1;
        if (a < 1 || bg === 'transparent') out.push(`page background is see-through (${bg})`);
        return [...new Set(out)].slice(0, 5);
      });
      hits.forEach((h) => bad.push(`${r}: ${h}`));
    }
    fail(bad, 'chrome problems');
  });

  // ------------------------------------------------------------------ copy
  await gate('G-C1', 'every code block has a Copy button you can see', async () => {
    const bad = []; let n = 0;
    for (const r of ROUTES) {
      await go(r);
      const res = await page.evaluate(() => [...document.querySelectorAll('main pre')].map((p) => {
        const btn = p.closest('[data-codeblock]')?.querySelector('button[data-copy]');
        if (!btn) return 'no copy button';
        const b = btn.getBoundingClientRect(), cs = getComputedStyle(btn);
        return b.width > 0 && b.height > 0 && Number(cs.opacity) === 1 && cs.visibility === 'visible' ? null : 'copy button hidden';
      }));
      n += res.length;
      res.forEach((e, i) => e && bad.push(`${r} pre#${i}: ${e}`));
    }
    expect(n > 0, 'NO CODE BLOCKS FOUND');
    fail(bad, 'code blocks');
    return `${n} code blocks`;
  });

  await gate('G-C2', 'Copy puts the whole snippet on the clipboard, including hidden lines', async () => {
    const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const p = await c2.newPage();
    try {
      let tested = 0;
      for (const r of ROUTES) {
        await p.goto(url(srv.base, r, { theme: THEME, scene: SCENE }, C), { waitUntil: 'networkidle' });
        const idx = await p.evaluate(() => [...document.querySelectorAll('main [data-codeblock]')].findIndex((b) => b.querySelector('pre[data-clipped]')));
        if (idx < 0) continue;
        const block = p.locator('main [data-codeblock]').nth(idx);
        const shown = (await block.locator('pre').innerText()).trim().split('\n').length;
        await block.locator('button[data-copy]').click();
        const got = await p.evaluate(() => navigator.clipboard.readText());
        expect(got.split('\n').length > shown, `${r}: clipboard has ${got.split('\n').length} lines, preview shows ${shown}`);
        tested++;
        break;
      }
      expect(tested, 'NO CLIPPED CODE BLOCK FOUND (pre[data-clipped]) to test with');
    } finally { await c2.close(); }
  });

  // ------------------------------------------------------------------ foundations
  const FOUNDATIONS = ROUTES.filter((r) => r.startsWith(`${C.foundationsBase}/`));
  await gate('G-F1', 'every foundation page has a playground whose first control changes its preview', async () => {
    expect(FOUNDATIONS.length, `NO FOUNDATION PAGES FOUND under ${C.foundationsBase}/`);
    const bad = [];
    for (const r of FOUNDATIONS) {
      await go(r);
      const pg = page.locator('main [data-playground]').first();
      if (!(await pg.count())) { bad.push(`${r}: no playground`); continue; }
      const preview = pg.locator('[data-preview]');
      if (!(await preview.count())) { bad.push(`${r}: playground has no [data-preview]`); continue; }
      const before = await preview.evaluate((e) => e.outerHTML);
      const ctl = pg.locator('[data-controls] :is(input, select, [role="slider"], [role="combobox"])').first();
      if (!(await ctl.count())) { bad.push(`${r}: no control`); continue; }
      const kind = await ctl.evaluate((e) => e.getAttribute('role') ?? (e.tagName === 'SELECT' ? 'select' : e.type));
      // system components are driven the way a reader drives them: keys on a slider, open and pick on a combobox
      if (kind === 'slider') { await ctl.focus(); const at = await ctl.getAttribute('aria-valuenow'); await page.keyboard.press(at === (await ctl.getAttribute('aria-valuemax')) ? 'Home' : 'End'); }
      else if (kind === 'combobox') { await ctl.click(); await page.waitForTimeout(150); const opt = page.locator('[role="option"]:not([aria-selected="true"]):not([data-disabled])').first(); if (await opt.count()) await opt.click(); else await page.keyboard.press('Escape'); }
      else if (kind === 'select') { const opts = await ctl.evaluate((e) => [...e.options].map((o) => o.value)); const cur = await ctl.inputValue(); await ctl.selectOption(opts.find((o) => o !== cur)); }
      else if (kind === 'range') await ctl.evaluate((e) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, String(Number(e.value) === Number(e.min) ? e.max : e.min)); e.dispatchEvent(new Event('input', { bubbles: true })); });
      else await ctl.fill('kiln');
      await page.waitForTimeout(50);
      if ((await preview.evaluate((e) => e.outerHTML)) === before) bad.push(`${r}: preview did not change`);
    }
    fail(bad, 'pages');
    return `${FOUNDATIONS.length} pages`;
  });

  await gate('G-N1', 'every select, slider, checkbox and radio on the docs is one of the system\'s own components, never a browser control', async () => {
    const bad = []; let n = 0;
    for (const theme of C.themes) for (const r of ROUTES) {
      await go(r, { theme });
      const res = await page.evaluate(() => {
        const visible = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 2 && b.height > 2 && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
        const out = [];
        // a visible native <select> always opens the operating system's menu, which cannot be styled
        for (const e of document.querySelectorAll('select')) if (visible(e)) out.push('native <select> (opens the OS menu)');
        // sliders, checkboxes and radios count only when a system component renders them
        for (const e of document.querySelectorAll('input[type="range"], input[type="checkbox"], input[type="radio"], [role="slider"], [role="combobox"], [role="checkbox"], [role="switch"]')) {
          if (!visible(e) && !e.matches('[role]')) continue;
          if (!e.closest('[data-component]')) out.push(`${e.getAttribute('role') ?? e.type} not rendered by a system component`);
        }
        return { n: document.querySelectorAll('[data-component]').length, out };
      });
      n += res.n;
      res.out.forEach((x) => bad.push(`${theme} ${r}: ${x}`));
    }
    expect(n > 0, 'NO SYSTEM CONTROLS FOUND ([data-component])');
    fail([...new Set(bad)], 'controls');
  });

  // ------------------------------------------------------------------ themes
  await gate('G-T1', 'the theme control switches tokens and the evidence covers every theme', async () => {
    expect(C.themes.length >= 2, `only ${C.themes.length} theme configured`);
    await go('/');
    const ctl = page.locator('[data-theme-control]');
    expect(await ctl.count(), 'NO THEME CONTROL FOUND ([data-theme-control])');
    const snap = () => page.evaluate(() => { const cs = getComputedStyle(document.body); return `${cs.color}|${cs.backgroundColor}|${getComputedStyle(document.querySelector('[data-surface]') ?? document.body).backgroundColor}`; });
    const seen = new Set();
    for (const t of C.themes) { await ctl.locator(`button[data-theme-value="${t}"]`).click(); await page.waitForTimeout(80); seen.add(await snap()); }
    expect(seen.size === C.themes.length, `switching ${C.themes.join('/')} changed nothing visible`);
    const evFile = path.join(C.abs(C.app), 'public', 'evidence.json');
    expect(existsSync(evFile), 'no evidence.json, contrast never measured');
    const ev = JSON.parse(readFileSync(evFile, 'utf8'));
    const missing = C.themes.filter((t) => !(ev.themes ?? []).includes(t));
    expect(!missing.length, `evidence has no run for ${missing.join(', ')}`);
  });

  // ------------------------------------------------------------------ components
  await gate('G-K1', 'every component has its tab routes and a shared header with status, last updated and a live demo with theme and variant selectors', async () => {
    expect(COMPONENTS.length, 'NO COMPONENT PAGES FOUND');
    const bad = [];
    for (const pg of COMPONENTS) {
      if (!hasTabs(pg)) { bad.push(`${pg.title}: no tabs (wants ${C.tabs.join(', ')})`); continue; }
      const missingTabs = C.tabs.filter((t) => !pg.tabs.includes(t));
      if (missingTabs.length) bad.push(`${pg.title}: missing tab ${missingTabs.join(', ')}`);
      await go(tabRoute(pg.slug, pg.tabs[0]));
      const h = await page.evaluate(() => {
        const head = document.querySelector('[data-component-header]');
        if (!head) return 'no [data-component-header]';
        const miss = ['status', 'updated'].filter((f) => !head.querySelector(`[data-fact="${f}"]`));
        const demo = head.querySelector('[data-live-demo]');
        if (!demo) miss.push('live demo');
        // any element: a system draws its own selects (G-N1), so a native <select> is not required
        else for (const s of ['theme', 'variant']) if (!demo.querySelector(`[data-selector="${s}"]`)) miss.push(`${s} selector`);
        return miss.length ? `missing ${miss.join(', ')}` : null;
      });
      if (h) bad.push(`${pg.title}: ${h}`);
    }
    fail(bad, 'components');
  });

  // The usage-tab gates share one visit per component.
  const usage = {};
  if (!ONLY || ['G-K2', 'G-K3', 'G-K4', 'G-K6', 'G-K7', 'G-K8'].some((g) => ONLY.has(g))) for (const pg of COMPONENTS) {
    await go(usageRoute(pg));
    usage[pg.title] = await page.evaluate(() => {
      const reg = {};
      for (let i = 1; i <= 14; i++) {
        const el = document.querySelector(`[data-registry="U${i}"]`);
        reg[`U${i}`] = !el ? 'missing' : el.hasAttribute('data-na') ? (el.textContent.trim().split(/\s+/).length >= 4 ? 'na' : 'na-without-reason') : (el.textContent.trim().split(/\s+/).length >= 12 || el.querySelector('[data-example], [data-do], table') ? 'ok' : 'empty');
      }
      const rows = (u) => [...document.querySelectorAll(`[data-registry="${u}"] tbody tr[data-option]`)].map((r) => r.dataset.option);
      const dives = [...document.querySelectorAll('[data-registry="U12"] [data-deep-dive]')].map((d) => ({ option: d.dataset.deepDive, context: !!d.querySelector('[data-in-context] *'), do: !!d.querySelector('[data-do] *'), dont: !!d.querySelector('[data-dont] *') }));
      const main = document.querySelector('main').cloneNode(true);
      main.querySelectorAll('pre, code, [data-example-live], [data-cell], [data-facts], nav').forEach((n) => n.remove());
      const words = main.textContent.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      const sections = document.querySelectorAll('main h2, main h3').length;
      const refs = [...document.querySelectorAll('[data-registry="U14"] a[data-reference][href^="http"]')].length;
      const rtl = [...document.querySelectorAll('[data-registry="U10"] [dir="rtl"]')].filter((e) => e.getBoundingClientRect().width > 0).length;
      const overflow = [...document.querySelectorAll('[data-overflow-demo]')].map((e) => e.scrollWidth <= e.clientWidth + 1);
      return { reg, variants: rows('U4'), sizes: rows('U6'), dives, words, sections, refs, rtl, overflow };
    });
  }

  await gate('G-K2', 'every Usage section U1–U14 is present, or says why it does not apply', async () => {
    const bad = [];
    for (const [name, u] of Object.entries(usage)) for (const [k, v] of Object.entries(u.reg)) if (v !== 'ok' && v !== 'na') bad.push(`${name} ${k}: ${v}`);
    expect(Object.keys(usage).length, 'NO USAGE TABS VISITED');
    fail(bad, 'sections');
  });

  await gate('G-K3', 'the variants and sizes tables have one row per option the props declare', async () => {
    const bad = [];
    for (const pg of COMPONENTS) {
      const m = metaOf(pg); const u = usage[pg.title];
      if (!m || !u) { bad.push(`${pg.title}: ${m ? 'no usage tab' : 'no meta'}`); continue; }
      const kindOptions = Object.values(m.kinds ?? {}).flat();
      const missV = kindOptions.filter((o) => !u.variants.includes(o));
      const missS = (m.sizes ?? []).filter((o) => !u.sizes.includes(o));
      if (missV.length) bad.push(`${pg.title} variants table lacks ${missV.join(', ')}`);
      if (missS.length) bad.push(`${pg.title} sizes table lacks ${missS.join(', ')}`);
    }
    fail(bad, 'tables');
  });

  await gate('G-K4', 'every variant option has a deep dive with a live in-context example and a live do/don\'t', async () => {
    const bad = [];
    for (const pg of COMPONENTS) {
      const m = metaOf(pg); const u = usage[pg.title];
      if (!m || !u) continue;
      for (const o of Object.values(m.kinds ?? {}).flat()) {
        const d = u.dives.find((x) => x.option === o);
        if (!d) bad.push(`${pg.title} ${o}: no deep dive`);
        else { const miss = ['context', 'do', 'dont'].filter((k) => !d[k]); if (miss.length) bad.push(`${pg.title} ${o}: missing ${miss.join(', ')}`); }
      }
    }
    fail(bad, 'deep dives');
  });

  await gate('G-K5', 'the Style tab is generated: every spec cell names its token and value', async () => {
    const bad = [];
    for (const pg of COMPONENTS) {
      if (!hasTabs(pg) || !pg.tabs.includes('style')) { bad.push(`${pg.title}: no style tab`); continue; }
      await go(tabRoute(pg.slug, 'style'));
      // a property left at its default (opacity 1, auto, normal, transparent, none) is not a design value, so it needs no token
      const r = await page.evaluate(() => { const DEF = new Set(['1', 'auto', 'normal', 'none', 'transparent', 'rgba(0, 0, 0, 0)', '0px', 'ease', '0s']); const cells = [...document.querySelectorAll('[data-spec] [data-value]')].filter((c) => !DEF.has(c.dataset.value)); return { cells: cells.length, untokened: cells.filter((c) => !c.dataset.token).length }; });
      if (!r.cells) bad.push(`${pg.title}: no [data-spec] cells`);
      else if (r.untokened / r.cells > 0.1) bad.push(`${pg.title}: ${r.untokened}/${r.cells} spec values without a token`);
    }
    fail(bad, 'style tabs');
  });

  await gate('G-K6', `usage depth ≥ ${C.depthRatio} × the Carbon page for the same component (words and sections)`, async () => {
    const bad = []; const report = [];
    for (const [name, u] of Object.entries(usage)) {
      const b = BENCH[name];
      if (!b?.words) { report.push(`${name} ${u.words}w/${u.sections}s (no benchmark)`); continue; }
      const rw = u.words / b.words, rs = u.sections / b.sections;
      report.push(`${name} ${u.words}/${b.words}w ${u.sections}/${b.sections}s`);
      if (rw < C.depthRatio || rs < C.depthRatio) bad.push(`${name}: ${u.words} words (${Math.round(rw * 100)}%), ${u.sections} sections (${Math.round(rs * 100)}%) of Carbon's ${b.words}/${b.sections}`);
    }
    expect(Object.keys(usage).length, 'NO USAGE TABS VISITED');
    fail(bad, 'components below depth');
    return report.join(' · ');
  });

  await gate('G-K7', 'every component cites at least two external references', async () => {
    fail(Object.entries(usage).filter(([, u]) => u.refs < 2).map(([n, u]) => `${n}: ${u.refs}`), 'components');
  });

  await gate('G-K8', 'every component shows a live RTL render and a live overflow render that is not clipped', async () => {
    const bad = [];
    for (const [n, u] of Object.entries(usage)) {
      if (u.reg.U10 === 'na') continue;
      if (!u.rtl) bad.push(`${n}: no visible dir="rtl" demo`);
      if (!u.overflow.length) bad.push(`${n}: no [data-overflow-demo]`);
      else if (u.overflow.some((ok) => !ok)) bad.push(`${n}: overflow demo is clipped`);
    }
    fail(bad, 'components');
  });

  await gate('G-B1', 'every component is shown in every theme over a dark and a bright scene', async () => {
    const bad = [];
    for (const pg of COMPONENTS) {
      await go(hasTabs(pg) && pg.tabs.includes('style') ? tabRoute(pg.slug, 'style') : pg.path);
      const r = await page.evaluate((themes) => {
        const box = document.querySelector('[data-backdrops]');
        if (!box) return 'no [data-backdrops]';
        const cells = [...box.querySelectorAll('[data-cell]')].map((c) => `${c.dataset.theme}/${c.dataset.sceneKind}`);
        const want = themes.flatMap((t) => ['dark', 'bright'].map((k) => `${t}/${k}`));
        const miss = want.filter((w) => !cells.includes(w));
        // guidance only: text inside a demo cell is the demo talking, not the page explaining what changes
        const prose = [...box.querySelectorAll('p')].filter((p) => !p.closest('[data-cell]')).map((p) => p.textContent).join(' ').split(/\s+/).filter(Boolean).length;
        return [miss.length ? `missing ${miss.join(', ')}` : null, prose >= 12 ? null : 'no text saying what changes'].filter(Boolean).join('; ') || null;
      }, C.themes);
      if (r) bad.push(`${pg.title}: ${r}`);
    }
    fail(bad, 'components');
  });

  await gate('G-L1', 'every component states status, its own change history, limitations and the app\'s accessibility duties', async () => {
    const bad = [];
    for (const pg of COMPONENTS) {
      const seen = { status: false, history: false, limitations: false, duties: false };
      for (const r of hasTabs(pg) ? pg.tabs.map((t) => tabRoute(pg.slug, t)) : [pg.path]) {
        await go(r);
        const s = await page.evaluate(() => ({ status: /\b(alpha|beta|stable|deprecated)\b/i.test(document.querySelector('[data-fact="status"]')?.textContent ?? ''), history: document.querySelectorAll('[data-history] tbody tr').length > 0, limitations: document.querySelectorAll('[data-limitations] li').length > 0, duties: document.querySelectorAll('[data-a11y-duties] li').length > 0 }));
        for (const k of Object.keys(seen)) seen[k] ||= s[k];
      }
      const miss = Object.entries(seen).filter(([, v]) => !v).map(([k]) => k);
      if (miss.length) bad.push(`${pg.title}: no ${miss.join(', ')}`);
    }
    fail(bad, 'components');
  });

  await gate('demo-floor', 'each component has at least variant dimensions + 3 live demos', async () => {
    const bad = [];
    for (const pg of COMPONENTS) {
      const m = metaOf(pg); if (!m) { bad.push(`${pg.title}: no meta`); continue; }
      let n = 0;
      for (const r of hasTabs(pg) ? pg.tabs.map((t) => tabRoute(pg.slug, t)) : [pg.path]) { await go(r); n += await page.locator('main [data-example]').count(); }
      if (n < m.demoFloor) bad.push(`${pg.title}: ${n} < ${m.demoFloor}`);
    }
    fail(bad, 'components');
  });

  await gate('G-W1', 'reasons are on the page: token tables have a filled Why column and every component page explains its parts, states and motion', async () => {
    const bad = []; let cells = 0;
    for (const r of ROUTES) {
      await go(r);
      const res = await page.evaluate(() => ({ cells: document.querySelectorAll('td[data-why]').length, empty: [...document.querySelectorAll('td[data-why]')].filter((td) => td.textContent.trim().split(/\s+/).length < 6 || td.querySelector('.fail')).length }));
      cells += res.cells;
      if (res.empty) bad.push(`${r}: ${res.empty} token rows without a reason`);
    }
    expect(cells > 0, 'NO WHY COLUMN FOUND (td[data-why]) in any token table');
    for (const pg of COMPONENTS) {
      let found = false;
      for (const r of hasTabs(pg) ? pg.tabs.map((t) => tabRoute(pg.slug, t)) : [pg.path]) { await go(r); if (await page.locator('[data-reasons]:not(.fail)').count()) { found = true; break; } }
      if (!found) bad.push(`${pg.title}: no reasons section ([data-reasons])`);
    }
    fail(bad, 'gaps');
    return `${cells} token rows with reasons`;
  });

  // ------------------------------------------------------------------ generic patterns (AI slop)
  // Shapes every pattern library ships and every model reaches for first. Finding one is not wrong in
  // itself; finding one the component's derivation does not name and justify (why.json
  // allowed_patterns) means the form came from habit, not from the concept.
  const WHY = {};
  const compDir = C.abs(C.componentsDir);
  if (existsSync(compDir)) for (const n of readdirSync(compDir)) { const f = path.join(compDir, n, `${n}.why.json`); if (existsSync(f)) WHY[n] = JSON.parse(readFileSync(f, 'utf8')); }
  await gate('G-X1', 'no habitual pattern (accent stripe, tinted icon disc with bold title and muted body) unless the derivation names and justifies it', async () => {
    const bad = [];
    for (const theme of C.themes.slice(0, 1)) for (const r of ROUTES) {
      await go(r, { theme });
      const hits = await page.evaluate(() => {
        const out = [];
        const rgb = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
        const tinted = (c) => { const [r, g, b, a = 1] = rgb(c); if (a < 0.3) return false; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 0 && (mx - mn) / mx > 0.35; };
        const owner = (e) => e.closest('[data-component]')?.dataset.component ?? 'docs chrome';
        for (const e of document.querySelectorAll('main *, nav *, header *')) {
          const cs = getComputedStyle(e); const box = e.getBoundingClientRect();
          const big = box.width >= 40 && box.height >= 24;
          // accent stripe: a thick coloured edge on the start side only (border, inset shadow, or a pseudo-element bar)
          const bs = parseFloat(cs.borderInlineStartWidth), be = parseFloat(cs.borderInlineEndWidth);
          if (big && bs >= 3 && be <= 1 && tinted(cs.borderInlineStartColor)) out.push({ kind: 'accent-stripe', owner: owner(e) });
          if (big && /inset\s+[3-9]px\s+0(px)?\s+0/.test(cs.boxShadow) || /rgba?\([^)]*\)\s+[3-9]px\s+0px\s+0px\s+0px\s+inset/.test(cs.boxShadow)) out.push({ kind: 'accent-stripe', owner: owner(e) });
          if (big) for (const pseudo of ['::before', '::after']) {
            const p = getComputedStyle(e, pseudo);
            if (p.content === 'none' || p.position !== 'absolute') continue;
            const w = parseFloat(p.width), h = parseFloat(p.height);
            // a neutral hairline is a rule, such as a timeline's rail between its dots (Pane wave 7, 2026-10-29):
            // the trope is a thick or tinted bar, so a 1px untinted line is let through
            if (w <= 1 && !tinted(p.backgroundColor)) continue;
            if (w > 0 && w <= 8 && (h >= box.height * 0.6 || p.insetBlock === '0px' || (p.top === '0px' && p.bottom === '0px')) && (p.backgroundColor !== 'rgba(0, 0, 0, 0)' || p.backgroundImage !== 'none')) out.push({ kind: 'accent-stripe', owner: owner(e) });
          }
          // the alert trope: a small tinted disc with an icon, beside a bold title over muted text
          const r = parseFloat(cs.borderTopLeftRadius);
          if (box.width >= 20 && box.width <= 48 && Math.abs(box.width - box.height) < 2 && r >= box.width / 2 - 1 && tinted(cs.backgroundColor) && e.querySelector('svg')) {
            const sib = e.nextElementSibling;
            const texts = sib ? [...sib.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && x.textContent.trim()) : [];
            const weights = texts.map((x) => Number(getComputedStyle(x).fontWeight));
            if (weights.some((w) => w >= 600) && weights.some((w) => w < 600)) out.push({ kind: 'icon-disc-alert', owner: owner(e) });
          }
        }
        return out;
      });
      for (const h of hits) {
        const ok = WHY[h.owner]?.allowed_patterns?.[h.kind] && String(WHY[h.owner].allowed_patterns[h.kind]).split(/\s+/).length >= 12;
        if (!ok) bad.push(`${r}: ${h.kind} in ${h.owner}`);
      }
    }
    fail([...new Set(bad)], 'habitual patterns');
  });

  // ------------------------------------------------------------------ diagrams can be seen
  // WCAG 1.4.11: parts of a graphic that are needed to understand it stand at least 3:1 off their
  // ground. Diagrams mark their ground ([data-graphic-ground]) and parts ([data-graphic]); the gate
  // screenshots each diagram and compares the mean colour of every part with the mean of the ground
  // pixels no part covers.
  await gate('G-NT1', 'diagram parts stand at least 3:1 off their ground, in every theme (WCAG 1.4.11)', async () => {
    const { PNG } = await import('pngjs');
    const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const bad = []; let grounds = 0;
    for (const theme of C.themes) for (const r of ROUTES) {
      await go(r, { theme });
      const n = await page.locator('[data-graphic-ground]').count();
      for (let i = 0; i < n; i++) {
        const g = page.locator('[data-graphic-ground]').nth(i);
        await g.scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        const geo = await g.evaluate((el) => { const b = el.getBoundingClientRect(); return { box: { x: b.left, y: b.top, w: b.width, h: b.height }, parts: [...el.querySelectorAll('[data-graphic]')].map((p) => { const q = p.getBoundingClientRect(); return { kind: p.dataset.graphic, x: q.left - b.left, y: q.top - b.top, w: q.width, h: q.height }; }) }; });
        if (!geo.parts.length || geo.box.w < 4) continue;
        grounds++;
        const png = PNG.sync.read(await page.screenshot({ clip: { x: geo.box.x, y: geo.box.y, width: geo.box.w, height: geo.box.h } }));
        const px = (x, y) => { const k = (Math.floor(y) * png.width + Math.floor(x)) * 4; return [png.data[k], png.data[k + 1], png.data[k + 2]]; };
        const inside = (x, y) => geo.parts.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
        const mean = (pts) => pts.reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0]).map((v) => v / Math.max(1, pts.length));
        const groundPts = [];
        for (let y = 2; y < png.height - 2; y += 3) for (let x = 2; x < png.width - 2; x += 3) if (!inside(x, y)) groundPts.push(px(x, y));
        const ground = lum(mean(groundPts));
        const seen = new Set();
        for (const p of geo.parts) {
          const pts = [];
          for (let y = p.y + 2; y < p.y + p.h - 2; y += 2) for (let x = p.x + 1; x < p.x + p.w - 1; x += 2) if (x >= 0 && y >= 0 && x < png.width && y < png.height) pts.push(px(x, y));
          if (!pts.length) continue;
          const l = lum(mean(pts));
          const ratio = (Math.max(l, ground) + 0.05) / (Math.min(l, ground) + 0.05);
          if (ratio < 3 && !seen.has(p.kind)) { seen.add(p.kind); bad.push(`${theme} ${r}: ${p.kind} ${ratio.toFixed(2)}:1 against its ground`); }
        }
      }
    }
    expect(grounds > 0, 'NO DIAGRAMS FOUND ([data-graphic-ground] with [data-graphic] parts)');
    fail(bad, 'parts');
    return `${grounds} diagrams`;
  });

  // ------------------------------------------------------------------ benchmark topics
  // Every topic the reference systems cover on the same page must be covered here, or declined with a
  // reason. The topic lists live with kiln (docs-engine/benchmarks/topics/<page>.json); the system maps
  // each topic to one of its own sections in system/benchmark-coverage.json.
  await gate('G-BT1', 'every topic the reference systems cover on a page is covered on ours, or declined with a reason', async () => {
    const map = C.benchmarkTopics ?? {};
    const covFile = path.join(C.root, 'system', 'benchmark-coverage.json');
    const cov = existsSync(covFile) ? JSON.parse(readFileSync(covFile, 'utf8')) : {};
    const dir = C.abs(C.topicsDir ?? 'marketplace/plugins/kiln/skills/docs-engine/benchmarks/topics');
    const bad = []; let n = 0;
    const routesFor = Object.entries(map);
    expect(routesFor.length, 'NO PAGES MAPPED to benchmark topics (docs.benchmarkTopics)');
    // every foundation page needs a topic list; a page without one is exactly where gaps hide
    for (const r of ROUTES.filter((x) => x.startsWith(`${C.foundationsBase}/`) && !(x in map))) bad.push(`${r}: no benchmark topic list yet (docs.benchmarkTopics)`);
    for (const [route, name] of routesFor) {
      const f = path.join(dir, `${name}.json`);
      if (!existsSync(f)) { bad.push(`${route}: no topic list ${name}.json`); continue; }
      const topics = JSON.parse(readFileSync(f, 'utf8')).topics;
      await go(route);
      for (const t of topics) {
        n++;
        const c = cov[route]?.[t.id];
        if (!c) { bad.push(`${route} ${t.id}: not covered and not declined (${t.topic})`); continue; }
        if (typeof c === 'object' && c.na) { if (String(c.na).split(/\s+/).length < 10) bad.push(`${route} ${t.id}: declined without a real reason`); continue; }
        const words = await page.evaluate((id) => { const e = document.getElementById(id.replace(/^#/, '')); return e ? e.innerText.trim().split(/\s+/).length : -1; }, String(c));
        if (words < 0) bad.push(`${route} ${t.id}: mapped to ${c}, which is not on the page`);
        else if (words < 25) bad.push(`${route} ${t.id}: ${c} has ${words} words, too thin to cover "${t.topic}"`);
      }
    }
    fail(bad, 'topics');
    return `${n} topics across ${routesFor.length} pages`;
  });

  // ------------------------------------------------------------------ reference
  await gate('G-M1', 'the accessibility matrix lists every component and no cell is blank', async () => {
    let found = false; const bad = [];
    for (const r of ROUTES) {
      await go(r);
      const rows = await page.evaluate(() => [...document.querySelectorAll('table[data-a11y-matrix] tbody tr')].map((tr) => [tr.querySelector('th')?.textContent.trim(), [...tr.querySelectorAll('td')].filter((td) => !td.textContent.trim()).length]));
      if (!rows.length) continue;
      found = true;
      const names = rows.map(([n]) => n);
      COMPONENTS.filter((pg) => !names.includes(pg.title)).forEach((pg) => bad.push(`missing row ${pg.title}`));
      rows.filter(([, b]) => b).forEach(([n, b]) => bad.push(`${n}: ${b} blank`));
      break;
    }
    expect(found, 'NO ACCESSIBILITY MATRIX FOUND (table[data-a11y-matrix])');
    fail(bad, 'problems');
  });

  await gate('G-IA1', 'the nav shows the whole catalog (planned items marked) and the required parts and pages', async () => {
    await go('/');
    const nav = await page.evaluate(() => ({ parts: [...document.querySelectorAll('nav[data-book-nav] [data-nav-part]')].map((p) => p.textContent.trim().toLowerCase()), items: [...document.querySelectorAll('nav[data-book-nav] a, nav[data-book-nav] [data-planned]')].map((a) => a.textContent.trim().toLowerCase()) }));
    const bad = [];
    for (const p of C.requiredParts ?? ['getting started', 'foundations', 'components', 'patterns']) if (!nav.parts.some((x) => x.startsWith(p))) bad.push(`part "${p}" missing`);
    for (const f of C.requiredFoundations ?? ['grid', 'accessibility', 'colo', 'content', 'icon', 'motion', 'spacing', 'theme', 'typography']) if (!nav.items.some((x) => x.includes(f))) bad.push(`foundation "${f}" missing`);
    for (const p of C.requiredPatterns ?? ['common actions', 'dialog', 'disabled', 'empty', 'filter', 'form', 'loading', 'notification', 'overflow', 'read-only', 'search', 'status']) if (!nav.items.some((x) => x.includes(p))) bad.push(`pattern "${p}" missing`);
    const catFile = C.abs(C.catalog);
    if (existsSync(catFile)) {
      const cut = new Set((C.catalogCut ?? []).map((x) => x.toLowerCase()));
      const names = [...readFileSync(catFile, 'utf8').matchAll(/^\*\*W\d+[^*]*\*\*\s*(.+)$/gm)].flatMap((m) => m[1].split(/,\s*/)).map((s) => s.replace(/\[.*?\]|\(.*?\)|×\d+:?/g, '').trim()).filter(Boolean);
      for (const n of names) {
        // a system may ship a catalog entry under its own name (kiln.config docs.catalogAliases: { "AuthForms": "AuthForm" })
        const aliases = [...n.split('/'), ...[].concat(C.catalogAliases?.[n] ?? [])].map((a) => a.trim().toLowerCase()).filter(Boolean);
        if (aliases.some((a) => cut.has(a))) continue;
        if (!aliases.some((a) => nav.items.some((x) => x === a || x.startsWith(`${a} `)))) bad.push(`catalog "${n}" not in nav`);
      }
    } else bad.push(`catalog file ${C.catalog} not found`);
    fail(bad, 'gaps');
  });

  // ------------------------------------------------------------------ starter leftovers, reach, hit areas
  await gate('G-TODO1', 'no starter placeholder is left on any page: no TODO( and no seed reason', async () => {
    const bad = [];
    for (const r of ROUTES) {
      await go(r);
      const hits = await page.evaluate(() => {
        const t = document.querySelector('main')?.innerText ?? '';
        return [...t.matchAll(/TODO\([^)]*\)[^\n]{0,40}|seed value from the kiln starter/g)].map((m) => m[0].slice(0, 60));
      });
      for (const h of new Set(hits)) bad.push(`${r}: ${h}`);
    }
    fail(bad, 'placeholders');
    return `${ROUTES.length} pages clean`;
  });

  await gate('G-PUB1', 'an install command names only what can be installed: no bare registry install of an unpublished package', async () => {
    // Pane, 2026-10-30: Getting started said `npm install pane-react` while nothing was on npm; another
    // project followed it, got a 404 twice and stalled. Packages count as published only when listed
    // in kiln.config `published`; until then the book must show the tarball or file path instead.
    const pkgDir = path.join(C.root, 'packages');
    const names = existsSync(pkgDir) ? readdirSync(pkgDir).map((d) => path.join(pkgDir, d, 'package.json')).filter(existsSync).map((f) => JSON.parse(readFileSync(f, 'utf8'))).filter((j) => !j.private).map((j) => j.name) : [];
    const unpublished = names.filter((n) => !(C.published ?? []).includes(n));
    if (!unpublished.length) return 'NO unpublished packages';
    const bad = [];
    for (const r of ROUTES) {
      await go(r);
      const hits = await page.evaluate((list) => {
        const t = document.querySelector('main')?.innerText ?? '';
        const out = [];
        for (const m of t.matchAll(/(?:npm (?:install|i)|pnpm add|yarn add|bun add)((?:[ \t]+[^\s#]+)+)/g)) {
          const args = m[1].trim().split(/\s+/).filter((a) => !a.startsWith('-'));
          for (const a of args) if (list.includes(a.replace(/@[^@/]*$/, ''))) out.push(m[0].slice(0, 60));
        }
        return out;
      }, unpublished);
      for (const h of new Set(hits)) bad.push(`${r}: "${h}"`);
    }
    fail(bad, 'install commands for unpublished packages');
    return `${ROUTES.length} pages, ${unpublished.length} unpublished packages never shown as a registry install`;
  });

  await gate('G-PWA1', 'the book installs as an app and reads offline: a valid manifest with 192 and 512 icons, a service worker that takes control, and a page that loads with the network off', async () => {
    // Pane, 2026-10-30, user: install the book on a phone without a store (PWA). Checks what Chrome and
    // Safari need to offer "Install app" / "Add to Home Screen", then reloads a page offline.
    if (C.pwa === false) return 'NO pwa in this system';
    const probe = ROUTES.find((r) => r.startsWith(`${C.componentsBase}/`)) ?? '/';
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
    const p = await c.newPage(); const bad = [];
    await p.goto(url(srv.base, probe, {}, C)); await p.waitForLoadState('networkidle');
    const href = await p.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute('href'));
    if (!href) bad.push('no <link rel="manifest">');
    else {
      const m = await p.evaluate(async (h) => (await fetch(h)).json().catch(() => null), href);
      if (!m) bad.push('manifest is not JSON');
      else {
        for (const k of ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'background_color']) if (!m[k]) bad.push(`manifest has no ${k}`);
        if (m.display && !['standalone', 'fullscreen', 'minimal-ui'].includes(m.display)) bad.push(`display is ${m.display}`);
        for (const want of ['192x192', '512x512']) {
          const ic = (m.icons ?? []).find((i) => String(i.sizes).split(' ').includes(want));
          if (!ic) { bad.push(`no ${want} icon`); continue; }
          const size = await p.evaluate(async (src) => { const img = new Image(); img.src = src; await img.decode().catch(() => {}); return `${img.naturalWidth}x${img.naturalHeight}`; }, ic.src);
          if (size !== want) bad.push(`${want} icon is ${size}`);
        }
        if (!(m.icons ?? []).some((i) => String(i.purpose ?? '').includes('maskable'))) bad.push('no maskable icon (Android crops the plain one)');
      }
    }
    if (!(await p.evaluate(() => !!document.querySelector('link[rel="apple-touch-icon"]')))) bad.push('no apple-touch-icon for iPhone');
    const controlled = await p.evaluate(async () => { if (!('serviceWorker' in navigator)) return false; return Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), 8000))]); }).catch(() => false);
    if (!controlled) bad.push('no service worker became ready');
    else {
      await p.reload(); await p.waitForLoadState('networkidle');
      await c.setOffline(true);
      await p.goto(url(srv.base, probe, {}, C)).catch(() => {});
      // a code-split book renders once its route chunks are in, which can be after the load event
      const ok = await p.waitForFunction(() => (document.querySelector('main h1')?.textContent ?? '').trim().length > 0, null, { timeout: 8000 }).then(() => true, () => false);
      if (!ok) bad.push(`offline, ${probe} did not render its heading`);
      await c.setOffline(false);
    }
    await c.close();
    fail(bad, 'install problems');
    return `manifest, icons and worker in place; ${probe} renders offline`;
  });

  await gate('G-CL1', 'every colour value written in the book is a current token value (no stale hex in prose)', async () => {
    // a hex typed into prose drifts when the token changes (assay dry run: #B3261E stayed in four pages
    // after the hazard red was darkened); the book should read values from tokens, and this catches it
    const tokFile = path.join(C.root, 'packages/tokens/build/json/tokens.json');
    expect(existsSync(tokFile), 'no built tokens json');
    const toks = JSON.parse(readFileSync(tokFile, 'utf8'));
    const known = new Set();
    for (const t of Object.values(toks)) for (const v of [t.value, ...Object.values(t.themes ?? {}).map((x) => x.value)]) for (const m of String(v).matchAll(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi)) known.add(m[0].toUpperCase().slice(0, 7));
    const bad = []; let n = 0;
    // a history page (a decision log) records values as they were, and an element marked data-not-token
    // quotes a colour on purpose (another brand's blue, for comparison); both are declared, never silent
    const history = new Set(C.history ?? []);
    for (const r of ROUTES.filter((x) => !history.has(x))) {
      await go(r);
      const hexes = await page.evaluate(() => {
        const m = document.querySelector('main')?.cloneNode(true); if (!m) return [];
        for (const e of m.querySelectorAll('[data-not-token]')) e.remove();
        // a code listing is the example's own source, compiled as shown, so it cannot drift from it (Pane,
        // 2026-10-30: ColorPicker examples pass the content's own colours as hex); prose is what drifts
        for (const e of m.querySelectorAll('pre')) e.remove();
        document.body.appendChild(m); m.style.cssText = 'position:absolute; inset-inline-start:-99999px';
        const t = m.innerText; m.remove();
        return [...t.matchAll(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi)].map((x) => x[0]);
      });
      for (const h of new Set(hexes)) { n++; if (!known.has(h.toUpperCase().slice(0, 7))) bad.push(`${r}: ${h}`); }
    }
    fail(bad, 'colour values that are not tokens');
    return `${n} values checked`;
  });

  // contrast helpers shared by the boundary gate, evaluated in the page
  const CONTRAST_JS = `
    const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const groundOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let g = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) g = over(c, g); return g; };
  `;
  // Measured edge of a control over glass: the ground is the median of a ring of pixels just outside the
  // control, the edge is the 85th-percentile contrast of a 2px band just inside its box (a lip along one
  // side is enough, as WCAG allows), and the floor is its median fill. Real pixels, after blur and dimming.
  const pixelEdge = async (loc) => {
    const { PNG } = await import('pngjs');
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox(); if (!b) return 0;
    const pad = 6, x0 = Math.max(0, Math.floor(b.x - pad)), y0 = Math.max(0, Math.floor(b.y - pad));
    const png = PNG.sync.read(await page.screenshot({ clip: { x: x0, y: y0, width: Math.ceil(b.width + pad * 2), height: Math.ceil(b.height + pad * 2) } }));
    const lumAt = (x, y) => { const k = (y * png.width + x) * 4; return [0, 1, 2].map((c) => { const v = png.data[k + c] / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, j) => s + v * [0.2126, 0.7152, 0.0722][j], 0); };
    const rad = await loc.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0);
    const bx = b.x - x0, by = b.y - y0, r = Math.min(rad, b.height / 2, b.width / 2);
    // distance from the control's rounded box: < 0 inside, > 0 outside
    const sd = (x, y) => { const cx = Math.min(Math.max(x, bx + r), bx + b.width - r), cy = Math.min(Math.max(y, by + r), by + b.height - r); return Math.hypot(x - cx, y - cy) - r; };
    const ring = [], band = [], inner = [];
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
      const d = sd(x + 0.5, y + 0.5);
      if (d > 2 && d < 5) ring.push(lumAt(x, y)); else if (d <= 0 && d > -2.5) band.push(lumAt(x, y)); else if (d < -6) inner.push(lumAt(x, y));
    }
    if (!ring.length || !band.length) return 0;
    const med = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
    const g = med(ring); const cr = (l) => (Math.max(l, g) + 0.05) / (Math.min(l, g) + 0.05);
    const edge = band.map(cr).sort((p, q) => p - q)[Math.floor(band.length * 0.85)];
    const fill = inner.length ? cr(med(inner)) : 0;
    return Math.round(Math.max(edge, fill) * 100) / 100;
  };
  await gate('G-NT2', 'every form control shows its boundary at least 3:1 against what it sits on, in every theme (WCAG 1.4.11)', async () => {
    // assay/Pane dry run, 2026-10-28: a search field in the light theme vanished into a white panel,
    // because only text was ever measured. A field, select, checkbox, radio, switch or slider must be
    // findable by its edge or its fill, not only by its placeholder.
    const bad = []; let n = 0; const seen = new Map();
    for (const theme of C.themes) for (const r of ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'))) {
      await go(r, { theme });
      const res = await page.evaluate((js) => {
        new Function(js + 'window.__nt2 = { parse, over, ratio, groundOf };')();
        const { parse, over, ratio, groundOf } = window.__nt2;
        const sel = '[data-example-live] :is(input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [role="combobox"], [role="switch"], [role="checkbox"], [role="radio"], [role="slider"])';
        return [...document.querySelectorAll(sel)].filter((el) => el.getBoundingClientRect().width > 0 && !el.closest('[data-dont], :disabled, [aria-disabled="true"], [data-disabled]') && !el.matches(':disabled')).map((el) => {
          // the drawn box is the control itself or the nearest ancestor inside its component that draws an edge or a fill
          // a slider drawn as a bar (Pane's fill slider, 2026-10-29: white on a white pane in light) is
          // found by the bar's own edge, and a channel slider by its channel (with the fill inside it), never by
          // the thumb alone: a white bead on a white pane says nothing about where the track runs
          if (el.matches('[role="slider"]')) {
            const bar = el.closest('[data-component]'); const bg = bar && parse(getComputedStyle(bar).backgroundColor);
            if (bar && bg && bg.a > 0 && bar.getBoundingClientRect().height >= 32) el = bar;
            else if (bar) { const drawn = [...bar.querySelectorAll('*')].filter((d) => !d.matches('[role="slider"]') && !el.contains(d) && (() => { const c = parse(getComputedStyle(d).backgroundColor); return (c && c.a > 0) || getComputedStyle(d).boxShadow !== 'none'; })()).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; if (drawn) { el = drawn; el.setAttribute('data-nt2-channel', ''); } }
          }
          const root = el.closest('[data-component]') ?? el;
          let best = 0;
          // a switch or checkbox often draws its track or box in an aria-hidden child, so those count too
          const drawn = [...el.querySelectorAll('[aria-hidden="true"], [aria-hidden="true"] *')].filter((d) => d.getBoundingClientRect().width >= 8);
          for (const d of drawn) {
            const cs = getComputedStyle(d); const ground = groundOf(d.parentElement ?? d);
            const fill = parse(cs.backgroundColor);
            if (fill && fill.a > 0) best = Math.max(best, ratio(over(fill, ground), ground));
            const bw = parseFloat(cs.borderTopWidth) || 0; const bc = parse(cs.borderTopColor);
            if (bw >= 1 && bc && bc.a > 0 && cs.borderTopStyle !== 'none') best = Math.max(best, ratio(over(bc, ground), ground));
            // a radio card's mark is a well carved by a shadow (Pane, 2026-10-29), which is its boundary too
            for (const m of cs.boxShadow.matchAll(/rgba?\([^)]+\)/g)) { const c = parse(m[0]); if (c && c.a > 0) best = Math.max(best, ratio(over(c, ground), ground)); }
          }
          for (let e = el; e && root.contains(e); e = e.parentElement) {
            const cs = getComputedStyle(e);
            const ground = groundOf(e.parentElement ?? e);
            const fill = parse(cs.backgroundColor);
            if (fill && fill.a > 0) best = Math.max(best, ratio(over(fill, ground), ground));
            const bw = parseFloat(cs.borderTopWidth) || 0; const bc = parse(cs.borderTopColor);
            if (bw >= 1 && bc && bc.a > 0 && cs.borderTopStyle !== 'none') best = Math.max(best, ratio(over(bc, ground), ground));
            for (const m of cs.boxShadow.matchAll(/rgba?\([^)]+\)/g)) { const c = parse(m[0]); if (c && c.a > 0) best = Math.max(best, ratio(over(c, ground), ground)); }
            const ow = parseFloat(cs.outlineWidth) || 0; const oc = parse(cs.outlineColor);
            if (ow >= 1 && cs.outlineStyle !== 'none' && oc && document.activeElement !== e) best = Math.max(best, ratio(over(oc, ground), ground));
            if (e === root) break;
          }
          // over glass or a photo the ground is pixels, not a colour: no opaque colour is reached before an
          // ancestor that blurs or paints an image, so this control is measured from the screenshot below
          let glass = false;
          for (let e = el.parentElement; e; e = e.parentElement) {
            const cs = getComputedStyle(e); const c = parse(cs.backgroundColor);
            if (c && c.a >= 1) break;
            if ((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none') || cs.backgroundImage.includes('url(')) { glass = true; break; }
          }
          // the box that draws the edge: the control, or the nearest ancestor inside its component that paints one
          let box = el;
          for (let e = el; e && root.contains(e); e = e.parentElement) {
            const cs = getComputedStyle(e); const c = parse(cs.backgroundColor);
            if (cs.boxShadow !== 'none' || (parseFloat(cs.borderTopWidth) || 0) >= 1 || (c && c.a > 0)) { box = e; break; }
            if (e === root) break;
          }
          // a field inside a well (Pane's InputGroup, 2026-10-30: PasswordInput, NumberInput) draws nothing itself;
          // the enclosing component's groove is its edge, so step out to it when it paints one
          if (box === el) {
            const cs0 = getComputedStyle(el); const c0 = parse(cs0.backgroundColor);
            const bare = cs0.boxShadow === 'none' && !((parseFloat(cs0.borderTopWidth) || 0) >= 1) && !(c0 && c0.a > 0);
            const well = bare ? root.parentElement?.closest('[data-component]') : null;
            const ws = well && getComputedStyle(well);
            if (ws && ws.boxShadow !== 'none' && well.contains(el)) {
              box = well; const ground = groundOf(well.parentElement ?? well);
              for (const m of ws.boxShadow.matchAll(/rgba?\([^)]+\)/g)) { const c = parse(m[0]); if (c && c.a > 0) best = Math.max(best, ratio(over(c, ground), ground)); }
            }
          }
          // several controls can share one drawn box (Pane's SegmentedControl, 2026-10-29: every segment is drawn
          // by its track); a box keeps the first index it was given, or the earlier locator finds nothing
          const i = box.dataset.nt2 ?? String(document.querySelectorAll('[data-nt2]').length); box.setAttribute('data-nt2', i);
          return [root.dataset.component ?? el.tagName, Math.round(best * 100) / 100, glass, i];
        });
      }, CONTRAST_JS);
      for (const [name, computed, glass, i] of res) {
        n++;
        let best = computed;
        // a channel is measured without its beads: the beads sit on the channel and are not its edge (Pane's
        // RangeSlider, 2026-10-30: two white beads covered enough of a light channel to sink its percentile)
        const beads = async (show) => page.evaluate(([j, v]) => { const el = document.querySelector(`[data-nt2="${j}"][data-nt2-channel]`); el?.closest('[data-component]')?.querySelectorAll('[role="slider"]').forEach((t) => { t.style.visibility = v; }); }, [i, show ? '' : 'hidden']);
        if (glass && !seen.has(`${theme}|${r}|${i}`)) { await beads(false); best = await pixelEdge(page.locator(`[data-nt2="${i}"]`)); await beads(true); }
        else if (glass) best = seen.get(`${theme}|${r}|${i}`);
        seen.set(`${theme}|${r}|${i}`, best);
        if (best < 3) bad.push(`${theme} ${r}: ${name} edge ${best}:1${glass ? ' (measured over glass)' : ''}`);
      }
    }
    expect(n > 0, 'NO FORM CONTROLS FOUND on any component Code page');
    fail([...new Set(bad)], 'controls whose edge is under 3:1');
    return `${n} controls in ${C.themes.length} themes`;
  });

  await gate('G-EL1', 'stacked glass reads as levels: each level differs from what is under it by a measured step, and a scrim dims the scene under an overlay', async () => {
    // Pane, 2026-10-29: a dialog, the tiles inside it and the app behind were the same thin grey glass,
    // so nothing read as above anything else. Measured from pixels on every [data-level-sample] in both themes.
    const STEP = C.elevationStep ?? 1.15, SCRIM = C.scrimMax ?? 0.6;
    const { PNG } = await import('pngjs');
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const shot = async (box) => PNG.sync.read(await page.screenshot({ clip: box }));
    const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
    const bad = []; let n = 0, routesSeen = 0;
    for (const theme of C.themes) for (const r of ROUTES.filter((x) => !x.startsWith(`${C.componentsBase}/`))) {
      await go(r, { theme });
      const els = await page.locator('[data-level-sample]').all();
      if (!els.length) continue; routesSeen++;
      for (const el of els) {
        await el.scrollIntoViewIfNeeded().catch(() => {});
        const b = await el.boundingBox(); if (!b) continue;
        const rad = await el.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0);
        const pad = 12, x0 = Math.max(0, b.x - pad), y0 = Math.max(0, b.y - pad);
        const png = await shot({ x: x0, y: y0, width: b.width + pad * 2, height: b.height + pad * 2 });
        const bx = b.x - x0, by = b.y - y0, rr = Math.min(rad, b.height / 2, b.width / 2);
        const sd = (x, y) => { const cx = Math.min(Math.max(x, bx + rr), bx + b.width - rr), cy = Math.min(Math.max(y, by + rr), by + b.height - rr); return Math.hypot(x - cx, y - cy) - rr; };
        const inside = [], outside = [];
        for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
          const d = sd(x + 0.5, y + 0.5), k = (y * png.width + x) * 4;
          const L = 0.2126 * lin(png.data[k]) + 0.7152 * lin(png.data[k + 1]) + 0.0722 * lin(png.data[k + 2]);
          // just inside the edge (the body, before any content) and just outside it (whatever is underneath)
          if (d < -2 && d > -6) inside.push(L); else if (d > 2 && d < 8) outside.push(L);
        }
        const a = med(inside), o = med(outside); const ratio = (Math.max(a, o) + 0.05) / (Math.min(a, o) + 0.05);
        n++;
        const lv = await el.getAttribute('data-level-sample');
        if (ratio < STEP) bad.push(`${theme} ${r}: level ${lv} is ${Math.round(ratio * 100) / 100}:1 from what is under it (needs ${STEP})`);
      }
      for (const sc of await page.locator('[data-scrim]').all()) {
        const b = await sc.boundingBox(); if (!b) continue;
        const box = { x: b.x + 4, y: b.y + 4, width: Math.min(40, b.width - 8), height: Math.min(40, b.height - 8) };
        const meanL = (png) => { let t = 0; for (let k = 0; k < png.data.length; k += 4) t += 0.2126 * lin(png.data[k]) + 0.7152 * lin(png.data[k + 1]) + 0.0722 * lin(png.data[k + 2]); return t / (png.data.length / 4); };
        const on = meanL(await shot(box)); await sc.evaluate((e) => { e.style.visibility = 'hidden'; }); const off = meanL(await shot(box)); await sc.evaluate((e) => { e.style.visibility = ''; });
        n++;
        if (off > 0 && on / off > SCRIM) bad.push(`${theme} ${r}: the scrim leaves the scene at ${Math.round(on / off * 100)}% (needs ${Math.round(SCRIM * 100)}% or less)`);
      }
    }
    expect(routesSeen > 0, 'NO ELEVATION DEMO FOUND ([data-level-sample])');
    fail(bad, 'levels too close');
    return `${n} levels and scrims in ${C.themes.length} themes`;
  });

  await gate('G-SV1', 'every promised state is there and visible: each cell of the state matrix differs from its row default and carries its ARIA, in every theme', async () => {
    // Pane, 2026-10-30, user: "เช็ค form, table, state, variant ห้ามขาด". A typecheck of the matrix found
    // readOnly missing on 9 fields, invalid on 7 choices, loading on Button and Table. This keeps them:
    // every cell must look different from its row's first cell and say its state to assistive tech.
    const route = C.statesRoute ?? '/patterns/states';
    // a book with no state matrix used to pass here, so a fresh system never checked a state. Missing from the
    // book is a failure; missing only from a KILN_ROUTES run is a skip (NO …); an empty matrix is a failure.
    if (!routes(C).includes(route)) throw new Error(`no state matrix: ${route} is not in routes.json (the starter ships book/states.tsx; set docs.statesRoute if it moved)`);
    if (!ROUTES.includes(route)) throw new Error('NO state matrix route in this run');
    const { PNG } = await import('pngjs');
    const ARIA = {
      disabled: ':disabled, [aria-disabled="true"], [data-disabled]', invalid: '[aria-invalid="true"], [data-invalid]',
      readonly: '[readonly], [aria-readonly="true"], [data-readonly]', required: '[required], [aria-required="true"]',
      checked: '[data-state="checked"], [data-state="on"], [aria-checked="true"], [aria-selected="true"], [aria-pressed="true"]',
      indeterminate: '[data-state="indeterminate"], [aria-checked="mixed"]', selected: '[data-state="checked"], [data-state="on"], [aria-selected="true"], [aria-pressed="true"], [aria-current="true"], [data-state="active"]',
      loading: '[aria-busy="true"]', sorted: '[aria-sort="ascending"], [aria-sort="descending"]',
    };
    const bad = []; let n = 0, seen = 0;
    for (const theme of C.themes) {
      await go(route, { theme });
      const cells = await page.evaluate(() => [...document.querySelectorAll('[data-state-cell]')].map((f) => { const [c, s] = f.getAttribute('data-state-cell').split('|'); const b = f.querySelector('.state-stage, :scope > div')?.getBoundingClientRect(); return { c, s, box: b && { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height } }; }));
      seen += cells.length;
      const rows = {};
      for (const x of cells) (rows[x.c] ??= []).push(x);
      for (const [comp, list] of Object.entries(rows)) {
        // each cell's stage is lifted into one fixed, opaque box at the same place on screen, shot there and
        // put back: two cells that look the same then rasterise the same, whatever sits behind the page
        const shot = async (x) => {
          const box = await page.evaluate(([c, st]) => {
            const stage = document.querySelector(`[data-state-cell="${c}|${st}"] .state-stage`);
            let dock = document.getElementById('kiln-sv-dock');
            if (!dock) { dock = document.createElement('div'); dock.id = 'kiln-sv-dock'; Object.assign(dock.style, { position: 'fixed', left: '0px', top: '0px', zIndex: 2147483647, padding: '12px', background: getComputedStyle(stage).backgroundColor, width: `${stage.getBoundingClientRect().width}px`, boxSizing: 'content-box' }); document.body.append(dock); }
            dock.style.width = `${Math.round(stage.getBoundingClientRect().width)}px`;
            const mark = document.createComment('sv'); stage.before(mark); dock.append(stage); window.__svBack = () => { mark.replaceWith(stage); };
            const b = dock.getBoundingClientRect(); return { x: 0, y: 0, width: Math.ceil(b.width), height: Math.ceil(b.height) };
          }, [comp, x.s]);
          await page.mouse.move(1200, 880); await page.waitForTimeout(40);
          const png = PNG.sync.read(await page.screenshot({ clip: box }));
          await page.evaluate(() => window.__svBack?.());
          return png;
        };
        const base = await shot(list[0]);
        for (const x of list.slice(1)) {
          n++;
          // the ARIA: every state word in the cell name that has a rule must be met inside the cell
          for (const word of Object.keys(ARIA)) if (x.s.split(' ').includes(word)) {
            const ok = await page.evaluate(([c, s, sel]) => !!document.querySelector(`[data-state-cell="${c}|${s}"]`)?.querySelector(sel), [comp, x.s, ARIA[word]]);
            if (!ok) bad.push(`${theme} ${comp} ${x.s}: no ${word} attribute in the cell`);
          }
          const img = await shot(x);
          // content inside a stage can still sit a pixel apart from its row's default, so the two are lined
          // up at the best whole-pixel shift within 2px before the changed pixels are counted
          let diff = Math.abs(img.width - base.width) + Math.abs(img.height - base.height) > 2 ? 1e9 : Infinity;
          if (diff === Infinity) for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
            let d = 0;
            for (let y = 3; y < Math.min(img.height, base.height) - 3; y++) for (let i = 3; i < Math.min(img.width, base.width) - 3; i++) {
              const a = (y * img.width + i) * 4, b = ((y + oy) * base.width + i + ox) * 4;
              if (Math.max(Math.abs(img.data[a] - base.data[b]), Math.abs(img.data[a + 1] - base.data[b + 1]), Math.abs(img.data[a + 2] - base.data[b + 2])) > 12) d++;
            }
            diff = Math.min(diff, d);
          }
          if (diff < 8) bad.push(`${theme} ${comp} ${x.s}: looks the same as ${list[0].s} (${diff} px differ)`);
        }
      }
    }
    if (!seen) throw new Error(`the state matrix at ${route} has no cells: add a row to system/states.tsx for each component with states`);
    fail(bad, 'state cells missing or invisible');
    return `${n} state cells differ from their default and carry their ARIA`;
  });

  await gate('G-GL1', 'glow is declared and measured: in dark only [data-glow] parts give off light, each visibly (near ring vs ground) and within reach; text never glows; in light nothing glows', async () => {
    // Pane, 2026-10-29: the user asked for white parts to glow in dark, "but not every white". The
    // system names what glows (data-glow="strong|soft|mark") and this gate holds the rest to reflect.
    // strong must stand clearly above soft; reach caps how far any glow may fog the pane
    const NEED = { strong: 1.25, soft: 1.15, mark: 1.15 } /* ratio of the ring just outside, glow on vs glow off */, REACH = C.glowReach ?? 32, DARK = C.glowTheme ?? 'dark';
    const { PNG } = await import('pngjs');
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
    const bad = []; let n = 0; const seen = {};
    const pages = ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'));
    for (const theme of C.themes) for (const r of pages) {
      await go(r, { theme });
      // undeclared light: a light outer shadow with blur, or a light blurred text-shadow, on anything in a stage
      const stray = await page.evaluate((dark) => {
        const out = [];
        const light = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 0; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return (r + g + b) / 765 > 0.8 ? a : 0; };
        const layers = (v) => v === 'none' ? [] : v.split(/,(?![^(]*\))/).map((l) => l.trim());
        const blur = (l) => { const nums = l.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) ?? []; return { b: parseFloat(nums[2] ?? '0'), sp: parseFloat(nums[3] ?? '0'), inset: /inset/.test(l), a: light(l) }; };
        for (const el of document.querySelectorAll('[data-example-live] *')) {
          const cs = getComputedStyle(el); const box = el.getBoundingClientRect(); if (!box.width || !box.height) continue;
          const glows = layers(cs.boxShadow).map(blur).filter((x) => !x.inset && x.a >= 0.15 && x.b >= 6);
          const who = el.closest('[data-component]')?.getAttribute('data-component') ?? el.tagName.toLowerCase();
          if (glows.length && !dark) out.push(`${who} gives off light; nothing glows in this theme`);
          else if (glows.length && !el.closest('[data-glow]')) out.push(`${who} glows but is not declared (data-glow)`);
          if (el.matches('[data-glow]')) { const reach = Math.max(0, ...glows.map((x) => x.b + x.sp)); if (reach > 0) out.push(`reach:${reach}`); }
          const ts = layers(cs.textShadow).map(blur).filter((x) => x.a >= 0.15 && x.b >= 2);
          if (dark && ts.length && [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) out.push(`text "${el.textContent.trim().slice(0, 16)}" glows; text never glows`);
        }
        return [...new Set(out)];
      }, theme === DARK);
      for (const s of stray) {
        if (s.startsWith('reach:')) { if (+s.slice(6) > REACH) bad.push(`${theme} ${r}: a glow reaches ${s.slice(6)}px (max ${REACH})`); continue; }
        bad.push(`${theme} ${r}: ${s}`);
      }
      // declared glow, measured from pixels: the ring just outside against the ground further out
      const els = await page.locator('[data-example-live] [data-glow]').all();
      for (const el of els.slice(0, 6)) {
        const info = await el.evaluate((e) => ({ kind: e.dataset.glow, off: /unchecked|off|inactive/.test(e.dataset.state ?? '') || e.matches(':disabled, [data-disabled]'), r: parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0 }));
        if (info.off || !(info.kind in NEED)) continue;
        // in light the pixels around a part are its card and neighbours, so the computed shadow decides:
        // the stray scan above already fails any light blurred shadow there
        if (theme !== DARK) { n++; continue; }
        await el.scrollIntoViewIfNeeded().catch(() => {});
        const b = await el.boundingBox(); if (!b || b.width < 2) continue;
        const pad = 40, x0 = Math.max(0, b.x - pad), y0 = Math.max(0, b.y - pad);
        // the glow's own light: the same crop with and without the part's shadow, so neighbours cancel out
        const clip = { x: x0, y: y0, width: b.width + pad * 2, height: b.height + pad * 2 };
        // a slider's beads sit on its glowing fill and are parts of their own; they are hidden while the fill's light
        // is measured (Pane's RangeSlider, 2026-10-30: two beads at the ends of a short fill sank the median)
        const beads = (v) => el.evaluate((e, v) => { if (e.matches('[role="slider"]')) return; e.closest('[data-component]')?.querySelectorAll('[role="slider"]').forEach((t) => { t.style.visibility = v; }); }, v);
        await beads('hidden');
        const on = PNG.sync.read(await page.screenshot({ clip }));
        const prev = await el.evaluate((e) => { const p = e.style.boxShadow; e.style.transition = 'none'; e.style.boxShadow = 'none'; return p; });
        const off = PNG.sync.read(await page.screenshot({ clip }));
        await el.evaluate((e, p) => { e.style.boxShadow = p; e.style.transition = ''; }, prev);
        await beads('');
        const bx = b.x - x0, by = b.y - y0, rr = Math.min(info.r, b.height / 2, b.width / 2);
        const sd = (x, y) => { const cx = Math.min(Math.max(x, bx + rr), bx + b.width - rr), cy = Math.min(Math.max(y, by + rr), by + b.height - rr); return Math.hypot(x - cx, y - cy) - rr; };
        const lum = (png, k) => 0.2126 * lin(png.data[k]) + 0.7152 * lin(png.data[k + 1]) + 0.0722 * lin(png.data[k + 2]);
        const nearOn = [], nearOff = [], farOn = [], farOff = [];
        for (let y = 0; y < on.height; y++) for (let x = 0; x < on.width; x++) {
          const d = sd(x + 0.5, y + 0.5), k = (y * on.width + x) * 4;
          if (d > 2 && d < 6) { nearOn.push(lum(on, k)); nearOff.push(lum(off, k)); } else if (d > 32 && d < 38) { farOn.push(lum(on, k)); farOff.push(lum(off, k)); }
        }
        const ratio = (med(nearOn) + 0.05) / (med(nearOff) + 0.05), spill = (med(farOn) + 0.05) / (med(farOff) + 0.05); n++;
        if (spill > 1.03) bad.push(`${theme} ${r}: a ${info.kind} glow still lightens the surface ${spill.toFixed(2)}:1 at 32px; it should be gone by then`);
        (seen[info.kind] ??= []).push(ratio);
        if (theme === DARK && ratio < NEED[info.kind]) bad.push(`${theme} ${r}: a ${info.kind} glow lifts its surround only ${ratio.toFixed(2)}:1 (needs ${NEED[info.kind]})`);
      }
    }
    expect(n > 0, 'NO GLOWING PART ([data-glow]) measured on any Code page');
    fail(bad, 'glow problems');
    const span = Object.entries(seen).map(([k, v]) => `${k} ${Math.min(...v).toFixed(2)}–${Math.max(...v).toFixed(2)}:1`).join(', ');
    return `${n} glowing parts in ${C.themes.length} themes (${span})`;
  });

  await gate('G-SL1', 'a slider has room to travel and holds still: at least 200px long, and neither it nor its surface changes size between its lowest and highest value', async () => {
    // Pane, 2026-10-29: in a centred stage the slider shrank to its label and value text, a stub, and
    // its pane grew and shrank as the value went from 2% to 100%. Checked by pressing Home and End.
    const MIN = C.sliderMin ?? 200;
    const bad = []; let n = 0;
    for (const r of ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`))) {
      await go(r);
      const thumbs = await page.locator('[data-example-live] [role="slider"]').all();
      for (const t of thumbs.slice(0, 8)) {
        if (!(await t.isVisible()) || (await t.isDisabled().catch(() => false)) || (await t.getAttribute('aria-disabled')) === 'true') continue;
        const measure = () => t.evaluate((e) => {
          const root = e.closest('[data-component]') ?? e.parentElement; const surf = root.parentElement?.closest('[data-surface], [data-component="Card"]') ?? root.parentElement;
          const a = root.getBoundingClientRect(), b = surf.getBoundingClientRect();
          return { w: a.width, h: a.height, pw: b.width, ph: b.height, name: root.getAttribute('data-component') ?? 'slider' };
        });
        await t.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(80); const lo = await measure();
        await page.keyboard.press('End'); await page.waitForTimeout(80); const hi = await measure();
        await page.keyboard.press('Home');
        n++;
        if (lo.w < MIN - 0.5) bad.push(`${r}: ${lo.name} is ${Math.round(lo.w)}px long (needs ${MIN})`);
        const moved = Math.max(Math.abs(hi.w - lo.w), Math.abs(hi.h - lo.h), Math.abs(hi.pw - lo.pw), Math.abs(hi.ph - lo.ph));
        if (moved > 1) bad.push(`${r}: ${lo.name} or its surface changes size by ${Math.round(moved)}px between its lowest and highest value`);
      }
    }
    if (!n) throw new Error('NO SLIDER on any component page');
    fail([...new Set(bad)], 'sliders');
    return `${n} sliders`;
  });

  await gate('G-S6', 'nothing in the page column spills out of it: no element crosses into the rail or the margin beside main (folds open)', async () => {
    // Pane, 2026-10-29: a do/don't pair grew past its 1fr column, slid under the sticky "On this page"
    // rail and put a demo behind its text. Only the evidence run noticed, as a contrast failure.
    const bad = []; let n = 0;
    for (const r of ROUTES) {
      await go(r);
      await page.evaluate(() => document.querySelectorAll('main details').forEach((d) => d.setAttribute('open', '')));
      const out = await page.evaluate(() => {
        const main = document.querySelector('main'); if (!main) return [];
        const m = main.getBoundingClientRect();
        const scrolls = (e) => { for (let a = e.parentElement; a && a !== main; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true; } return false; };
        const over = [...main.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.right > m.right + 1 || b.left < m.left - 1) && getComputedStyle(e).position !== 'fixed' && !scrolls(e); });
        return over.filter((e) => !over.includes(e.parentElement)).slice(0, 3).map((e) => `${e.closest('[data-component]')?.getAttribute('data-component') ?? e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} by ${Math.round(Math.max(e.getBoundingClientRect().right - m.right, m.left - e.getBoundingClientRect().left))}px`);
      });
      n++; for (const o of out) bad.push(`${r}: ${o}`);
    }
    fail(bad, 'elements spilling out of the page column');
    return `${n} pages`;
  });

  await gate('G-MT1', 'one material per screen: no demo puts glass panes and solid panes side by side, outside a comparison marked as one', async () => {
    // Pane, 2026-10-31, user: glass and opaque surfaces were mixing ("บางคนอยากได้กระจก บางคนอยากได้ทึบ"). A
    // screen picks one material (M1). A pane is glass when its own backdrop filter blurs, solid when it does not.
    const routes = ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'));
    if (!routes.length) throw new Error('NO COMPONENT PAGES in this run');
    const bad = [];
    for (const r of routes) {
      await go(r);
      const res = await page.evaluate((SURF) => {
        const out = [];
        for (const stage of document.querySelectorAll('main [data-example-live]')) {
          if (stage.closest('[data-material-compare]')) continue;
          const kinds = new Set();
          for (const surf of stage.querySelectorAll(`${SURF}, [data-component="Dialog"], [data-component="Sheet"], [data-component="Navbar"], [data-component="BottomNav"]`)) {
            const cs = getComputedStyle(surf); if (cs.display === 'none') continue;
            const f = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
            // a nested pane inside a glass pane draws no filter of its own; it takes its parent's material
            if (f === 'none' && surf.parentElement.closest(SURF)) continue;
            kinds.add(f === 'none' ? 'solid' : 'glass');
          }
          if (kinds.size > 1) out.push(stage.closest('figure')?.querySelector('figcaption')?.textContent?.slice(0, 50) ?? 'a demo');
        }
        return out;
      }, SURFACE);
      for (const x of res) bad.push(`${r}: ${x}`);
    }
    if (bad.length) throw new Error(`${bad.length} demos mix glass and solid: ${bad.slice(0, 8).join(' | ')}`);
    return `${routes.length} pages`;
  });

  // ------------------------------------------------------------------ material recipe, bare surfaces, mesh, anchor
  // The measurements live in surface-probes.mjs and are proven red/green by surface-probes.proof.mjs.
  await gate('G-GR1', 'every glass in a component uses the shared recipe: backdrop-filter is none or written through tokens, and what renders carries every recipe function', async () => {
    // Pane, 2026-10-31: Navbar blurred without saturate or brightness, so on a bright scene its text fell to 3.4:1
    const R = { functions: ['blur', 'saturate', 'brightness'], ...(C.glassRecipe ?? {}) };
    const bad = [];
    const walk = (d) => { if (!existsSync(d)) return; for (const n of readdirSync(d, { withFileTypes: true })) { const f = path.join(d, n.name); if (n.isDirectory()) walk(f); else if (n.name.endsWith('.css')) bad.push(...glassCssProblems(readFileSync(f, 'utf8'), path.relative(C.root, f))); } };
    walk(C.abs(C.componentsDir));
    const routes = ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && (x.endsWith('/code') || x.endsWith('/usage')));
    if (!routes.length && !bad.length) throw new Error('NO COMPONENT PAGES in this run');
    let glass = 0;
    for (const r of routes) {
      await go(r);
      const res = await page.evaluate(glassRecipeProbe, { scope: 'main [data-example-live] *', functions: R.functions });
      glass += await page.evaluate(() => [...document.querySelectorAll('main [data-example-live] *')].filter((e) => (getComputedStyle(e).backdropFilter || 'none') !== 'none').length);
      for (const x of res) bad.push(`${r}: ${x}`);
    }
    fail([...new Set(bad)], 'glass outside the recipe');
    return `${glass} glass elements on ${routes.length} pages carry ${R.functions.join(' + ')}`;
  });

  await gate('G-BR1', 'a subject shown as its own surface paints one, and no live example puts text straight on the photo', async () => {
    // Pane: chart, chat and agent subjects were shown bare and drew their words on the scene with no pane
    const arg = { minAlpha: C.bareMinAlpha ?? 0.9, paneAlpha: C.paneAlpha ?? 0.35, stages: 'main [data-example-live]' };
    const scenes = [...new Set([SCENE, C.photoScene].filter(Boolean))];
    const routes = ROUTES.filter((x) => !x.startsWith(`${C.componentsBase}/`) || x.endsWith('/usage') || x.endsWith('/style'));
    if (!routes.length) throw new Error('NO PAGES in this run');
    const bad = []; let photo = 0;
    for (const scene of scenes) for (const r of routes) {
      await go(r, { scene });
      photo += await page.evaluate(() => [...document.querySelectorAll('main [data-example-live]')].filter((s) => /url\(/.test(getComputedStyle(s).backgroundImage)).length);
      for (const x of await page.evaluate(bareSurfaceProbe, arg)) bad.push(`${scene} ${r}: ${x}`);
    }
    fail([...new Set(bad)], 'subjects with no surface');
    return `${routes.length} pages, ${photo} photo stages${photo ? '' : ' (no stage showed a photo; set docs.photoScene to the brightest photo scene)'}`;
  });

  await gate('G-MS1', `a mesh gradient is an accent: at most ${Math.round((C.meshMaxShare ?? 0.1) * 100)}% of its section, stage or card, never a wallpaper`, async () => {
    // user rule, 2026-10-31: mesh gradients are an accent, never the ground
    const arg = { maxShare: C.meshMaxShare ?? 0.1, regions: C.meshRegions ?? `section, [data-example-live], ${SURFACE}, [data-component="Card"]` };
    const bad = [];
    for (const r of ROUTES) { await go(r); for (const x of await page.evaluate(meshShareProbe, arg)) bad.push(`${r}: ${x}`); }
    fail([...new Set(bad)], 'mesh areas past their share');
    return `${ROUTES.length} pages`;
  });

  await gate('G-AN1', 'the card still looks like the anchor: body lightness, chroma and rim contrast on the anchor\'s backdrop stay within the allowed deltas', async () => {
    // Pane R-032: glass was tuned one number at a time until it read as opaque; nothing compared it with the anchor
    const A = C.anchor;
    if (!A?.route || !A?.selector) throw new Error('no docs.anchor { route, selector, reference } in kiln.config.json: the anchor pick records one (anchor-likeness.mjs --record)');
    const refFile = C.abs(A.reference ?? 'system/anchor/anchor-likeness.json');
    if (!existsSync(refFile)) throw new Error(`no anchor reference at ${path.relative(C.root, refFile)}: run node tooling/kiln/anchor-likeness.mjs --record <anchor html> at the anchor lock`);
    if (!ROUTES.includes(A.route)) throw new Error('NO anchor route in this run');
    const ref = JSON.parse(readFileSync(refFile, 'utf8'));
    await go(A.route, { theme: ref.theme ?? THEME, scene: ref.scene ?? SCENE });
    await page.mouse.move(1, 1);
    const now = await cardStats(page, A.selector);
    fail(anchorDrift(ref, now, A), 'drifts from the anchor');
    return `L ${now.L} C ${now.C} rim ${now.rim}:1 against the anchor's L ${ref.L} C ${ref.C} rim ${ref.rim}:1`;
  });

  await gate('G-IC1', 'every icon inside a component is drawn at a size: no glyph collapses to nothing', async () => {
    // Pane, 2026-10-31: IconButton wrapped its children in a content span for the loading state, and its
    // ".root > svg" size rule stopped matching, so every IconButton icon (and Menu and Tooltip triggers)
    // rendered at 0×0 for a day while every gate passed. Any visible svg in a component must have area.
    const routes = [...new Set(['/', ...ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'))])].filter((r) => ROUTES.includes(r));
    if (!routes.length) throw new Error('NO pages to check');
    const bad = []; let n = 0;
    for (const r of routes) {
      await go(r);
      const res = await page.evaluate(() => {
        const out = []; let count = 0;
        for (const svg of document.querySelectorAll('main [data-component] svg')) {
          if (svg.parentElement.closest('svg')) continue;
          const host = svg.closest('[data-component]');
          const hb = host.getBoundingClientRect(); if (hb.width === 0 || hb.height === 0) continue; // the component itself is hidden
          let hidden = false; for (let e = svg; e && e !== host.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } }
          if (hidden) continue;
          count++;
          const b = svg.getBoundingClientRect();
          if (b.width < 4 || b.height < 4) out.push(`${host.getAttribute('data-component')}: an icon drawn at ${Math.round(b.width)}×${Math.round(b.height)}`);
        }
        return { out, count };
      });
      n += res.count; for (const x of res.out) bad.push(`${r}: ${x}`);
    }
    const u = [...new Set(bad.map((x) => x.replace(/^\S+: /, '')))];
    if (u.length) throw new Error(`${u.length} collapsed icons: ${u.slice(0, 8).join(' | ')}`);
    return `${n} icons on ${routes.length} pages`;
  });

  await gate('G-OV1', 'components side by side in a demo never overlap: nothing one draws, a port or a badge, lands on its neighbour', async () => {
    // Pane, 2026-10-31: three NodeCards in a row at the small gap put each out port on the next card's in
    // port. Every part a component draws, including what sticks out past its box, is measured.
    const routes = ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'));
    if (!routes.length) throw new Error('NO pages to check');
    const bad = [];
    for (const r of routes) {
      await go(r);
      const res = await page.evaluate(() => {
        const out = [];
        const extent = (root) => { let l = Infinity, t = Infinity, rr = -Infinity, b = -Infinity; for (const e of [root, ...root.querySelectorAll('*')]) { const q = e.getBoundingClientRect(); if (!q.width || !q.height || getComputedStyle(e).visibility === 'hidden') continue; l = Math.min(l, q.left); t = Math.min(t, q.top); rr = Math.max(rr, q.right); b = Math.max(b, q.bottom); } return { l, t, r: rr, b }; };
        for (const stage of document.querySelectorAll('main [data-example-live]')) {
          const roots = [...stage.querySelectorAll('[data-component]')].filter((e) => !e.parentElement.closest('[data-component]') || e.parentElement.closest('[data-component]') === stage.closest('[data-component]'));
          const sibs = roots.filter((e, i) => roots.every((o, j) => j === i || !o.contains(e)));
          const ex = sibs.map(extent);
          for (let i = 0; i < sibs.length; i++) for (let j = i + 1; j < sibs.length; j++) {
            if (sibs[i].parentElement !== sibs[j].parentElement) continue;
            const a = ex[i], b = ex[j]; const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
            if (w > 2 && h > 2) out.push(`${sibs[i].getAttribute('data-component')} and ${sibs[j].getAttribute('data-component')} overlap by ${Math.round(w)}×${Math.round(h)}px`);
          }
        }
        return out;
      });
      for (const x of res) bad.push(`${r}: ${x}`);
    }
    if (bad.length) throw new Error(`${bad.length} overlaps: ${bad.slice(0, 8).join(' | ')}`);
    return `${routes.length} pages`;
  });

  await gate('G-LK1', 'page styles never reach inside a component: it lays out the same inside the prose of a page as on its own', async () => {
    // Pane, 2026-10-31: the gallery sits inside the overview's prose, and ".prose ul" turned Pagination's
    // page list into a column; ".prose a" underlined Sidebar, BottomNav and List rows. Each example's
    // component is cloned outside main, where no page rule can reach, and their layout is compared.
    const routes = [...new Set(['/', ...ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'))])].filter((r) => ROUTES.includes(r));
    if (!routes.length) throw new Error('NO pages to check');
    const bad = [];
    for (const r of routes) {
      await go(r);
      if (r === '/') { const open = page.getByRole('button', { name: /gallery/i }); if (await open.count()) { await open.first().click(); await page.waitForTimeout(1500); } }
      const res = await page.evaluate(() => {
        const PROPS = ['display', 'flexDirection', 'flexWrap', 'fontSize', 'lineHeight', 'fontWeight', 'textDecorationLine', 'marginTop', 'marginBottom', 'paddingLeft', 'paddingTop', 'listStyleType', 'rowGap', 'columnGap', 'textTransform', 'letterSpacing'];
        const same = (p, q) => p === q || (/px$/.test(p) && /px$/.test(q) && Math.abs(parseFloat(p) - parseFloat(q)) < 0.5);
        const roots = [...document.querySelectorAll('main [data-component], dialog [data-component]')].filter((e) => !e.parentElement.closest('[data-component]'));
        const host = document.createElement('div'); host.setAttribute('data-lk-host', ''); host.style.cssText = 'position:absolute;left:-10000px;top:0;inline-size:1200px';
        document.body.appendChild(host);
        const out = [];
        for (const r0 of roots.slice(0, 120)) {
          const env = r0.closest('[data-brightness], [data-environment], [data-theme]');
          const wrap = env ? env.cloneNode(false) : document.createElement('div');
          const w = r0.parentElement.getBoundingClientRect().width;
          wrap.style.inlineSize = `${Math.max(1, w)}px`;
          const c = r0.cloneNode(true); wrap.appendChild(c); host.appendChild(wrap);
          const a = [r0, ...r0.querySelectorAll('*')], b = [c, ...c.querySelectorAll('*')];
          // the root itself may be placed by the page (a row, a grid); only what is inside it must not change
          for (let i = 1; i < a.length && i < b.length; i++) {
            // only the component's own parts: content a product passes in (a paragraph in a Card) may follow the page
            if (a[i].closest('svg') || !/-module__/.test(String(a[i].className))) continue;
            const x = getComputedStyle(a[i]), y = getComputedStyle(b[i]);
            const diff = PROPS.filter((k) => !same(x[k], y[k]) && (k !== 'listStyleType' || a[i].tagName === 'LI'));
            if (diff.length) { out.push(`${r0.getAttribute('data-component')} ${a[i].tagName.toLowerCase()}: ${diff.map((k) => `${k} ${x[k]}≠${y[k]}`).join(', ')}`); break; }
          }
          wrap.remove();
        }
        host.remove();
        return out;
      });
      for (const x of res) bad.push(`${r}: ${x}`);
    }
    const u = [...new Set(bad.map((x) => x.replace(/^\S+: /, '')))];
    if (u.length) throw new Error(`${u.length} components restyled by the page: ${u.slice(0, 8).join(' | ')}`);
    return `${routes.length} pages`;
  });

  await gate('G-NC1', 'a shape inside a rounded shape nests its corner wherever it sits near one: even inset and inner radius = outer radius − inset', async () => {
    // Pane, 2026-10-30, user: the ⌘K key in the topbar search pill sat 4px from the pill's round end and
    // 12px from its top and bottom, with a 6px corner against a 22px one. G-NR1 checked this rule only for
    // the highlighted row of an open flyout, so the topbar, built later, never met it. This is the rule
    // itself: any drawn box near a drawn parent's rounded corner, on the shell and on component pages.
    const routes = [...new Set(['/', ...ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code')).slice(0, 40), ...(ROUTES.includes(C.statesRoute ?? '/patterns/states') ? [C.statesRoute ?? '/patterns/states'] : [])])].filter((r) => ROUTES.includes(r));
    if (!routes.length) throw new Error('NO pages to check');
    const bad = [];
    for (const r of routes) {
      await go(r);
      const res = await page.evaluate((EXEMPT) => {
        const out = [];
        const drawn = (el) => {
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'contents') return false;
          const bg = cs.backgroundColor; const solid = bg && !/rgba\(.*,\s*0\)$/.test(bg) && bg !== 'transparent';
          // a shadow draws a shape unless every layer is an inset line along one edge (a divider: inset 0 Npx 0)
          const lineOnly = cs.boxShadow !== 'none' && cs.boxShadow.split(/,(?![^(]*\))/).every((l) => /inset/.test(l) && /(^|\s)0px\s+-?[\d.]+px\s+0px(\s|$)/.test(l.replace(/rgba?\([^)]*\)/, '').trim()));
          return solid || cs.backgroundImage !== 'none' || (cs.boxShadow !== 'none' && !lineOnly) || ['Top', 'Right', 'Bottom', 'Left'].every((k) => parseFloat(cs[`border${k}Width`]) > 0); // a one-side rule is a line, not a shape
        };
        const rad = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        const name = (el) => el.closest('[data-component]')?.getAttribute('data-component') ?? (el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase());
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest(`svg, [aria-hidden="true"] [aria-hidden="true"], [data-nc-exempt]${EXEMPT ? `, ${EXEMPT}` : ''}`) || !drawn(el)) continue;
          const b = el.getBoundingClientRect();
          if (b.width < 12 || b.height < 12 || b.width > 600) continue;
          let p = el.parentElement; while (p && p !== document.body && !drawn(p)) p = p.parentElement;
          if (!p || p === document.body) continue;
          const pb = p.getBoundingClientRect(); const R = Math.min(rad(p), pb.height / 2, pb.width / 2);
          if (R < 10 || pb.height > 160) continue;
          const l = b.left - pb.left, rr = pb.right - b.right, t = b.top - pb.top, bo = pb.bottom - b.bottom;
          if (Math.min(l, rr, t, bo) < -0.5) continue; // not inside: a lens, a tooltip, a popover
          // only boxes that sit in a corner region: both their inline and block insets smaller than the corner
          const h = Math.min(l, rr), v = Math.min(t, bo);
          // a corner is only read as shared when the gap to it is small next to its curve (under 0.6 R);
          // further in, the inner shape stands on its own and keeps its own corner
          if (Math.max(h, v) > 0.6 * R) continue;
          // flush against a parent that clips its children (a code block's bar) the parent's own corner does the work
          if (Math.max(h, v) < 1 && getComputedStyle(p).overflow !== 'visible') continue;
          const want = Math.max(0, R - Math.max(h, v)); const got = Math.min(rad(el), b.height / 2, b.width / 2);
          // a pill's end is set by its height, so a pill only owes the even inset, never a radius
          const pill = got >= Math.min(b.height, b.width) / 2 - 1;
          const uneven = Math.abs(h - v) > Math.max(2, 0.25 * Math.max(h, v)) && Math.min(h, v) < 0.6 * Math.max(h, v);
          if (uneven || (!pill && Math.abs(got - want) > Math.max(2, 0.2 * want))) out.push(`${name(el)}${el.closest('[data-component]') === el ? '' : ` ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0].replace(/^[a-z][a-z0-9-]*?-(?=[A-Z])|-module__/g, '')}`} in ${name(p)}: inset ${Math.round(h)}px/${Math.round(v)}px, corner ${Math.round(got)}px (wants even insets and ${Math.round(want)}px)`);
        }
        return out;
      }, C.ncExempt ?? '');
      for (const x of res) bad.push(`${r}: ${x}`);
    }
    const u = [...new Set(bad.map((x) => x.replace(/^\S+: /, '')))];
    if (u.length) throw new Error(`${u.length} nested shapes: ${u.slice(0, 8).join(' | ')}`);
    return `${routes.length} pages`;
  });

  await gate('G-NR1', 'a highlighted row inside a rounded flyout nests its corner: inner radius = outer radius − inset', async () => {
    // Pane dry run, 2026-10-28: the dropdown's highlighted row had its own pill radius and an uneven
    // inset, so its curve did not follow the flyout's. Checked on every open listbox and menu.
    const bad = []; let n = 0; let tried = 0;
    for (const r of ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'))) {
      await go(r);
      const triggers = await page.locator('[data-example-live] button[role="combobox"], [data-example-live] [aria-haspopup="menu"]').count();
      for (let i = 0; i < Math.min(triggers, 2); i++) {
        const t = page.locator('[data-example-live] button[role="combobox"], [data-example-live] [aria-haspopup="menu"]').nth(i);
        if (!(await t.isVisible()) || (await t.isDisabled())) continue;
        tried++;
        await t.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
        const res = await page.evaluate(() => {
          const pop = [...document.querySelectorAll('[role="listbox"], [role="menu"]')].find((x) => x.getBoundingClientRect().width > 0);
          if (!pop) return null;
          const R = parseFloat(getComputedStyle(pop).borderTopLeftRadius) || 0;
          const pb = pop.getBoundingClientRect(); const pcs = getComputedStyle(pop);
          const item = pop.querySelector('[data-highlighted], [aria-selected="true"], [data-active], [role="option"], [role="menuitem"]');
          if (!item) return null;
          const ib = item.getBoundingClientRect(); const r = parseFloat(getComputedStyle(item).borderTopLeftRadius) || 0;
          const inset = Math.max(0, ib.left - pb.left - (parseFloat(pcs.borderLeftWidth) || 0));
          return { R, r: Math.min(r, ib.height / 2), h: ib.height, inset, want: Math.max(0, R - inset - (parseFloat(pcs.borderLeftWidth) || 0)) };
        });
        await page.keyboard.press('Escape');
        if (!res) continue;
        n++;
        // the row's drawn radius is capped at half its height; a nested radius above that turns every
        // row into a pill whose round ends cannot follow the flyout's straight sides
        if (res.R > 0 && res.want >= res.h / 2 - 0.5) bad.push(`${r}: a ${res.R}px flyout with ${Math.round(res.inset)}px inset needs a ${Math.round(res.want)}px row radius, more than half the ${Math.round(res.h)}px row, so rows read as pills (use a smaller flyout radius or a larger inset)`);
        else if (res.R > 0 && Math.abs(res.r - res.want) > 2) bad.push(`${r}: row radius ${Math.round(res.r)}px in a ${res.R}px flyout with ${Math.round(res.inset)}px inset (nested radius ${Math.round(res.want)}px)`);
      }
    }
    if (!tried) return 'no flyout triggers on any Code page';
    expect(n > 0, `${tried} flyout triggers found but no listbox or menu opened, so nothing was measured`);
    fail(bad, 'flyouts whose rows do not nest');
    return `${n} flyouts`;
  });

  await gate('G-TX1', 'a text field holds every script and keeps its size while typing: Thai marks above and below are not clipped, and typing never widens the field', async () => {
    // Pane, 2026-10-30, user: "ภาษาไทยสระบนสุดโดนตัด … ตอนพิมพ์ input มันยืดยาวขึ้น". The field's line box was
    // 1.15em, which cuts the tone mark stacked over an upper vowel, and SearchInput grew by its clear button
    // once there was a query. Measured on the state matrix, where every field family has a row.
    const route = C.statesRoute ?? '/patterns/states';
    if (!ROUTES.includes(route)) throw new Error('NO state matrix route in this run');
    await go(route);
    const SEL = 'input:is([type="text"], [type="search"], [type="email"], [type="password"], [type="tel"], [type="url"], :not([type])):not([readonly]):not(:disabled), textarea:not([readonly]):not(:disabled)';
    const fields = await page.locator(`main ${SEL}`).all();
    const bad = [];
    for (const f of fields) {
      if (!(await f.isVisible())) continue;
      const before = await f.evaluate((el) => {
        const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
        const lh = cs.lineHeight === 'normal' ? fs * 1.4 : parseFloat(cs.lineHeight);
        const host = el.closest('[data-component]:not([data-component="Input"])') ?? el.closest('[data-component]') ?? el;
        return { name: host.getAttribute('data-component') ?? el.tagName, ratio: lh / fs, w: host.getBoundingClientRect().width };
      });
      // a tone mark over an upper vowel and a lower vowel need about 1.35em of line box in Thai fonts
      if (before.ratio < 1.35) bad.push(`${before.name}: line box ${before.ratio.toFixed(2)}em clips Thai marks (needs 1.35)`);
      await f.fill('เหี่ยะอะไรเนี่ย ปู่ฤๅษี');
      const after = await f.evaluate((el) => (el.closest('[data-component]:not([data-component="Input"])') ?? el.closest('[data-component]') ?? el).getBoundingClientRect().width);
      if (Math.abs(after - before.w) > 1) bad.push(`${before.name}: ${Math.round(before.w)}px empty, ${Math.round(after)}px while typing`);
      await f.fill('');
    }
    if (!fields.length) throw new Error('NO text fields on the state matrix');
    const u = [...new Set(bad)];
    if (u.length) throw new Error(`${u.length} fields: ${u.slice(0, 8).join(' | ')}`);
    return `${fields.length} fields`;
  });

  await gate('G-IN1', 'text inside a control keeps its inset from the control\'s edge: at least 8px, and half the corner radius on a rounded end', async () => {
    // Pane, 2026-10-29: InputGroup's "NOK" suffix sat 4px from the pill's right curve, because the end
    // padding was sized for a round button. Every gate passed; the user saw it at once. Measured here:
    // the gap between each line of text and the inline edges of the nearest control that draws a boundary.
    const bad = []; let n = 0;
    for (const r of ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`) && x.endsWith('/code'))) {
      await go(r);
      const res = await page.evaluate(() => {
        const out = []; let count = 0;
        const drawn = (el) => {
          const cs = getComputedStyle(el);
          const bg = cs.backgroundColor; const solid = bg && !/rgba\(.*,\s*0\)$/.test(bg) && bg !== 'transparent';
          return parseFloat(cs.borderLeftWidth) > 0 || cs.boxShadow !== 'none' || solid || cs.backgroundImage !== 'none';
        };
        const isControl = (el) => {
          const b = el.getBoundingClientRect();
          return b.height >= 20 && b.height <= 72 && b.width > 0 && drawn(el) && (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) >= 4;
        };
        const need = (el) => { const b = el.getBoundingClientRect(); const R = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, b.height / 2); return Math.max(8, R / 2); };
        const label = (el) => el.closest('[data-component]')?.getAttribute('data-component') ?? el.tagName.toLowerCase();
        for (const stage of document.querySelectorAll('[data-example-live]')) {
          // text nodes: measured against the nearest ancestor that is a control-sized bounded shape
          const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
          for (let t = walker.nextNode(); t; t = walker.nextNode()) {
            if (!t.textContent.trim()) continue;
            // text kept for screen readers only (clipped to a pixel) is not on screen, so it cannot crowd anything
            const host = t.parentElement; const hb = host?.getBoundingClientRect(); if (!hb || hb.width <= 1 || hb.height <= 1) continue;
            // a line cut with an ellipsis is clipped by its own box; measure the box, not the text that runs past it
            const clipped = getComputedStyle(host).textOverflow === 'ellipsis' && host.scrollWidth > host.clientWidth;
            let el = host; while (el && el !== stage && !isControl(el)) el = el.parentElement;
            if (!el || el === stage) continue;
            const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], [hidden]')) continue;
            // a monogram in a disc (an Avatar's initials, Pane wave 7): the disc is sized to its letters and has no
            // start or end edge for the text to crowd, so the inset rule for pills does not apply
            { const db = el.getBoundingClientRect(); if (Math.abs(db.width - db.height) < 2 && (parseFloat(cs.borderTopLeftRadius) || 0) >= db.height / 2 - 1) continue; }
            const rg = document.createRange(); rg.selectNodeContents(t);
            const b = el.getBoundingClientRect(); const want = need(el);
            for (const tr0 of rg.getClientRects()) {
              const tr = clipped ? { left: Math.max(tr0.left, hb.left), right: Math.min(tr0.right, hb.right), top: tr0.top, bottom: tr0.bottom, width: tr0.width } : tr0;
              if (tr.width < 1 || tr.bottom < b.top || tr.top > b.bottom) continue;
              count++;
              const gap = Math.min(tr.left - b.left, b.right - tr.right);
              if (gap < want - 0.5) out.push(`${label(el)} "${t.textContent.trim().slice(0, 16)}" ${Math.round(gap)}px from its edge (needs ${Math.round(want)})`);
            }
          }
          // typed text in a field that draws its own boundary starts at its padding
          for (const f of stage.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea')) {
            if (!isControl(f)) continue;
            const cs = getComputedStyle(f); const want = need(f);
            if (cs.textAlign === 'center') continue; // a centred cell (a PIN digit) is clear of both edges by construction
            count++;
            const pad = Math.min(parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth));
            if (pad < want - 0.5) out.push(`${label(f)} field text ${Math.round(pad)}px from its edge (needs ${Math.round(want)})`);
          }
        }
        return { out: [...new Set(out)], count };
      });
      n += res.count;
      for (const o of res.out) bad.push(`${r}: ${o}`);
    }
    expect(n > 0, 'NO TEXT IN A CONTROL on any Code page, so nothing was measured');
    fail(bad, 'texts that crowd their control\'s edge');
    return `${n} lines of text in controls`;
  });

  await gate('G-ST1', 'the address holds only what someone chose: a default is never written into the URL, and a stale or unknown value falls back and is dropped', async () => {
    // Pane, 2026-10-29: the app wrote ?scene=room into every URL while room was the default. When the
    // default became the studio, every saved link still forced the old photo and the user kept seeing it.
    const p2 = await browser.newPage();
    const settle = async (q) => { await p2.goto(`${srv.base}/${q}`, { waitUntil: 'networkidle' }); await p2.waitForTimeout(600); return new URL(p2.url()).searchParams; };
    const bad = [];
    const clean = await settle('');
    if ([...clean.keys()].length) bad.push(`a fresh visit to / ends with ?${clean} in the address: the app wrote its defaults into the URL`);
    const stale = await settle(`?${C.sceneParam}=no-such-value&${C.themeParam}=no-such-value`);
    for (const [k, v] of stale) if (v === 'no-such-value') bad.push(`?${k}=no-such-value is still in the address after load: an unknown value must fall back to the default and be dropped`);
    expect(await p2.locator('main').count() > 0, 'the page did not render with unknown values in the address');
    // a book with a backdrop control and no configured scenes measured every scene-swept check on one
    // backdrop and called it all of them; the starter ships one real scene, so an empty list is a lost setting
    if (!C.scenes.length && await p2.locator('[data-scene-control]').count()) bad.push('the book has a backdrop control but docs.scenes is empty: list the backdrop ids in kiln.config.json (the first is the default)');
    else if (C.scenes.length) {
      const known = await p2.evaluate((ids) => ids.filter((id) => !document.querySelector(`[data-scene-control] option[value="${id}"], [data-scene-control] [data-value="${id}"], [data-scene-control] [value="${id}"]`)), C.scenes);
      if (await p2.locator('[data-scene-control] option, [data-scene-control] [data-value]').count() && known.length) bad.push(`docs.scenes lists ${known.join(', ')}, which the backdrop control does not offer`);
    }
    // every configured scene must be one the app understands, or every scene-swept check measures the default
    // (Pane, 2026-10-29: the app moved to ?backdrop= and evidence kept sending ?scene=, so its "4 scenes" were one)
    for (const sc of C.scenes.slice(1)) { const kept = await settle(`?${C.sceneParam}=${sc}`); if (kept.get(C.sceneParam) !== sc) bad.push(`?${C.sceneParam}=${sc} is dropped on load: the app does not read the scene the checks ask for`); }
    await p2.close();
    fail(bad, 'address problems');
    return 'clean address, stale values dropped';
  });

  await gate('G-RH1', 'separate steps stand apart: a demo stage and a tab bar sit at least 24px from the blocks around them; a stage\'s own code, caption or heading may sit 8px off and its intro 16px', async () => {
    // Pane, 2026-10-29: the live demo stacked its intro, its controls, the stage, the code and the
    // page's tab bar 8px apart, so five different things read as one lump. The user saw it at once.
    const bad = []; let n = 0;
    for (const r of ROUTES.filter((x) => x.startsWith(`${C.componentsBase}/`)).slice(0, 400)) {
      await go(r);
      const res = await page.evaluate(() => {
        const main = document.querySelector('main'); if (!main) return { out: [], n: 0 };
        const vis = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
        const blocks = [...main.querySelectorAll('p, h1, h2, h3, h4, nav, table, pre, ul, ol, [data-selector], [data-example-live], [data-controls], label')].filter(vis);
        // a block nested in another listed block is measured through its outermost listed ancestor
        const outer = blocks.filter((el) => !blocks.some((o) => o !== el && o.contains(el)));
        const isCode = (el) => el.matches('pre') || !!el.querySelector('pre');
        const name = (el) => el.matches('[data-example-live]') ? 'stage' : el.matches('nav') ? 'tab bar' : isCode(el) ? 'code' : el.tagName.toLowerCase();
        const out = []; let n = 0;
        for (const el of outer.filter((x) => x.matches('[data-example-live], nav[aria-label]'))) {
          const b = el.getBoundingClientRect();
          const near = (dir) => outer.filter((o) => o !== el && !o.contains(el) && !el.contains(o)).map((o) => ({ o, ob: o.getBoundingClientRect() }))
            .filter(({ ob }) => ob.right > b.left + 4 && ob.left < b.right - 4 && (dir < 0 ? ob.bottom <= b.top + 1 : ob.top >= b.bottom - 1))
            .sort((x, y) => (dir < 0 ? y.ob.bottom - x.ob.bottom : x.ob.top - y.ob.top))[0];
          for (const dir of [-1, 1]) {
            const m = near(dir); if (!m) continue;
            const gap = dir < 0 ? b.top - m.ob.bottom : m.ob.top - b.bottom;
            if (gap > 200) continue;
            n++;
            const fig = el.closest('figure');
            // the stage's own code below it, or anything in its own figure (caption, legend) belongs to it
            const own = el.matches('[data-example-live]') && ((dir > 0 && isCode(m.o)) || (fig && fig.contains(m.o)) || m.o.matches('figcaption'));
            // a heading leads into what follows it (8px), a paragraph that introduces a stage stays close
            // to it (16px), anything else is a separate step (24px)
            const lead = dir < 0 && el.matches('[data-example-live]') && /^h[1-6]$/i.test(m.o.tagName);
            const intro = dir < 0 && el.matches('[data-example-live]') && m.o.matches('p');
            const want = own || lead ? 8 : intro ? 16 : 24;
            if (gap < want - 0.5) out.push(`${name(m.o)} ${Math.round(gap)}px ${dir < 0 ? 'above' : 'below'} the ${name(el)} (needs ${want})`);
          }
        }
        return { out: [...new Set(out)], n };
      });
      n += res.n; for (const o of res.out) bad.push(`${r}: ${o}`);
    }
    expect(n > 0, 'NO STAGE OR TAB BAR on any component page, so nothing was measured');
    fail(bad, 'steps that crowd each other');
    return `${n} gaps`;
  });

  await gate('G-NAV1', 'every page in routes.json is reachable from the book nav at 375 and 1280px', async () => {
    const want = JSON.parse(readFileSync(C.abs(C.routes), 'utf8')).parts.flatMap((p) => p.pages.map((pg) => pg.path));
    const bad = [];
    for (const w of [375, 1280]) {
      await page.setViewportSize({ width: w, height: 800 });
      await go('/');
      const hrefs = await page.locator('nav[data-book-nav] a').evaluateAll((as) => as.map((a) => new URL(a.href).pathname));
      for (const p of want) if (!hrefs.some((h) => h === p || h.startsWith(`${p}/`))) bad.push(`${w}px ${p}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(want.length, 'NO ROUTES FOUND');
    fail(bad, 'pages not in the nav');
    return `${want.length} pages`;
  });

  await gate('G-SM1', 'following an in-page link (table of contents, heading anchor) lands with its heading clear of the sticky header', async () => {
    const bad = [];
    let n = 0;
    for (const r of ROUTES.filter((x) => !x.startsWith(`${C.componentsBase}/`) || x.endsWith('/usage'))) {
      await go(r);
      const hashes = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && document.getElementById(h.slice(1))))].slice(1, 3));
      for (const h of hashes) {
        n++;
        await page.evaluate((id) => { location.hash = id; }, h);
        await page.waitForTimeout(80);
        const g = await page.evaluate((id) => {
          const el = document.getElementById(id.slice(1));
          const head = el.matches('h1, h2, h3, h4') ? el : el.querySelector('h1, h2, h3, h4') ?? el;
          const bars = [...document.querySelectorAll('body *')].filter((e) => ['sticky', 'fixed'].includes(getComputedStyle(e).position) && e.getBoundingClientRect().top <= 0 && e.getBoundingClientRect().width > innerWidth / 2);
          const atEnd = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2;
          return { top: head.getBoundingClientRect().top, bar: Math.max(0, ...bars.map((x) => x.getBoundingClientRect().bottom)), atEnd };
        }, h);
        if (g.top < g.bar - 1 && !g.atEnd) bad.push(`${r}${h}: heading at ${Math.round(g.top)}px, header ends at ${Math.round(g.bar)}px`);
      }
    }
    expect(n > 0, 'NO IN-PAGE LINKS FOUND (a[href^="#"])');
    fail(bad, 'headings under the header');
    return `${n} links followed`;
  });

  const TOUCH = C.touchTarget ?? 44;
  await gate('G-TT1', `every control in a live example and in the shell gives a pointer at least ${TOUCH}px each way`, async () => {
    const bad = [];
    let n = 0;
    for (const r of ROUTES) {
      await go(r);
      const res = await page.evaluate((min) => {
        const hit = (el) => {
          const b = el.getBoundingClientRect();
          let w = b.width, h = b.height;
          // a hit area may be drawn by an absolute pseudo-element or a [data-hit] child that extends past the box
          for (const pseudo of ['::before', '::after']) {
            const cs = getComputedStyle(el, pseudo);
            if (cs.content !== 'none' && cs.position === 'absolute') { w = Math.max(w, parseFloat(cs.width) || 0); h = Math.max(h, parseFloat(cs.height) || 0); }
          }
          const child = el.querySelector('[data-hit]');
          if (child) { const c = child.getBoundingClientRect(); w = Math.max(w, c.width); h = Math.max(h, c.height); }
          // a form field may take its press area from a label marked [data-hit] that surrounds it
          for (const l of el.labels ?? []) if (l.matches('[data-hit]')) { const c = l.getBoundingClientRect(); w = Math.max(w, c.width); h = Math.max(h, c.height); }
          return [w, h];
        };
        const sel = '[data-example-live] :is(button, a[href], [role="button"], [role="tab"], [role="slider"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], input:not([type="hidden"]), select, textarea), header :is(button, a[href]), nav[data-book-nav] button';
        // inline text links are exempt (WCAG 2.5.8 exception); a deliberate exception carries data-touch-exempt and an EXCEPTIONS entry
        // a form's mirror input (Radix renders an aria-hidden, untabbable input beside a switch or checkbox inside a
        // <form>, Pane's Form, 2026-10-30) is not a target; the visible control beside it is measured instead
        const mirror = (e) => e.tagName === 'INPUT' && e.getAttribute('aria-hidden') === 'true' && e.tabIndex < 0;
        const els = [...document.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width > 0 && !mirror(e) && !e.closest('[data-dont], [data-touch-exempt]') && !(e.tagName === 'A' && e.closest('p, li, td')));
        // a control hidden until it has focus (a skip link, a Refresh button for a gesture) is measured focused
        const sized = (e) => { let [w, h] = hit(e); if (w <= 2 && h <= 2) { e.focus({ preventScroll: true }); [w, h] = hit(e); e.blur(); } return [w, h]; };
        return els.map((e) => { const [w, h] = sized(e); return w + 0.5 >= min && h + 0.5 >= min ? null : `${(e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 20)} ${Math.round(w)}×${Math.round(h)}`; });
      }, TOUCH);
      n += res.length;
      for (const x of new Set(res.filter(Boolean))) bad.push(`${r}: ${x}`);
    }
    expect(n > 0, 'NO CONTROLS FOUND');
    fail(bad, `controls under ${TOUCH}px`);
    return `${n} controls`;
  });

  // ------------------------------------------------------------------ axe
  for (const mode of ['none', 'active']) {
    await gate(`axe-${mode}`, `axe finds no WCAG 2.2 AA violations on any page (forced-colors ${mode})`, async () => {
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: mode, reducedMotion: 'reduce' });
      const p = await c.newPage();
      const bad = [];
      try {
        for (const r of ROUTES) {
          await p.goto(url(srv.base, r, { theme: THEME, scene: SCENE }, C), { waitUntil: 'networkidle' }); await unfold(p);
          // In forced colours the reader's own palette sets every colour, and axe reads authored colours for
          // text inside a nested theme region (assay dry run: #F2F2EF reported on a forced white page while the
          // computed colour was black). Contrast in that mode is measured per pixel by evidence.mjs instead.
          const builder = new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
          if (mode === 'active') builder.disableRules(['color-contrast']);
          const res = await builder.analyze();
          for (const v of res.violations) bad.push(`${r} ${v.id}×${v.nodes.length}`);
        }
      } finally { await c.close(); }
      fail(bad, 'violations');
    });
  }
} finally {
  await browser.close();
  srv.close();
}

if (SHARD) {
  mkdirSync(path.dirname(shardFile(SHARD[0])), { recursive: true });
  writeFileSync(shardFile(SHARD[0]), JSON.stringify(results));
  process.exit(0);
}
if (MERGE != null) {
  for (let k = 0; k < MERGE; k++) {
    if (!existsSync(shardFile(k))) { console.log(`✗ gates: shard ${k} wrote no results (it crashed); the run is incomplete`); process.exit(1); }
    results.push(...JSON.parse(readFileSync(shardFile(k), 'utf8')));
  }
  results.sort((a, b) => a.order - b.order);
}
const passed = results.filter((r) => r.ok).length;
// docs.advisory = { "G-XX": "why it cannot pass yet" }: reported as ! and kept out of the exit code, so a
// gate still being built never forces verify to run a hand-picked --only list (which hid real reds in
// Pane). The milestone check refuses to close a milestone while any advisory gate is red.
const ADVISORY = C.advisory ?? {};
const blocking = results.filter((r) => !r.ok && !(r.id in ADVISORY));
for (const r of results) console.log(`${r.ok ? '✓' : r.id in ADVISORY ? '!' : '✗'} ${r.id.padEnd(10)} ${r.name}${r.detail ? ` — ${r.detail}` : ''}${!r.ok && r.id in ADVISORY ? ` (advisory: ${ADVISORY[r.id]})` : ''}`);
const stamp = new Date().toISOString();
mkdirSync(path.join(C.abs(C.app), 'public'), { recursive: true });
writeFileSync(path.join(C.abs(C.app), 'public', 'gates.json'), JSON.stringify({ generatedAt: stamp, passed, total: results.length, partial: Boolean(ONLY), advisory: ADVISORY, results }, null, 2) + '\n');
if (process.argv.includes('--report')) {
  const md = [`# Docs audit ${stamp.slice(0, 10)}`, '', `${passed}/${results.length} gates pass. Failed gates first, every problem listed.`, ''];
  for (const r of [...results].sort((a, b) => Number(a.ok) - Number(b.ok))) {
    md.push(`## ${r.ok ? '✓' : '✗'} ${r.id} ${r.name}`, '');
    if (r.detail) md.push(r.ok ? r.detail : `**${r.detail.split(':')[0]}**`, '');
    for (const p of r.problems ?? []) md.push(`- ${p}`);
    md.push('');
  }
  mkdirSync(path.join(C.root, 'system', 'reports'), { recursive: true });
  writeFileSync(path.join(C.root, 'system', 'reports', `docs-audit-${stamp.slice(0, 10)}.md`), md.join('\n'));
}
const adv = results.length - passed - blocking.length;
console.log(`\n${blocking.length ? '✗' : '✓'} docs gates: ${passed}/${results.length}${adv ? `, ${adv} advisory red` : ''}${ONLY ? ' (--only: a partial run proves nothing about the rest)' : ''}`);
process.exit(blocking.length ? 1 : 0);
