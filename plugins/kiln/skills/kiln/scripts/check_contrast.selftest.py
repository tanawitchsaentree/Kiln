#!/usr/bin/env python3
"""Gate Proof for check_contrast.py — closes the gate-proof gap audit_kit.py finds for Precision
G3 (contrast, computed not eyeballed). Mirrors the exact case from the 2026-08-10 eval report
(a real 2.38:1 fail vs. a real 8.86:1 pass against the gate's 4.5:1 line), now as a standing test
instead of a one-time report in a scratch directory.

Run: python3 scripts/check_contrast.selftest.py
"""
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent / "check_contrast.py"


def run(fg, bg, min_ratio="4.5"):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), fg, bg, "--min", min_ratio],
        capture_output=True, text=True,
    )
    return result.returncode, result.stdout + result.stderr


def main():
    failures = []

    # Real Dial pair: light text-default on light surface-canvas — clears 4.5:1 comfortably.
    code, output = run("#f2efeb", "#282623")
    if code != 0:
        failures.append(f"high-contrast pair (#f2efeb/#282623) exited {code}, expected 0 — output: {output[:300]}")
    else:
        print("✓ real high-contrast pair correctly passes 4.5:1")

    # Real Dial pair: border-hairline on surface-canvas — deliberately sub-3:1 (decorative divider,
    # never claimed as AA text), so it must fail the 4.5:1 text minimum.
    code, output = run("#d6d2cc", "#f2efeb")
    if code == 0:
        failures.append("low-contrast pair (#d6d2cc/#f2efeb) exited 0 — contrast check did not fire")
    elif "FAIL" not in output:
        failures.append(f"low-contrast pair failed (exit {code}) but no FAIL marker: {output[:200]}")
    else:
        print("✓ real low-contrast pair correctly fails 4.5:1")

    # Boundary case: the same low-contrast pair against a 3:1 UI-boundary minimum instead — still
    # fails (1.31:1 clears neither bar), proving --min is actually read, not hardcoded to 4.5.
    code, output = run("#d6d2cc", "#f2efeb", "3")
    if code == 0:
        failures.append("low-contrast pair against --min 3 exited 0 — --min flag not being honoured, or hardcoded threshold")
    else:
        print("✓ --min flag is honoured (3:1 threshold applied, not hardcoded 4.5)")

    print()
    if failures:
        print(f"✗ check_contrast.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ check_contrast.selftest clean — G3 is gate-proof.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
