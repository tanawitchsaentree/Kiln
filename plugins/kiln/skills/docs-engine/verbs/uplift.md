# Verb — docs uplift

`docs audit` → fix everything below floor → re-run `docs audit` to prove the delta. This is the
verb for "docs already exist, they're not good enough, make them meet the bar" — the case this
whole skill was built to make ordinary rather than a one-off hand-fix.

## Steps

1. Run `docs audit` (`verbs/audit.md`) in full. Do not skip straight to fixing from memory of a
   prior audit — configs and component counts drift, and the punch list must be from THIS run.
2. Work the punch list in the order it was ranked (worst gap first), not alphabetically, not by
   whatever's easiest. For each component page below the demo floor: build the missing demo-ladder
   sections using the mechanical derivation in `content-model.md` (one section per real enum/state
   dimension the TS parser found, plus composition patterns) — never pad with filler demos that
   don't correspond to a real dimension just to hit the number.
3. For checklist points below 100% coverage (props table, keyboard table, CSS API table, Related,
   footer, badge row): fix mechanically where a generator already exists; where one doesn't
   (bundle-size badge, keyboard-table classification for untested components), build the minimal
   generator first (this is real, durable work — not a docs-page edit, a tooling gap fix) rather
   than faking the number on one page and leaving the gap for the rest.
4. For overview/guide pages scoring 0 non-prose structures: build the real structure (card grid,
   comparison table, stepper) from data that already exists in the repo (component category list,
   package list, version history) — never invent taxonomy or comparison content that wasn't
   already a real decision somewhere (if the comparison set or category grouping was itself only
   a default per `BACKLOG.md`, that stays logged as a content decision gap; the STRUCTURE around
   whatever content is real is this verb's job regardless).
5. Add the top navbar (see `build.md` Stage 2) if Phase 0 found none.
6. Gate-Proof every G-D gate touched by this run's fixes (at minimum: G-D1 and G-D6, since those
   are what triggered the uplift in the first place) — plant, confirm red, revert, per
   `references/gates.md`.
7. Re-run `docs audit`. The re-audit's numbers ARE the delta report — do not hand-write a
   before/after summary that doesn't match what the re-audit actually computed.
8. Confirm the library's own baseline gates (lint/tsc/vitest/pack-verify, whatever the project
   defines) are still green — docs work must never touch component/token package source. If any
   of these went red during this run, that's a stop condition per this repo's standing rules
   (previously-green gate turning red), not something to log and continue past.
