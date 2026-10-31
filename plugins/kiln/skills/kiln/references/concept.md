# Concept → principles → reasons

Nothing in a kiln system is there because it looked nice. Before the first token, the concept is
distilled into principles, and every decision after that, seen or unseen, names the principle it
serves. A grid, a corner radius, a shadow, a hover lift, a 200ms fade, a focus ring offset, a
visually-hidden label, a forced-colours border: each has a reason that would still hold if someone
argued against it. "It is rounded so it feels friendly" is not a reason. "Corners nest so a pane
inside a pane reads as inside it: inner radius = outer radius − padding" is.

This runs after the anchor pick and the vector (the direction is known) and before any token is
written. `tooling/kiln/rationale.mjs` enforces it; the docs show it (docs-engine G-W1).

## 1. Distil the concept (system/CONCEPT.md)

One paragraph: what the system is, for whom, in what situation, and what it must never become.
Then 3–7 principles. Each principle is a claim about the product, not a style adjective:

- ✗ "Minimal", "Modern", "Clean", "Friendly"
- ✓ "Glass is clear: the scene behind is part of the interface, so surfaces dim it rather than paint over it"
- ✓ "One loud thing per pane: a reader should never have to choose between two equal calls to action"

Each principle carries a **Therefore** block with a consequence on every axis: **space, shape, depth,
colour, type, motion, interaction**. If a principle does not touch an axis, write that and why
("type: not affected, because legibility is set by P2"). An axis no principle speaks to is a gap:
any value chosen there would be taste.

**A light model, for any system with material** (glass, paper, metal, anything with depth). Say where
the light comes from and how it lands on each kind of thing: a raised surface, a recess, a chosen item,
the loud action, a disabled part. Every component's derivation then states how each of its parts is lit
(`derivation[].axis: "depth"`). Without it depth is decided part by part, and the parts disagree.
(Pane, 2026-10-29: the rim was drawn from the top left on cards and buttons only; most atoms had no
light at all, and the user showed a reference where one light from above lights every atom alike.) Then say what **emits** as well as what reflects: in a dark theme a material system usually wants a few parts to give off light, and "every white thing glows" is the habit to avoid. Name the categories by meaning (the promoted action; on or an amount; now) and the ones that never emit (text, icons, edges, chosen surfaces, held objects, status colours, disabled), give each a token, and mark the parts with `data-glow` so G-GL1 can measure them. (Pane, 2026-10-29, D-027.)

**A hue is a decision, not a default.** A principle that names a brand colour carries it into every
derivation that quotes it. Name the hue only if the concept needs it, and say where it may appear.
(Pane: "one ink and one blue" in P1 kept the blue alive through three derivation rounds the user then
rejected.)

```markdown
### P3 Things settle
Objects in the scene have weight; they arrive and come to rest instead of snapping.
**Therefore** space: … shape: … depth: … colour: … type: … motion: long ease-out, small distances,
zero under reduced motion. interaction: press answers faster than hover, because it is a reply.
```

## 2. Give every token a reason

In the DTCG sources, `$extensions["kiln.why"] = { "p": "P3", "why": "…" }` on the token or on the
nearest group (a scale shares one reason; a token that departs from its group says why). `p` may be a
list. The reason says what the value does for the reader or the concept, in at least 8 words.

## 3. Give every part, state and motion a reason

Each component has `<Name>.why.json`:

```json
{
  "concept": "How this component expresses the concept, in one sentence.",
  "parts":  { "<every CSS class>": { "p": "P2", "why": "…" } },
  "states": { "hover": {…}, "focus-visible": {…}, "disabled": {…}, "data-state=open": {…}, "@media forced-colors: active": {…} },
  "motion": { "transform": {…}, "@menu-in": {…} }
}
```

The gate reads the CSS module and fails on anything it finds without a reason: an unseen helper
class, a state selector, a forced-colours rule, a transitioned property, a keyframes block. It also
fails on reasons for things the CSS no longer has (stale), on unknown principles, on reasons under
8 words, and on reasons that argue from appearance (looks clean, modern, premium, elegant, สวย, ดูดี…).

## 4. Order of work

anchor pick → vector → **CONCEPT.md** (user sees the principles, one round) → tokens with reasons →
atoms → molecules → organisms, **each one derived first** (`references/derivation.md`: default to
avoid, lineage reference, derivation quoting the principles, three variants, user pick), code after.
Reasons written after the code only explain a habit; a component whose form was not derived is
redesigned, not re-explained.
