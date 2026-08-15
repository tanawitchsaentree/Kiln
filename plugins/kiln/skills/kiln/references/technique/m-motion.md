# Technique — motion presence

Loaded when M sits at 7 or above. This is the implementation vocabulary; `references/foundations/motion.md`
is the system decision (duration scale, easing, choreography rules). Load that to decide, this to
build once motion is the loud axis.

## Choreography as the actual technique

A single orchestrated moment — one sequence, staged, that the system spends its entire motion
budget on — reads as more considered than continuous animation spread across every interaction.
Per `references/foundations/motion.md`'s choreography section, decide where the system spends its
motion and hold everything else still. At M7 and above this becomes the system's signature rather
than a nice-to-have: name the one moment (an onboarding sequence, a state transition that matters,
a data update) that gets the full choreography, and let routine interactions stay near-instant.

## Motion that reveals structure, not just state

Movement that shows a spatial relationship the static layout couldn't (an element visibly travels
from where it was summoned to where it lands, so the reader's mental model of the layout updates
with it) does more work than a fade that merely announces "something changed." This is harder to
build (it needs real coordinate tracking, not a CSS transition on opacity alone) and it's the
difference between motion that explains and motion that decorates.

## A held beat before release

A brief pause between a trigger and the response — not latency, a deliberate hold — can make a large
movement feel weighted rather than instantaneous. Used sparingly, on the one choreographed moment
above, not on every button press, where it would just read as lag.

## Physical easing beyond the standard three

`references/foundations/motion.md`'s three curves (out, in, in-out) are the floor. A motion-loud
system can add exactly one signature curve — a slight overshoot, a specific spring — reserved for
the one choreographed moment, per that file's rule that bounce belongs to at most one deliberate
signature per system, never to routine state changes.

## Motion tied to a value, made visible

Per `references/foundations/motion.md`'s "motion as data" section, this is the one kind of motion
that earns itself even at a low intensity, and at high intensity it becomes a real technique: a
number's transition is animated with actual interpolation (counting through intermediate values,
not jump-cutting to the new one), a changed row is marked with motion proportional to how much it
changed. This only works where the underlying data genuinely changed — applying it decoratively to
static content is the fastest way to turn this technique back into noise.

## Where this axis breaks

Motion at M7 and above is the axis `references/foundations/a11y.md`'s reduced-motion requirement
hits hardest, because the whole technique depends on movement the preference collapses to a 150ms
opacity change. Design the choreographed moment's reduced-motion fallback deliberately rather than
letting the browser's default reduction apply — a moment built around spatial travel needs its own
stated non-spatial equivalent, not just "turn the animation off."
