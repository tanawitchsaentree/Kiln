# The restraint-profile decision — 2026-08-10

The question forced by the Dial audit: kiln's spread rule fails any system whose thesis is
disciplined quiet, indistinguishably from a system that's flat by accident. Two honest answers
existed — build a real third path, or state plainly that kiln is scoped to contrast-driven systems
and restraint-as-thesis is out of scope. This record is the decision and the proof it isn't a
loophole.

## Decision: kiln supports restraint-as-thesis, as a real third profile, not a lowered bar

Built `references/gates-restraint.md` plus a `--profile restraint` mode in
`scripts/check_vector.py` with its own arithmetic (ceiling ≤3, floor requires a literal 0, flatline
requires spread ≥2 even within the quiet band), distinct from the expressive profile's arithmetic,
not a relaxed version of it. Wired into `references/intensity.md` ("Two profiles" section),
`phases/2-vector.md` (the point where a build would actually reach for this), `phases/7-gates.md`
(routing to a third gate file), and `MANIFEST.md`.

**Why not the other answer** (declare restraint out of scope): restraint-as-thesis is a real
tradition with real precedent — Dieter Rams' own "as little design as possible," Muji, monastic
architecture, and Braun hardware itself, which is the literal reference Dial (the system this
audit is being run against) was built from. Refusing to model it would mean kiln can recognize
boldness as a decision but can only see quiet as a default, never as an argument — exactly the
blind spot the skill's own founding claim (refuse the statistical middle) would have, aimed at
everyone except the people whose actual point is quiet.

## Why this isn't just "spread, but lower"

The temptation with a request like this is to lower the spread threshold from 5 to something
smaller and call it done — that would legalize the exact flat, undeclared-default vector the
existing SPREAD rule exists to catch, just at a smaller scale. The restraint profile instead asks
for proof of discipline, three different ways:

1. **Ceiling** — nothing may exceed 3. A system with one axis at 6 isn't restrained, it's an
   expressive system with an unusually quiet loud axis, and gets routed back to the expressive
   arithmetic instead.
2. **Floor** — at least one axis must sit at literal 0. This is the mechanical proof of an actual
   refusal, not a preference. Six axes at 1-3 is "toned everything down." One axis at 0 is "refused
   this outright," which is a claim that can be checked against the real system (gates-restraint.md's
   G1/G2: is the refusal named, and does it hold everywhere with no exception).
3. **Flatline** — even within the ceiling, spread must still be ≥2. Six axes at the identical low
   value made zero decisions; restraint has to be a small number of decisions made deliberately
   inside a narrow range, not uniform grey.

## Gate-proved, all three new rules, individually

Each rule was disabled by direct code mutation, confirmed to let a real, specific violation through
that the unmutated script correctly catches, then reverted with byte-identical sha256
(`325c66540cea8b7e75415ef0b5c42a9d948a72c19909266b9529748ba81bca25` before and after every
mutation):

| Rule | Mutation | Real violation that wrongly passed when disabled |
|---|---|---|
| Ceiling | Emptied the `ceiling_breaks` list unconditionally | `0,2,1,3,1,6` (density at 6, clearly loud) |
| Floor | Hardcoded `floor = [1]` (always non-empty) | `1,3,2,1,1,2` (spread=2, passes flatline, but no axis is actually 0) |
| Flatline | Hardcoded `spread = 99` (always passes) | `0,0,0,0,0,0` (floor satisfied six times over, zero internal differentiation) |

The floor test specifically needed a second vector after the first attempt (`2,2,2,2,2,3`) turned
out to fail FLATLINE independently even with FLOOR disabled — this is a good sign, not a failure of
the test: it means the two rules are not redundant with each other, each catches a distinct failure
mode, and isolating floor required a vector engineered to pass flatline on its own first.

## What this means for Dial specifically

**Update, same day, follow-up request**: the wrinkle flagged below was the exact ambiguity a
follow-up request forced a resolution on. `intensity.md` now states explicitly that a score
measures expressive use by choice, not literal on-screen presence — under that now-explicit rule,
Dial's surface score corrects from S1 to S0, because D-008 is an absolute, narrowly-excepted rule
(checked directly: shadow appears in exactly 3 of 26 component token files, exactly the
floating-layer exception D-008 names, holding with zero unstated exceptions elsewhere), not a mere
preference toward flatness. Dial's corrected vector `C2 T1 G1 S0 M1 D3` **does pass the restraint
profile's arithmetic** — `passes ceiling, floor, and flatline`, refusing surface outright. The
finding below (originally: "Dial fails restraint too, it's undifferentiated quiet, not a proven
refusal") is superseded by this correction and left in place, unedited, as the record of what the
first pass found before the scoring rule was made explicit — see
`dial-audit-2026-08-10/report.md`'s own dated correction section for the full account, and
`floor-cost-2026-08-10/report.md` for whether this specific refusal also clears the floor rule's
separate cost requirement, which the arithmetic passing does not by itself guarantee.

---

**Original finding (2026-08-10, superseded by the update above, kept for the record):**

Dial's actual scored vector, `C2 T1 G1 S1 M1 D3`, **fails the restraint profile too** — not just
the expressive one. It has no axis at literal 0; every axis was toned down, not refused. This is an
honest, and slightly uncomfortable, finding: Dial is not currently a restraint-thesis system by
kiln's own arithmetic, it's an undifferentiated quiet one.

One live wrinkle worth flagging rather than silently fixing: Dial's own D-008 rule ("ห้ามมี
drop-shadow ตกแต่งบน card/button/input ปกติ" — decorative shadow forbidden) is an actual, absolute
refusal, not a preference — and if surface (S) had been scored at 0 instead of 1 in the original
audit to reflect that, `0,2,1,3,1,2`-shaped vectors close to Dial's real one *would* pass restraint.
This suggests the original audit's S=1 scoring was arguably one step too conservative for what
D-008 actually states. Per the standing instruction not to retroactively touch Dial or re-litigate
the frozen audit record, this is noted here as a methodology observation for any future re-scoring,
not applied backward to the existing `dial-audit-2026-08-10/report.md`, which stands as originally
written — the audit's own S=1 call is a defensible read of "the fill is mostly flat," even if
"the rule is absolute" would have argued for S=0 instead.
