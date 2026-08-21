#!/usr/bin/env python3
"""Gate Proof for post-edit-audit.sh — the PostToolUse hook that runs assets/audit.py
automatically after every Edit/Write. This was proven by hand in the session that shipped it
(silent exit 0 with no marker file, real audit output with one) but never turned into a standing,
re-runnable test, which is exactly the gap this repo's own Gate Proof rule exists to close: a
check proven once by hand and never re-run is a claim, not evidence.

Run: python3 hooks/post-edit-audit.selftest.py
"""
import subprocess
import sys
import tempfile
from pathlib import Path

HOOK = Path(__file__).parent / "post-edit-audit.sh"
PLUGIN_ROOT = Path(__file__).parent.parent

GOOD_PRIMITIVES = ":root { --gray-900: #111111; --space-3: 12px; }\n"
GOOD_SEMANTIC = (
    ':root, [data-theme="light"] {\n'
    "  --fg-default: var(--gray-900); /* D-001 ink on canvas */\n"
    "}\n"
)
# check_static's own gate (a real component css file, not the semantic layer): a :hover rule with
# no transition anywhere for it. Uses var(--gray-900), never a raw hex, so this trips exactly one
# check (STATIC) rather than compounding a PURITY violation into the same plant.
BAD_COMPONENT_STATIC = ".badge:hover { background: var(--gray-900); }\n"


def run_hook(root):
    import os
    env = {**os.environ, "CLAUDE_PLUGIN_ROOT": str(PLUGIN_ROOT)}
    result = subprocess.run(["sh", str(HOOK)], cwd=root, capture_output=True, text=True, env=env)
    return result.returncode, result.stdout + result.stderr


def main():
    failures = []

    # Case 1: no css/primitives.css at all — must be a true no-op: exit 0, no output.
    with tempfile.TemporaryDirectory(prefix="dsf-hook-selftest-") as root:
        code, out = run_hook(root)
        if code != 0 or out.strip():
            failures.append(f"no marker file: expected silent exit 0, got exit {code} — {out[:200]}")
        else:
            print("✓ no css/primitives.css present: silent no-op")

    # Case 2: marker present, tokens clean — hook must actually invoke audit.py and report clean.
    with tempfile.TemporaryDirectory(prefix="dsf-hook-selftest-") as root:
        Path(root, "css").mkdir()
        Path(root, "css", "primitives.css").write_text(GOOD_PRIMITIVES)
        Path(root, "css", "semantic.css").write_text(GOOD_SEMANTIC)
        code, out = run_hook(root)
        if code != 0 or "STATIC" not in out:
            failures.append(f"clean fixture: expected exit 0 with real audit.py output, got exit {code} — {out[:300]}")
        else:
            print("✓ marker present, clean tokens: hook runs audit.py for real and reports clean")

    # Case 3: marker present, a real planted STATIC violation — the hook's exit code must move,
    # proving it isn't just running audit.py in a mode that swallows failures.
    with tempfile.TemporaryDirectory(prefix="dsf-hook-selftest-") as root:
        Path(root, "css").mkdir()
        Path(root, "css", "primitives.css").write_text(GOOD_PRIMITIVES)
        Path(root, "css", "semantic.css").write_text(GOOD_SEMANTIC)
        Path(root, "css", "component.css").write_text(BAD_COMPONENT_STATIC)
        code, out = run_hook(root)
        if code == 0:
            failures.append(f"violation fixture: expected non-zero exit, got 0 — {out[:300]}")
        else:
            print("✓ marker present, a real violation: hook's exit code moves off 0")

    print()
    if failures:
        print(f"✗ post-edit-audit.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ post-edit-audit.selftest clean — the hook no-ops outside a managed project, and "
          "actually runs (and reports) audit.py's real result inside one.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
