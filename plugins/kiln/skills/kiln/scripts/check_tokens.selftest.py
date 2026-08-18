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

# DTCG JSON — leaf-level $description, no group inheritance in play.
GOOD_JSON_LEAF = """{
  "color": {
    "brand": { "$value": "#9c3200", "$description": "D-006 accent, orange ramp" }
  }
}
"""

# DTCG JSON — no leaf-level $description, but the group above it carries one that should be
# read as inherited (check_json's own walk() logic, the thing a CSS-only fixture can't exercise).
GOOD_JSON_INHERITED = """{
  "color": {
    "$description": "D-006 accent ramp",
    "brand": { "$value": "#9c3200" }
  }
}
"""

# DTCG JSON — no leaf description, no group description, no file-level $description: nothing to
# inherit from, so this leaf must be reported missing.
BAD_JSON_NO_SOURCE_NOTE = """{
  "color": {
    "brand": { "$value": "#9c3200" }
  }
}
"""


def run(content, suffix=".css"):
    with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False) as f:
        f.write(content)
        path = f.name
    try:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), path], capture_output=True, text=True
        )
        return result.returncode, result.stdout + result.stderr
    finally:
        Path(path).unlink()


def run_json(content):
    return run(content, suffix=".json")


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

    # JSON path (check_json) — a real gap until now: every case above only ever exercised
    # check_css. DTCG JSON has no CSS equivalent of "raw value outside the token block" (every
    # value in a DTCG file lives inside a $value by construction), so there is no fourth case
    # mirroring BAD_CSS_RAW_VALUE — the JSON coverage is leaf-description, group-inherited-
    # description, and missing-description, which is check_json's own real branch structure.
    code, output = run_json(GOOD_JSON_LEAF)
    if code != 0:
        failures.append(f"JSON with a leaf $description exited {code}, expected 0 — output: {output[:300]}")
    else:
        print("✓ JSON token with its own leaf $description correctly passes")

    code, output = run_json(GOOD_JSON_INHERITED)
    if code != 0:
        failures.append(f"JSON with only a group $description exited {code}, expected 0 — output: {output[:300]}")
    elif "inherited from a group" not in output.lower():
        failures.append(f"JSON group-inheritance case passed but didn't report as inherited — output: {output[:300]}")
    else:
        print("✓ JSON token inheriting its group's $description correctly passes and is reported as inherited")

    code, output = run_json(BAD_JSON_NO_SOURCE_NOTE)
    if code == 0:
        failures.append("JSON token with no leaf or group $description exited 0 — missing-note check did not fire for JSON")
    elif "no source note" not in output.lower():
        failures.append(f"JSON missing-note file failed (exit {code}) but not on source-note check — output: {output[:200]}")
    else:
        print("✓ JSON token with no description anywhere in its chain correctly fails")

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
