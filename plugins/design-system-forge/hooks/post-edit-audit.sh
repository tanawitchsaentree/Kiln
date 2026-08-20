#!/bin/sh
# Runs assets/audit.py automatically after Claude edits or writes a file, so a regression is
# caught the moment it's introduced instead of whenever someone remembers to run `audit` — the
# gap this skill had relative to a detector that runs as a git/editor hook rather than only on
# request.
#
# Silent no-op outside a project this skill actually manages: css/primitives.css (audit.py's own
# default Layer 1 path) is the marker. Without it, this would fire on every Edit/Write in every
# project anyone has this plugin enabled in, most of which never asked for these rules — exactly
# the "gate that fires on correct code gets switched off" failure mode audit.py's own docstrings
# warn about, one level up.
if [ ! -f "css/primitives.css" ]; then
  exit 0
fi

python3 "${CLAUDE_PLUGIN_ROOT}/skills/design-system-forge/assets/audit.py" . --quiet
