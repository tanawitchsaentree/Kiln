# Foundry report template

## Niche grid

| Niche | Position (1 sentence, real and distinct, not a slider position) |
|---|---|
| 1 | ... |
| 2 | ... |
| N | ... |

## Generation + floor filter

| Niche | Candidate produced? | Floor result | Reason if rejected |
|---|---|---|---|
| 1 | yes/no | PASS/REJECT | if REJECT: which specific floor rule, with the measured value that failed |

## Novelty pressure

State every pairwise comparison among floor-passing candidates that collapsed to one slot, and why
(same silhouette + same depth treatment + only a hue/token-value difference = collapse). List the
surviving distinct set after collapse.

## Fill-rate

`fill-rate = (candidates that reached judging) / K attempted` — state the fraction and the
percentage. A fill-rate under 100% is reported plainly, not treated as a shortfall to hide.

## Judging

For each candidate that reached judging: the judge's stated reasoning against the real requirements
(FORM.md class table, lineage reference, floor rules) — not a restatement of the generator's own
pitch for that candidate. Final ranking.

## Handoff to the Lab

Confirm every candidate (floor-rejected, novelty-collapsed, and judged) has its full token diff
archived, and state the archive path — this is what makes a later user swap cost only a token
change rather than a re-run of the loop.
