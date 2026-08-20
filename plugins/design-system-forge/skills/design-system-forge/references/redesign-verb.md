# The `redesign` verb — same content, different fingerprint

An existing system or interface, kept functionally identical, rebuilt so it no
longer looks like itself.

**Preserved absolutely:** every word of copy, the information architecture, the
route and page structure, the brand's non-negotiables (logo, legal colour if one
is mandated, product names), every feature and interactive affordance, every
accessibility guarantee.

**Rebuilt freely:** type, palette beyond the mandated marks, spacing rhythm,
shape language, depth and material, layout composition, motion, component
anatomy.

The difference from `build`: you are not inventing what the thing says, only how
it says it. That constraint is what makes the verb useful — and what makes it
harder, because you cannot resolve a layout problem by cutting a paragraph.

## Inventory before you touch anything

Skipping this step is how a redesign quietly loses a feature. Write the inventory
down; it is your completeness checklist at the end.

```bash
# every distinct route/page
# every component in use, and its states
# every string of user-facing copy
# every colour, font, radius, and shadow actually in use — the implicit system
grep -rhoE '#[0-9A-Fa-f]{3,8}' --include=*.css . | sort | uniq -c | sort -rn
grep -rhoE 'font-family:[^;]+' --include=*.css . | sort | uniq -c | sort -rn
```

Then run `audit` on the original. Two reasons: you inherit its real accessibility
floor rather than guessing, and you find out which of its problems are pre-existing
so you do not get blamed for them — or reproduce them.

## Establish the current fingerprint, then move away from it

Name what the thing currently reads as, in one sentence: "generic SaaS — Inter,
slate-and-indigo, 8px radius everywhere, timid shadows." **Now that sentence is
the forbidden list.** A redesign that lands on a neighbouring cliché has failed
even if it is technically different.

Pick a genuinely different axis to move along. Changing hue from indigo to teal
is not a redesign — it is a recolour, and the result reads identical:

| Axis | Weak move | Real move |
|---|---|---|
| Type | swap Inter → Geist | change the *classification*: grotesque → serif, or introduce mono as the UI voice |
| Colour | indigo → teal | change the strategy: one-hue-and-neutral → duotone, paper-and-ink, or dark-native |
| Space | pad everything more | change the base unit and the proximity ratio, so the rhythm differs |
| Shape | 8px → 12px | commit to an opinion: fully sharp, or notably round, or asymmetric |
| Depth | darker shadows | change the material: flat → paper, or grain, or recessed-vs-raised logic |
| Layout | widen the container | change the composition: centred column → asymmetric grid, or sidebar-led |

Move **at least three** axes meaningfully. One axis is a reskin; everything at
once with no through-line is noise. Name your through-line before you start —
the one idea the whole redesign expresses — and check every decision against it.

## Copy is immutable, and it constrains you

This is where redesigns break. The old design was shaped around its copy, so:

- **Long strings must still fit.** A 60-character button label kills a pill
  button. Test with the longest real string, not a placeholder.
- **Don't retitle to fit a layout.** If a heading is too long for your hero,
  the hero is wrong.
- **Preserve emphasis and hierarchy.** If the original bolded a warning, yours
  does too — that emphasis carries meaning.
- **Same language, same length.** No "tightening" the copy. If it genuinely needs
  editing, raise it as a separate suggestion; do not do it silently.

If a preserved string truly cannot work in your new layout, change the layout.
That is the deal.

## Then build it properly

From here it is `build`: Systems 2 → 6, full token layers, all seven states, both
themes, the same verification. A redesign is not an excuse to ship fewer states
than the original had.

Two additions specific to this verb:

- **Feature parity check.** Walk the inventory. Every route, component, state, and
  string present in the original must be present in the redesign. Report anything
  dropped as a decision with a reason, not as an omission.
- **Accessibility must not regress.** Run `audit` on both and compare. If the
  original had a keyboard path you broke, that is a failure regardless of how
  much better it looks. Where the original was already failing, fix it and say
  so — inheriting a defect is not preservation.

## Reporting

```
REDESIGN — <project>
Was:      generic SaaS — Inter, slate/indigo, 8px, timid shadows
Now:      <one sentence>
Through-line: <the one idea>

Axes moved:   type (grotesque → mono-led) · colour (indigo → paper-and-ink)
              · shape (8px → 0px) · depth (shadow → recessed/raised)
Preserved:    12 routes · 41 components · 218 strings verbatim · logo · legal blue
Accessibility: before 4 failures → after 0   (audit.py)
Dropped:      nothing
Changed beyond visual: none
```

If anything in "Preserved" is not actually verbatim, or anything was dropped, say
it there. A redesign that quietly changed the copy is a different product, and the
user needs to know that before they ship it.
