#!/usr/bin/env node
/**
 * docs-engine audit script — computes G-D1 (demo floor) and checklist coverage counts for a
 * React + react-docgen-typescript repo. This is the reference implementation for the "TS-aware
 * parser" the content model requires; a non-React/non-TS repo needs its own equivalent that
 * produces the same shape of output (variant_count as dimension-count, never option-count sum).
 *
 * Must be run from inside the docs app directory (or anywhere `react-docgen-typescript` resolves
 * via node_modules) — running from outside the workspace fails with ERR_MODULE_NOT_FOUND.
 *
 * Usage:
 *   node audit.mjs --react-root <path/to/packages/react> --docs-pages <path/to/app/components> \
 *     [--demos-dir <path/to/content/demos>] [--json]
 *
 * Config, no CLI flags required — reads docs-engine.config.json in cwd if present, CLI flags
 * override it. See docs-engine.config.example.json alongside this script.
 */
import { withCustomConfig } from 'react-docgen-typescript';
import path from 'node:path';
import fs from 'node:fs';

const STATE_PROP_NAMES = ['disabled', 'invalid', 'loading', 'indeterminate', 'readOnly', 'required', 'checked', 'error', 'defaultChecked'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

function loadConfig() {
  const configPath = path.join(process.cwd(), 'docs-engine.config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {};
}

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function main() {
  const cliArgs = parseArgs(process.argv.slice(2));
  const config = loadConfig();

  const reactRootRaw = cliArgs['react-root'] || config.reactRoot;
  const docsPagesDirRaw = cliArgs['docs-pages'] || config.docsPagesDir;
  const asJson = cliArgs.json === true || config.json === true;

  if (!reactRootRaw || !docsPagesDirRaw) {
    console.error('Usage: node audit.mjs --react-root <path> --docs-pages <path> [--json]');
    console.error('   or: create docs-engine.config.json with { "reactRoot": ..., "docsPagesDir": ... }');
    process.exit(2);
  }

  // Resolve to absolute paths — react-docgen-typescript's tsconfig "include" resolution needs
  // an absolute config path, a relative CLI arg string passed straight through fails with
  // "No inputs were found" even though the path is valid relative to cwd.
  const reactRoot = path.resolve(process.cwd(), reactRootRaw);
  const docsPagesDir = path.resolve(process.cwd(), docsPagesDirRaw);

  const tsconfigPath = path.join(reactRoot, 'tsconfig.json');
  const compDir = path.join(reactRoot, 'src', 'components');

  const parser = withCustomConfig(tsconfigPath, {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop) => {
      if (!prop.declarations || prop.declarations.length === 0) return true;
      return prop.declarations.some((d) => d.fileName.includes(`${path.sep}src${path.sep}`));
    },
  });

  const names = fs.readdirSync(compDir).filter((f) => fs.statSync(path.join(compDir, f)).isDirectory()).sort();

  const results = [];
  let totalDemos = 0;
  let totalFloor = 0;
  let passing = 0;

  for (const name of names) {
    const tsxPath = path.join(compDir, name, `${name}.tsx`);
    if (!fs.existsSync(tsxPath)) continue;

    let variantOptionCount = 0;
    const enumProps = [];
    const statesFound = [];
    let parseError = null;

    try {
      const docs = parser.parse(tsxPath);
      const doc = docs.find((d) => d.displayName === name) || docs[0];
      if (!doc) {
        parseError = 'no component doc found';
      } else {
        for (const [propName, prop] of Object.entries(doc.props)) {
          if (prop.type?.name === 'enum' && Array.isArray(prop.type.value)) {
            const options = prop.type.value.map((v) => String(v.value).replace(/^"|"$/g, ''));
            if (options.length >= 2) {
              variantOptionCount += 1; // one dimension per enum prop, NOT per option
              enumProps.push({ prop: propName, options });
            }
          }
          if (STATE_PROP_NAMES.includes(propName)) statesFound.push(propName);
        }
      }
    } catch (e) {
      parseError = String(e.message || e);
    }

    const dimensionCount = enumProps.length + statesFound.length;
    const floor = dimensionCount + 3;

    const slug = kebab(name);
    const pagePath = path.join(docsPagesDir, slug, 'page.mdx');
    let demoBlockCount = 0;
    let pageExists = fs.existsSync(pagePath);
    if (pageExists) {
      const pageSrc = fs.readFileSync(pagePath, 'utf8');
      demoBlockCount = (pageSrc.match(/<Demo\b/g) || []).length;
    }

    const passesFloor = demoBlockCount >= floor;
    if (passesFloor) passing += 1;
    totalDemos += demoBlockCount;
    totalFloor += floor;

    results.push({
      name, slug, pageExists, enumProps, statesFound, dimensionCount,
      floor, demoBlockCount, passesFloor, gap: Math.max(0, floor - demoBlockCount), parseError,
    });
  }

  results.sort((a, b) => b.gap - a.gap);

  const summary = {
    totalComponents: results.length,
    passingFloor: passing,
    totalDemos,
    totalFloorRequired: totalFloor,
    totalGap: totalFloor - totalDemos,
  };

  if (asJson) {
    console.log(JSON.stringify({ summary, results }, null, 2));
    return;
  }

  console.log(`G-D1 demo floor: ${passing}/${results.length} pages pass`);
  console.log(`Total demos: ${totalDemos} vs floor required: ${totalFloor} (gap: ${summary.totalGap})`);
  console.log('');
  console.log('Ranked by gap (worst first):');
  for (const r of results) {
    if (r.gap === 0) continue;
    console.log(`  ${r.name.padEnd(16)} dims=${r.dimensionCount} floor=${r.floor} demos=${r.demoBlockCount} gap=${r.gap}`);
  }
  const errored = results.filter((r) => r.parseError);
  if (errored.length) {
    console.log('');
    console.log('Parse errors (excluded from dimension count, investigate):');
    for (const r of errored) console.log(`  ${r.name}: ${r.parseError}`);
  }
}

main();
