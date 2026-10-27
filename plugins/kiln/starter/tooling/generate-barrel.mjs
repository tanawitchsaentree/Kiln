#!/usr/bin/env node
// Generates packages/react/src/index.ts from packages/react/src/barrel.manifest.mjs.
//
// WHY this exists (structural fix, not a "be more careful" one): the old index.ts was a single
// flat file that every parallel batch agent appended to — no collision *happened* yet, but
// nothing prevented one. Each component's own src/components/{Name}/index.ts is already that
// component's single source of truth for its public exports (agents only ever touch their own
// directory); this script's only job is to stitch those together in manifest order. A batch that
// adds components appends one manifest entry (or asks a single agent to) and reruns this script
// at the end — no agent ever edits the root index.ts by hand again.
//
// Run: node tooling/generate-barrel.mjs [--check]
//   --check: exit 1 if regenerating would change the file (CI/pre-publish guard), no write.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REACT_SRC = path.join(__dirname, '..', 'packages', 'react', 'src');
const OUTPUT_PATH = path.join(REACT_SRC, 'index.ts');

const { BARREL_MANIFEST } = await import(path.join(REACT_SRC, 'barrel.manifest.mjs'));
const PKG_NAME = JSON.parse(readFileSync(path.join(REACT_SRC, '..', 'package.json'), 'utf8')).name;

// Delegates to the component's own index.ts via `export *` rather than inlining its contents —
// that file stays the single source of truth for what the component exports; this barrel only
// decides inclusion + order.
function barrelLine(name) {
  const indexPath = path.join(REACT_SRC, 'components', name, 'index.ts');
  if (!existsSync(indexPath)) {
    throw new Error(`barrel.manifest.mjs references "${name}" but src/components/${name}/index.ts doesn't exist`);
  }
  return `export * from './components/${name}';`;
}

const sections = BARREL_MANIFEST.map((block) => {
  if (block.raw) return block.raw;
  const header = block.header ? `// ${block.header.split('\n').join('\n// ')}\n\n` : '';
  const body = block.components.map(barrelLine).join('\n');
  return `${header}${body}`;
});

const output = `// ${PKG_NAME} — public entry point.
// GENERATED FILE — do not hand-edit. Source of truth: packages/react/src/barrel.manifest.mjs +
// each component's own src/components/{Name}/index.ts. Regenerate with:
//   node tooling/generate-barrel.mjs

${sections.join('\n\n')}
`;

if (process.argv.includes('--check')) {
  const current = readFileSync(OUTPUT_PATH, 'utf8');
  if (current !== output) {
    console.error('✗ packages/react/src/index.ts is stale — run `node tooling/generate-barrel.mjs` and commit the result.');
    process.exit(1);
  }
  console.log('✓ packages/react/src/index.ts is up to date');
} else {
  writeFileSync(OUTPUT_PATH, output);
  console.log(`✓ wrote ${path.relative(process.cwd(), OUTPUT_PATH)} (${BARREL_MANIFEST.length} manifest blocks)`);
}
