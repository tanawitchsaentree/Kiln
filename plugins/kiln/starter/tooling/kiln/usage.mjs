#!/usr/bin/env node
// usage — how many model tokens this system has cost so far, per day, from Claude Code's own
// transcripts of this repo (~/.claude/projects/<repo path with / as ->/**/*.jsonl, subagents included).
// It reads only the usage numbers each reply records, never message text. docs/BUDGET.md explains
// the columns: "context" (cache reads + writes + fresh input) is what a long session pays again on
// every call, and is usually far larger than what the model writes.
//
// Usage: node tooling/kiln/usage.mjs [--since 2026-10-26] [--dir <transcripts dir>]
import { readdirSync, statSync, createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './config.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const dir = arg('--dir') ?? path.join(os.homedir(), '.claude', 'projects', path.resolve(ROOT).replace(/[^A-Za-z0-9]/g, '-'));
const since = arg('--since') ?? '';
if (!existsSync(dir)) { console.log(`no transcripts at ${dir} (pass --dir)`); process.exit(0); }
const files = []; const walk = (d) => { for (const n of readdirSync(d)) { const p = path.join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.jsonl')) files.push(p); } }; walk(dir);
const days = {}; const seen = new Set();
for (const f of files) {
  for await (const line of createInterface({ input: createReadStream(f) })) {
    if (!line.includes('"usage"')) continue;
    let j; try { j = JSON.parse(line); } catch { continue; }
    const u = j.message?.usage; const id = j.message?.id ?? j.uuid;
    if (!u || seen.has(id)) continue; seen.add(id);
    const d = String(j.timestamp ?? '').slice(0, 10); if (d < since) continue;
    const t = (days[d] ??= { calls: 0, out: 0, ctx: 0 });
    t.calls++; t.out += u.output_tokens ?? 0; t.ctx += (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  }
}
const M = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : `${(n / 1e6).toFixed(1)}M`);
const all = { calls: 0, out: 0, ctx: 0 };
console.log('day         calls   written   context   avg context/call');
for (const d of Object.keys(days).sort()) { const t = days[d]; for (const k in all) all[k] += t[k]; console.log(`${d}  ${String(t.calls).padStart(6)}  ${M(t.out).padStart(8)}  ${M(t.ctx).padStart(8)}  ${M(t.ctx / t.calls).padStart(8)}`); }
if (all.calls) console.log(`total       ${String(all.calls).padStart(6)}  ${M(all.out).padStart(8)}  ${M(all.ctx).padStart(8)}  ${M(all.ctx / all.calls).padStart(8)}   (${files.length} transcripts)`);
