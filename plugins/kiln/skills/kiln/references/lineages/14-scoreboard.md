# 14-scoreboard — Scoreboard

## Conditions

State is changing continuously and must be read correctly at a glance, from a distance, by many
people at once who cannot ask for clarification. The content is almost entirely tabular numbers,
and the small set of colours in use are not decoration, each one is a fixed label for a team or a
status: home versus away, ball versus strike. Match this lineage when the brief's real problem is
live state read at range by a crowd, not any dashboard that merely updates in real time.

## Home vector

`C3 T3 G2 S2 M7 D8` — two axes sit at 7 or above, the concentration limit. Density at 8 is the
primary loud axis: a scoreboard packs score, clock, period, and status into view simultaneously and
permanently. Motion at 7 is the secondary loud axis, and it is not decorative: a scoreboard's actual
identity is built on live, mechanical state-change — the digit flip, the buzzer flash, the clock
counting down to zero in view — and a scoreboard with that motion held quiet is a static
leaderboard, a different medium with a different problem. Density at 8 is paid for by chroma at 3
and surface at 2. Passes `check_vector.py`.

Earlier drafts of this file spent the second loud slot on chroma (a reserved home/away/alert
palette) instead of motion, and that reading undersold the medium: the reserved-colour system is
real and load-bearing (see Colour logic and Signature move below), but it survives at chroma 3-4
just as well as at 7 — a scoreboard is still legible with a modest, held-consistent palette. The
live countdown and the digit-flip are what a static screenshot of a scoreboard cannot show and a
photograph of one always misses; that is the axis actually worth spending loud here.

## Hierarchy logic

Two devices. First, a reserved colour per role — home, away, ball, out, alert — held constant no
matter what sport or event is on screen, so a viewer learns the code once and reads any scoreboard
with it. Second, fixed zone position: score always occupies the same slot, clock always occupies
the same slot, regardless of what the actual numbers are. Nothing is found by being made bigger;
everything is found by always living in the same place.

## Colour logic

A small, closed set of roles, typically three or four: home, away, a neutral or informational
colour, and sometimes a single alert colour for a fault or violation. The governing rule is binary
opposition kept absolutely consistent — home is always the same colour whether the current game is
baseball or basketball — and no reserved colour is ever borrowed for decoration or emphasis outside
its role.

## Rhythm

The interval is the fixed-width digit cell, sized to the segmented or dot-matrix display's own
module. Rhythm comes from every numeral occupying an identical cell footprint regardless of its
value, so a 0 and a 100 take the same visual space and the layout never reflows when the score
changes.

## Signature move

Numerals held in fixed-width cells that never change footprint when their value changes. If a
scoreboard's digits reflow or resize as the number grows, the whole point — glance-legibility at a
stable location, updated by content alone — collapses, and it stops functioning as a scoreboard even
if it still displays the right number.

## What it hands the system for free

A live-state communication pattern that never needs inventing from scratch: viewers always know
where to look for a given piece of information because position never depends on current content,
only colour and digit value change. Any interface tracking a small number of live, comparable values
across parties inherits this instead of building its own convention for where "the current state"
lives.

## Type character

Tabular numerals are mandatory, set in a geometric or mono-width display face doing genuine
distance-legibility work — this is one of the few lineages where display size is not decoration but
the actual mechanism of legibility at range. No serif nuance, no variable proportions; the digit
shape itself is built for recognition before it is built for character.

## Voice

Near-telegraphic. Team codes, period numbers, and status words like "OUT" or "BALL" are abbreviated
to the minimum a viewer needs, never full sentences, because there is no time to read anything
longer while the state is still changing.

## Failure mode

Loosen the fixed zone positions or let the grid become more conventional-looking and the
glance-legibility breaks, because viewers can no longer find information by habit alone. Push
surface toward decoration and the scoreboard stops being legible from the back row, which is the
one audience this lineage exists to serve. Motion is a different case now that it's a loud axis:
functional motion (the flip, the flash, the countdown — all of it tied to an actual state change) is
the mechanism, not a risk. What still breaks the lineage is motion that carries no state — an
animated background, a decorative transition on something that hasn't actually changed — because
that competes with the state-change motion for the same attention and the viewer can no longer tell
which movement means something. The failure mode isn't "motion," it's motion untied from data,
same distinction `references/foundations/motion.md`'s "motion as data" section draws generally.

## What it cancels

Cancels proportional or variable-width numerals. Cancels an expanding colour palette, since a
scoreboard's colour code only works if it stays small and fixed. Cancels illustrative or
display-driven type, and cancels ambient or decorative motion untied to an actual state change —
the flip, flash, and countdown are the medium's actual mechanism now that motion is the second loud
axis, and anything moving that isn't reporting a real change competes with them for the same
attention.

## Behaviour pulled off home

Density is already at the concentration ceiling alongside motion, so pulling a third axis up to 7
or above is not available without breaking the profile — a brief that wants more visual richness on
chroma or surface has to spend it by pulling density or motion down first. Pull density down and
the fixed-zone logic still holds at a smaller scale, since it never depended on how much is tracked,
only on position staying constant. Pull motion down toward 1-2 and the medium changes fundamentally,
not just quietly — a scoreboard whose digits don't visibly flip and whose clock doesn't visibly
count down is a static leaderboard, `08-seed-catalogue`'s or `10-field-guide`'s comparison-list
problem, not this one's live-state problem; this lineage's whole reason to exist is the thing a
photograph of it always misses. Pushing motion higher still, past the loud band into pure spectacle
(constant animated transitions between every state, not tied to an actual score change), turns it
into a broadcast graphic rather than a venue display, which is a different lineage's problem in the
other direction.
