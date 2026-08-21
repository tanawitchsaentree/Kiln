# Phase 2 — Vector

Six axes, set from the lineage's home vector and pulled toward the brief, validated by script, not
by judgement.

## Starting position

Begin from the lineage's stated home vector. Pull it toward the brief's specific needs — a brief
that's denser than the lineage's home position, or that needs a different axis to carry the loud
role than the lineage's native one — using the lineage's own "behaviour pulled off home" section to
know what survives that pull and what breaks first.

## Validate

```
python3 scripts/check_vector.py --vector C,T,G,S,M,D --log .kiln/log.json
```

Read `references/intensity.md` if any rule's reasoning isn't already clear from the script's own
failure messages — the file explains the arithmetic in prose and gives worked examples of vectors
that pass and fail, which is more useful at this phase than at any other.

Fix and re-run until it exits 0. Do not proceed on a failing profile, and do not adjust a value by
eye and assume it now passes — run the script again after every change.

**If the vector keeps failing SPREAD and the honest reason is that the brief's actual thesis is
restraint** (not just "nothing here needed to be loud"), don't loosen this check — read
`references/intensity.md`'s "Two profiles" section and, only if the brief genuinely passes that
file's entry test, switch to `python3 scripts/check_vector.py --vector C,T,G,S,M,D --profile
restraint`. State explicitly in the reply that this build declared the restraint profile and why —
this is a real, distinct decision, not a default fallback for a failing vector.

## Name the loud axis and what paid for it

Once the vector passes, state which axis is loudest and what two quiet axes are covering its
payment (if it's at 8 or above — per the arithmetic, only extreme axes require this). This sentence
goes directly into the stamp at Phase 8. A vector with no named loud axis is six numbers nobody has
taken a position on.

## Under a fixed brand

If Phase 1 flagged a brand constraint, some axes are given rather than chosen — usually chroma, and
often type. Mark them with an asterisk per `references/constraint.md`'s stamp format, and set the
remaining axes so the whole vector still passes the arithmetic, since the payment rule applies to
the given axes too: a brand mandating high chroma has already spent that payment, and grid, surface,
and motion have to go quiet enough to cover it whether or not that was the plan.

## What to carry forward

Call `python3 scripts/kiln_state.py advance --data '{"vector": [C,T,G,S,M,D], "loud_axis": "...",
"loud_axis_payment": "..."}'` — this is the transition that decides, from `has_reference` recorded
at Phase 0, whether the state machine sends you to Phase 3 or straight to Phase 4; you don't choose
that here, the harness does, from data you already gave it.

The validated vector, the named loud axis and its payment, and — only if the loud axis is 7 or
above — which technique file(s) it will need. Do not load the technique file yet; just note which
one applies. `phases/6-expand.md` loads it before building the expanded component.
