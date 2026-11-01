# Style Recipe: Material and mechanism (tactile, skeuomorphic, Bauhaus)

A tactile system makes each control a physical part that the hand already understands, such as a key,
a rocker, a rotary or a fader. It goes wrong in two ways. Either it becomes a costume, with a leather
texture and a stitched border on a web form, or it becomes mush, where everything is soft and shaded
and nothing moves like a part. This recipe avoids both by deriving every control from two
declarations, one material and one mechanism, and keeps the usability bar the same as any other
system. The worked example is `tactile-lab.html` beside this file (in the kiln repo, `apps/lab/tactile/`), with four mechanisms in three materials.

## One light, one material

Shade is never drawn per component. The system declares one light (Pane's glass and this panel both
light from the top left), and every highlight, shadow and bevel follows from it:

| Part | From the light |
|---|---|
| Cast shadow | offset = height × the light vector, so a part 6px tall throws 6px down and right |
| Lit edge | an inset hairline on the side facing the light, its strength set by gloss |
| Shaded edge | an inset hairline on the far side |
| Press | height goes to 0, so the shadow collapses under the part and the part moves by the same offset |

A material is four numbers, and the panel reads them. These are the lab's values.

| Material | height | gloss | roughness | mass | feel |
|---|---|---|---|---|---|
| Enamel on steel | 5px | 0.75 | 1px | 1 | light, short throw, bright highlight |
| Bakelite | 9px | 0.32 | 3px | 2.2 | heavy, deep throw, soft matte light |
| Print (flat Bauhaus) | 4px | 0 | 0 | 1 | ink offset shadow, no gloss, registration-mark precision |

The CONCEPT's lineage picks the material. Bauhaus metalwork leads to enamel, a 1950s radio to
bakelite, a Bauhaus poster to print. A system has one material and at most one accent material, the
way a panel has one finish.

## Mechanisms

Each interactive control names its mechanism in its why.json, and the mechanism decides how it moves
and which keys drive it.

| Mechanism | Behaves like | Role and keys | Motion |
|---|---|---|---|
| key | a push button that travels and returns | button, Space and Enter | down at once, up on the spring |
| rocker | a two-face switch on a pivot | switch, Space | thrown past the pivot, settles on the spring |
| rotary | a knob with detents over 270° | slider, arrows step a detent, Home and End | follows the hand, released into the nearest detent |
| fader | a cap riding a groove with detents | slider, arrows, Home and End | the same as the rotary, in one axis |
| lever | a toggle with a throw | switch | travel with a short overshoot, the one signature moment if the concept allows it |

```json
"mechanism": { "kind": "rotary", "detents": 11, "sweep": 270, "travel": "6px",
  "spring": { "mass": 1, "stiffness": 520, "damping": 38 } }
```

## Springs from the material

A part settles on a damped spring, x″ = (−k(x − target) − c·v) / m. The ratio that decides how it
feels is ζ = c / (2√(k·m)). Below 0.6 it wobbles, and above 1 it creeps. Interface parts stay
between 0.75 and 1, and the time to settle, about 4 / (ζ·ω₀) with ω₀ = √(k/m), stays under 600ms.
Mass comes from the material, so bakelite at m = 2.2 takes 350ms to come back where enamel takes
210ms, with the same stiffness range. The rationale check computes ζ and the settle time from the
numbers in why.json and fails a spring outside the range.

The press follows the motion rhythm (`references/foundations/motion.md`). Going down snaps in 60–70ms
because the hand has already moved, and coming back runs on the spring. That is fast on and slow off,
done with physics.

## The bar does not move

Being different never buys an exception. Labels hold 4.5:1 on the material, and every target is at
least 44px. A rotary is a slider with arrow keys and never a mystery drag area. Every part shows the
system's focus ring. Under Reduce motion nothing is thrown, and detents change at once with a short
fade. The gates that check a glass system check this one the same way.

## What it must never become

- texture as decoration: grain, leather or stitching that carries no light and no mechanism
- a different light per component, so that two shadows on one screen point different ways
- a knob you can only drag, with no keys, no value and no label
- springs that bounce on every state change; a bounce is one signature moment, declared in CONCEPT
