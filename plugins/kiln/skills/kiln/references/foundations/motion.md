# Motion system

The decisions. `technique/m-motion.md` has the implementation. Load this to decide, that to build.

## Duration scale

Three durations, four at most, named by purpose rather than by milliseconds.

Instant for state feedback, around 100ms. Short for local transitions such as a dropdown, around
200ms. Medium for larger movement such as a drawer or a page region, around 300ms. Anything above
400ms feels broken unless the movement is genuinely large.

Duration scales with distance and size. The same drawer takes longer on a wide screen than on a
narrow one, and a fixed duration makes one of those wrong.

## Easing

Three curves, and never the browser default.

Out for things entering or responding to the user, since they should arrive fast and settle.
In for things leaving, since nobody watches an exit.
In-out for things moving between two on-screen positions.

No bounce or overshoot on interface state. It reads as playful once and as unserious by the tenth
time. Bounce belongs to a deliberate signature moment, at most one per system.

## What animates

Transform and opacity only. Animating width, height, top, or margin causes layout work every frame
and it will stutter on the hardware your users actually have.

If a layout property must animate, animate a transform that produces the same visual result, or
accept the cost knowingly and confine it to one small element.

## Choreography

One orchestrated moment lands harder than fifteen scattered ones. Choose where the system spends its
motion and leave the rest still.

Stagger by a fixed increment for a list entering, and cap the total. A twenty-item list staggered at
50ms takes a second before the last item arrives, which is a second the reader waits.

Related elements move together. Unrelated elements do not move at the same time, or the reader
cannot tell what changed.

## Reduced motion

`prefers-reduced-motion: reduce` collapses spatial movement to an opacity change of 150ms or less.
It does not remove feedback entirely, since a control that stops responding reads as broken.

Ambient and continuous motion stops completely under the preference. This is not optional.

Never animate a focus ring's appearance. It must be instant, in every mode, at every reduced-motion
setting.

## Motion as data

Motion tied to a value changing is the one kind that earns itself. A number that just updated, a row
that just arrived, a status that just changed. Mark it briefly and let it settle.

Motion tied to nothing is decoration, and decoration that repeats becomes irritation.

## Rhythm

Smooth is the floor, never the goal. A system that eases every change over the same 300ms feels like
syrup, and one that fades everything in 100ms feels raw. Rhythm is the difference between those two. Each kind of change
gets its own way in and its own way out, and the gates measure both (G-MO1 and G-MO3 in the
page, G-MO2 on the tokens, proven by `tooling/kiln/motion-probes.proof.mjs`).

**Fast on, slow off.** A state answers the moment it is entered and lets go slowly. Hover lights up in
about 130ms and fades over about 360ms when the pointer leaves; a press goes down in about 70ms and
comes back over about 300ms. The way out is at least 1.6 times the way in. The token says it in one
place, with `$extensions["kiln.state"]`, and the build turns it into a rule on each component root:

```json
"hover": { "$type": "duration", "$value": "{duration.linger}",
  "$extensions": { "kiln.state": { ":hover": "{duration.brisk}" }, "kiln.reduced": "keep" } }
```

A CSS transition takes its duration from the state it is going to, so components keep writing
`transition: background-color var(--ds-motion-hover) var(--ds-motion-easing)` and get both halves.

**Decelerate in, accelerate out.** Anything that arrives starts fast and settles, so its curve is
steeper at the start than at the end. For a cubic-bezier (x1, y1, x2, y2) the slope at the start is
y1 / x1 and at the end (1 − y2) / (1 − x2); arrival needs the first to be larger. An exit does the
opposite and is shorter than the entrance, about 0.6 of it, with no stagger, because nobody watches a
thing leave.

**Duration follows distance.** For travel, duration = clamp(min, a + b·√d, max) with d in px. With
a = 120 and b = 12 a 100px move takes 240ms, 400px takes 360ms and 900px takes 480ms. Fades and state
changes do not travel, so they stay on the state tokens.

**Springs for direct manipulation.** A thumb, a knob or a sheet that follows a finger keeps moving after
release, so it settles on a spring rather than a curve. Damping ratio ζ = c / (2√(k·m)) stays between
0.75 and 1 on interface state (no visible bounce), and the time to settle is about 4 / (ζ·ω₀) with
ω₀ = √(k / m). A bounce is a signature moment, at most one per system, and it is declared in CONCEPT.

**Choreography.** Stagger s ≤ 40ms per item and cap the whole entrance at 240ms, so at most 1 + 240 / s
items stagger and the rest arrive together. A parent arrives before its children, and children never
start before the parent has covered half its travel.

**A toggle changes, it never swaps (G-MO3).** Choosing a chip, a segment, a switch or a tab is a state
change like hover, and it gets the same rhythm. Two things break it, and G-MO3 clicks real toggles to
catch both:

- *Never swap a gradient on a state change.* A gradient is an image, so no transition can interpolate it
  and it changes in one frame. Paint the fill from the two registered colours the token build declares,
  `background: linear-gradient(var(--ds-fill-top), var(--ds-fill-foot))`, set both from tokens per state,
  and transition `--ds-fill-top, --ds-fill-foot`. A flat fill transitions `background-color` as usual.
- *Never let a toggle change size at once.* A check mark added to the DOM, or a label that turns bold,
  widens the toggle in one frame and its neighbour jumps. Keep the mark in the DOM inside a track that
  opens with `grid-template-columns: 0fr → 1fr` on the state's duration, and reserve the bold width of
  the label.

The gate goes red when a neighbour moves more than 4px between two frames, or when a fill is already
at its end 60ms after the press (Pane R-048).

**Reduced motion.** Travel and scale go to zero. Fades of colour and light that move nothing keep their
rhythm (`kiln.reduced: "keep"`), because a control that snaps reads as broken (Pane D-039).
