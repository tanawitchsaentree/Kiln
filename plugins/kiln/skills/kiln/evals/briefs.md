# Test briefs

The skill has to be run before any claim in it is a result rather than a hypothesis. These are the
runs that matter, in the order they are worth doing.

Each runs in a clean context. Record the outcome in `evals/results.md`.

## 1. Repeatability

Same brief, two clean runs.

> Design a system for a regional credit union.

Pass: the two vectors differ by 3 or more on at least two axes, and the lineages differ.
Fail cause, most likely: the log is not being read at Phase 1 and 2. Fix in the phase files, not in
`intensity.md`.

## 2. Separation

Four briefs from different domains, run in sequence in one project so the log accumulates.

> A booking flow for a physiotherapy clinic.
> A label site for an electronic music imprint.
> A monitoring dashboard for cold-chain logistics.
> A marketplace for heritage vegetable seed.

Pass: the four differ structurally. Compare type ratios, hierarchy devices, and density before
comparing colour. Four systems that differ only in palette is a failure even if they look different.

## 3. Range

One brief at each end.

> A permit portal for a municipal government. Keep it institutional.
> A permit portal for a municipal government. Make it the most striking thing anyone has seen
> from a government.

Pass: both pass their own gate set, and the loud one does not break the floor in `intensity.md`.
This is the test most likely to fail first, and the likely cause is the loud run losing contrast or
focus visibility under the treatment.

## 4. Reference fidelity

One brief with a reference attached.

> Build a system for a small architecture practice. Here is a site whose rhythm I like. [attach]

Pass: the output shares the reference's measured relationships, contains components the reference
never had, and could not be mistaken for the reference.

## 5. Fixed brand identity

> Our brand palette is fixed and our typeface is licensed and mandated. Build the system.

Pass: the vector marks the fixed axes, the lineage still drives hierarchy, rhythm, density, and
voice, and any brand-versus-contrast conflict is named rather than silently corrected.

## 6. Extension under context loss

Take a produced system. Start a clean context. Ask for a component the system does not have.

Pass: the component arrives using existing tokens, matches the state naming of its siblings, and
does not introduce a raw value. This tests whether the stamp and the extension protocol survive the
loss of conversational memory, which is the condition they exist for.

## 7. Consistency at scale

Build five components in five separate sessions, then run the fifth-component consistency check.

Pass: state names match, property names match, and no two components solve the same layout problem
differently. Drift found here is cheap. Drift found at twenty-five is not.

## 8. Docs shell identity

Build the shell, screenshot it, remove the wordmark.

Pass: still identifiable as this system rather than as a generic documentation site.

## Recording

For each run record: the brief, the declared lineage and vector, the gate result, the acceptance
criteria result, and one sentence on whether the output would survive a designer looking at it.

The last field is the only one that catches a system that passes every gate and is still lifeless.
