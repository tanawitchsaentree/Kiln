#!/usr/bin/env node
// smoke-import — packs BOTH packages, installs them together into a scratch project, and consumes
// them exactly as a real consumer would: import by published name, resolve every documented entry
// point, and render components server-side.
//
// WHY this exists alongside pack-verify: pack-verify checks one package at a time, and only that
// each declared path resolves to a non-empty file. It cannot catch (a) the two packages being
// broken *together* (react's CSS referencing token vars that tokens no longer ships), (b) an entry
// point that resolves to a real file which then throws on import, or (c) a rename that left the old
// name resolvable from stale node_modules. A package rename is exactly the change that breaks (c)
// (list retired names in system/kiln.config.json `legacyNames`), and a tokens package has already
// shipped an exports map pointing at filenames the build never produced once — "the config looks
// right" is not evidence. (Gate-proof history below is from Dial, the first system built with kiln.)
//
// Run: node tooling/smoke-import.mjs
// Exits non-zero on the first broken entry point, so it is safe to chain into prepublishOnly.
//
// Gate-proofed per ds-conventions/SKILL.md — mutate, confirm red, revert, confirm green. Five real
// mutations, each red, with the unmutated baseline green immediately before and after (28/28):
//   M1  tokens exports './css' -> a filename the build never makes   → 2 checks red (the shipped bug)
//   M2  publishConfig.access put back on the unscoped package        → 1 red (stale-leftover check)
//   M3  react exports './styles.css' -> ./dist/nope.css              → 2 red
//   M4  files[] narrowed to ['src'] so the tarball ships no dist     → 3 red (ESM+CJS+parity)
//   M5  package renamed back to @dial/react                          → 1 red (old name resolves again)
//   M6  (Pane, 2026-10-27) tokens './css' back to a bare string, no types → 1 red (consumer tsc TS2882)
// M5 is the one that proves this gate reads the manifest instead of a hardcoded string: renaming the
// package makes the "old name is gone" check fire rather than silently testing a name nobody ships.
// M4 dropping exactly the three root-import checks, and M2 exactly one, is what says those checks
// each test one thing.
//
// Two failures the first run produced were the PROBE being wrong, not the packages, and both are now
// encoded so they can't recur: there is no bare `Toast` export (it is ToastProvider/ToastAction/
// useToast), and `Card` is a compound namespace whose renderable element is `Card.Root`. A third
// "failure" was this file's own contract check flagging 7 vars that are set inline at runtime with
// fallbacks — see the comment on that check for why only no-fallback vars are a hard dependency.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSystemConfig } from './system-config.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES = ['tokens', 'react'];

// What a consumer must be able to import and render is the system's API, not the engine's — it comes
// from system/kiln.config.json (`smokeImport`). An empty list is a FAIL, not a pass: a gate with
// nothing to check proves nothing.
const SMOKE = loadSystemConfig().smokeImport ?? {};
const EXPECTED = SMOKE.expectedExports ?? [];
const MIN_EXPORTS = SMOKE.minExports ?? 1;
const RENDER_PROBES = SMOKE.renderProbes ?? [];
const LEGACY_NAMES = SMOKE.legacyNames ?? [];

// Read the real names out of the manifests rather than hardcoding them here. Hardcoding is the bug
// class this repo keeps hitting (a hand-typed string that drifts silently) — if a package is renamed
// again, this gate must follow it or fail loudly, never pass by checking a name nobody publishes.
const manifests = PACKAGES.map((dir) => {
  const p = join(REPO_ROOT, 'packages', dir, 'package.json');
  const pkg = JSON.parse(readFileSync(p, 'utf8'));
  if (!pkg.name || !pkg.version) throw new Error(`${p} has no name/version`);
  return { dir, pkg };
});
const NAMES = Object.fromEntries(manifests.map((m) => [m.dir, m.pkg.name]));

const scratch = mkdtempSync(join(tmpdir(), 'kiln-smoke-'));
let failures = 0;
const results = [];
const record = (ok, label, info = '') => {
  if (!ok) failures++;
  results.push([ok, label, info]);
};

function sh(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}:\n${(r.stderr || r.stdout || '').slice(0, 2000)}`);
  }
  return r.stdout;
}

try {
  console.log(`[smoke-import] packing ${manifests.map((m) => `${m.pkg.name}@${m.pkg.version}`).join(' + ')}...`);
  const tarballs = manifests.map(({ dir, pkg }) => {
    // pnpm pack, not npm pack: it rewrites workspace:^ dependencies to real versions, exactly as a
    // published tarball would carry them — npm pack would ship an uninstallable "workspace:^".
    sh('pnpm', ['pack', '--pack-destination', scratch], join(REPO_ROOT, 'packages', dir));
    // npm pack names an unscoped tarball <name>-<version>.tgz; a scoped one gets the scope flattened
    // with a leading dash removed. Resolve by checking what actually landed instead of guessing.
    const unscoped = join(scratch, `${pkg.name}-${pkg.version}.tgz`);
    const scoped = join(scratch, `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`);
    const tgz = existsSync(unscoped) ? unscoped : scoped;
    if (!existsSync(tgz)) throw new Error(`npm pack produced no tarball for ${pkg.name} (looked for ${unscoped})`);
    return tgz;
  });

  writeFileSync(
    join(scratch, 'package.json'),
    JSON.stringify({ name: 'kiln-smoke-consumer', private: true, version: '1.0.0', type: 'module' }, null, 2),
  );

  console.log('[smoke-import] installing both tarballs + react into a scratch project...');
  sh('npm', ['install', '--no-audit', '--no-fund', ...tarballs, 'react@18', 'react-dom@18'], scratch);

  const nm = (p) => join(scratch, 'node_modules', p);
  const req = `import { createRequire } from 'node:module';\nconst require = createRequire(${JSON.stringify(join(scratch, 'probe.mjs'))});\n`;

  // Run each probe in the scratch project's own resolution context, so what is being tested is real
  // package resolution by published name — not this repo's node_modules.
  function probe(code) {
    const f = join(scratch, 'probe.mjs');
    writeFileSync(f, req + code);
    const r = spawnSync('node', [f], { cwd: scratch, encoding: 'utf8' });
    return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
  }

  // 1. Both packages installed under the names their manifests declare.
  for (const { pkg } of manifests) {
    const installed = join(nm(pkg.name), 'package.json');
    if (!existsSync(installed)) {
      record(false, `${pkg.name} installed`, 'not present in scratch node_modules');
      continue;
    }
    const got = JSON.parse(readFileSync(installed, 'utf8'));
    record(got.name === pkg.name, `${pkg.name} installed`, `${got.name}@${got.version}`);
    // publishConfig.access is meaningful only for scoped packages; left on an unscoped one it is a
    // leftover that reads as "still scoped" to the next person.
    if (!pkg.name.startsWith('@') && got.publishConfig?.access) {
      record(false, `${pkg.name} has stale publishConfig.access`, JSON.stringify(got.publishConfig));
    }
  }

  // 2. ESM + CJS roots of the react package (separate exports conditions, breakable independently).
  const R = NAMES.react;
  let esm = probe(`const m = await import('${R}');\nconsole.log(Object.keys(m).length);`);
  record(esm.ok, `import '${R}' (ESM)`, esm.ok ? `${esm.out} named exports` : esm.err.split('\n')[0]);
  const exportCount = Number(esm.out) || 0;

  const cjs = probe(`console.log(Object.keys(require('${R}')).length);`);
  record(cjs.ok, `require('${R}') (CJS)`, cjs.ok ? `${cjs.out} named exports` : cjs.err.split('\n')[0]);
  record(
    exportCount > 0 && Number(cjs.out) === exportCount,
    'ESM and CJS agree on export count',
    `esm=${exportCount} cjs=${cjs.out}`,
  );

  // A root that imports cleanly but exports nothing is a broken build that resolves fine.
  record(exportCount >= MIN_EXPORTS, `${R} exports a full surface`, `${exportCount} exports (expected >= ${MIN_EXPORTS})`);

  // 3. Named exports actually present. The list stays explicit in system/kiln.config.json —
  // deriving it from the barrel would make the check circular. Compound namespaces (e.g. Card) are
  // listed by namespace; their renderable part goes in renderProbes as 'Card.Root'.
  record(EXPECTED.length > 0, 'smokeImport.expectedExports configured', EXPECTED.length ? `${EXPECTED.length} names` : 'EMPTY — fill system/kiln.config.json');
  const named = probe(
    `const m = await import('${R}');\nconst missing = ${JSON.stringify(EXPECTED)}.filter((n) => !m[n]);\n` +
      `if (missing.length) { console.error('missing: ' + missing.join(', ')); process.exit(1); }\nconsole.log('all present');`,
  );
  record(named.ok, `${R} named exports present`, named.ok ? EXPECTED.join(', ') : named.err.split('\n')[0]);

  // 4. Types and the stylesheet consumers are told to import.
  // the types entry the package itself declares — what a consumer's TypeScript will actually load
  const rManifest = JSON.parse(readFileSync(join(nm(R), 'package.json'), 'utf8'));
  const dts = join(nm(R), rManifest.exports?.['.']?.types ?? rManifest.types ?? 'dist/index.d.ts');
  const dtsName = EXPECTED[0];
  record(
    Boolean(dtsName) && existsSync(dts) && new RegExp(`\\b${dtsName}\\b`).test(readFileSync(dts, 'utf8')),
    `${R} ships index.d.ts with ${dtsName ?? '(no expected export configured)'}`,
  );

  const cssProbe = probe(
    `const p = require.resolve('${R}/styles.css');\nconst s = require('node:fs').readFileSync(p, 'utf8');\n` +
      `if (!/--ds-/.test(s)) { console.error('no --ds- vars referenced'); process.exit(1); }\nconsole.log(s.length + ' bytes');`,
  );
  record(cssProbe.ok, `${R}/styles.css resolves and references --ds-* vars`, cssProbe.ok ? cssProbe.out : cssProbe.err.split('\n')[0]);

  // 5. Every subpath in the tokens exports map, read from the installed manifest.
  const T = NAMES.tokens;
  const tokensInstalled = JSON.parse(readFileSync(join(nm(T), 'package.json'), 'utf8'));
  const subpaths = Object.keys(tokensInstalled.exports ?? {});
  record(subpaths.length > 0, `${T} declares exports subpaths`, `${subpaths.length} subpaths`);
  for (const sub of subpaths) {
    const spec = T + sub.slice(1);
    const r = probe(
      `const p = require.resolve('${spec}');\nconst s = require('node:fs').readFileSync(p, 'utf8');\n` +
        `if (!s.length) { console.error('0 bytes'); process.exit(1); }\nconsole.log(s.length + ' bytes');`,
    );
    record(r.ok, `${spec}`, r.ok ? r.out : r.err.split('\n')[0]);
  }

  // 6. The cross-package contract: react's CSS references --ds-* custom properties that ONLY the
  // tokens CSS defines. Each package can be internally fine while this is broken.
  // Only vars used WITHOUT a fallback are a hard dependency on the tokens CSS. `var(--ds-grid-cols, 12)`
  // and the Skeleton sizing vars are set inline by the component at runtime and carry a fallback, so
  // tokens is not expected to define them — the first version of this check flagged those 7 and
  // "failed" on a design that is correct. The invariant worth enforcing is narrower and real: a var
  // with no fallback, defined by nobody, renders as an invalid value with no error anywhere.
  const contract = probe(
    `const fs = require('node:fs');\n` +
      `const css = fs.readFileSync(require.resolve('${R}/styles.css'), 'utf8');\n` +
      `const tokens = fs.readFileSync(require.resolve('${T}/css'), 'utf8');\n` +
      `const hard = new Set([...css.matchAll(/var\\((--ds-[a-z0-9-]+)\\s*\\)/g)].map((m) => m[1]));\n` +
      `const defined = new Set([...tokens.matchAll(/(--ds-[a-z0-9-]+)\\s*:/g)].map((m) => m[1]));\n` +
      `const selfSet = new Set([...css.matchAll(/(--ds-[a-z0-9-]+)\\s*:/g)].map((m) => m[1]));\n` +
      `const undef = [...hard].filter((v) => !defined.has(v) && !selfSet.has(v));\n` +
      `if (!hard.size) { console.error('no --ds- vars used without a fallback at all — suspicious'); process.exit(1); }\n` +
      `if (undef.length) { console.error(undef.length + ' undefined: ' + undef.slice(0, 8).join(', ')); process.exit(1); }\n` +
      `console.log(hard.size + ' hard-dependency vars, all defined by ${T}');`,
  );
  record(
    contract.ok,
    'every --ds-* var react hard-depends on is defined by tokens',
    contract.ok ? contract.out : contract.err.split('\n')[0],
  );

  // 7. Render server-side. A broken export resolves and imports fine, then fails only when used.
  // Each probe is a dotted path into the package ('Button', 'Card.Root' — a compound namespace
  // object itself throws when rendered) given a text child that must come back out.
  record(RENDER_PROBES.length > 0, 'smokeImport.renderProbes configured', RENDER_PROBES.length ? RENDER_PROBES.join(', ') : 'EMPTY — fill system/kiln.config.json');
  const render = probe(
    `const { renderToStaticMarkup } = await import('react-dom/server');\n` +
      `const React = (await import('react')).default;\n` +
      `const m = await import('${R}');\n` +
      `for (const p of ${JSON.stringify(RENDER_PROBES)}) {\n` +
      `  const C = p.split('.').reduce((o, k) => o?.[k], m);\n` +
      `  if (!C) { console.error(p + ' is not exported'); process.exit(1); }\n` +
      `  const html = renderToStaticMarkup(React.createElement(C, null, 'kiln-probe'));\n` +
      `  if (!/kiln-probe/.test(html)) { console.error(p + ' rendered no text: ' + html); process.exit(1); }\n` +
      `}\n` +
      `console.log(${JSON.stringify(RENDER_PROBES.join(' + '))} + ' render with real markup');`,
  );
  record(render.ok, 'components render server-side', render.ok ? render.out : render.err.split('\n')[0]);

  // 9. A consumer's own `tsc` must pass on the documented imports. Runtime resolution (4, 5) passing
  // said nothing here: TypeScript 6+ checks side-effect imports by default, and `import '<tokens>/css'`
  // has no .css extension for a bundler's `*.css` shim to match, so a fresh Vite + TS app went red in
  // CI while building fine. Forced on, and without vite/client, so the result is the same on any TS
  // version and any bundler.
  sh('npm', ['install', '--no-audit', '--no-fund', 'typescript', '@types/react@18', '@types/react-dom@18'], scratch);
  const cssSpecs = [`${R}/all.css`, `${R}/styles.css`, ...subpaths.filter((s) => /[./]css$/.test(s)).map((s) => T + s.slice(1))];
  writeFileSync(
    join(scratch, 'consumer.ts'),
    cssSpecs.map((s) => `import '${s}';\n`).join('') +
      `import * as ds from '${R}';\n` +
      `const names: (keyof typeof ds)[] = ${JSON.stringify(EXPECTED)};\nexport default names;\n`,
  );
  const tsc = spawnSync(
    join(scratch, 'node_modules', '.bin', 'tsc'),
    ['--noEmit', '--strict', '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2022',
      '--noUncheckedSideEffectImports', '--types', '', 'consumer.ts'],
    { cwd: scratch, encoding: 'utf8' },
  );
  const tscOut = (tsc.stdout || tsc.stderr || '').trim();
  record(tsc.status === 0, `consumer tsc passes on ${cssSpecs.join(' + ')} + named imports`, tsc.status === 0 ? 'clean' : tscOut.split('\n')[0]);

  // 10. One tarball is enough. A second empty project installs only the React package and must resolve
  // all.css (tokens and components in one file), the bundled tokens, and render a component, with
  // nothing fetched for the tokens package. This is the "one install" promise on the Getting started page.
  const PROBE = RENDER_PROBES[0] ?? EXPECTED[0];
  const solo = mkdtempSync(join(tmpdir(), 'kiln-smoke-solo-'));
  try {
    writeFileSync(join(solo, 'package.json'), JSON.stringify({ name: 'solo', private: true, type: 'module' }));
    sh('npm', ['install', '--no-audit', '--no-fund', tarballs[manifests.findIndex((m) => m.dir === 'react')], 'react@18', 'react-dom@18'], solo);
    const has = existsSync(join(solo, 'node_modules', T));
    record(!has, `${R} installs alone, without ${T}`, has ? `${T} was installed as a dependency` : `only ${R}`);
    writeFileSync(join(solo, 'p.mjs'), `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
const fs = require('node:fs'); const css = fs.readFileSync(require.resolve('${R}/all.css'), 'utf8');
if (!/--ds-[a-z0-9-]+\\s*:/.test(css) || !/${PROBE}-module__/.test(css)) { console.error('all.css lacks tokens or component styles'); process.exit(1); }
const t = await import('${R}/tokens'); if (!t.tokens || !Object.keys(t.tokens).length) { console.error('no bundled tokens'); process.exit(1); }
const { renderToStaticMarkup } = await import('react-dom/server'); const React = (await import('react')).default; const m = await import('${R}');
const html = renderToStaticMarkup(React.createElement(m.${PROBE}, null, 'solo')); if (!/solo/.test(html)) process.exit(1);
console.log(Math.round(css.length / 1024) + ' kB all.css, ' + Object.keys(t.tokens).length + ' tokens');`);
    const r = spawnSync('node', ['p.mjs'], { cwd: solo, encoding: 'utf8' });
    record(r.status === 0, `${R}/all.css carries tokens and styles, ${R}/tokens resolves, a component renders`, r.status === 0 ? r.stdout.trim() : (r.stderr || r.stdout).trim().split('\n')[0]);
  } finally { rmSync(solo, { recursive: true, force: true }); }

  // 8. The old scoped names must be gone. A stale symlink or a leftover dependency entry would let
  // the repo keep working locally while a real consumer gets ERR_MODULE_NOT_FOUND.
  for (const old of LEGACY_NAMES) {
    const r = probe(`try { require.resolve('${old}'); console.error('still resolves'); process.exit(1); } catch { console.log('gone'); }`);
    record(r.ok, `old name '${old}' no longer resolves`, r.ok ? 'gone' : 'STILL RESOLVES — stale artifact');
  }
} finally {
  for (const [ok, label, info] of results) {
    console.log(`  ${ok ? '✓' : '✗'} ${label}${info ? '  — ' + info : ''}`);
  }
  rmSync(scratch, { recursive: true, force: true });
}

console.log();
if (failures > 0) {
  console.error(`✗ ${failures}/${results.length} smoke check(s) FAILED — do not publish.`);
  process.exit(1);
}
console.log(`✓ ${results.length}/${results.length} smoke checks passed — both packages install and work under their published names.`);
