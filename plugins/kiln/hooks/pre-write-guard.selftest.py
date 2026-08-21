#!/usr/bin/env python3
"""Gate Proof for pre-write-guard.sh — the PreToolUse hook that blocks writing a token/component
file before kiln's state machine has passed Phase 5. This is a blocking mechanism, not an
observational one: getting it wrong doesn't just under-report, it can block every Edit/Write call
in every project that happens to have a .kiln/state.json, or silently fail to block anything at
all. Both failure directions get a real case here, not just a manual smoke test.

Runs entirely inside a temp directory via subprocess, feeding the hook real JSON on stdin the way
Claude Code actually would.

Run: python3 hooks/pre-write-guard.selftest.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HOOK = Path(__file__).parent / "pre-write-guard.sh"
STATE_SCRIPT = Path(__file__).parent.parent / "skills" / "kiln" / "scripts" / "kiln_state.py"


def run_hook(root, file_path):
    payload = json.dumps({"tool_input": {"file_path": file_path}})
    result = subprocess.run(
        ["sh", str(HOOK)], cwd=root, input=payload, capture_output=True, text=True
    )
    return result.returncode, result.stdout + result.stderr


def run_state(root, *args):
    subprocess.run([sys.executable, str(STATE_SCRIPT), *args], cwd=root, capture_output=True, text=True)


def denied(output):
    try:
        return json.loads(output).get("hookSpecificOutput", {}).get("permissionDecision") == "deny"
    except (json.JSONDecodeError, ValueError):
        return False


def main():
    failures = []

    # Case 1: no .kiln/state.json at all — must allow silently, no output, no false blocking of
    # an ordinary project that never asked for this state machine.
    with tempfile.TemporaryDirectory(prefix="kiln-guard-selftest-") as root:
        code, out = run_hook(root, "src/tokens.css")
        if code != 0 or out.strip():
            failures.append(f"no state.json case: expected silent exit 0, got exit {code} — {out[:200]}")
        else:
            print("✓ no .kiln/state.json present: allowed silently")

    # Case 2: state.json exists, phase 0 — writing a gated extension must be DENIED.
    with tempfile.TemporaryDirectory(prefix="kiln-guard-selftest-") as root:
        run_state(root, "init", "--verb", "build", "--scale", "Spec")
        code, out = run_hook(root, "src/tokens.css")
        if not denied(out):
            failures.append(f"phase 0, tokens.css: expected a deny decision, got — {out[:300]}")
        else:
            print("✓ phase 0: writing a token/component file is denied")

        # Case 3: same phase 0, but the harness's OWN state file must never be gated — a false
        # positive here would deadlock the harness against itself.
        code, out = run_hook(root, ".kiln/cache.json")
        if denied(out):
            failures.append(f".kiln/cache.json at phase 0: should be exempt, got a deny — {out[:300]}")
        else:
            print("✓ phase 0: .kiln/'s own files are exempt from the gate")

        # Case 4: same phase 0, a non-gated extension (prose) must be allowed.
        code, out = run_hook(root, "BRIEF.md")
        if denied(out):
            failures.append(f"BRIEF.md at phase 0: should be exempt, got a deny — {out[:300]}")
        else:
            print("✓ phase 0: non-gated extensions (.md) are allowed")

        # Advance the real state machine to phase 5, then confirm the gate opens — this is the
        # revert half: a gate that never opens again is as broken as one that never closes.
        run_state(root, "advance", "--data", '{"brief":"x","scale":"Spec","has_reference":false}')
        run_state(root, "advance", "--data",
                  '{"lineage_name":"x","home_vector":[1,1,1,1,1,1],"signature_move":"x","fit_statement":"x"}')
        run_state(root, "advance", "--data",
                  '{"vector":[3,8,2,1,2,6],"loud_axis":"type","loud_axis_payment":"x"}')
        run_state(root, "advance", "--data",
                  '{"plan":"p","out_of_scope":"x","acceptance_criteria":["a"],"riskiest_slice":"x"}')
        code, out = run_hook(root, "src/tokens.css")
        if denied(out):
            failures.append(f"phase 5 (thin slice): should be allowed, got a deny — {out[:300]}")
        else:
            print("✓ phase 5: writing the thin slice's real files is allowed")

        run_state(root, "advance", "--data",
                  '{"stamp":{},"token_block":"x","acceptance_criteria":["a"],"approved":true}')
        code, out = run_hook(root, "src/components/Button.tsx")
        if denied(out):
            failures.append(f"phase 6 (expand): should be allowed, got a deny — {out[:300]}")
        else:
            print("✓ phase 6: expansion writes are allowed once the checkpoint is real")

    # Case 5: unreadable/corrupt state.json must fail OPEN (allow), never block on a guess — a
    # guard that blocks everything the moment its own state file is malformed is worse than no
    # guard at all.
    with tempfile.TemporaryDirectory(prefix="kiln-guard-selftest-") as root:
        Path(root, ".kiln").mkdir()
        Path(root, ".kiln", "state.json").write_text("{not valid json")
        code, out = run_hook(root, "src/tokens.css")
        if denied(out):
            failures.append(f"corrupt state.json: should fail open (allow), got a deny — {out[:300]}")
        else:
            print("✓ corrupt state.json fails open instead of blocking on a guess")

    print()
    if failures:
        print(f"✗ pre-write-guard.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ pre-write-guard.selftest clean — the blocking hook opens and closes correctly, "
          "exempts the harness's own files, and fails open on a corrupt state file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
