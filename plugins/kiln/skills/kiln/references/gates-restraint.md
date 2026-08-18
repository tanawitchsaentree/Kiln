# Gates — restraint set, for systems whose thesis is disciplined quiet

A third profile, alongside `gates-precision.md` (quiet vectors under the expressive arithmetic) and
`gates-coherence.md` (loud vectors). This set exists for a narrower and different case than either:
a system whose entire point is that it says less, on purpose, everywhere — not a quiet system that
happens to have no loud axis, but a system whose actual thesis is the discipline of refusal itself.

**Kiln does support this case.** The alternative — telling a user that "your thesis is silence" is
out of scope — would have been a real answer too, and was seriously considered before writing this
file. The reason it wasn't taken: restraint-as-thesis is not a hedge or an escape hatch from having
a point of view, it is itself a point of view, with real traditions behind it (monastic architecture,
Muji, Dieter Rams' own "as little design as possible," Braun's own hardware — the reference this
project's own sibling system, Dial, was built from). Refusing to model it would mean the skill can
only recognize boldness as a decision and quiet as a default, which is exactly the trap the
expressive arithmetic's spread rule was built to catch everyone else in. A skill that catches every
accidentally-flat system except the ones that are flat on purpose has a blind spot shaped like its
own founding claim.

## The test that decides which gate set applies

Not "is the vector quiet." A quiet vector under `gates-precision.md` and a restraint vector under
this file can look numerically similar and mean completely different things. The actual test:

**Does the system's own stated brief name restraint as the thesis, or does it merely lack a loud
axis?** A monitoring dashboard with no loud axis is quiet because nothing in its brief called for
volume — that's `gates-precision.md`'s case, ordinary competence, no claim being made about the
absence itself. A system whose brief is "as little as possible, on purpose, and here is what we
refuse and why" is making restraint the actual argument. If nobody can name what the system refuses
and why in one sentence, it doesn't belong in this file — go back to `gates-precision.md` and treat
the quiet as the natural outcome of a non-loud brief, not as a thesis being defended.

**Proven versus advisory**: `evals/gate-proof-tally-2026-08-10/report.md` tracks which of this
file's 14 gates have real mutation- or fixture-tested evidence versus which are sound judgement
with no such proof yet — as of that report, this set's arithmetic gate (G3) is fully proven (three
separate mutations: ceiling, floor, flatline), and G1/G2's cost criteria have been applied to one
real case (Dial) but not yet proven with a constructed fixture pair. Only a proven gate may be the
sole reason to block a build on a red result; every other gate here is a real signal worth
investigating, not a hard stop on its own.

## Entry criteria — arithmetic, not vibes

`scripts/check_vector.py --vector C,T,G,S,M,D --profile restraint` enforces this. Different rules
from the expressive profile — restraint has to be *proven*, not merely permitted by a lowered bar:

**Ceiling.** No axis may exceed 3. If anything in the system genuinely needs to run louder than
that, this isn't a restraint profile — it's an expressive profile with an unusually quiet loud axis,
and the expressive arithmetic (spread ≥5, at most two axes ≥7, payment for anything ≥8) is the
correct one to run instead. A restraint profile does not get to have one axis at 6 because "that one
thing needed it" — that is exactly the expressive case wearing restraint's name to dodge the payment
rule.

**Floor.** At least one axis must sit at exactly 0. This is the arithmetic proof of an actual
refusal, not a preference. "Kept it fairly quiet" is six axes at 1-3. "Refused outright" is one axis
at literal 0, with a named reason. If no axis can honestly go to 0, the system hasn't refused
anything — it's toned everything down, which is still a real design choice, but it's the quiet end
of the expressive spectrum, not restraint-as-thesis.

**The floor's loophole, and why it's closed here rather than left implicit.** A 0 on an axis the
system's own medium never wanted in the first place is free, not a refusal — a pharmaceutical label
scoring M0 has refused nothing, because a label was never going to move; there was no pull toward
motion to resist. The floor rule as arithmetic alone cannot tell a free 0 from a costly one, and a
system could pass FLOOR by zeroing out whichever axis happened to be cheapest to zero, which would
make the whole profile decorative — restraint would mean nothing more than picking your easiest
axis and calling the omission a philosophy.

**A 0 counts as a genuine floor entry only if it meets both of these, checked as prose, not
arithmetic:**

1. **The medium actually pulls toward that axis.** State, in one sentence, what mainstream
   convention or the system's own closest comparable component would normally do on this axis, and
   confirm that convention is a real pull, not a strawman. "Cards commonly use a hover-lift shadow
   for depth, industry-wide, including in systems this one is otherwise similar to" is a real pull.
   "Systems sometimes use extreme grid asymmetry" said about a system with no grid-heavy component
   in the first place is not — there was nothing pulling toward it to refuse.
2. **The refusal is checkable against real temptation points, not just a rule's text.** Count the
   actual places in the system where the pull from criterion 1 could have been given in and wasn't,
   and confirm the refusal held at each one, not only in the abstract. A system with one card
   component and no other place shadow could plausibly have crept in has one temptation point,
   checked once. A system with twenty places shadow could plausibly have crept in and a rule saying
   it never does needs the refusal checked across a real sample of those twenty, not asserted from
   the rule's existence alone.

A 0 that fails either check is downgraded before the profile is declared: either find a genuine
axis the medium did pull toward and score the floor there instead, or accept that this system,
for now, is the quiet end of the expressive spectrum (`gates-precision.md`) rather than a proven
restraint thesis. Gate G1 and G2 below are where this gets checked formally, but the check belongs
here too, because a build that never verifies cost before setting the vector will pass FLOOR on an
empty refusal and only discover the gap at Phase 7, after everything downstream has already
assumed the restraint framing was earned.

**Flatline.** `max − min` across the remaining axes must still be 2 or more even within the quiet
band. Six axes sitting at exactly the same low value is uniform modesty, not a considered decision
about which axis carries what little differentiation the system allows itself. Restraint is not the
absence of decisions — it's a small number of decisions, made deliberately, inside a narrow range.
A vector of `2,2,2,2,2,2` has made zero decisions. A vector of `0,2,1,3,1,2` has made several, all
of them quiet.

**Rotation**, checked the same way as the expressive profile but against a smaller bar (2, not 3,
since the whole available range within the ceiling is narrower) — two consecutive restraint systems
in the same project still need to differ, or "restraint" becomes a way to always build the same thing
and call it a philosophy.

## What this does not license

This is not a way to skip having a lineage or a vector. A restraint-thesis system still declares
both, still runs Phase 1 and Phase 2, still gets a stamp. The lineage still matters — several
lineages (see `references/foundations/depth.md`'s space-led group: `01-transit-signage`,
`02-botanical-plate`, `17-title-card`) already lean toward restraint as part of their native
character, and their home vectors are a legitimate starting point for a restraint build, the same
way any lineage's home vector is a starting point under the expressive profile.

This is also not a way to avoid naming a signature move. A restraint system's signature move is
usually the refusal itself, stated specifically: not "we kept it simple" but "we refuse X because Y,
and every screen holds that line without exception." The exception-free part is the load-bearing
claim — a restraint system that occasionally breaks its own restraint for convenience has
demonstrated that the restraint was never really the thesis.

## Gates — 14, mirroring the other two sets' shape but asking a different question

Every gate below still needs evidence per `phases/7-gates.md`'s "Evidence discipline" section —
read that first if you loaded this file directly rather than arriving at it through Phase 7.

### G1 — The refusal is named, specific, and costly

The axis sitting at 0 has a stated reason, one sentence, naming what would have been added and why
it wasn't. "We kept colour minimal" is not this. "Colour is refused entirely outside the one control
a user's finger actually touches, because a system where colour could mean anything means nothing"
is this. This gate also re-checks the floor's own cost criteria from the entry section above — the
reason has to name a real pull the medium had toward this axis, not a strawman. A stated reason for
a 0 the medium was never going to reach for anyway passes this gate's letter while failing its
point; check for that specifically, not just for whether a sentence exists. Evidence: the sentence,
plus the named pull it's refusing, checked against the actual system for whether it's held
everywhere or broken somewhere.

### G2 — The refusal holds without exception

Grep or read every component/screen the system has for a violation of the stated refusal. One
exception, anywhere, un-flagged, and the refusal was never real — it was a preference that happened
to hold most of the time. A stated, deliberate, narrowly-scoped exception (with its own reason) is
different from an unnoticed one; the gate is checking for the second kind.

### G3 — Profile arithmetic holds

`scripts/check_vector.py --profile restraint` run against the final vector. Evidence: exit code and
full output.

### G4 — The quiet axes are still distinguishable from each other

Within the ceiling, the axes that differ (per the flatline rule) actually read as different in the
built artefact, not just on paper. If chroma sits at 0 and type sits at 3, does the system actually
show more typographic decision-making than colour decision-making when you look at it? Evidence: a
concrete comparison, not just the stated numbers.

### G5 — Density is not smuggling in what the other axes refused

Density is exempt from most restraint framing (per `intensity.md`'s own note that D is a content
axis, not a voice axis) — but check specifically that a "quiet" system isn't using density as a
back door for the volume the other axes gave up. A restrained system that's also extremely dense
everywhere has moved the loudness into the one axis nobody was watching.

### G6 — Hierarchy without the tools that would break the ceiling

If nothing may exceed 3 on type, colour, or surface, hierarchy has to come from position, order, or
enclosure — see the space-led lineages' own hierarchy logic. Confirm the system actually has a real
hierarchy device and hasn't just gone flat everywhere because volume was capped. Restraint is not
absence of hierarchy; it's hierarchy achieved without volume.

### G7 — Contrast, computed not eyeballed

Same requirement as both other sets: 4.5:1 text, 3:1 UI boundary, computed from real resolved
values. A restrained palette is not exempt from being legible — if anything it has less colour
budget to spend fixing a contrast problem after the fact, so this gate matters more here, not less.

### G8 — Token layer integrity

Same as both other sets. `scripts/check_tokens.py` run against the actual token file.

### G9 — Reduced motion

Same requirement as both other sets — motion sitting at or under 3 does not exempt the system from
`prefers-reduced-motion` if anything animates at all.

### G10 — Focus visibility on every surface

Same requirement as both other sets. A restrained palette with few colours has fewer places to hide
a weak focus ring, which makes this gate easier to satisfy correctly, not harder — check it anyway.

### G11 — Forced-colours mode

Same requirement as both other sets.

### G12 — Baseline distance

Same requirement, same caveat as both other sets: reports not run until `references/baseline.md`'s
ban list is measured. Worth naming specifically here: a restraint-thesis system is at real risk of
landing exactly on the measured baseline by coincidence, since "quiet" and "default" can look
identical from the outside even when one is argued and the other is accidental — this is precisely
why G1 and G2 above (the named, held refusal) matter more for this set than for either other one.

### G13 — Look at it

Same requirement as both other sets. Render or screenshot and look. Ask specifically: does this
look like a decision, or does it look like nothing happened?

### G14 — Acceptance criteria, separately

Same requirement as both other sets: the brief's own criteria, run as their own pass. For a
restraint-thesis brief, at least one criterion should test the refusal itself — "a user can tell
that colour was withheld on purpose, not simply forgotten" is a real, checkable criterion; most
restraint briefs that fail this gate fail it because nobody wrote a criterion that could tell the
difference between "disciplined" and "unfinished."
