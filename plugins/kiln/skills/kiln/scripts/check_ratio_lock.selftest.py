#!/usr/bin/env python3
"""Gate Proof for check_ratio_lock.py — the real defect this script exists to catch: three Dial
components (features.tsx, security.tsx, how-it-works.tsx) each independently chose an
icon-in-container ratio for what is visually one repeated pattern, found 2026-08-24 by direct user
report against the rendered build, not by any gate that was running at the time.

Run: python3 scripts/check_ratio_lock.selftest.py
"""
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent / "check_ratio_lock.py"


def run(arg):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), arg],
        capture_output=True, text=True,
    )
    return result.returncode, result.stdout + result.stderr


def main():
    failures = []

    # Real Dial defect: features.tsx (44px box / 20px icon), security.tsx (36px / 16px),
    # how-it-works.tsx (48px / 20px) — ratios 2.2, 2.25, 2.4, none within tolerance of each other.
    code, output = run("44:20,36:16,48:20")
    if code == 0:
        failures.append(f"real 3-way Dial mismatch exited 0, expected 1 (a mismatch that shipped) — output: {output[:400]}")
    elif "FAIL" not in output:
        failures.append(f"real 3-way Dial mismatch exited {code} but printed no FAIL — output: {output[:400]}")
    elif "2.2500" not in output or "2.4000" not in output:
        failures.append(f"FAIL fired but didn't name the actual mismatched ratios (2.25, 2.4) — output: {output[:400]}")
    else:
        print("real 3-way Dial mismatch correctly fails and names both mismatched ratios")

    # Same pattern, correctly locked: two instances both resolving to 2.2 (44:20 and 33:15).
    code, output = run("44:20,33:15")
    if code != 0:
        failures.append(f"two instances at the same ratio (2.2) exited {code}, expected 0 — output: {output[:400]}")
    elif "passes" not in output:
        failures.append(f"exit 0 but no pass message — output: {output[:400]}")
    else:
        print("two instances correctly agreeing on ratio 2.2 correctly passes")

    # A single real instance — nothing to lock against yet, should pass (not a false alarm on a
    # system's first-ever use of a pattern).
    code, output = run("44:20")
    if code != 0:
        failures.append(f"single instance exited {code}, expected 0 (nothing to compare yet) — output: {output[:400]}")
    else:
        print("single instance (nothing to lock against yet) correctly passes")

    if failures:
        print("\nFAILURES:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)

    print("\nAll check_ratio_lock.py Gate Proof cases pass.")
    sys.exit(0)


if __name__ == "__main__":
    main()
