#!/usr/bin/env node
// PostToolUse hook (Edit|Write|MultiEdit) — runs no-hardcode-lint on the file just edited.
// Claude Code passes the tool call as JSON on stdin; a hook only reaches the agent when it exits 2
// with the reason on stderr. The previous inline hook (`lint || echo ...`) always exited 0, so a
// violation never blocked anything and the agent never saw it.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LINT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'no-hardcode-lint.mjs');

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // not a tool-call payload — nothing to check
}
const file = input?.tool_input?.file_path;
if (!file) process.exit(0);

const r = spawnSync(process.execPath, [LINT, file], { encoding: 'utf8', cwd: input.cwd || process.cwd() });
if (r.status === 0) process.exit(0);

process.stderr.write(
  `no-hardcode-lint FAILED on ${file} — fix before moving on (CLAUDE.md iron rule 1)\n` +
    (r.stdout || '') + (r.stderr || ''),
);
process.exit(2);
