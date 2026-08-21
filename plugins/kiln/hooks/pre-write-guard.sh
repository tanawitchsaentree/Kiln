#!/bin/sh
# PreToolUse guard — blocks writing a real token/component/style file before kiln's own state
# machine has passed Phase 0-4. This skill's own opening claim is that a real lineage and vector
# get decided before a single token gets written; without this hook that was a claim about intent,
# checkable only by rereading the phase file. With it, writing one of those files during phases
# 0-4 in a project the state machine is actively tracking is a call the harness refuses, not a
# step the model could silently skip.
#
# Scoped narrowly on purpose: only fires inside a project with .kiln/state.json (a build this
# state machine is actively tracking — see scripts/kiln_state.py), never touches .kiln/'s own
# files (state.json, cache.json, log.json are legitimate infrastructure writes, not the token/
# component work this hook exists to gate), and allows everything from phase 5 onward, since
# Phase 5 legitimately writes the thin slice for real — see kiln_state.py's own `guard` command
# for the phase-6 boundary that governs expansion instead of this one.

STATE=".kiln/state.json"
[ -f "$STATE" ] || exit 0

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

case "$FILE" in
  .kiln/*|*/.kiln/*) exit 0 ;;
  *.css|*.scss|*.ts|*.tsx|*.js|*.jsx|*.json) ;;
  *) exit 0 ;;
esac

PHASE=$(python3 -c "
import json
try:
    print(json.load(open('$STATE')).get('current_phase', 99))
except Exception:
    print(99)
" 2>/dev/null)

case "$PHASE" in
  ''|*[!0-9]*) exit 0 ;;  # unreadable state, fail open rather than block on a guess
esac

if [ "$PHASE" -lt 5 ]; then
  printf '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "kiln'"'"'s state machine is at phase %s, before Phase 5. Decide the lineage and vector first (run scripts/kiln_state.py status), then advance the state machine, before writing %s."}}' "$PHASE" "$FILE"
fi

exit 0
