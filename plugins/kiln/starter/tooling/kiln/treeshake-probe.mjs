#!/usr/bin/env node
// G-TS1: importing one component costs only that component. Pane, 2026-10-30: a product imported
// Environment alone and its shared JS grew by 77 kB gz and its CSS by 34 kB, because pane-react shipped
// one file; its page went over its 150 kB budget. This builds a throwaway Vite app that imports one
// component the way a product does and fails when the JS or the CSS carries more than that component.
// Config (kiln.config.json docs): "treeShake": { "package": "pane-react", "probe": "Environment", "maxJsGz": 8000,
//   "tokensCss": "pane-react/tokens.css", "packageDir": "packages/react", "cssPrefix": "pane-" } (the last two optional)
// A system with no treeShake config FAILS: every kiln starter ships one, so a missing block is a lost setting.
import { mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { docsConfig } from './config.mjs';

const C = docsConfig(); const T = C.treeShake;
if (!T) { console.log('✗ G-TS1: no docs.treeShake block in system/kiln.config.json (the starter ships one; set package and probe)'); process.exit(1); }
// packageDir names the workspace folder; without it the folder after the "-" (pane-react → packages/react)
const pkgDir = path.join(C.root, T.packageDir ?? path.join('packages', T.package.replace(/^.*-(?=[^-]+$)/, '')));
const real = process.env.KILN_TS_PKGDIR ?? (existsSync(pkgDir) ? pkgDir : path.join(C.root, 'node_modules', T.package)); // KILN_TS_PKGDIR: probe an unpacked release (gate proof)
const tmp = path.join(C.root, 'node_modules', '.cache', 'kiln-treeshake'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(path.join(tmp, 'node_modules'), { recursive: true });
symlinkSync(real, path.join(tmp, 'node_modules', T.package));
for (const dep of ['react', 'react-dom', '@radix-ui']) { const d = [real, pkgDir].map((b) => path.join(b, 'node_modules', dep)).find(existsSync); if (d) symlinkSync(d, path.join(tmp, 'node_modules', dep)); }
writeFileSync(path.join(tmp, 'main.js'), `import { ${T.probe} } from '${T.package}';\n${T.tokensCss ? `import '${T.tokensCss}';\n` : ''}console.log(${T.probe});\n`);
writeFileSync(path.join(tmp, 'index.html'), '<!doctype html><html><body><script type="module" src="./main.js"></script></body></html>');
const vite = path.join(path.dirname(require_resolve('vite/package.json')), 'bin', 'vite.js');
function require_resolve(id) { const p = execFileSync(process.execPath, ['-p', `require.resolve(${JSON.stringify(id)})`], { cwd: pkgDir, encoding: 'utf8' }).trim(); return p; }
execFileSync(process.execPath, [vite, 'build', '--logLevel', 'error'], { cwd: tmp, stdio: 'pipe' });
const assets = path.join(tmp, 'dist', 'assets'); const files = readdirSync(assets);
const gz = (ext) => gzipSync(Buffer.concat(files.filter((f) => f.endsWith(ext)).map((f) => readFileSync(path.join(assets, f))))).length;
const js = gz('.js'); const cssText = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(path.join(assets, f), 'utf8')).join('');
const others = new Set([...cssText.matchAll(new RegExp(`${(T.cssPrefix ?? T.package.replace(/-[^-]+$/, '-')).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([A-Z][A-Za-z]+)-module__`, 'g'))].map((m) => m[1]).filter((n) => n !== T.probe));
const bad = [];
if (js > (T.maxJsGz ?? 8000)) bad.push(`JS for ${T.probe} alone is ${js} B gz (budget ${T.maxJsGz ?? 8000})`);
if (others.size) bad.push(`CSS for ${T.probe} alone carries ${others.size} other components' styles (${[...others].slice(0, 5).join(', ')}…)`);
console.log(bad.length ? `✗ G-TS1: ${bad.join('; ')}` : `✓ G-TS1: ${T.probe} alone is ${js} B gz JS and ${gz('.css')} B gz CSS, no other component`);
process.exit(bad.length ? 1 : 0);
