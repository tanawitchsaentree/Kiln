# Foundation depth — what the reference systems cover, enumerated before writing

The failure this file exists for (Pane, 2026-10-27): component pages got a depth standard, foundation
pages did not, so the user found each thin foundation page one at a time ("ปัญหามาอีกจนกว่ากูจะเจอไปเรื่อยๆ").
The Grid page had a playground, a hand-typed breakpoint table and a token list. Carbon, Atlassian and
Dell cover 27 topics between them on the same page.

## Rule

Before writing any foundation (or pattern, or guide) page, load its topic list from
`benchmarks/topics/<page>.json`: the union of what Carbon, Atlassian, Dell, Material and others
cover on that page, one topic per idea, with sources. If no list exists yet, make one first from at
least three reference systems' pages (headings and tables), and commit it to kiln so the next system
starts from it.

Then map every topic in `system/benchmark-coverage.json` to one of the page's own sections
(`"anatomy": "#anatomy"`) or decline it with a reason that follows from the concept
(`"density": { "na": "…" }`). G-BT1 fails on any topic left unmapped, mapped to a section that is not
on the page, mapped to a section under 25 words, or declined in under 10 words.

## Covering a topic means showing it

Benchmarks decide which topics a page covers, never what the system looks like. A topic is covered
with the system's own live material: an annotated overlay drawn from the tokens rather than a
screenshot, tables generated from the token build rather than typed, and do/don't pairs rendered
with real components. A topic declined for the concept says why the concept makes it unnecessary,
not that there was no time.

## Topic lists in kiln

| Page | File |
|---|---|
| Grid | `benchmarks/topics/grid.json` (Carbon 2x Grid, Atlassian Grid, Dell Grid) |

Add a file the first time any system builds a page that has none.
