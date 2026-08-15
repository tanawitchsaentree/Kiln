#!/usr/bin/env python3
"""Gate G1, automated (precision/coherence/restraint sets share this gate's wording verbatim).

Every type size / spacing step / radius scale must trace to a stated ratio applied N times, not
to values that happened to look right. This script checks a plain list of numbers for a constant
step-to-step ratio, within a small floating-point tolerance — deterministic, no model judgement.

  python3 scripts/check_ratio.py 11,13.75,17.19,21.48,26.85
"""
import sys

TOLERANCE = 0.01  # allow rounding noise from real px/rem values, not a loose pass


def check(values):
    if len(values) < 3:
        return True, None, "fewer than 3 values — no ratio to check"
    ratios = [values[i + 1] / values[i] for i in range(len(values) - 1)]
    first = ratios[0]
    for i, r in enumerate(ratios):
        if abs(r - first) > TOLERANCE:
            return False, ratios, f"step {i}->{i+1} ratio is {r:.4f}, expected {first:.4f} (constant)"
    return True, ratios, None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    try:
        values = [float(x) for x in sys.argv[1].split(",")]
    except ValueError:
        sys.exit("error: values must be a comma-separated list of numbers")

    ok, ratios, reason = check(values)
    if ratios:
        print("step ratios: " + ", ".join(f"{r:.4f}" for r in ratios))
    if not ok:
        print(f"FAIL  {reason}")
        print("\nA scale with no constant ratio is values that happened to look right, not a stated scale.")
        sys.exit(1)
    print(f"G1 passes — constant ratio {ratios[0]:.4f} across {len(ratios)} steps." if ratios else f"G1 passes — {reason}")
    sys.exit(0)


if __name__ == "__main__":
    main()
