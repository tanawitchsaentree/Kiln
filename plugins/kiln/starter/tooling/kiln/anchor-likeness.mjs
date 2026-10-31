#!/usr/bin/env node
// anchor-likeness: records what the locked anchor card looks like, so G-AN1 can tell when the system's card
// drifts from it. Run once at the anchor lock (and again only when a decision changes the anchor on purpose):
//   node tooling/kiln/anchor-likeness.mjs --record apps/lab/anchor/b.html --selector "[data-anchor]" \
//        [--scene <backdrop id>] [--theme dark] [--out system/anchor/anchor-likeness.json]
// The anchor page is opened as a file, the card is measured on the backdrop the page shows (body lightness
// and chroma in OKLab, rim contrast against the backdrop just outside it), and the numbers are written with
// the scene and theme the book must use for the comparison. kiln.config.json docs.anchor names the book
// route and selector of the current card and the allowed deltas (maxDeltaL, maxDeltaC, maxDeltaRim).
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { docsConfig } from './config.mjs';
import { cardStats } from './surface-probes.mjs';

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const src = arg('--record');
if (!src) { console.error('usage: anchor-likeness.mjs --record <anchor html or url> --selector <css> [--scene id] [--theme t] [--out file]'); process.exit(1); }
const C = docsConfig();
const selector = arg('--selector', C.anchor?.selector ?? '[data-anchor]');
const out = C.abs(arg('--out', C.anchor?.reference ?? 'system/anchor/anchor-likeness.json'));
const href = /^https?:/.test(src) ? src : pathToFileURL(path.resolve(C.root, src)).href;
if (!/^https?:/.test(src) && !existsSync(path.resolve(C.root, src))) { console.error(`✗ no anchor page at ${src}`); process.exit(1); }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await page.goto(href, { waitUntil: 'networkidle' });
const stats = await cardStats(page, selector);
await browser.close();
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ ...stats, scene: arg('--scene', C.scenes[0] ?? null), theme: arg('--theme', C.themes[0]), recordedFrom: src, selector, recordedAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`✓ anchor recorded: L ${stats.L} C ${stats.C} rim ${stats.rim}:1 → ${path.relative(C.root, out)}`);
