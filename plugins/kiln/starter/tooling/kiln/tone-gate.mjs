#!/usr/bin/env node
// tone-gate — every page of the built docs must pass the human-tone lint (lint.py: dashes, negation
// scaffolding, label colons, banned lexicon, formula constructions, fake engagement, bow-ties). Reads
// the RENDERED prose (headings, paragraphs, list items, table cells), so generated text is checked
// too. Code, live examples ([data-example] previews, [data-cell]) and fact chips are excluded.
// lint.py: docs.tone.lint, else $HUMAN_TONE_LINT, else the local human-tone install. Missing = FAIL.
// Writes system/reports/tone-gate-{date}.json.
import { writeFileSync, existsSync, mkdtempSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { docsConfig, routes, url } from './config.mjs';
import { serveDist } from './serve-dist.mjs';

const C = docsConfig();
const LINT = C.abs(C.tone.lint) ?? process.env.HUMAN_TONE_LINT ?? path.join(homedir(), 'Downloads', 'human-tone-folder', '.claude', 'skills', 'human-tone', 'scripts', 'lint.py');
if (!existsSync(LINT)) { console.error(`✗ tone gate: lint.py not found at ${LINT}. Nothing was checked, so this fails.`); process.exit(1); }
const EXCLUDE = new Set(C.tone.exclude);
const ROUTES = routes(C).filter((r) => !EXCLUDE.has(r));

const srv = await serveDist(C.abs(C.dist));
const browser = await chromium.launch();
const scratch = mkdtempSync(path.join(tmpdir(), 'tone-'));
const out = { generatedAt: new Date().toISOString(), lint: LINT, excluded: [...EXCLUDE], pages: {} };
let failed = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const r of ROUTES) {
    await page.goto(url(srv.base, r, { scene: C.scenes[0] }, C), { waitUntil: 'networkidle' });
    const text = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, main h4, main p, main li, main td, main caption')]
      .filter((e) => !e.closest('pre, code, [data-example-live], [data-cell], [data-facts], [data-group], [data-tone-skip]') && !e.querySelector('p, li') && e.innerText.trim().split(/\s+/).length >= 2)
      .filter((e) => e.textContent.replace(/\s/g, '') !== [...e.querySelectorAll('code')].map((c) => c.textContent).join('').replace(/\s/g, ''))
      .map((e) => { const c = e.cloneNode(true); c.querySelectorAll('code, kbd').forEach((k) => k.replaceWith('code')); return c.textContent.replace(/\s+/g, ' ').trim(); }).join('\n'));
    const f = path.join(scratch, `${r.replace(/\W+/g, '_') || 'root'}.txt`);
    writeFileSync(f, text);
    const res = spawnSync('python3', [LINT, '--json', '--no-profile', f], { encoding: 'utf8' });
    let report; try { report = JSON.parse(res.stdout); } catch { report = { raw: res.stdout.slice(0, 400) }; }
    const ok = res.status === 0;
    if (!ok) failed++;
    out.pages[r] = { ok, words: text.split(/\s+/).length, hard: (report.hard ?? []).length, report };
    console.log(`${ok ? '✓' : '✗'} ${r.padEnd(40)} ${text.split(/\s+/).length} words${ok ? '' : ` · ${(report.hard ?? []).length} hard`}`);
    if (process.argv.includes('--verbose')) for (const v of report.hard ?? []) console.log(`    ${v.rule.padEnd(46)} | ${text.split('\n')[v.line - 1]?.slice(0, 160)}`);
  }
} finally { await browser.close(); srv.close(); }
mkdirSync(path.join(C.root, 'system', 'reports'), { recursive: true });
writeFileSync(path.join(C.root, 'system', 'reports', `tone-gate-${out.generatedAt.slice(0, 10)}.json`), JSON.stringify(out, null, 2) + '\n');
if (!ROUTES.length) { console.log('✗ tone gate: NO PAGES FOUND'); process.exit(1); }
console.log(`\n${failed ? '✗' : '✓'} tone gate: ${ROUTES.length - failed}/${ROUTES.length} pages pass human-tone lint`);
process.exit(failed ? 1 : 0);
