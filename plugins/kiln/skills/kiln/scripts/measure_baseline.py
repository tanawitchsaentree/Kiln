#!/usr/bin/env python3
"""Generate the baseline measurement briefs and tally the results.

The ban list in references/baseline.md must be measured, not inherited. This script removes the
excuse by generating the briefs, giving a recording template, and doing the counting.

  python3 scripts/measure_baseline.py briefs          print the 8 briefs, one per clean context
  python3 scripts/measure_baseline.py template        print a blank recording file
  python3 scripts/measure_baseline.py tally runs.json print the ban and watch lists
"""
import json, sys, collections

BRIEFS = [
    "Design a system for a banking app used by freelancers.",
    "Design a system for an electronic music label.",
    "Design a system for a physiotherapy clinic booking flow.",
    "Design a system for a vegetable seed marketplace.",
    "Design a system for an industrial sensor monitoring dashboard.",
    "Design a system for a municipal permit portal.",
    "Design a system for an independent bookshop.",
    "Design a system for a youth sports league.",
]

FIELDS = [
    "type_stack", "scale_ratio", "base_unit", "primary_hue", "primary_lightness",
    "neutral_ramp_steps", "radius", "elevation_levels", "container_width",
    "first_four_components", "token_naming",
]


def briefs():
    print("Run each in a CLEAN context. No skill loaded, no reference, no follow-up.")
    print("A single prior turn about design contaminates the result.\n")
    for i, b in enumerate(BRIEFS, 1):
        print(f"{i}. {b}")
    print("\nRecord each run with: measure_baseline.py template")


def template():
    blank = {"model": "", "date": "", "runs": [
        {"brief": b, **{f: "" for f in FIELDS}} for b in BRIEFS
    ]}
    print(json.dumps(blank, indent=2))


def tally(path):
    data = json.load(open(path))
    runs = data.get("runs", [])
    n = len(runs)
    if n == 0:
        sys.exit("no runs recorded")

    print(f"baseline tally · model {data.get('model','?')} · {n} runs\n")
    ban, watch = [], []
    for f in FIELDS:
        counts = collections.Counter(
            str(r.get(f, "")).strip().lower() for r in runs if str(r.get(f, "")).strip()
        )
        for value, c in counts.most_common():
            row = (f, value, c)
            if c >= 6:
                ban.append(row)
            elif c >= 4:
                watch.append(row)

    def show(title, rows):
        print(f"## {title}")
        if not rows:
            print("(none)\n")
            return
        print("| Field | Value | Freq |")
        print("|---|---|---|")
        for f, v, c in sorted(rows, key=lambda r: -r[2]):
            print(f"| {f} | {v} | {c}/{n} |")
        print()

    show("Ban list — appeared in 6 or more", ban)
    show("Watch list — appeared in 4 or 5", watch)
    print("Paste the ban table into references/baseline.md and delete the predictions section.")
    print("Gate G12 uses the four highest-frequency entries.")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "briefs"
    if cmd == "briefs":
        briefs()
    elif cmd == "template":
        template()
    elif cmd == "tally":
        tally(sys.argv[2])
    else:
        sys.exit(__doc__)
