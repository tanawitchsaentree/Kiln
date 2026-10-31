#!/usr/bin/env node
// Gate proof for G-GR1, G-BR1, G-MS1 and G-AN1 (Gate Proof Rule: plant the violation, expect red; repair
// it, expect green). Each case is a small page shaped like the book's markup, run through the same probe
// gates.mjs uses. Usage: node tooling/engine/surface-probes.proof.mjs   (exit 1 when any case is wrong)
import { chromium } from 'playwright';
import { glassCssProblems, glassRecipeProbe, bareSurfaceProbe, meshShareProbe, cardStats, anchorDrift } from './surface-probes.mjs';

// a photo stand-in: a striped bright image as a data URL, so "on a photo" is real pixels and a url() ground
const PHOTO = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#e8d9a0"/><rect width="20" height="40" fill="#f6f1e0"/></svg>')}")`;
const RECIPE = 'blur(32px) saturate(1.8) brightness(0.56)';
const stage = (inner) => `<div data-example-live="" data-surface="" style="padding:24px;background-image:${PHOTO};background-size:40px">${inner}</div>`;
const card = (body) => `<div data-component="Card" data-anchor="" style="width:240px;height:160px;border-radius:16px;${body}">Mara Lind</div>`;

const cases = [
  // G-GR1, static: a hand-written filter is red, a token-only filter is green
  { gate: 'G-GR1 css', want: 'red', run: () => glassCssProblems('.root { backdrop-filter: blur(20px); }', 'Navbar.module.css') },
  { gate: 'G-GR1 css', want: 'green', run: () => glassCssProblems('.root { backdrop-filter: var(--x-navbar-filter); -webkit-backdrop-filter: none; }', 'Navbar.module.css') },
  // G-GR1, computed: Pane's Navbar (blur only) is red, the full recipe is green
  { gate: 'G-GR1 page', want: 'red', html: stage('<nav data-component="Navbar" style="backdrop-filter:blur(20px)">Shop</nav>'), probe: glassRecipeProbe, arg: { scope: 'main [data-example-live] *', functions: ['blur', 'saturate', 'brightness'] } },
  { gate: 'G-GR1 page', want: 'green', html: stage(`<nav data-component="Navbar" style="backdrop-filter:${RECIPE}">Shop</nav>`), probe: glassRecipeProbe, arg: { scope: 'main [data-example-live] *', functions: ['blur', 'saturate', 'brightness'] } },
  // G-BR1: a bare chart that paints nothing and draws its labels on the photo is red twice over
  { gate: 'G-BR1 bare', want: 'red', html: stage('<div data-bare="surface"><div data-component="BarChart"><span>Jan</span><span>Feb</span></div></div>'), probe: bareSurfaceProbe, arg: { minAlpha: 0.9, paneAlpha: 0.35, stages: 'main [data-example-live]' } },
  { gate: 'G-BR1 bare', want: 'green', html: stage(`<div data-bare="surface"><div data-component="BarChart" style="backdrop-filter:${RECIPE};background:rgba(20,21,24,.45)"><span>Jan</span><span>Feb</span></div></div>`), probe: bareSurfaceProbe, arg: { minAlpha: 0.9, paneAlpha: 0.35, stages: 'main [data-example-live]' } },
  { gate: 'G-BR1 text', want: 'red', html: stage('<div data-component="ChatMessage"><p>Your print shipped</p></div>'), probe: bareSurfaceProbe, arg: { minAlpha: 0.9, paneAlpha: 0.35, stages: 'main [data-example-live]' } },
  { gate: 'G-BR1 text', want: 'green', html: stage('<div data-component="ChatMessage" style="background:rgba(247,247,249,.66)"><p>Your print shipped</p></div>'), probe: bareSurfaceProbe, arg: { minAlpha: 0.9, paneAlpha: 0.35, stages: 'main [data-example-live]' } },
  // G-MS1: a mesh behind the whole stage is a wallpaper (red); a mesh chip in a corner is an accent (green)
  { gate: 'G-MS1', want: 'red', html: `<section style="height:400px"><div data-mesh="" style="height:380px;background:radial-gradient(at 20% 20%,#f0a,transparent),radial-gradient(at 80% 80%,#0af,transparent)"></div></section>`, probe: meshShareProbe, arg: { maxShare: 0.1, regions: 'section, [data-example-live], [data-surface]' } },
  { gate: 'G-MS1', want: 'red', html: `<style>body{background:radial-gradient(at 0 0,#f0a,transparent),radial-gradient(at 100% 100%,#0af,transparent)}</style><section style="height:400px">Text</section>`, probe: meshShareProbe, arg: { maxShare: 0.1, regions: 'section, [data-example-live], [data-surface]' } },
  { gate: 'G-MS1', want: 'green', html: `<section style="height:400px;width:800px"><div data-mesh="" style="width:120px;height:120px;background:radial-gradient(at 20% 20%,#f0a,transparent),radial-gradient(at 80% 80%,#0af,transparent)"></div></section>`, probe: meshShareProbe, arg: { maxShare: 0.1, regions: 'section, [data-example-live], [data-surface]' } },
  // G-AN1: the anchor is thin glass; a card tuned toward opaque (R-032) is red, the same recipe is green
  { gate: 'G-AN1', want: 'red', anchor: card('background:rgba(20,21,24,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)'), now: card('background:rgba(20,21,24,.92);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)') },
  { gate: 'G-AN1', want: 'green', anchor: card('background:rgba(20,21,24,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)'), now: card('background:rgba(20,21,24,.47);box-shadow:inset 0 0 0 1px rgba(255,255,255,.33)') },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
const show = (body) => page.setContent(`<!doctype html><html><body style="margin:0;font:16px system-ui"><main style="padding:16px">${body}</main></body></html>`);
let wrong = 0;
for (const c of cases) {
  let problems;
  if (c.run) problems = c.run();
  else if (c.anchor) {
    await show(stage(c.anchor)); const ref = await cardStats(page, '[data-anchor]');
    await show(stage(c.now)); const now = await cardStats(page, '[data-anchor]');
    problems = anchorDrift(ref, now);
  } else { await show(c.html); problems = await page.evaluate(c.probe, c.arg); }
  const got = problems.length ? 'red' : 'green';
  if (got !== c.want) wrong++;
  console.log(`${got === c.want ? '✓' : '✗'} ${c.gate} ${c.want}: ${got}${problems.length ? ` (${problems[0].slice(0, 90)})` : ''}`);
}
await browser.close();
console.log(`${wrong ? '✗' : '✓'} surface probes: ${cases.length - wrong}/${cases.length} cases as expected`);
process.exit(wrong ? 1 : 0);
