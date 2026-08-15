#!/usr/bin/env node
/**
 * docs-engine template audit — computes G-T1 (composition floor) and G-T3 (inventory honesty)
 * for a repo's shipped example templates. Reference implementation reading a `templates.ts`
 * manifest (array of {slug, requiredComponents, sourcePath}) and each template's own source file
 * — never a second hand-typed inventory. G-T4 (thumbnail freshness) and G-T5 (page health,
 * keyboard walk) need a running server + Playwright and are documented separately (see
 * `generate-template-thumbnails.mjs` for G-T4's real-render half; a repo's own Playwright suite
 * should add the keyboard-walk check per `references/gates.md`'s G-T5 definition).
 *
 * Usage: node template-audit.mjs --manifest src/lib/templates.ts --app-root src/app [--json]
 * Must run from a location where the manifest's own imports resolve (e.g. the docs app root).
 */
import esbuild from 'esbuild';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
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
  const tmpPath = path.join(path.dirname(manifestPath), `.template-audit-${process.pid}.mjs`);
  writeFileSync(tmpPath, result.outputFiles[0].text);
  try {
    const mod = await import(pathToFileURL(tmpPath).href);
    return mod.TEMPLATES;
  } finally {
    rmSync(tmpPath, { force: true });
  }
}

/** Extracts the distinct dial-react (or configurable package) named imports from a template's
 * own source — this IS the composition-floor count (G-T1) and the inventory-honesty check basis
 * (G-T3), read from real import statements, never estimated. */
function extractComponentImports(source, packageName) {
  const importRegex = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${packageName}['"]`, 'g');
  const names = new Set();
  let match;
  while ((match = importRegex.exec(source))) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().split(' as ')[0].trim();
      if (name) names.add(name);
    }
  }
  return names;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest;
  const appRoot = args['app-root'] || 'src/app';
  const packageName = args['package-name'] || 'dial-react';
  const compositionFloor = Number(args['composition-floor'] || 8);
  const asJson = args.json === true;

  if (!manifestPath) {
    console.error('Usage: node template-audit.mjs --manifest <path/to/templates.ts> [--app-root src/app] [--package-name dial-react] [--json]');
    process.exit(2);
  }

  const TEMPLATES = await loadManifest(path.resolve(process.cwd(), manifestPath));
  const results = [];

  for (const t of TEMPLATES) {
    const sourcePath = path.resolve(process.cwd(), appRoot, t.sourcePath);
    const source = readFileSync(sourcePath, 'utf8');
    const actualImports = extractComponentImports(source, packageName);

    // G-T1: composition floor. Category breadth isn't computed here (needs the repo's own
    // category taxonomy, e.g. nav.ts's COMPONENT_CATEGORIES) — a real implementation should
    // cross-reference actualImports against that map; this reference script reports the raw
    // count and leaves category-breadth cross-referencing as a documented next step.
    const compositionCount = actualImports.size;
    const passesFloor = compositionCount >= compositionFloor;

    // G-T3: inventory honesty. Every required component the catalog decision named must actually
    // appear in the template's real imports.
    const required = t.requiredComponents || [];
    const missing = required.filter((name) => !actualImports.has(name));
    const inventoryHonest = missing.length === 0;

    results.push({
      slug: t.slug,
      compositionCount,
      compositionFloor,
      passesFloor,
      requiredComponents: required,
      actualImports: [...actualImports].sort(),
      missing,
      inventoryHonest,
    });
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`G-T1 composition floor (>= ${compositionFloor} components):`);
  for (const r of results) {
    console.log(`  ${r.slug.padEnd(16)} count=${r.compositionCount} ${r.passesFloor ? 'PASS' : 'FAIL'}`);
  }
  console.log('');
  console.log('G-T3 inventory honesty (every catalog-required component actually imported):');
  for (const r of results) {
    console.log(`  ${r.slug.padEnd(16)} ${r.inventoryHonest ? 'PASS' : `FAIL — missing: ${r.missing.join(', ')}`}`);
  }
}

main();
