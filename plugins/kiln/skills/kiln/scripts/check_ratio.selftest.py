#!/usr/bin/env python3
"""Gate Proof for check_ratio.py — closes the gate-proof gap audit_kit.py finds for Precision G1
(ratio discipline). The 2026-08-10 eval report proved this once with a real fixture pair in a
scratch /tmp directory, never committed as a standing test — this file makes that proof re-runnable
by writing a real script for the gate first (check_ratio.py didn't exist before this round; G1 was
previously judgement-only), then gate-proofing that script the same way every other gate here is.

Run: python3 scripts/check_ratio.selftest.py
"""
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent / "check_ratio.py"


def run(values):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), values], capture_output=True, text=True
    )
    return result.returncode, result.stdout + result.stderr


def main():
    failures = []

    # Real Dial type scale (1.2 ratio) — must pass.
    code, output = run("11,13.2,15.84,19.008,22.8096")
    if code != 0:
        failures.append(f"clean 1.2-ratio scale exited {code}, expected 0 — output: {output[:300]}")
    else:
        print("✓ clean constant-ratio scale correctly passes")

    # Arbitrary sizes with no stated ratio (the actual case from the original eval fixture) — must fail.
    code, output = run("12,14,19,24,31")
    if code == 0:
        failures.append("arbitrary non-ratio scale exited 0 — ratio-discipline check did not fire")
    elif "FAIL" not in output:
        failures.append(f"arbitrary scale failed (exit {code}) but no FAIL marker in output: {output[:200]}")
    else:
        print("✓ arbitrary non-ratio scale correctly fails")

    print()
    if failures:
        print(f"✗ check_ratio.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ check_ratio.selftest clean — G1 is gate-proof.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
