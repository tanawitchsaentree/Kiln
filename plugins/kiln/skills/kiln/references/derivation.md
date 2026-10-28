# Derivation — form comes from the principles, then the code

The failure this file exists for (Pane, 2026-10-27): after one anchor round, every other component
was built by recalling what pattern libraries do and putting the system's tokens on it. The Banner
came out as Carbon's inline notification in glass: an accent stripe on the start edge, a tinted
icon disc, a bold title over muted text. Its reasons were written afterwards and explained the
habit instead of deriving anything. Select, Slider and the list flyout were the same: built because
the docs needed them, never designed. A gate that only checks "a reason exists" passes all of it.

So, for every component with a form of its own (atoms to organisms, including popups, flyouts and
any control the docs need), the order is fixed and the hook enforces it:

## 1. Name the default you are about to reach for

Write `default_to_avoid` in `<Name>.why.json` before anything else: the shape a pattern library or a
model produces first for this job, and where it comes from (Carbon inline notification, Material
banner, Radix default popover, iOS slider). Say why it does not fit this concept. Writing it down is
what stops it appearing by habit.

## 2. Look at how the lineage solves the job

Cite at least one reference from the system's own lineage (`references[]`), not from a general UI
library. Pane's lineage is spatial computing, so a message is an ornament or a sheet in visionOS, not
a banner from an admin console. Benchmarks such as Carbon are for documentation depth only; they
never decide a component's form.

## 3. Derive

`derivation[]`: at least three steps from at least two principles. Each step quotes the principle's
**Therefore** text for one axis word for word (`consequence`) and says what form follows (`form`).
If a principle's text does not lead anywhere for this component, that is a finding about the
principle, not permission to fill the gap with taste.

## 4. Render three, then pick

Three variants that follow the derivation in different ways, rendered in `apps/lab/<component>/`,
same content, compared against the default to avoid. With `autonomy.picks: "user"` the user picks
(`variants.picked`, `variants.by: "user"`). With `"agent"` (questions asked once at intake) the
agent picks, writes `variants.by: "agent"` and a `variants.reason` that argues from the principles,
and adds a row to `system/REVIEW.md`; the user reviews every such pick at the milestone. Only `identity: false` components (layout primitives with no form of their
own) skip this, with `identity_reason`.

## 5. Then the code, with reasons on the axis they act on

CSS and TSX can now be written (`tooling/kiln/derivation-guard.mjs` blocks them before). Every part,
state and motion in `<Name>.why.json` names `p` and `axis`, and that principle must actually say something
about that axis. A pattern the habit gate flags (G-X1: accent stripe, icon-disc alert…) is allowed
only if `allowed_patterns` names it with a reason from the derivation.

## Components built before this rule

They go in `rationale.pendingDerivation` in `system/kiln.config.json`. The gate reports them on every
run and the docs mark them "awaiting derivation". The list may only shrink: a component leaves it by
going through steps 1–5, never by having its reasons rewritten.
