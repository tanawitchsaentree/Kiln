#!/usr/bin/env node
// anchor-contrast — the anchor round's contrast check (iron rule 9): worst-pixel WCAG contrast of every visible
// text node in the anchor lab, in every theme the book has, plus a screenshot of each variant. The user picks
// among variants that are all readable, never between a pretty one and a legible one.
// Usage: node tooling/kiln/anchor-contrast.mjs [apps/lab/anchor/index.html] [--threshold 4.5]
// Variants are the elements with [data-anchor]; the theme is set as ?theme=<t> and as data-theme on <html>.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, docsConfig } from './config.mjs';
import { measurePageText } from './text-contrast.mjs';

const C = docsConfig();
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const file = path.resolve(ROOT, process.argv.slice(2).find((a) => !a.startsWith('--') && a !== arg('--threshold')) ?? 'apps/lab/anchor/index.html');
const T = Number(arg('--threshold') ?? C.contrast?.threshold ?? 4.5);
if (!existsSync(file)) { console.log(`✗ no anchor lab at ${path.relative(ROOT, file)}`); process.exit(1); }
const out = path.join(path.dirname(file), 'shots'); mkdirSync(out, { recursive: true });
const b = await chromium.launch(); let bad = 0;
for (const theme of C.themes ?? ['dark', 'light']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto(`${pathToFileURL(file).href}?theme=${theme}`); await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, `anchor-${theme}.png`), fullPage: true });
  for (const h of await p.$$('[data-anchor]')) { const id = await h.getAttribute('data-anchor'); if (id) await h.screenshot({ path: path.join(out, `${id}-${theme}.png`) }); }
  const r = await measurePageText(p, T);
  bad += r.failures.length;
  console.log(`${r.failures.length ? '✗' : '✓'} ${theme}: ${r.textElements} text nodes, ${r.failures.length} below ${T}:1`);
  for (const f of r.failures.slice(0, 6)) console.log(`  ✗ ${JSON.stringify(String(f.text ?? '').slice(0, 24))} ${f.min?.toFixed?.(2) ?? f.min}`);
  await p.close();
}
await b.close();
console.log(`${bad ? '✗' : '✓'} anchor contrast: ${bad} text below ${T}:1; shots in ${path.relative(ROOT, out)}/`);
process.exit(bad ? 1 : 0);
