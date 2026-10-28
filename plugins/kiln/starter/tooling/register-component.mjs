#!/usr/bin/env node
// register-component — wires a finished component into the package and the book in one step, so no
// registration is forgotten (the assay dry run did this by hand twelve times). It touches only the
// shared lists: the barrel manifest, the book's routes, the Usage-depth index, the Style subjects,
// the chapter list and the changelog. The component's own files, depth file, examples, chapter text
// and system/conformance/<slug>.mjs are written first, by hand.
//
// Usage: node tooling/register-component.mjs <Name> --chapter <file> --subject <file> \
//          --changelog "First release. …" [--wave "Wave 1 atoms…"] [--slug name] [--depth CONST]
//   --chapter  a file holding the chapter object literal (`{ name: 'X', … },`) for components-data.tsx
//   --subject  a file holding the SUBJECTS line (`  X: { render: … },`) for depth/subjects.tsx
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const name = args[0];
if (!name || !/^[A-Z]\w+$/.test(name)) { console.error('usage: register-component.mjs <Name> --chapter <file> --subject <file> --changelog "<text>"'); process.exit(1); }
const slug = opt('--slug') ?? name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const CONST = opt('--depth') ?? slug.replace(/-/g, '_').toUpperCase();
const wave = opt('--wave');
const src = (p) => path.join(ROOT, p);
const read = (p) => readFileSync(src(p), 'utf8');
const write = (p, s) => writeFileSync(src(p), s);
const done = [];
const must = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); process.exit(1); } };

must(existsSync(src(`packages/react/src/components/${name}/index.ts`)), `packages/react/src/components/${name}/index.ts does not exist`);
must(existsSync(src(`packages/react/src/components/${name}/${name}.why.json`)), `${name}.why.json does not exist; derive first`);
must(existsSync(src(`apps/docs/src/depth/${slug}.tsx`)), `apps/docs/src/depth/${slug}.tsx does not exist`);
must(existsSync(src(`system/conformance/${slug}.mjs`)), `system/conformance/${slug}.mjs does not exist; a component with no checks fails conformance`);

// chapter
let s = read('apps/docs/src/book/components-data.tsx');
if (!s.includes(`name: '${name}',`)) {
  const ch = opt('--chapter'); must(ch && existsSync(ch), '--chapter <file> is required for a new chapter');
  const i = s.lastIndexOf('];'); s = s.slice(0, i) + readFileSync(ch, 'utf8') + s.slice(i); write('apps/docs/src/book/components-data.tsx', s); done.push('chapter');
}
// depth index
s = read('apps/docs/src/depth/index.ts');
if (!new RegExp(`\\b${CONST}\\b`).test(s)) {
  s = s.replace("import type { Depth } from './types';", `import type { Depth } from './types';\nimport { ${CONST} } from './${slug}';`);
  s = s.replace(/(export const DEPTH: Record<string, Depth> = \{[^}]*?)\s*\};/, (m, a) => `${a}, ${name}: ${CONST} };`);
  write('apps/docs/src/depth/index.ts', s); done.push('depth index');
}
// subject
s = read('apps/docs/src/depth/subjects.tsx');
if (!new RegExp(`\\n  ${name}: `).test(s)) {
  const sub = opt('--subject'); must(sub && existsSync(sub), '--subject <file> is required for a new subject');
  const pkg = JSON.parse(read('packages/react/package.json')).name;
  s = s.replace(new RegExp(`import \\{ ([^}]*) \\} from '${pkg}';`), (m, list) => `import { ${[...new Set([...list.split(',').map((x) => x.trim()), name])].sort().join(', ')} } from '${pkg}';`);
  s = s.replace('export const SUBJECTS: Record<string, Subject> = {', `export const SUBJECTS: Record<string, Subject> = {\n${readFileSync(sub, 'utf8').trimEnd()}`);
  write('apps/docs/src/depth/subjects.tsx', s); done.push('subject');
}
// route
const routes = JSON.parse(read('apps/docs/src/book/routes.json'));
const comp = routes.parts.find((p) => p.title === 'Components');
if (!comp.pages.some((p) => p.path === `/components/${slug}`)) {
  comp.pages.push({ path: `/components/${slug}`, title: name, tabs: comp.pages[0]?.tabs ?? ['usage', 'style', 'code', 'accessibility'] });
  write('apps/docs/src/book/routes.json', JSON.stringify(routes, null, 2) + '\n'); done.push('route');
}
// barrel
s = read('packages/react/src/barrel.manifest.mjs');
if (!s.includes(`'${name}'`)) {
  if (wave && !s.includes(wave)) s = s.replace(/\n\];\s*$/, `\n  {\n    header: \`${wave}\`,\n    components: ['${name}'],\n  },\n];\n`);
  else s = s.replace(/(components: \[[^\]]*)\](,\n  \},\n\];\s*)$/, (m, a, b) => `${a}, '${name}']${b}`);
  write('packages/react/src/barrel.manifest.mjs', s); done.push('barrel');
  spawnSync('node', ['tooling/generate-barrel.mjs'], { cwd: ROOT, stdio: 'ignore' });
}
// changelog: under the newest version heading
const log = opt('--changelog');
s = read('packages/react/CHANGELOG.md');
if (log && !s.includes(`- ${name}: `)) {
  s = s.replace(/(## [^\n]+\n\n(?:- [^\n]*\n)*)/, (m) => `${m}- ${name}: ${log}\n`);
  write('packages/react/CHANGELOG.md', s); done.push('changelog');
}
console.log(`✓ ${name} registered: ${done.join(', ') || 'already complete'}. Add its row to system/REVIEW.md and run pnpm run verify:quick.`);
