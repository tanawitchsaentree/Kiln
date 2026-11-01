# Budget: how far kiln gets on few tokens

A user on a small plan should know before starting what they will have at the end of it. This page
gives the measured cost of the one full build kiln has done, says where those tokens went, and sets
out three budgets. Intake question 10 picks one and writes it to `kiln.config.json` → `budget`.

## What Pane cost

`tooling/kiln/usage.mjs` reads Claude Code's transcripts of a repo and adds up the usage each reply
records. For Pane and kiln together, 2026-10-26 to 2026-11-01:

| | Measured |
|---|---|
| Model calls | 6,736 over 7 days, 31 transcripts with subagents |
| Tokens written by the model | 6.0M |
| Context read on those calls | 2.94B |
| Average context per call | about 0.44M |

What the model writes is 0.2% of the total. The rest is the conversation read again on every call,
because one session ran for days and grew to near a million tokens before each compaction. So the
largest saving has nothing to do with doing less work. Keep each call's context small.

Two more things raised the bill. Pane went to 126 components and a book at full Carbon depth, and
about a third of the days went to rework the user asked for (RETRO R-001 to R-043). kiln now carries
those fixes as rules and gates, so a new system should not pay for them again.

## Three budgets

Every budget measures the same things. Contrast at 4.5:1 in every theme and mode, the anchor round,
three-tier tokens with reasons, keyboard and focus, the a11y gate, and human-tone on every page are
never traded away. A budget moves only how much is written and how many rounds are run.

| | lean | standard | full |
|---|---|---|---|
| M1 holds | core 15 and the app type's wave 1 (20 components) | the same, and at least 12 | at least 12, Pane's depth |
| Derivation | one round per family; a member names its family and what differs | the same | every component on its own |
| Usage prose against Carbon | 0.25 × | 0.35 × | 0.5 × |
| Patterns the book writes | 4 | 8 | 12 |
| Estimated context for M1 | about 60M | about 150M | 400M or more |

The app type (intake question 3, `tooling/kiln/app-types.json`) is what keeps lean useful. A booking
app gets a Calendar, RadioCards and a Stepper in wave 1 instead of the generic 12, so the first
milestone already has the screens that product needs.

The estimates assume the habits below and a fresh session per wave, at roughly 0.12M context a call.
For lean that means about 60 calls for the brief, the concept and the anchor, 30 for each family's
derivation round, 10 for each member, and 80 for the book and the verify, around 500 calls in all. Run
`usage.mjs` after the milestone and put the real number here.

## How far each step goes

Even with no model tokens at all, `kiln create` makes a working repo with the token build for every
target in `docs/TARGETS.md`, the book shell, the engine and every gate, on the starter's seed tokens.

The brief, concept, anchor and tokens (M0) give the system its own look, and every later component
derives from them. A user who stops here has tokens for React, Tailwind, Swift, Kotlin, Dart and Figma
with this system's reasons in every theme.

Lean M1 adds 20 components with their book pages, the evidence and a green verify. That is enough to
build the app type's first screens, and later waves follow the type's `wave2` and `wave3` lists.

## Habits that keep context small

These matter more than the budget setting.

1. Start a new session at each wave. `system/STATE.md` and `system/NEXT.md` carry the work across,
   so nothing depends on the old conversation.
2. Send searches and long reads to a subagent and keep only its answer.
3. Cap every command's output (rule 16), and never read a generated JSON in full.
4. While working, run `verify:changed` and `gates.mjs --only`. The full verify runs at the milestone.
5. Fix a complaint at the step that made it, once, in RETRO. A second round on the same complaint
   costs more than the first.
