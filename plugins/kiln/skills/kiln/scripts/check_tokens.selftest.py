#!/usr/bin/env python3
"""Gate Proof for check_tokens.py — closes the gate-proof gap audit_kit.py finds for Precision
G8/Coherence G8/Restraint G8 (token layer integrity, the same script backs all three per the
gate-proof tally). The 2026-08-10 eval report proved this once in a scratch /tmp directory, never
committed — this file makes it a standing, re-runnable test.

Uses real temp files (via tempfile, cleaned up after) so this exercises the actual file-reading
path check_tokens.py uses, not a mocked-out internal function.
Run: python3 scripts/check_tokens.selftest.py
"""
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).parent / "check_tokens.py"

GOOD_CSS = """:root {
  --ds-color-brand: #9c3200; /* D-006 accent, orange ramp */
  --ds-space-md: 16px; /* base-8 scale step 2 */
}
"""

BAD_CSS_NO_SOURCE_NOTE = """:root {
  --ds-color-brand: #9c3200;
  --ds-space-md: 16px;
}
"""

BAD_CSS_RAW_VALUE = """:root {
  --ds-color-brand: #9c3200; /* D-006 accent */
}
.button {
  color: #ffffff;
}
"""


def run(css_content):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
        f.write(css_content)
        path = f.name
    try:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), path], capture_output=True, text=True
        )
        return result.returncode, result.stdout + result.stderr
    finally:
        Path(path).unlink()


def main():
    failures = []

    code, output = run(GOOD_CSS)
    if code != 0:
        failures.append(f"fully-noted tokens file exited {code}, expected 0 — output: {output[:300]}")
    else:
        print("✓ fully source-noted tokens file correctly passes")

    code, output = run(BAD_CSS_NO_SOURCE_NOTE)
    if code == 0:
        failures.append("tokens with no source note exited 0 — missing-note check did not fire")
    elif "no source note" not in output.lower():
        failures.append(f"missing-note file failed (exit {code}) but not on source-note check — output: {output[:200]}")
    else:
        print("✓ token with no source note correctly fails")

    code, output = run(BAD_CSS_RAW_VALUE)
    if code == 0:
        failures.append("raw hex value outside the token block exited 0 — raw-value check did not fire")
    elif "raw value" not in output.lower():
        failures.append(f"raw-value file failed (exit {code}) but not on raw-value check — output: {output[:200]}")
    else:
        print("✓ raw value outside the token block correctly fails")

    print()
    if failures:
        print(f"✗ check_tokens.selftest FAILED — {len(failures)} case(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ check_tokens.selftest clean — G8 (all three sets) is gate-proof.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
