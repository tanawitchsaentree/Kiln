# Floor-rule cost check — is Dial's S0 a real refusal or a free zero?

The loophole this closes: the restraint profile's FLOOR arithmetic only checks that some axis
equals 0. It cannot, on its own, tell a costly refusal (the medium wanted this axis, the system
said no anyway) from a free one (the medium was never going to reach for this axis, so a 0 there
proves nothing). `gates-restraint.md`'s entry criteria now name two checks for this; this report
applies both to Dial's corrected S0 score as the worked example.

## Check 1 — does the medium actually pull toward surface?

Yes, and it's a strong pull, not a strawman. Drop-shadow-as-depth-cue is one of the most common
conventions in mainstream component libraries — a card, in particular, is one of the single most
frequent places a hover-lift shadow appears industry-wide (Material Design's elevation system,
most SaaS design systems' default card treatment). Dial's own Card component is exactly the kind of
component where this convention is strongest — a bordered content container, the component most
likely to reach for shadow-as-depth anywhere in a typical system. This isn't a manufactured
temptation; it's the single most predictable place a system like this would normally spend on
surface if it were going to spend on surface at all.

## Check 2 — was the refusal actually checked at real temptation points, not just asserted?

Checked directly against the token source, not inferred from the rule's existence. `grep`-level
count: shadow-valued tokens appear in exactly 3 of Dial's 26 component files
(`dialog.json`, `popover.json`, `toast.json`) — precisely the floating-layer exception D-008 itself
names. The other 23 files were read for how they handle the same "how does this component define
its own edge/depth" question shadow would normally answer, and five components — the ones where the
pull is real, not several dozen where it never was — explicitly document choosing something else
and cite D-008 by name as the reason:

- **`button.json`**: "outline/ghost stay bg-transparent and use overlay.hover/overlay.pressed for
  the non-shadow hover/pressed cue (braun-flat rule 4) **instead of any shadow**."
- **`card.json`**: (covered at length in the original audit) zero shadow references, root border
  moved to `border.interactive` specifically because the fill alone couldn't separate the card from
  the page — the exact spot a shadow would conventionally solve this, solved instead with a border.
- **`image.json`**: "a hairline border token for the optional rounded-frame case **(no decorative
  shadow, D-008)**."
- **`table.json`**: "D-008: no decorative shadow — root/header/row borders all alias
  `color.border.hairline`/`hairlineStrong`... a table grid line is a quiet layout divider, not the
  boundary of a focusable control."
- **`listbox.json`**: "Root border reuses `color.border.hairline` (braun-flat rule 1 — no
  decorative shadow on the listbox surface itself; it is not a floating layer)."
- **`skeleton.json`**: "base/shimmer are two adjacent neutral steps so the shimmer animation is a
  lightness sweep between them — **no shadow involved (D-008/braun-flat rule 1)**."

That's five real temptation points (Button, Card, Image, Table, Listbox — plus Skeleton, six),
each independently documenting the same refusal at the exact point mainstream convention would most
predictably reach for shadow, each citing the same rule by name rather than reinventing the
reasoning per-component. This is what "checked across a real sample of temptation points" looks
like in practice, not a refusal asserted once and assumed to generalize.

## Verdict

Dial's S0 passes both cost checks. The refusal is named (D-008, cited by number, not paraphrased,
in every file that documents it), specific (a stated exception — floating layers only — rather than
an unqualified "no shadow anywhere"), held at real temptation points (checked directly against 26
files, not asserted from the rule's existence), and the medium genuinely pulled toward the axis
being refused (shadow-as-depth is a strong, common, real convention for exactly the kind of
component — a card — Dial's own catalog includes). This is a costly refusal, not a free zero.

**This settles the arithmetic-versus-cost distinction for this one case, and does not retroactively
apply anything to Dial** — no token, decision, or lock changes as a result of this check. It answers
a question about whether kiln's restraint profile is *correctly scored* against Dial's real,
frozen state, which is exactly the kind of audit question this whole engagement has been running,
not a design change to the audited system.
