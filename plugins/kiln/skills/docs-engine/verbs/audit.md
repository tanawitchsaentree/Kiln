# Verb — docs audit

Scores existing docs against `references/content-model.md`. **Never edits a file.** Output is a
ranked punch list with computed numbers — the input `docs uplift` needs to know what to fix, and
the artifact a human uses to decide whether to run `uplift` at all.

## Steps

1. Run Phase 0 (`references/phase0.md`) if not already cached this session.
2. For every component page: run `scripts/audit.mjs` (or the stack-appropriate equivalent — see
   the script's own header for what to swap when the repo isn't React/TS) to compute
   `variant_count` (real enum + state prop dimensions, from the TS parser, never regex) and
   `demo_count` (count of demo blocks in the page's own source). Report the floor
   (`variant_count + 3`), the actual count, and pass/fail — per component, and as a totals line
   (`X/N pages pass`, `Y demos exist vs Z required`).
3. For every overview/guide page: count non-prose structures (grep the page's MDX component
   usages against the project's registered "structural" components — cards/tables/steppers).
   Report `0` honestly where it's `0`; do not round up.
4. For every foundation page: same structural count, but expect ≥1 already in most real
   foundation pages (they usually have specimens by construction) — flag any that are pure prose.
5. Checklist coverage sweep: for the 13 component-page points, count how many of the N component
   pages have each point present (grep for the expected MDX component/heading per point — e.g.
   point 7 → count of `<DoDont>` usages, point 9 → count of `<KeyboardTable>` usages). Report as
   `M/N` per point, not a single aggregate score that hides which points are weak.
6. Badge-row check (point 2): does bundle-size/a11y-status/since-version exist anywhere yet? If
   no generator exists for bundle size, name that as SPEC DEBT rather than skipping the check
   silently.
7. Run whichever G-D gates are cheap to compute without a full build (G-D1, G-D2, G-D6, G-D7
   today — see `references/gates.md` for what each needs). Name which gates were NOT run this
   pass and why (usually: needs a built site to crawl — G-D3/G-D4/G-D5/G-D8).
8. Emit the punch list: one section per page-type, ranked by gap size (worst demo-floor gap
   first), never alphabetical — the point is to tell someone what to fix first.

## Output shape

A ranked list, not prose. Per component page: name, floor, actual, gap, top missing checklist
points. Totals line at top. SPEC DEBT items at bottom, each naming the exact missing truth source.
