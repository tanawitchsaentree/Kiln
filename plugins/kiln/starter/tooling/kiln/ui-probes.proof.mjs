#!/usr/bin/env node
// Gate proof for G-CP1, G-BJ1, G-FR1, G-SP1, G-SC1 and G-PG1: each violation planted on a small page must read
// red and its repair green. Usage: node tooling/engine/ui-probes.proof.mjs   (exit 1 when any case is wrong)
import { chromium } from 'playwright';
import { duplicateOptionsProbe, barJobsProbe, focusClipProbe, splitAlignProbe, showcaseProbe, playgroundProbe } from './ui-probes.mjs';

const opts = (labels) => `<div role="listbox">${labels.map((l) => `<div role="option">${l}</div>`).join('')}</div>`;
const pill = 'background:#3a3a3e;border:1px solid #555;border-radius:999px;color:#fff;padding:6px 12px';
const scen = (states, controls) => `<section data-scenario aria-label="Order"><div role="radiogroup">${Array.from({ length: states }, (_, i) => `<button role="radio">s${i}</button>`).join('')}</div>${Array.from({ length: controls }, () => '<input>').join('')}</section>`;
const cases = [
  { gate: 'G-CP1', want: 'red', html: opts(['Button', 'Button', 'Badge']), probe: duplicateOptionsProbe, arg: { options: '[role=option]' } },
  { gate: 'G-CP1', want: 'green', html: opts(['Button', 'Button · Code', 'Badge']), probe: duplicateOptionsProbe, arg: { options: '[role=option]' } },
  { gate: 'G-BJ1', want: 'red', html: `<header><input placeholder="Search" style="${pill}"><button style="${pill}">New in 0.7</button></header>`, probe: barJobsProbe, arg: { bars: 'header' } },
  { gate: 'G-BJ1', want: 'green', html: `<header><input placeholder="Search" style="${pill}"><button style="${pill};background:#5b4bd6">New in 0.7</button></header>`, probe: barJobsProbe, arg: { bars: 'header' } },
  { gate: 'G-FR1', want: 'red', html: '<div style="overflow:hidden;padding:0;width:200px"><button id="f" style="outline:3px solid #09f;outline-offset:2px">Save</button></div>', focus: '#f', probe: focusClipProbe },
  { gate: 'G-FR1', want: 'green', html: '<div style="overflow:hidden;padding:8px;width:200px"><button id="f" style="outline:3px solid #09f;outline-offset:2px">Save</button></div>', focus: '#f', probe: focusClipProbe },
  { gate: 'G-SP1', want: 'red', html: '<div id="sb" style="display:inline-flex;margin-left:40px"><button style="width:120px">Save</button><button style="width:32px">▾</button></div><div role="menu" style="position:absolute;left:160px;top:60px;width:160px;height:80px;background:#eee"></div>', probe: splitAlignProbe, arg: { root: '#sb', menu: '[role=menu]' } },
  { gate: 'G-SP1', want: 'green', html: '<div id="sb" style="display:inline-flex;margin-left:40px"><button style="width:120px">Save</button><button style="width:32px">▾</button></div><div role="menu" style="position:absolute;left:56px;top:60px;width:160px;height:80px;background:#eee"></div>', probe: splitAlignProbe, arg: { root: '#sb', menu: '[role=menu]' } },
  { gate: 'G-SC1', want: 'red', html: '<div class="grid"><div>Card</div><div>Chip</div></div>', probe: showcaseProbe, arg: { scenario: '[data-scenario]' } },
  { gate: 'G-SC1', want: 'red', html: scen(1, 4), probe: showcaseProbe, arg: { scenario: '[data-scenario]' } },
  { gate: 'G-SC1', want: 'green', html: scen(4, 4), probe: showcaseProbe, arg: { scenario: '[data-scenario]' } },
  { gate: 'G-PG1', want: 'red', html: '<div style="--ds-x-size:32px"><div role="slider" aria-valuenow="20" data-playground-token="--ds-x-size"></div></div>', probe: playgroundProbe, pick: (r) => r.problems },
  { gate: 'G-PG1', want: 'green', html: '<div style="--ds-x-size:32px"><div role="slider" aria-valuenow="32" data-playground-token="--ds-x-size"></div></div>', probe: playgroundProbe, pick: (r) => r.problems },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
let wrong = 0;
for (const c of cases) {
  await page.setContent(`<!doctype html><html><body style="margin:0;font:16px system-ui"><main style="padding:16px">${c.html}</main></body></html>`);
  if (c.focus) await page.focus(c.focus);
  const res = await page.evaluate(c.probe, c.arg ?? {});
  const problems = c.pick ? c.pick(res) : res;
  const got = problems.length ? 'red' : 'green';
  if (got !== c.want) wrong++;
  console.log(`${got === c.want ? '✓' : '✗'} ${c.gate} ${c.want}: ${got}${problems.length ? ` (${problems[0].slice(0, 90)})` : ''}`);
}
await browser.close();
console.log(`${wrong ? '✗' : '✓'} ui probes: ${cases.length - wrong}/${cases.length} cases as expected`);
process.exit(wrong ? 1 : 0);
