# Lineages index

Load this index, pick one, load that one file. Never the folder. A build reads exactly one lineage
file; `constraint.md` covers the rare two-lineage case and even that reads two files, not the
directory.

Every lineage is a design tradition from outside web and UI, chosen at Phase 1 because its problem
matches the brief's problem — not because its look matches a mood. A field guide and a botanical
plate can both be "nature," and if you pick between them by mood you'll pick wrong; pick by which
one's actual problem (rapid identification in the field, versus authoritative single-specimen
record) is the brief's problem.

Each file carries the same eleven fields, in the same order, per `_TEMPLATE.md`: conditions, home
vector, hierarchy logic, colour logic, rhythm, signature move, what it hands the system for free,
type character, voice, failure mode, what it cancels — plus a closing note on behaviour pulled off
home vector.

## Picking

Read the **conditions** line of two or three candidates before committing to one. A lineage's
conditions state the kind of problem it was built to solve in its original medium — match the
brief's problem to that, not to the adjective a person might use to describe the look.

Rotate against `.kiln/log.json`: `scripts/check_vector.py --log .kiln/log.json` names the previous
run's lineage as a note. Do not pick it again for a fresh build in the same project.

## The eighteen

| # | Lineage | Conditions it answers |
|---|---|---|
| 01 | `01-transit-signage.md` | Wayfinding under motion, at a distance, in more than one script |
| 02 | `02-botanical-plate.md` | One specimen, authoritative record, no ambiguity about scale |
| 03 | `03-nautical-chart.md` | Dense overlapping data where a wrong reading has real consequence |
| 04 | `04-pharmaceutical-label.md` | Legal precision, no room for a missed warning, small physical space |
| 05 | `05-record-sleeve.md` | Identity and mood carry more than function; one strong image |
| 06 | `06-textile-draft.md` | Repetition, pattern, a structure that repeats at every scale |
| 07 | `07-instrument-panel.md` | Continuous monitoring, glanceable state, operator under load |
| 08 | `08-seed-catalogue.md` | Many similar items, comparison shopping, plain accurate description |
| 09 | `09-letterpress-broadside.md` | One urgent message, maximum type contrast, short-lived attention |
| 10 | `10-field-guide.md` | Rapid identification in the field, portable, distinguishing similar things |
| 11 | `11-glaze-notebook.md` | Personal record-keeping, formulas, notes made for the maker's own later use |
| 12 | `12-architectural-drawing.md` | Precision at scale, one convention read by many trades, no ambiguity |
| 13 | `13-security-printing.md` | Anti-forgery, verification, deliberate friction as a feature |
| 14 | `14-scoreboard.md` | State changing live, read from a distance, tabular numbers as the content |
| 15 | `15-manuscript-margin.md` | Primary text with commentary alongside, layered authority over time |
| 16 | `16-parts-diagram.md` | Exploded assembly, one part related to the whole, no styling, only structure |
| 17 | `17-title-card.md` | A single moment of maximum impact, brief duration, no persistent chrome |
| 18 | `18-painted-shop-sign.md` | Handmade, one maker's hand visible, local and specific rather than systemic |

## Where a lineage's problem does not match a brief that sounds similar

"A dashboard" is not automatically `07-instrument-panel`. If the dashboard's real problem is
comparing many similar rows (`08-seed-catalogue`'s problem) rather than glanceable state under
operator load (`07`'s actual problem), the catalogue's logic serves the brief better even though
"dashboard" sounds like a panel. State which problem the brief actually has before picking.

## Two lineages, one system

Covered in `references/constraint.md`, not here. Only reach for it when the brief genuinely has two
surfaces — an identity surface and a dense application surface — that no single lineage serves well.
It is not a way to hedge between two lineages you like equally.
