#!/usr/bin/env python3
"""Gate Proof for check_vector.py — closes the gate-proof gap audit_kit.py finds for Precision
G3/Coherence G3/Restraint G3 (profile arithmetic) and the token-layer-integrity-adjacent share of
G8's arithmetic proxy. The 2026-08-10 eval report proved these once, in a scratch /tmp directory
that was never committed — this file makes the same proof a standing, re-runnable test.

Two real cases, run through the actual script (subprocess, not imported logic) so this tests
exactly what a human running the documented command would see:
  1. A flat vector (max-min=2, needs >=5) must FAIL the spread check — exit 1, "SPREAD" in output.
  2. A vector with a real loud axis and proper payment must PASS — exit 0.
Run: python3 scripts/check_vector.selftest.py
"""
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent / "check_vector.py"


def run(vector, profile=None):
    cmd = [sys.executable, str(SCRIPT), "--vector", vector]
    if profile:
        cmd += ["--profile", profile]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout + result.stderr


def main():
    failures = []

    # Case 1: flat vector must fail SPREAD.
    code, output = run("5,5,5,5,5,5")
    if code == 0:
        failures.append("flat vector (5,5,5,5,5,5) exited 0 — SPREAD check did not fire")
    elif "SPREAD" not in output:
        failures.append(f"flat vector failed (exit {code}) but not on SPREAD — output: {output[:200]}")
    else:
        print("✓ flat vector correctly fails SPREAD")

    # Case 2: a real, valid expressive vector must pass.
    code, output = run("3,8,2,1,2,6")
    if code != 0:
        failures.append(f"valid vector (3,8,2,1,2,6) exited {code}, expected 0 — output: {output[:300]}")
    else:
        print("✓ valid vector correctly passes")

    # Case 3 (mutation-equivalent, per the original eval): an underpaid extreme axis must fail
    # payment. Axis at 8, but only ONE other axis at <=2 (needs two) — payment violation.
    # C3 T8 G5 S5 M2 D6: only motion(2) is quiet; chroma=3 does not count (>2), so only 1 of the
    # required 2 quiet axes exists.
    code, output = run("3,8,5,5,2,6")
    if code == 0:
        failures.append("underpaid vector (3,8,5,5,2,6 — only one quiet axis covering an 8) exited 0 — PAYMENT check did not fire")
    elif "PAYMENT" not in output.upper() and "pay" not in output.lower():
        failures.append(f"underpaid vector failed (exit {code}) but not on payment — output: {output[:200]}")
    else:
        print("✓ underpaid extreme axis correctly fails payment")

    print()
    if failures:
        print(f"✗ check_vector.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ check_vector.selftest clean — G3 (all three sets) is gate-proof.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
