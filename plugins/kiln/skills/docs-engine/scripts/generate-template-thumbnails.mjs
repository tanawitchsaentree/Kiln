#!/usr/bin/env node
/**
 * docs-engine template thumbnails — computes G-T4 (thumbnail freshness) for a repo's shipped
 * example templates: screenshot each template's live route, hash the screenshot, and compare
 * against the hash recorded when its thumbnail was last generated. Companion to
 * `template-audit.mjs` (G-T1/G-T3, source-only); this script is the real-render half those two
 * gates don't cover, per `references/gates.md`'s G-T4 definition.
 *
 * Reads the same `templates.ts` manifest as `template-audit.mjs` (array of {slug, requiredComponents,
 * sourcePath}), plus an optional `route` per entry — defaults to `/examples/{slug}` when absent,
 * since that's the convention `references/gates.md`'s G-T5 assumes for template routes.
 *
 * Usage:
 *   node generate-template-thumbnails.mjs --manifest src/lib/templates.ts --base-url http://localhost:3000 [--check] [--out public/template-thumbnails] [--index template-thumbnails/hashes.json] [--json]
 *
 * `--check` compares against the stored index without writing anything and exits 1 on any
 * missing/stale thumbnail (the Gate-Proof's "confirm the hash-mismatch check flags that exact
 * template" half). Without `--check`, missing/stale thumbnails are regenerated and the index is
 * updated (the Gate-Proof's "regenerate the thumbnail and confirm green again" half).
 *
 * Must be run somewhere `playwright` resolves via node_modules (repo root or a workspace app),
 * against a base URL that is already serving the templates — this script does not start a server.
 */
import esbuild from 'esbuild';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return args;
}

async function loadManifest(manifestPath) {
  const result = await esbuild.build({
    entryPoints: [manifestPath],
    bundle: false,
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });
  const tmpPath = path.join(path.dirname(manifestPath), `.thumbnail-gen-${process.pid}.mjs`);
  writeFileSync(tmpPath, result.outputFiles[0].text);
  try {
    const mod = await import(pathToFileURL(tmpPath).href);
    return mod.TEMPLATES;
  } finally {
    rmSync(tmpPath, { force: true });
  }
}

function loadIndex(indexPath) {
  if (!existsSync(indexPath)) return {};
  return JSON.parse(readFileSync(indexPath, 'utf8'));
}

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest;
  const baseUrl = (args['base-url'] || 'http://localhost:3000').replace(/\/$/, '');
  const outDir = args.out || 'public/template-thumbnails';
  const indexPath = args.index || path.join(outDir, 'hashes.json');
  const checkOnly = args.check === true;
  const asJson = args.json === true;

  if (!manifestPath) {
    console.error(
      'Usage: node generate-template-thumbnails.mjs --manifest <path/to/templates.ts> [--base-url http://localhost:3000] [--check] [--out public/template-thumbnails] [--index <path>] [--json]'
    );
    process.exit(2);
  }

  const TEMPLATES = await loadManifest(path.resolve(process.cwd(), manifestPath));
  const index = loadIndex(path.resolve(process.cwd(), indexPath));
  const nextIndex = { ...index };
  const results = [];

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const t of TEMPLATES) {
      const route = t.route || `/examples/${t.slug}`;
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
      const screenshot = await page.screenshot({ fullPage: true });
      const freshHash = hashBuffer(screenshot);
      const storedHash = index[t.slug];
      const stale = storedHash !== undefined && storedHash !== freshHash;
      const missing = storedHash === undefined;

      if (!checkOnly && (missing || stale)) {
        mkdirSync(outDir, { recursive: true });
        writeFileSync(path.join(outDir, `${t.slug}.png`), screenshot);
        nextIndex[t.slug] = freshHash;
      }

      results.push({
        slug: t.slug,
        route,
        storedHash: storedHash ?? null,
        freshHash,
        status: missing ? 'missing' : stale ? 'stale' : 'fresh',
      });
    }
  } finally {
    await browser.close();
  }

  if (!checkOnly) {
    mkdirSync(path.dirname(path.resolve(process.cwd(), indexPath)), { recursive: true });
    writeFileSync(path.resolve(process.cwd(), indexPath), JSON.stringify(nextIndex, null, 2));
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('G-T4 thumbnail freshness:');
    for (const r of results) {
      console.log(`  ${r.slug.padEnd(16)} ${r.status === 'fresh' ? 'PASS' : `FAIL — ${r.status}`}`);
    }
  }

  const anyFailing = results.some((r) => r.status !== 'fresh');
  if (checkOnly && anyFailing) process.exit(1);
}

main();
