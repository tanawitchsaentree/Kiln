#!/usr/bin/env node
// gates — kiln's docs gates, run against any system's BUILT docs through the page contract
// (docs-engine/references/page-contract.md). Nothing here knows a system's class names; a gate that
// finds none of its markers fails with NOTHING FOUND. Component behaviour (keyboard, roles) is the
// system's own conformance suite; this file owns what every kiln docs site must be.
//
//   shell        G-P0 G-D3 G-S1 G-S2 G-S3 G-S5          copy        G-C1 G-C2
//   reading      G-R1 (size, leading, measure)      affordance  G-A1      loading  G-PF1 G-PF2
//   chrome       G-SH1 plain opaque shell; the system's look lives in demo stages only
//   foundations  G-F1 G-N1                          themes      G-T1
//   components   G-K1–G-K8 G-B1 G-L1 demo floor     reference   G-M1 G-IA1      a11y  axe ×2
//   identity     G-X1 habitual patterns (accent stripe, icon-disc alert) need a derivation that justifies them
//   diagrams     G-NT1 graphic parts ≥3:1 off their ground (WCAG 1.4.11)
//   benchmarks   G-BT1 every reference topic for a page covered or declined (benchmarks/topics)
//   reasons      G-W1 (Why column, component reasons section; data from rationale.mjs)
//   claims       G-CL1 every hex in the book is a current token value
//   milestone    G-TODO1 no starter placeholder or seed reason left   reach  G-NAV1 G-SM1   touch  G-TT1
//
// Usage: node tooling/engine/gates.mjs [--only G-K2,G-K3] [--report]
//   --report  also writes system/reports/docs-audit-{date}.md, a ranked punch list
// Writes <app>/public/gates.json. Exit 1 on any failed gate.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { docsConfig, routes, componentPages, url } from './config.mjs';
import { serveDist } from './serve-dist.mjs';

const C = docsConfig();
const ROUTES = routes(C);
const COMPONENTS = componentPages(C);
const META = existsSync(C.abs(C.meta)) ? JSON.parse(readFileSync(C.abs(C.meta), 'utf8')) : { components: {} };
const BENCH = C.benchmark && existsSync(C.abs(C.benchmark)) ? JSON.parse(readFileSync(C.abs(C.benchmark), 'utf8')).components : {};
const ONLY = process.argv.includes('--only') ? new Set(process.argv[process.argv.indexOf('--only') + 1].split(',')) : null;
const THEME = C.themes[0];
const SCENE = C.scenes[0];

const results = [];
async function gate(id, name, fn) {
  if (ONLY && !ONLY.has(id)) return;
  try {
    const detail = await fn();
    results.push({ id, name, ok: true, detail: typeof detail === 'string' ? detail : undefined });
  } catch (e) {
    results.push({ id, name, ok: false, detail: String(e.message ?? e).split('\n')[0], problems: e.problems });
  }
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
const go = (route, opts = {}) => page.goto(url(srv.base, route, { theme: THEME, scene: SCENE, ...opts }, C), { waitUntil: 'networkidle' });

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
      await page.locator('nav[data-book-nav]').getByRole('link', { name: target.title, exact: true }).click();
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
        const link = [...document.querySelectorAll('nav[data-book-nav] a')].find((a) => a.textContent.trim() === n);
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
      return { diffs, titleCursor: t.cursor, titleInteractive: !!title.closest('a, button') };
    });
    expect(!r.missing, 'NO NAV LINK OR PART TITLE FOUND ([data-nav-part])');
    const link = page.locator('nav[data-book-nav] a:not([aria-current])').first();
    const before = await link.evaluate((e) => { const c = getComputedStyle(e); return `${c.backgroundColor}|${c.color}|${c.textDecorationLine}|${c.boxShadow}`; });
    await link.hover(); await page.waitForTimeout(500);
    const after = await link.evaluate((e) => { const c = getComputedStyle(e); return `${c.backgroundColor}|${c.color}|${c.textDecorationLine}|${c.boxShadow}`; });
    const bad = [];
    if (r.diffs.length < 2) bad.push(`links and part titles differ only in ${r.diffs.join(', ') || 'nothing'}`);
    if (r.titleCursor === 'pointer' || r.titleInteractive) bad.push('part title looks pressable');
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
      const r = await page.evaluate(() => { const cells = [...document.querySelectorAll('[data-spec] [data-value]')]; return { cells: cells.length, untokened: cells.filter((c) => !c.dataset.token).length }; });
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
        const aliases = n.split('/').map((a) => a.trim().toLowerCase()).filter(Boolean);
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

  await gate('G-CL1', 'every colour value written in the book is a current token value (no stale hex in prose)', async () => {
    // a hex typed into prose drifts when the token changes (assay dry run: #B3261E stayed in four pages
    // after the hazard red was darkened); the book should read values from tokens, and this catches it
    const tokFile = path.join(C.root, 'packages/tokens/build/json/tokens.json');
    expect(existsSync(tokFile), 'no built tokens json');
    const toks = JSON.parse(readFileSync(tokFile, 'utf8'));
    const known = new Set();
    for (const t of Object.values(toks)) for (const v of [t.value, ...Object.values(t.themes ?? {}).map((x) => x.value)]) for (const m of String(v).matchAll(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi)) known.add(m[0].toUpperCase().slice(0, 7));
    const bad = []; let n = 0;
    for (const r of ROUTES) {
      await go(r);
      const hexes = await page.evaluate(() => [...(document.querySelector('main')?.innerText ?? '').matchAll(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi)].map((m) => m[0]));
      for (const h of new Set(hexes)) { n++; if (!known.has(h.toUpperCase().slice(0, 7))) bad.push(`${r}: ${h}`); }
    }
    fail(bad, 'colour values that are not tokens');
    return `${n} values checked`;
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
          return [w, h];
        };
        const sel = '[data-example-live] :is(button, a[href], [role="button"], [role="tab"], [role="slider"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], input:not([type="hidden"]), select, textarea), header :is(button, a[href]), nav[data-book-nav] button';
        // inline text links are exempt (WCAG 2.5.8 exception); a deliberate exception carries data-touch-exempt and an EXCEPTIONS entry
        const els = [...document.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('[data-dont], [data-touch-exempt]') && !(e.tagName === 'A' && e.closest('p, li, td')));
        return els.map((e) => { const [w, h] = hit(e); return w + 0.5 >= min && h + 0.5 >= min ? null : `${(e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 20)} ${Math.round(w)}×${Math.round(h)}`; });
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
          await p.goto(url(srv.base, r, { theme: THEME, scene: SCENE }, C), { waitUntil: 'networkidle' });
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
