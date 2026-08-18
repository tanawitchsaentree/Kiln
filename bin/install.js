#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

function run(args) {
  console.log(`> claude ${args.join(' ')}`);
  const result = spawnSync('claude', args, { stdio: 'inherit' });
  if (result.error) {
    console.error(
      '\nCould not find the `claude` CLI. Install Claude Code first: https://docs.claude.com/en/docs/claude-code'
    );
    process.exit(1);
  }
  return result.status ?? 1;
}

// `update` is the same three commands as a fresh install (marketplace add on an already-added
// marketplace updates config in place, marketplace update re-fetches the repo, plugin install on
// an already-installed plugin re-installs the latest version) — this mode exists so the command a
// returning user types actually says "update," instead of asking them to remember that re-running
// the install command is the update path.
const mode = process.argv[2] === 'update' ? 'update' : 'install';

console.log(mode === 'update' ? 'Updating kiln to the latest commit...\n' : 'Installing kiln...\n');

const addStatus = run(['plugin', 'marketplace', 'add', 'tanawitchsaentree/Kiln']);
if (addStatus !== 0) {
  process.exit(addStatus);
}

const updateStatus = run(['plugin', 'marketplace', 'update', 'kiln-marketplace']);
if (updateStatus !== 0) {
  process.exit(updateStatus);
}

const installStatus = run(['plugin', 'install', 'kiln@kiln-marketplace']);
if (installStatus === 0) {
  // This script runs outside any Claude Code session, so a session that was already open before
  // it ran has no way to know a plugin changed underneath it — the plugin loader only reads
  // installed plugins at session start, per Claude Code's own docs. Say so explicitly rather than
  // letting someone re-run this, see no error, and wonder why kiln still isn't there.
  console.log(mode === 'update' ? '\nkiln is up to date.' : '\nkiln is installed.');
  console.log('If you have a Claude Code session already open, run /reload-plugins inside it');
  console.log('(or start a new session) before kiln shows up — this script cannot do that for you.');
  console.log('Then try: kiln study <image or URL>');
  console.log(
    mode === 'update'
      ? '\nRun this update command again any time later.'
      : '\nRun `npx github:tanawitchsaentree/Kiln update` any time later to update.'
  );
}
process.exit(installStatus);
