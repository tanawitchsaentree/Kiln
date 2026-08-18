#!/usr/bin/env python3
"""Gate Proof for check_vector.py — closes the gate-proof gap audit_kit.py finds for Precision
G3/Coherence G3/Restraint G3 (profile arithmetic) and the token-layer-integrity-adjacent share of
G8's arithmetic proxy. The 2026-08-10 eval report proved these once, in a scratch /tmp directory
that was never committed — this file makes the same proof a standing, re-runnable test.

check() (expressive) has four independent branches — spread, concentration, payment, rotation —
and check_restraint() has four more — ceiling, floor, flatline, rotation. Every branch gets its own
isolated case below (one violation planted per case, everything else in the vector left passing),
run through the actual script via subprocess, not imported logic, so this tests exactly what a
human running the documented command would see. The restraint profile previously had zero cases at
all (`--profile restraint` was never invoked by this file) despite Restraint G3 being marked
"Proven" against it — that's the biggest single gap this update closes.
Run: python3 scripts/check_vector.selftest.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).parent / "check_vector.py"


def run(vector, profile=None, log_vector=None):
    """log_vector, if given, writes a temp .kiln/log.json-shaped file with that vector as the
    prior run, so rotation can be tested the same way an in-repo log would trigger it."""
    cmd = [sys.executable, str(SCRIPT), "--vector", vector]
    if profile:
        cmd += ["--profile", profile]
    log_path = None
    try:
        if log_vector is not None:
            f = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
            json.dump([{"vector": log_vector, "lineage": "01-transit-signage"}], f)
            f.close()
            log_path = f.name
            cmd += ["--log", log_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode, result.stdout + result.stderr
    finally:
        if log_path:
            Path(log_path).unlink()


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

    # Case 4: three axes at 7+ must fail CONCENT (at most two allowed that high). Spread and
    # payment both pass on this vector (extreme axes T8/G9 are covered by 3 quiet axes <=2), so
    # CONCENT is the only violation in play.
    code, output = run("7,8,9,1,0,2")
    if code == 0:
        failures.append("three loud axes (7,8,9,1,0,2) exited 0 — CONCENT check did not fire")
    elif "CONCENT" not in output:
        failures.append(f"three-loud-axes vector failed (exit {code}) but not on CONCENT — output: {output[:200]}")
    else:
        print("✓ three axes at 7+ correctly fails concentration")

    # Case 5: an unmoved vector vs. an identical prior log entry must fail expressive ROTATE.
    code, output = run("3,8,2,1,2,6", log_vector=[3, 8, 2, 1, 2, 6])
    if code == 0:
        failures.append("unmoved vector vs identical log entry exited 0 — expressive ROTATE check did not fire")
    elif "ROTATE" not in output:
        failures.append(f"unmoved vector failed (exit {code}) but not on ROTATE — output: {output[:200]}")
    else:
        print("✓ unmoved vector vs prior run correctly fails expressive rotation")

    # Case 6: an axis above the restraint ceiling (3) must fail CEILING. Floor (T=0, M=0) and
    # flatline (spread=4) both pass, so CEILING is isolated.
    code, output = run("4,0,1,2,0,3", profile="restraint")
    if code == 0:
        failures.append("restraint vector with an axis at 4 (4,0,1,2,0,3) exited 0 — CEILING check did not fire")
    elif "CEILING" not in output:
        failures.append(f"over-ceiling restraint vector failed (exit {code}) but not on CEILING — output: {output[:200]}")
    else:
        print("✓ restraint axis above the ceiling correctly fails")

    # Case 7: no axis at exactly 0 must fail FLOOR. Ceiling (max=3) and flatline (spread=2) both
    # pass, so FLOOR is isolated.
    code, output = run("3,2,1,3,1,2", profile="restraint")
    if code == 0:
        failures.append("restraint vector with no axis at 0 (3,2,1,3,1,2) exited 0 — FLOOR check did not fire")
    elif "FLOOR" not in output:
        failures.append(f"no-floor restraint vector failed (exit {code}) but not on FLOOR — output: {output[:200]}")
    else:
        print("✓ restraint vector with no refused axis correctly fails the floor check")

    # Case 8: spread under 2 even with a real floor present must fail FLATLINE. Ceiling (max=1)
    # and floor (D=0 present) both pass, so FLATLINE is isolated.
    code, output = run("1,1,1,1,1,0", profile="restraint")
    if code == 0:
        failures.append("restraint vector with spread=1 (1,1,1,1,1,0) exited 0 — FLATLINE check did not fire")
    elif "FLATLINE" not in output:
        failures.append(f"low-spread restraint vector failed (exit {code}) but not on FLATLINE — output: {output[:200]}")
    else:
        print("✓ restraint vector with insufficient spread correctly fails flatline")

    # Case 9: a genuinely valid restraint vector (ceiling, floor, and flatline all satisfied)
    # must pass — the restraint profile's own equivalent of case 2, missing until now.
    code, output = run("3,0,2,1,3,2", profile="restraint")
    if code != 0:
        failures.append(f"valid restraint vector (3,0,2,1,3,2) exited {code}, expected 0 — output: {output[:300]}")
    else:
        print("✓ valid restraint vector correctly passes")

    # Case 10: an unmoved restraint vector vs. an identical prior log entry must fail restraint's
    # own ROTATE (lower movement bar than expressive's, per check_restraint()'s own comment).
    code, output = run("3,0,2,1,3,2", profile="restraint", log_vector=[3, 0, 2, 1, 3, 2])
    if code == 0:
        failures.append("unmoved restraint vector vs identical log entry exited 0 — restraint ROTATE check did not fire")
    elif "ROTATE" not in output:
        failures.append(f"unmoved restraint vector failed (exit {code}) but not on ROTATE — output: {output[:200]}")
    else:
        print("✓ unmoved restraint vector vs prior run correctly fails rotation")

    print()
    if failures:
        print(f"✗ check_vector.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ check_vector.selftest clean — all 8 branches (4 expressive, 4 restraint) are gate-proof.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
