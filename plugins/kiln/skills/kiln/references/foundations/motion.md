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
