#!/usr/bin/env node
// derivation-guard — PreToolUse hook: a component's CSS or TSX cannot be written until its form has
// been derived from the concept (references/derivation.md). The component's <Name>.why.json must hold
// the generic default it avoids, derivation steps that quote the principles, and a picked variant
// (by the user, or by the agent with a reason when autonomy.picks is "agent"), or "identity": false
// with a reason, for layout primitives with no form of their own.
//
// Hooked on Edit/Write/MultiEdit AND on Bash: in Pane, component CSS was rewritten with `sed -i` and
// heredocs while the Edit hook watched the front door. A Bash command that names a component's
// CSS/TSX and writes (redirect, tee, sed -i, perl -pi, cp, mv, a script writing files) is held to
// the same rule. rationale.mjs checks the same thing again in verify.
// Reads the hook payload on stdin; exit 2 blocks the call and tells the agent what is missing.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { docsConfig, ROOT } from './config.mjs';

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const C = docsConfig();
const comp = C.abs(C.componentsDir);
const SYS = (() => { try { return JSON.parse(readFileSync(path.join(ROOT, 'system', 'kiln.config.json'), 'utf8')); } catch { return {}; } })();

const targets = [];
const input = payload.tool_input ?? {};
if (input.file_path || input.path) targets.push(path.resolve(input.file_path ?? input.path));
if (typeof input.command === 'string') {
  const cmd = input.command;
  const writes = /(^|[^<])>>?\s*\S|\btee\b|\bsed\s+(-\w*\s+)*-i|\bperl\s+-\w*p\w*i|\bcp\b|\bmv\b|\binstall\b|writeFile|open\([^)]*['"]w|\.write\(|rsync\b/.test(cmd);
  if (writes) for (const m of cmd.matchAll(/[\w./-]*?([A-Z]\w*)\/\1\.(module\.css|tsx)\b/g)) targets.push(path.resolve(payload.cwd ?? ROOT, m[0]));
  // a glob or a directory-wide rewrite of the components folder counts too
  if (writes && /components\/(\*|\{)/.test(cmd)) targets.push(path.join(comp, '*', '*.tsx'));
}

const blocked = [];
for (const file of targets) {
  const rel = path.relative(comp, file);
  if (rel.startsWith('..')) continue;
  if (rel.startsWith('*')) { blocked.push(['(several)', ['a command that rewrites every component at once; edit one derived component at a time']]); continue; }
  const m = rel.match(/^([A-Z][\w]*)\/\1\.(module\.css|tsx)$/);
  if (!m) continue;
  const name = m[1];
  const whyFile = path.join(comp, name, `${name}.why.json`);
  const why = existsSync(whyFile) ? JSON.parse(readFileSync(whyFile, 'utf8')) : null;
  const missing = [];
  if (!why) missing.push(`${name}.why.json does not exist`);
  else if (why.identity === false) { if (!why.identity_reason) missing.push('identity: false needs identity_reason'); }
  else {
    if (!(why.default_to_avoid ?? []).length) missing.push('default_to_avoid (the generic pattern this must not become)');
    if ((why.derivation ?? []).length < 3) missing.push('derivation (≥3 steps quoting the principles\' Therefore text)');
    const v = why.variants ?? {};
    const agentOk = v.by === 'agent' && SYS.autonomy?.picks === 'agent' && String(v.reason ?? '').split(/\s+/).length >= 12;
    if (!v.picked || !(v.by === 'user' || agentOk)) missing.push(SYS.autonomy?.picks === 'agent' ? 'variants.picked with by "agent" and a reason (render ≥3 in apps/lab first, log it in system/REVIEW.md)' : 'variants.picked by the user (render ≥3 in apps/lab first)');
  }
  if (missing.length) blocked.push([name, missing]);
}
if (!blocked.length) process.exit(0);
console.error(blocked.map(([name, missing]) => `BLOCKED: ${name}'s form has not been derived from the concept yet. Fill ${name}.why.json first:\n  - ${missing.join('\n  - ')}`).join('\n') + `\nSee kiln references/derivation.md. Design comes from the principles, then the code${input.command ? ', and a shell command is not a way around this' : ''}.`);
process.exit(2);
