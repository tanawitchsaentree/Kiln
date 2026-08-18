# Verb — audit

`kiln audit <target>`. Score an existing system. A ranked punch list, no edits. This verb never
writes to the target — its entire value is an independent read, and making edits during the same
pass would mean the audit's own findings influenced what it's judging.

## Load

Read the target's actual tokens, components, and any documentation before doing anything else — a
system's stated intentions and its real code drift from each other constantly, and only the code
tells the truth about what ships.

Infer the lineage and vector from what's actually there, the same inference `AGENT-ORDER.md`'s
Task 1 describes for adopting a system, not from what the target's own documentation claims if the
two disagree. Where the target states a derivation explicitly and the code matches it, use that and
say so.

Load the gate set matching the inferred vector's loud axis — `references/gates-precision.md` below
7, `references/gates-coherence.md` at 7 or above — and run it against the target as it exists, not
against a hypothetical corrected version.

## Run

Score every gate with evidence, per the same discipline as Phase 7: a computed value, a screenshot,
a file actually opened, or the answer is not run. Run `scripts/check_tokens.py` against the target's
actual token file for Gate G8 (or the equivalent numbered gate — confirm the number against
whichever gate file is loaded). Run `scripts/check_vector.py` against the inferred vector to confirm
it's a legal profile in the first place; an existing system built before this skill's arithmetic
existed may genuinely fail spread or concentration, and that's a real finding, not a scoring error.

Check the nine contract parts from `references/contract.md` against what actually exists — most
real audits find several parts thin or missing (no stated break clause, no extension protocol
anyone could follow) rather than failing outright, and thin-but-present is worth distinguishing from
absent in the punch list.

## Output

A ranked list, most consequential finding first. Each finding states what was checked, what was
found, and what fixing it would require — not a fix itself, since this verb doesn't edit. Rank by
what a user of the system would actually hit, not by what's easiest to name.

Separate craft findings (gate failures) from contract findings (missing or thin parts of the nine)
from brief findings (if the original brief or its equivalent is known, whether the system still
serves it) — three different kinds of gap, and conflating them in one flat list makes the punch list
harder to act on.

## Escalating a finding

A finding whose real fix is a visual or form decision with more than one defensible answer —
not a mechanical correctness bug with exactly one right value — names `foundry run
<component-class> --k N` (the bundled `variant-foundry` sub-skill) as its next step, rather than
this verb prescribing a single fix itself. That still honours "no edits": the punch list states
what's wrong and what kind of work fixing it needs, never which fix to apply. A finding with
exactly one correct fix (a token that doesn't resolve, a missing alt attribute) doesn't need this —
name that fix directly as what fixing it would require, per `## Output` above.
