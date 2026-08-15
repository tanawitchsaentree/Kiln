# Phase 7 — Gates

Reset before this phase, per `phases/6-expand.md`'s carry-forward list. One gate set, never both.
Render and look at it. Run the brief's own criteria separately from the craft gates.

## Which set

Three sets exist; load exactly one, never two.

If Phase 2 declared a **restraint** profile (per `references/intensity.md`'s "Two profiles"
section — this is the exception, not the default, and Phase 2 would have said so explicitly and
run `check_vector.py --profile restraint`), load `references/gates-restraint.md`.

Otherwise, check the vector's loud axis under the ordinary expressive profile. Below 7, or no axis
reaching 6: load `references/gates-precision.md`. At 7 or above: load `references/gates-coherence.md`.

Never open two of the three files — each scores a different kind of system and a build only needs
the one that matches what it's actually spending on (or, for restraint, what it's actually
refusing).

## Never before now

Gate files inform fixes, not generation. If a gate file was read earlier in this build to shape a
decision in advance, that decision was made to satisfy a gate rather than to solve the brief, and
the two are not the same thing. This phase exists precisely because scoring happens after building,
against what was actually built.

## Evidence discipline

Every gate answer records what produced it: a script's exit code, a computed contrast ratio, a
screenshot, a file actually opened. A gate answered from confidence, with nothing to point at, gets
marked **not run** rather than a guessed pass — per `ORDER.md`'s non-negotiables, not run is a
usable and honest result, while an unbacked yes stops anyone from ever checking again.

## Run the technique file's gate-time craft check too

`references/technique/craft.md` loads here regardless of which gate set applies — it covers the
finishing details (nested radius, optical centring, border weight derivation) that Gate G2 in both
sets checks for.

## Run the acceptance criteria as their own pass

Gate 14 in both sets is the brief's own criteria from Phase 4, run separately from the thirteen craft
gates before it. A system passing every craft gate and failing this one has built something
well-made and wrong — report both results, not just the craft score, and don't let a strong craft
score stand in for this pass.

## On a failure

A failed gate gets fixed, then re-run — this is the one legitimate reason to read a gate file more
than once in a build. Do not silently patch around a failure and move on without re-running the gate
that caught it; the gate exists to be satisfied, not glanced at.

## What to carry forward

The gate results (per-gate, with evidence), the acceptance-criteria results, and anything marked not
run with a stated reason. Phase 8 needs this to write an honest stamp and an honest report back.
