# Gates — coherence set, for loud vectors

Loaded at Phase 7, one gate file only, never any two of the three (`gates-precision.md` and
`gates-restraint.md` are the other two). Use this set when the intensity vector's loud axis (per
`references/intensity.md`) sits at 7 or above and the build did not declare the restraint profile at
Phase 2. A system spending on boldness is judged on whether the boldness holds together and whether
it paid what it owed — precision alone does not answer either question.

Same evidence discipline as the other sets: every answer records what produced it, and an unchecked
claim is marked **not run**, never an unbacked yes.

**Proven versus advisory**: `evals/gate-proof-tally-2026-08-10/report.md` tracks which of this
file's 14 gates have real mutation- or fixture-tested evidence that they discriminate a violation
from a pass, versus which are sound judgement with no such proof yet. Only a gate marked proven in
that tally may be the sole reason to block a build on a red result — an unproven gate's red is a
real, worth-investigating signal, never a hard stop on its own.

## G1 — Lineage identifiability

Screenshot the system, remove the wordmark, ask whether it is still identifiable as this system
rather than as a generic bold interface. Evidence: the screenshot, and one sentence on what
specifically would give it away without the name.

## G2 — Signature move present and load-bearing

The declared lineage's signature move (stated in its lineage file) is actually present in the
built system, doing real work rather than appearing once as decoration. Evidence: point to where it
appears and what it's doing there.

## G3 — Profile arithmetic holds

`scripts/check_vector.py` run against the final vector, not the vector proposed at Phase 2 — a
system's real values sometimes drift from the plan during build. Evidence: the script's output,
exit code included.

## G4 — Payment is actually spent, not just declared

For every axis at 8 or above, the two axes named as paying for it are verifiably quiet in the built
artefact, not quiet only in the stamp's stated numbers. A vector can pass `check_vector.py`'s
arithmetic while the built system fails to actually deliver the quiet axes it claimed. Evidence:
one concrete example of the paying axis actually being quiet where it mattered — a screenshot of the
calmest screen, or the flattest surface, not a description of it.

## G5 — Concentration held under real content

The loud axis stays loud when real or realistically-shaped content is dropped in, not only on the
curated example that was designed around it. A long string, a dense table row, an empty state.
Evidence: at least one of those three, rendered.

## G6 — No leakage into the quiet axes

The quiet axes paying for the loud one stay quiet everywhere, not just in the specimen. A single
component that quietly reintroduces the boldness the vector spent elsewhere breaks the payment for
the whole system, even if that one component looks fine on its own. Evidence: check at least two
components away from the specimen for the same restraint.

## G7 — Rotation against the log

`scripts/check_vector.py --log .kiln/log.json` run with the log present, confirming the vector moved
3 or more on at least two axes against the previous entry. Evidence: the script's rotation note.

## G8 — Token layer integrity

Same as the precision set's G8. Boldness is not an exemption from the token discipline —
`scripts/check_tokens.py` run against the actual token file, zero missing source notes, zero raw
values outside the token block. Evidence: the script's output, pasted in full.

## G9 — Contrast survives the treatment

Every text pairing clears 4.5:1 and every UI-boundary pairing clears 3:1, computed from the actual
resolved values, specifically checked on whatever surface carries the loud axis — a saturated
ground, a heavy display face at small sizes, a dense layout. This is the gate a loud system fails
most often, because the treatment the vector is spending on is usually also the thing that erodes
contrast. Evidence: the computed ratio on the specific loud surface, not on a safe neutral one.

## G10 — Focus visibility survives the treatment

Same requirement as the precision set's G10, checked specifically against the loudest surface the
system produces — a saturated ground or a heavily patterned one, since that is where a focus ring
most often disappears. Evidence: the computed contrast against that specific surface.

## G11 — Forced-colours floor

High-intensity systems break in forced-colours mode most often and most invisibly, because the
browser overrides exactly the values the identity depends on. Evidence: a screenshot under
forced-colours mode, with every broken cue named, not just the ones that happen to be obvious.

## G12 — Baseline distance

Same as the precision set's G12. Compared against the ban list in `references/baseline.md`, and
reported as not run if the baseline is unmeasured. A loud system triggering a ban-list entry despite
spending six axes of budget to avoid the default is worth flagging loudly, not quietly.

## G13 — Look at it

Same as the precision set's G13. Render or screenshot the artefact and look at it. A loud system is
more likely to have this step skipped in favour of trusting the token math, and that is exactly
backwards — the token math is what got it this far, and the look is what confirms it actually
arrived.

## G14 — Acceptance criteria, separately

Same as the precision set's G14. A loud system can pass every gate above, look genuinely striking,
and still fail the brief's actual problem — the two most common failure shapes are a system that is
memorable but unusable at the density the brief needed, and a system whose signature move fights the
content it was built to carry. Evidence: each criterion, met or not, with what was checked.
