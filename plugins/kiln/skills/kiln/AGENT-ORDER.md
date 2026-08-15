# Order

Standing instructions for the agent adopting this skill into an existing repository.
Paste as-is. Do not summarise it into your own words before acting.

## Read discipline — this is a hard constraint, not advice

Read `SKILL.md` once. Then read each phase or verb file only when you arrive at it.

Never read:
- more than one file in `references/lineages/` per task
- both gate files
- any `references/technique/` file the vector did not earn
- `BUILD-NOTES.md`, `README.md`, or `evals/` at runtime, they are for humans

Read the index, pick, load the pick. Loading a whole directory to see what is in it is the single
largest waste available to you and the indexes exist so you never have to.

Clear context at the two points `SKILL.md` names. Carry forward the stated handoff list, nothing
else. Do not let history compact instead.

## Task 1 — Adopt the existing system before building anything

This repository already has a system. Do not start a fresh one and do not rotate the lineage.

1. Read the existing tokens, the decisions record, and three built components chosen at random.
2. Infer the lineage from what is actually there and name it in one line. Where the repo already
   states a derivation, use that and say you are using it.
3. Infer the intensity vector, six axes, and validate it:
   `python3 <kiln>/scripts/check_vector.py --vector C,T,G,S,M,D`
4. Write the stamp into the primary token file and create `.kiln/log.json` with this entry.
5. Report the vector and one sentence on which axis carries the system.

This takes one pass and everything afterwards depends on it. A system with no recorded lineage
drifts back to the default at around the sixtieth component, and nobody notices the day it happens.

## Task 2 — The documentation page template. This is the priority.

Read `references/docs-shell.md` and `verbs/docs.md`.

Build, in this order, stopping after each:

1. The shell. Three regions, left rail with status inline next to every component name, centre
   column with the measure held between 65 and 78 characters, right rail table of contents two
   levels deep with scroll position marked. Search with a keyboard shortcut. Theme toggle if the
   system ships more than one theme.
2. **A reusable page template file that lives in the repo**, not a hand-built page. New components
   are added by filling it in. It carries all eight sections in fixed order: name with status and
   version and one sentence, live example, when to use beside when not to use, anatomy, variants and
   states, API, accessibility, related components. Every section present on every page even when
   short.
3. The live example block. Rendered output above, code below, switched by a control rather than
   stacked. The code is generated from the same source that produces the render, never written
   separately. Copy button. Prop controls that update both the render and the code. The example sits
   on the system's own surface, not a neutral white card.
4. Migrate two existing component pages into the template and confirm nothing about the template
   assumed content it will not always have.

The shell is built from the system's own tokens. It defines no values of its own. One stated
exception: its information architecture stays conventional regardless of the vector, because a
reader arrives to find something.

## Task 3 — Every component from here

Use `verbs/component.md`. One component per session, clean context, against the stamp. Do not batch.
Batching produces components that drift, because context degrades faster than the consistency
requirement does.

Before writing anything, open the source of the closest existing component. Its behaviour is a claim
until read.

## Non-negotiables

**Evidence.** Every gate answer records what was run: a computed value from the resolved build, a
screenshot, a script exit code, a file you opened. A gate marked pass with no evidence is marked not
run. A precedent cited without being read is not verification.

**No defaults.** If your first instinct for a value is a neutral grotesque, an 8px unit, a 1.25
ratio, a blue near 60% lightness, an 8px radius, or three elevation levels, that instinct is the
statistical middle rather than a decision. Derive it from the lineage or from a stated ratio and
write the source note. Every token carries one.
`python3 <kiln>/scripts/check_tokens.py <token file>` fails the ones that do not.

**Creative range is paid for.** Boldness is concentrated, not spread. Read
`references/intensity.md` before proposing a change to the vector, and run the script rather than
judging by eye.

**Ask before deleting.** State the files you will create, modify, or delete before touching them.
Deletions need explicit confirmation every time.

**Never publish.** No `npm publish`, no `npm login`, no credential handling, regardless of how green
the gates look.

## When something does not fit

Say so and name what would have to change at the system level. Quietly bending the system to fit one
component is how a system stops being one.
