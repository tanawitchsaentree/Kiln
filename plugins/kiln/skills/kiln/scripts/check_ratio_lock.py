#!/usr/bin/env python3
"""Gate G13's scripted pass, ratio-lock half (precision/coherence/restraint sets share this
wording verbatim — see references/technique/craft.md's "Locked ratio, not a per-instance guess").

A container built to hold a smaller mark at a fixed proportion (an icon inside a badge, a step
number inside a circle) must lock that proportion as one ratio and reuse it everywhere the pattern
recurs. This script checks a list of measured outer:inner size pairs — one pair per real instance of
what is supposed to be "the same" pattern — for a shared ratio, within a small tolerance. It does
not check scale purity (that's check_ratio.py's G1, a single scale's own step-to-step ratio); this
checks that independently-placed instances of one repeated pattern agree with each other.

  python3 scripts/check_ratio_lock.py "44:20,36:16,48:20"

Real motivating case (the arg above): three Dial components each built their own icon-in-container
pattern independently — features.tsx (44px box / 20px icon = 2.2), security.tsx (36px / 16px =
2.25), how-it-works.tsx (48px / 20px = 2.4) — three different ratios for what reads, in the shipped
build, as one pattern.
"""
import sys
from collections import Counter

TOLERANCE = 0.03  # looser than check_ratio.py's scale tolerance: these are independently
                   # hand-set px values across components, not steps generated from one formula


def check(pairs):
    ratios = []
    for outer, inner in pairs:
        if inner <= 0:
            return False, [], None, f"inner size {inner} must be > 0"
        ratios.append(outer / inner)

    if len(pairs) < 2:
        return True, ratios, ratios[0], None

    # Group ratios into clusters within TOLERANCE of each other; the largest cluster is the
    # "locked" ratio everyone should be matching, everything outside it is a mismatch.
    clusters = []
    for i, r in enumerate(ratios):
        placed = False
        for cluster in clusters:
            if abs(r - cluster[0][1]) <= TOLERANCE:
                cluster.append((i, r))
                placed = True
                break
        if not placed:
            clusters.append([(i, r)])
    clusters.sort(key=len, reverse=True)
    locked_ratio = sum(r for _, r in clusters[0]) / len(clusters[0])

    outliers = [
        (i, r) for cluster in clusters[1:] for (i, r) in cluster
    ]

    if outliers:
        return False, ratios, locked_ratio, outliers
    return True, ratios, locked_ratio, None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    try:
        pairs = []
        for item in sys.argv[1].split(","):
            outer, inner = item.split(":")
            pairs.append((float(outer), float(inner)))
    except ValueError:
        sys.exit("error: expected comma-separated outer:inner pairs, e.g. \"44:20,36:16\"")

    ok, ratios, locked_ratio, detail = check(pairs)

    if ratios:
        for i, ((outer, inner), r) in enumerate(zip(pairs, ratios)):
            print(f"  instance {i}: {outer:g}:{inner:g} -> ratio {r:.4f}")

    if not ok:
        if isinstance(detail, str):
            print(f"FAIL  {detail}")
        else:
            print(f"\nFAIL  locked ratio is {locked_ratio:.4f} (majority of {len(pairs)} instances) "
                  f"— {len(detail)} instance(s) don't match it:")
            for i, r in detail:
                outer, inner = pairs[i]
                expected_inner = outer / locked_ratio
                print(f"    instance {i}: {outer:g}:{inner:g} -> ratio {r:.4f}, expected ~{locked_ratio:.4f} "
                      f"(inner should be ~{expected_inner:.1f}, not {inner:g})")
            print("\nA repeated container:mark pattern with more than one ratio is per-instance guesses, "
                  "not one locked decision — pick one ratio, alias it as a token, apply it everywhere.")
        sys.exit(1)

    print(f"\nG13 ratio-lock passes — {len(pairs)} instance(s) agree on ratio {locked_ratio:.4f}.")
    sys.exit(0)


if __name__ == "__main__":
    main()
