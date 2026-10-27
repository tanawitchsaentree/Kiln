#!/usr/bin/env node
// kiln create — a new design-system repo from kiln's starter, ready to build, verify and docs from
// the first minute. Everything a system needs is in it: the tokens/react/docs monorepo, the engine
// (tooling/kiln, read-only, synced from kiln), its benchmark data, the hooks and the system/ files
// (INTAKE, CONCEPT, REVIEW, NEXT…). The plugin's skills and agents come from the installed plugin.
//
// Usage: node <plugin>/bin/create.mjs <dir> --name <name> [--no-install] [--no-git]
//   <name> is lowercase letters, digits and dashes; packages become <name>-tokens and <name>-react.
// Nothing is published or pushed. The new repo's first commit is local.
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STARTER = path.join(HERE, '..', 'starter');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--name');
const name = opt('--name') ?? (dir ? path.basename(dir) : null);

if (!dir || !name) { console.error('usage: create.mjs <dir> --name <name> [--no-install] [--no-git]'); process.exit(1); }
if (!/^[a-z][a-z0-9-]{1,30}$/.test(name)) { console.error(`✗ name "${name}": use lowercase letters, digits and dashes (it becomes ${name}-react on npm)`); process.exit(1); }
const dest = path.resolve(dir);
if (existsSync(dest) && readdirSync(dest).length) { console.error(`✗ ${dest} exists and is not empty. kiln create never writes into an existing project.`); process.exit(1); }
if (!existsSync(path.join(STARTER, 'package.json'))) { console.error(`✗ starter not found at ${STARTER}`); process.exit(1); }

const SKIP = new Set(['node_modules', 'dist', 'build', 'release', '.turbo', 'test-results']);
const SKIP_REL = /^(apps\/docs\/public\/(evidence|gates|conformance|specs)\.json|system\/reports\/.+)$/;
mkdirSync(dest, { recursive: true });
cpSync(STARTER, dest, { recursive: true, filter: (src) => {
  const rel = path.relative(STARTER, src);
  return !rel || (!rel.split(path.sep).some((p) => SKIP.has(p)) && !SKIP_REL.test(rel.split(path.sep).join('/')));
} });

// Rename: package names, the book's NAME, config. The engine copy (tooling/kiln) is never edited, so
// sync --check keeps passing.
const TEXT = /\.(json|md|mjs|ts|tsx|css|html|yaml|yml)$/;
let changed = 0;
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const f = path.join(d, n);
    const rel = path.relative(dest, f).split(path.sep).join('/');
    if (rel.startsWith('tooling/kiln/') || rel === 'pnpm-lock.yaml') continue;
    if (statSync(f).isDirectory()) { walk(f); continue; }
    if (!TEXT.test(n)) continue;
    const s = readFileSync(f, 'utf8');
    const t = s.replaceAll('kiln-ds', name).replaceAll('{{name}}', name);
    if (t !== s) { writeFileSync(f, t); changed++; }
  }
};
walk(dest);
console.log(`✓ ${name}: starter copied to ${dest} (${changed} files renamed)`);

const run = (cmd, a, opts = {}) => {
  const r = spawnSync(cmd, a, { cwd: dest, stdio: 'inherit', ...opts });
  if (r.status !== 0) { console.error(`✗ ${cmd} ${a.join(' ')} failed`); process.exit(r.status ?? 1); }
};
if (!flag('--no-install')) {
  run('pnpm', ['install']);
  run('pnpm', ['--filter', `${name}-tokens`, 'build']);
}
if (!flag('--no-git')) {
  run('git', ['init', '-q']);
  run('git', ['add', '-A']);
  run('git', ['commit', '-qm', `${name}: new design system from the kiln starter`], { stdio: 'ignore' });
  console.log('✓ git repo with one local commit (nothing pushed)');
}
console.log(`
Next, inside ${dest}:
  1. Start Claude Code there. It reads CLAUDE.md, then asks the intake questions once (system/INTAKE.md).
  2. pnpm run docs:dev           the book, already rendering (with TODO placeholders until each phase fills them)
  3. pnpm run verify:quick       builds, types, reasons and component checks in a few minutes
  4. pnpm run milestone          what M1 still needs
`);
