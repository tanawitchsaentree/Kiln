#!/usr/bin/env node
// gates-run — runs gates.mjs as n shards side by side, then merges them into one result, one report
// and one exit code. Each shard is its own browser on its own share of the gates, so a full gate run
// takes about 1/n of the time. n is docs.parallel (default 3); every line is streamed with its shard.
// Usage: node tooling/kiln/gates-run.mjs [--report]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { docsConfig } from './config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C = docsConfig();
const N = Math.max(1, Number(C.parallel ?? 1));
const run = (args, tag) => new Promise((resolve) => {
  const child = spawn('node', [path.join(HERE, 'gates.mjs'), ...args], { cwd: C.root, stdio: ['ignore', 'pipe', 'pipe'] });
  const out = (d) => process.stdout.write(d.toString().replace(/^(?=.)/gm, tag));
  child.stdout.on('data', out); child.stderr.on('data', out);
  child.on('close', resolve);
});
const t0 = Date.now();
await Promise.all(Array.from({ length: N }, (_, k) => run(['--shard', `${k}/${N}`], `[shard ${k + 1}/${N}] `)));
const code = await run(['--merge', String(N), ...process.argv.slice(2)], '');
console.log(`gates ran as ${N} shards in ${Math.round((Date.now() - t0) / 1000)}s`);
process.exit(code ?? 1);
