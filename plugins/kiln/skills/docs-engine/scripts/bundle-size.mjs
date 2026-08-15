#!/usr/bin/env node
/**
 * docs-engine bundle-size generator — computes per-export minified+gzipped size for a component
 * library's public exports, for the badge-row checklist point (content-model.md point 2).
 * Reference implementation for esbuild-based bundlers; a non-JS-bundled stack needs its own
 * equivalent producing the same {name, minifiedBytes, gzipBytes} shape.
 *
 * Method: for each named export, generate a virtual entry file that imports ONLY that export from
 * the package, then esbuild-bundle+minify it with the package's own peer deps (react/react-dom)
 * marked external — so the reported size is (intended to be) the component's own code weight,
 * not React's.
 *
 * IMPORTANT — this only reports a real per-component number if the package's build output is
 * tree-shakeable (separate modules/chunks per component, or at minimum ES module syntax with no
 * cross-export top-level side effects). Confirmed against dial-react (packages/react/dist/
 * index.mjs, a single ~10k-line flat bundle with every component's minified identifier packed
 * into one scope): every export reports the exact SAME size (209.9 KB min / 66.4 KB gzip,
 * confirmed identical for Button/IconButton/Input/Stack/Spacer) because esbuild cannot tree-shake
 * a single already-bundled file — importing any one name still pulls in the whole bundle textually.
 * That number is honest about the package as a whole but WRONG as a per-component badge — do not
 * present it as "this component's size." This script now detects that condition (all measured
 * exports reporting an identical byte count) and reports it explicitly as UNMEASURABLE rather
 * than emitting a misleading per-component figure — see `allIdentical` in the output. A real
 * per-component number requires either building the package as bundle: false or `--metafile`-based
 * source-attribution against the actual output (esbuild's `--analyze`), whichever the package's own
 * build should adopt — that's a `packages/react` build config decision, not a docs-engine one; see
 * BACKLOG.md.
 *
 * Usage:
 *   node bundle-size.mjs --package-name <name> --package-root <path> --exports Button,Input,...
 *   node bundle-size.mjs --package-name dial-react --package-root ../../packages/react \
 *     --exports Button,IconButton,Input
 *
 * Must run from somewhere esbuild resolves via node_modules (e.g. the repo root or a workspace
 * package), same constraint as audit.mjs.
 */
import esbuild from 'esbuild';
import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

async function measureExport(packageName, packageRoot, exportName) {
  // Node module resolution walks up from the ENTRY FILE's own directory, not absWorkingDir alone
  // — a temp file under os.tmpdir() can't see the caller's node_modules, so the probe file must
  // live inside the directory tree that actually has `packageName` resolvable (i.e. cwd, where
  // this script is invoked from — normally the docs app with a workspace dependency on it).
  const tmpFile = path.join(process.cwd(), `.docs-engine-bundle-size-probe-${exportName}-${process.pid}.mjs`);
  fs.writeFileSync(tmpFile, `export { ${exportName} } from '${packageName}';\n`);

  try {
    const result = await esbuild.build({
      entryPoints: [tmpFile],
      bundle: true,
      minify: true,
      format: 'esm',
      write: false,
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      logLevel: 'silent',
    });
    const code = result.outputFiles[0].text;
    const minifiedBytes = Buffer.byteLength(code, 'utf8');
    const gzipBytes = gzipSync(Buffer.from(code, 'utf8')).length;
    return { name: exportName, minifiedBytes, gzipBytes, error: null };
  } catch (e) {
    return { name: exportName, minifiedBytes: null, gzipBytes: null, error: String(e.message || e) };
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

function formatBytes(n) {
  if (n == null) return 'error';
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageName = args['package-name'];
  const packageRootRaw = args['package-root'];
  const exportsList = (args.exports || '').split(',').filter(Boolean);
  const asJson = args.json === true;

  if (!packageName || !packageRootRaw || exportsList.length === 0) {
    console.error('Usage: node bundle-size.mjs --package-name <name> --package-root <path> --exports A,B,C [--json]');
    process.exit(2);
  }

  const packageRoot = path.resolve(process.cwd(), packageRootRaw);
  const results = [];
  for (const exportName of exportsList) {
    results.push(await measureExport(packageName, packageRoot, exportName));
  }

  // If every successfully-measured export reports within a few bytes of the same size, the
  // package's build output isn't tree-shakeable (single flat bundle) and none of these numbers
  // are real per-component sizes — reporting them as such would be an unbacked claim (Honesty
  // Rule). Threshold is NOT exact equality: confirmed against dial-react that importing different
  // names from the same flat bundle produces sizes differing by single-digit bytes (whichever
  // export got aliased to the shortest/longest minified re-export identifier) even though the
  // actual bundled code is the identical whole-package blob every time — exact equality misses
  // this real case. 0.5% of the smallest measured size is generous enough to catch bundler-noise
  // variance while still flagging a genuinely code-split package (which differs by kilobytes, not
  // bytes, between e.g. a 2KB atom and a 40KB overlay component).
  const measured = results.filter((r) => r.minifiedBytes != null);
  const minSize = measured.length ? Math.min(...measured.map((r) => r.minifiedBytes)) : 0;
  const maxSize = measured.length ? Math.max(...measured.map((r) => r.minifiedBytes)) : 0;
  const allIdentical = measured.length > 1 && (maxSize - minSize) <= Math.max(64, minSize * 0.005);

  if (asJson) {
    console.log(JSON.stringify({ results, allIdentical }, null, 2));
    return;
  }

  if (allIdentical) {
    console.log(`UNMEASURABLE per-component: all ${measured.length} exports reported the identical size (${formatBytes(measured[0].minifiedBytes)} min / ${formatBytes(measured[0].gzipBytes)} gzip) — ${packageName}'s build output is a single non-tree-shakeable bundle, so this is the whole package's size, not any one component's. Do not use this as a per-component badge value; see this script's own header comment and BACKLOG.md.`);
    return;
  }

  console.log(`Bundle size for ${packageName} (minified, gzip — react/react-dom external as peer deps):`);
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.name.padEnd(16)} ERROR: ${r.error}`);
    } else {
      console.log(`  ${r.name.padEnd(16)} min=${formatBytes(r.minifiedBytes).padEnd(10)} gzip=${formatBytes(r.gzipBytes)}`);
    }
  }
}

main();
