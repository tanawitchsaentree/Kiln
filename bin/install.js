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

const mode = process.argv[2] === 'update' ? 'update' : 'install';

console.log(mode === 'update' ? 'Updating kiln to the latest commit...\n' : 'Installing kiln...\n');

const addStatus = run(['plugin', 'marketplace', 'add', 'tanawitchsaentree/Kiln']);
if (addStatus !== 0) {
  process.exit(addStatus);
}

const marketplaceUpdateStatus = run(['plugin', 'marketplace', 'update', 'kiln-marketplace']);
if (marketplaceUpdateStatus !== 0) {
  process.exit(marketplaceUpdateStatus);
}

// `plugin install` on an already-installed plugin reports "already installed" and stops — it
// does NOT check the refreshed marketplace cache for a newer version. `plugin update` does that
// version check, but only works on something already installed. Update mode tries `update` first
// and falls back to `install` for someone who typed `update` before ever installing; install mode
// calls `install` directly since there's nothing installed yet to update. Verified directly
// against a real `claude` CLI (v2.1.234): plugin install alone silently left a stale 1.0.0
// installed even after marketplace update had already pulled 1.1.0 — plugin update was the only
// command that actually bumped the installed copy.
let finalStatus;
if (mode === 'update') {
  finalStatus = run(['plugin', 'update', 'kiln@kiln-marketplace']);
  if (finalStatus !== 0) {
    finalStatus = run(['plugin', 'install', 'kiln@kiln-marketplace']);
  }
} else {
  finalStatus = run(['plugin', 'install', 'kiln@kiln-marketplace']);
}

if (finalStatus === 0) {
  // `claude plugin update`'s own success message says "Restart to apply changes" — trust that
  // over a general "/reload-plugins usually works" claim, since it's the tool's own stated
  // requirement for this specific path.
  console.log(mode === 'update' ? '\nkiln is up to date.' : '\nkiln is installed.');
  console.log('Restart Claude Code (fully quit and reopen, not just a new session) to pick this');
  console.log('up in any session, new or already open — this script cannot do that for you.');
  console.log('Then try: kiln study <image or URL>');
  console.log(
    mode === 'update'
      ? '\nRun this update command again any time later.'
      : '\nRun `npx github:tanawitchsaentree/Kiln update` any time later to update.'
  );
}
process.exit(finalStatus);
