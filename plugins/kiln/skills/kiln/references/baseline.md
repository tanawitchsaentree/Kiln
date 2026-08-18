# Baseline — measuring this model's own defaults

Gate G12, in both gate sets, checks a system against the ban list below. Measured 2026-08-18
against `claude-sonnet-5` (`eu.anthropic.claude-sonnet-5`), 8 runs, per the protocol below — see
"Measurement notes" for this run's sample size and the one manual step in an otherwise scripted
tally. Do not fill the list from a published anti-slop list. Those describe someone else's briefs
against someone else's model version; this file exists so the ban list measures the model actually
generating these systems, not a folklore list inherited from elsewhere.

## Why measure rather than assert

`ORDER.md` and `AGENT-ORDER.md` both name specific defaults to refuse — a warm off-white field with
a high-contrast serif and a clay accent, a near-black field with one saturated accent, a neutral
grotesque as the only face, 8px/1.25/blue-600, a nine-step neutral ramp, three shadow levels, radius
6–10. Those are informed predictions, useful as a starting caution, but they are not this file's
measured list, and they should not be copied into the table below as if they were. The table below
gets filled only by running the protocol.

## The protocol

```
python3 scripts/measure_baseline.py briefs      print the 8 briefs, one per clean context
python3 scripts/measure_baseline.py template    print a blank recording file
python3 scripts/measure_baseline.py tally runs.json    print the ban and watch lists
```

Run each of the eight briefs in a genuinely clean context: no skill loaded, no reference attached,
no follow-up turn. A single prior turn about design in the same context contaminates the run,
because it gives the model something to react to rather than a true unsteered default.

Record each run's output against the fields the template lists: `type_stack`, `scale_ratio`,
`base_unit`, `primary_hue`, `primary_lightness`, `neutral_ramp_steps`, `radius`,
`elevation_levels`, `container_width`, `first_four_components`, `token_naming`.

Tally with the script. A value appearing in 6 or more of the 8 runs goes on the **ban list** — a
system built by this skill declaring that value without an explicit reason is presumed to have
drifted rather than chosen. A value appearing in 4 or 5 runs goes on the **watch list** — worth a
second look at Phase 2, not an automatic fail.

Paste the resulting tables here and delete this section's placeholder note once done. One session,
in a project with no other kiln activity contaminating the log, and the result is permanent until
the underlying model changes enough to warrant re-measuring.

## Ban list — appeared in 6 or more of 8 runs

| Field | Value | Frequency |
|---|---|---|
| Token naming | Three-tier — primitive → semantic → component, components never read primitives directly | 8/8 |
| Spacing base unit | 4px | 7/8 |
| First components | A generic Button named in the first 3-4 components built | 6/8 |

## Watch list — appeared in 4 or 5 of 8 runs

| Field | Value | Frequency |
|---|---|---|
| Type scale ratio | 1.25 | 4/8 |
| Primary hue | Blue-family (~200-260°) | 4/8 |
| Primary lightness | Mid (45-50%) | 4/8 |
| Primary lightness | Low (26-33%) — the other half of an even bimodal split, not a second default | 4/8 |
| Neutral ramp steps | 11 | 4/8 |
| Corner radius | Multiple size tiers plus a separate full/pill radius token | 4/8 |

## Measurement notes

Sample size is 8 — one run per brief, per the protocol as written. That is a small enough n that a
6/8 or 7/8 result is a real, above-chance signal but not a precise probability; treat the ban list
as "keep an eye on this," not as a claim that a 9th run is guaranteed to repeat it.

Six of the eleven fields (`scale_ratio`, `base_unit`, `neutral_ramp_steps`, `container_width`,
`elevation_levels`, and the numeric half of `primary_hue`/`primary_lightness`) tally on the number
each run stated outright. The other five (`type_stack`, `radius`, `first_four_components`,
`token_naming`, and the categorical half of `primary_hue`/`primary_lightness`) are free text by
construction — two runs both choosing a serif display face and a humanist sans body face still fail
an exact-string tally if one calls it "Fraunces + Public Sans" and the other "a literary serif
paired with a humanist grotesque." Those five were bucketed by hand into the smallest number of
categories that kept genuinely different answers apart (e.g. "single sans + mono" stayed separate
from "serif display + sans body + mono") before tallying, and that bucketing step — not the
counting — is the one place this measurement depends on judgment rather than string equality. The
raw 8 responses this run bucketed are not committed to this repo; re-running the protocol is the
correct way to check this table rather than trusting the categorization.

## How G12 uses this

A value on the ban list, present in a system with no stated reason, is a finding: name it and ask
whether it's deliberate (state the reason, and the token's source note should already carry it per
`references/intensity.md` and `references/foundations/tokens.md`) or drift (fix it before shipping).
A value on the watch list is worth a mention, not a blocker.

## Re-measuring

The list is a measurement of a specific model at a specific time, not a permanent fact about
defaults. When the underlying model changes materially, re-run the protocol rather than patching
individual entries by hand — a hand-patched ban list mixes measurements from different models and
none of the frequencies mean anything anymore.
