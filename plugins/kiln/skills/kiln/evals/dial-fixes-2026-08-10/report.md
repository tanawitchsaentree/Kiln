# Dial bugfixes from the kiln audit — 2026-08-10

Standing constraint honored throughout: no token, vector, or lineage from kiln applied backward to
Dial (D-001 through D-023 are locked). Both fixes below are real code bugs the audit surfaced,
confirmed with evidence before touching anything, fixed in Dial's own code with Dial's own
conventions, and re-verified with real Playwright renders — not kiln philosophy retrofitted onto an
existing system.

## Fix 1 — Switch's missing `prefers-reduced-motion` override (the confirmed gap from the earlier audit)

Already identified in the original `dial-audit-2026-08-10/report.md`: Switch's thumb transitions
`inset-inline-start`, a real spatial property, with zero `prefers-reduced-motion` handling anywhere
in the file — the one genuine violation among the 7 initial "has transition, no override" hits (the
other 6 were false alarms, transitioning colour/border only).

**Fix**: added a `@media (prefers-reduced-motion: reduce) { .thumb { transition: none; } }` block.
The position still changes instantly to reflect the real on/off state — only the animated slide is
removed, per the standing rule (`motion.md`): spatial movement collapses to instant or a short
opacity change under the preference, it doesn't disappear as a state signal.

**Verified, not assumed**: `page.emulateMedia({ reducedMotion: 'reduce' })` against the real
Storybook render confirmed `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`
and the thumb's computed `transitionDuration === '0s'`. (Note: Playwright's project-level
`reducedMotion: 'reduce'` launch option, used elsewhere in Dial's own conformance config, did not
reliably apply the media query in this environment — `page.emulateMedia` was used instead as the
more direct, reliable mechanism; this is a tooling quirk worth Dial's own conformance suite
checking separately, not something this fix depends on.)

**Gate**: lint 0/232, tsc 0 error, vitest 360/360 (Switch's own 7 tests included) — no regression.

## Fix 2 — border-width hover transitions were causing real, measurable layout shift

This was the open decision from the original audit's item 5: "decide whether to fix or register an
exception." Investigated with a real measurement before deciding, per the standing evidence
discipline, rather than guessing which way to go.

**What was actually happening**: several components use a documented, intentional non-color hover
cue — border width steps from hairline to thick (`braun-flat rule 4`). The intent is sound. The
implementation had a real defect: the elements carrying this transition had no explicit
`box-sizing: border-box`, so they defaulted to the browser's `content-box`, and growing the border
actually grew the element's total footprint.

**Measured directly** (not inferred): Radio's `.ring`, before hover, computed `border-box: content-box`
(the default), `24px` nominal size read as `26×26` including border; after hover, `28×28`. A ±1px
per side, real, repaintable layout shift on every hover of every radio button in the system.

**Decision: fix, not except.** This didn't meet the bar for a numbered exception in Dial's own
`EXCEPTIONS.md` — exceptions are for genuine, narrowly-scoped tradeoffs with no better alternative
(see that file's own criteria, applied earlier this engagement to Card's border and to Alert's
accent bar). This was neither: `box-sizing: border-box` is a one-line, zero-tradeoff fix that
preserves the exact intended visual cue (the border still visibly thickens) while removing the
unintended side effect (the element no longer grows). There was no reason to register a permanent
exception for something with a strictly-better fix available.

**Fixed in 7 selectors across 7 components** — every place the same hover-border-widens pattern
appears without an existing `box-sizing: border-box`:

| Component | Selector | Had box-sizing already? |
|---|---|---|
| Radio | `.ring` | No — fixed |
| Switch | `.track` | No — fixed |
| Checkbox | `.box` | No — fixed |
| Input | `.wrapper` | No — fixed |
| PinInput | `.cell` | No — fixed |
| Textarea | `.textarea` | No — fixed |
| RadioCards | `.cardVisual`, `.indicator` | No — fixed (both) |

Not touched: `Spinner.module.css`'s `border-width: thick` is a static ring weight with no hover
transition — not the same bug, correctly left alone. `Radio.module.css`'s own `.dot` already had
`box-sizing: border-box` from an earlier fix — the fix here is consistent with a pattern that
partially already existed in the codebase, not a new convention invented for this audit.

**Verified, not assumed, post-fix**: real Playwright measurement on both Radio's `.ring` (now
`box-sizing: border-box`, `24×24` stable before and after hover, versus `26×26 → 28×28` before the
fix) and Switch's `.track` (`48×24` stable before and after hover).

**Gate**: lint 0/232, tsc 0 error, vitest 360/360 — no regression, same run as Fix 1.

## What this confirms about the audit process

Both fixes were real, both were found by measurement rather than by pattern-matching a rule's
wording, and the border-width case specifically shows the value of measuring before deciding
between "fix" and "except" — an exception would have been the easier paperwork, but the actual
underlying defect had a real fix with no downside, and writing an exception for it would have
permanently documented a limitation that didn't need to exist.
