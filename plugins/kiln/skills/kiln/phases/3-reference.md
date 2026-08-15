# Phase 3 — Reference

Only if a reference exists. Skip straight to Phase 4 if it doesn't; this phase has nothing to do
without one.

## Extract relationships, never values

Read `references/extraction.md` in full — it names the ten fields to extract, the never-extract
list (no lifted hex values, no lifted pixel measurements, no matched-font identification, no
verbatim copy), and how to handle a reference asking for something a flat screen can't literally
do.

Work through the ten fields against the actual reference. Not every reference answers every field —
say plainly which ones it's silent on rather than inventing an answer to fill the row. A reference
that answers six of the ten fully and honestly is more useful than one where all ten are guessed.

## Reconcile against the declared lineage

The reference and the Phase 1 lineage pick are not always the same tradition, and they don't need to
be — a brief can bring a reference from one world and still be best served by a different lineage's
problem-solving logic. Where the reference's own extracted relationships diverge from the declared
lineage's home logic, name the divergence and decide whether the reference should pull the vector
(Phase 2 revisits it) or whether the lineage's own logic should simply override the reference on that
one point. Don't let both operate silently and produce a system that quietly contradicts itself.

## Cache it

Write the completed extraction table to `.kiln/cache.json` per `SKILL.md`'s caching rule, so a later
run in the same project reuses it without re-extracting.

## What to carry forward

The completed ten-field table (or as many fields as the reference actually answers), and one
sentence on any point where it pulled the Phase 2 vector or diverged from the Phase 1 lineage. Not
the reference image or document itself — the extracted table is what later phases need.
