#!/usr/bin/env python3
"""Validate a kiln intensity vector against the profile rules and the rotation log.

Deterministic. No model judgement. Exit 0 = valid, exit 1 = one or more rules failed.

Two profiles. `expressive` (default) is the loud-end arithmetic: spread, concentration, payment,
rotation. `restraint` is the quiet-end arithmetic for a system whose stated thesis is disciplined
absence, not undeclared flatness — see references/gates-restraint.md for when this profile is the
right one to declare, and references/intensity.md's "Two profiles" section for why the expressive
arithmetic cannot simply be skipped or loosened for a quiet brief.

  python3 scripts/check_vector.py --vector 3,8,2,1,2,6
  python3 scripts/check_vector.py --vector 3,8,2,1,2,6 --log .kiln/log.json
  python3 scripts/check_vector.py --vector 2,1,1,1,0,3 --profile restraint --log .kiln/log.json
"""
import argparse, json, os, sys

AXES = ["C", "T", "G", "S", "M", "D"]
NAMES = ["chroma", "type", "grid", "surface", "motion", "density"]
RESTRAINT_CEILING = 3


def parse_vector(s):
    parts = [p.strip() for p in s.replace(" ", ",").split(",") if p.strip()]
    if len(parts) != 6:
        sys.exit(f"error: need 6 values in C,T,G,S,M,D order, got {len(parts)}")
    try:
        v = [int(p) for p in parts]
    except ValueError:
        sys.exit("error: values must be whole numbers 0-10")
    if any(x < 0 or x > 10 for x in v):
        sys.exit("error: values must be between 0 and 10")
    return v


def check(v, log_path=None):
    fails, notes = [], []
    show = " ".join(f"{a}{n}" for a, n in zip(AXES, v))

    spread = max(v) - min(v)
    if spread < 5:
        fails.append(
            f"SPREAD  max-min is {spread}, needs 5 or more. "
            f"This profile is flat and has no point of view. "
            f"If the brief's actual thesis is restraint, use --profile restraint instead of "
            f"loosening this rule — see references/gates-restraint.md for its own, different "
            f"arithmetic and entry criteria."
        )

    loud = [i for i, x in enumerate(v) if x >= 7]
    if len(loud) > 2:
        fails.append(
            "CONCENT " + ", ".join(NAMES[i] for i in loud)
            + f" are all 7 or above. At most two axes may sit that high."
        )

    extreme = [i for i, x in enumerate(v) if x >= 8]
    if extreme:
        quiet = [i for i, x in enumerate(v) if x <= 2]
        if len(quiet) < 2:
            fails.append(
                "PAYMENT " + ", ".join(NAMES[i] for i in extreme)
                + f" at 8 or above needs two axes at 2 or below. Found {len(quiet)}."
            )

    if not fails:
        primary = NAMES[v.index(max(v))]
        notes.append(f"loud axis is {primary} at {max(v)}")

    if log_path and os.path.exists(log_path):
        try:
            with open(log_path) as f:
                log = json.load(f)
        except Exception as e:
            notes.append(f"log unreadable ({e}); rotation not checked")
            log = []
        if log:
            prev = log[0].get("vector")
            if isinstance(prev, list) and len(prev) == 6:
                deltas = [abs(a - b) for a, b in zip(v, prev)]
                moved = [i for i, d in enumerate(deltas) if d >= 3]
                if len(moved) < 2:
                    fails.append(
                        "ROTATE  needs 3 or more movement on at least two axes vs the last run "
                        + " ".join(f"{a}{n}" for a, n in zip(AXES, prev))
                        + f". Moved on {len(moved)}."
                    )
                else:
                    notes.append(
                        "rotation ok, moved on " + ", ".join(NAMES[i] for i in moved)
                    )
                lin = log[0].get("lineage")
                if lin:
                    notes.append(f"last lineage was {lin}; pick a different one")
    elif log_path:
        notes.append("no log found; first run for this project")

    return show, fails, notes


def check_restraint(v, log_path=None):
    """Different arithmetic from check(). A restraint profile is not 'check() but with a lower
    spread bar' — that would just legalise the flat, undeclared-default vector check() exists to
    catch. Restraint has to prove discipline, not merely quiet: a real ceiling (no axis allowed
    into the loud band at all), a real floor-tell (at least one axis genuinely refused, at 0, not
    just low), and enough internal spread that the six axes still say something about each other
    rather than all reading as one undifferentiated grey. See references/gates-restraint.md for
    the prose criteria this arithmetic backs."""
    fails, notes = [], []
    show = " ".join(f"{a}{n}" for a, n in zip(AXES, v))

    ceiling_breaks = [i for i, x in enumerate(v) if x > RESTRAINT_CEILING]
    if ceiling_breaks:
        fails.append(
            "CEILING " + ", ".join(NAMES[i] for i in ceiling_breaks)
            + f" exceed {RESTRAINT_CEILING}. A restraint profile has no loud axis at all — if "
            f"something here needs to run louder than {RESTRAINT_CEILING}, this is an expressive "
            f"profile with a very quiet loud axis, not a restraint profile. Use the default "
            f"(expressive) check instead."
        )

    floor = [i for i, x in enumerate(v) if x == 0]
    if not floor:
        fails.append(
            "FLOOR   no axis is at exactly 0. Restraint means something was genuinely refused, "
            "not merely kept low — every axis sitting at 1 or above is six axes that were toned "
            "down, not a stated absence. Name what this system refuses outright and set that "
            "axis to 0."
        )

    spread = max(v) - min(v)
    if spread < 2:
        fails.append(
            f"FLATLINE max-min is {spread}, needs 2 or more even within the quiet band. Six axes "
            f"at the same low value is uniform modesty, not a considered choice about which axis "
            f"carries what little differentiation this system has. At least one axis has to read "
            f"as more restrained than the others, deliberately."
        )

    if not fails:
        held = [NAMES[i] for i, x in enumerate(v) if x == 0]
        notes.append(f"refused outright: {', '.join(held)}")

    if log_path and os.path.exists(log_path):
        try:
            with open(log_path) as f:
                log = json.load(f)
        except Exception as e:
            notes.append(f"log unreadable ({e}); rotation not checked")
            log = []
        if log:
            prev = log[0].get("vector")
            if isinstance(prev, list) and len(prev) == 6:
                deltas = [abs(a - b) for a, b in zip(v, prev)]
                moved = [i for i, d in enumerate(deltas) if d >= 2]
                if len(moved) < 2:
                    fails.append(
                        "ROTATE  needs 2 or more movement (restraint's smaller band lowers this "
                        "bar from expressive's 3) on at least two axes vs the last run "
                        + " ".join(f"{a}{n}" for a, n in zip(AXES, prev))
                        + f". Moved on {len(moved)}."
                    )
                else:
                    notes.append(
                        "rotation ok, moved on " + ", ".join(NAMES[i] for i in moved)
                    )
                lin = log[0].get("lineage")
                if lin:
                    notes.append(f"last lineage was {lin}; pick a different one")
    elif log_path:
        notes.append("no log found; first run for this project")

    return show, fails, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vector", required=True, help="C,T,G,S,M,D e.g. 3,8,2,1,2,6")
    ap.add_argument("--log", default=".kiln/log.json")
    ap.add_argument("--profile", choices=["expressive", "restraint"], default="expressive",
                     help="expressive (default): spread/concentration/payment/rotation. "
                          "restraint: ceiling/floor/flatline/rotation — see "
                          "references/gates-restraint.md before choosing this.")
    a = ap.parse_args()

    checker = check_restraint if a.profile == "restraint" else check
    show, fails, notes = checker(parse_vector(a.vector), a.log)
    print(f"vector  {show}  [{a.profile}]")
    for n in notes:
        print(f"note    {n}")
    if fails:
        for f in fails:
            print(f"FAIL    {f}")
        print("\nfix the vector and run again. do not proceed on a failing profile.")
        sys.exit(1)
    if a.profile == "restraint":
        print("passes ceiling, floor, flatline, rotation.")
    else:
        print("passes spread, concentration, payment, rotation.")
    sys.exit(0)


if __name__ == "__main__":
    main()
