# Eval results

Empty. Nothing in `evals/briefs.md` has been run. Every claim this skill makes about its own
behaviour — that lineages differ structurally, that the vector arithmetic produces range rather than
noise, that an extended system survives a clean context — is a design hypothesis until at least
tests 1, 2, and 3 from `briefs.md` have actually been executed and recorded here.

## Recording format

One entry per run, appended, oldest first:

```
### Run N — brief M ({one-line brief})
Date:
Lineage declared:
Vector declared:
Gate set used, result: (per-gate, with evidence per references/gates-precision.md or
  references/gates-coherence.md's evidence discipline — a script output, a computed value, a
  screenshot, or "not run")
Acceptance criteria result: (each criterion from the brief, met or not, with what was checked)
Pass/fail per briefs.md's stated pass condition for this test:
One sentence: would this survive a designer looking at it?
```

## Do not backfill

Do not write an entry for a run that wasn't actually executed in a clean context, even to fill this
file in and make the skill look tested. A backfilled entry is indistinguishable from a real one to
anyone reading this file later, and it would make every subsequent real finding less trustworthy by
association once discovered.
