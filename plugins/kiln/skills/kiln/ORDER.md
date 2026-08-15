# Order

`kiln/` is a design system skill. It is not documentation to absorb. It is a router plus a set of
files you pull on demand. Read it that way or it will cost you ten times what it should.

## Read order

Read `kiln/SKILL.md`. That is the entire entry point. It is under 1,300 tokens and it tells you
which file to open next.

After that, open only what the current phase file names. Nothing else.

Hard limits, because over-reading is the main failure mode here:

- One lineage file per build. Never the folder, never two.
- `technique/INDEX.md`, then at most two axis files. Never the folder.
- One gate file. Never both.
- Never open gate files before the build is finished. They inform fixes, not generation.
- Never open `BUILD-NOTES.md` or `README.md` during a run. Those are for humans.

A full build touches roughly 10,000 tokens of `kiln/`. The folder on disk is 50,000. If you are
near the second number you are reading things nobody asked for.

Clear context at the two points `SKILL.md` names, carrying forward only what the phase file says to
carry. Do not let the history compact itself instead.

## The job

**1. Build the documentation surface, and make it reusable.**

This is the priority. Run `kiln docs` after the system exists. Read `references/docs-shell.md`.

What has to survive after you stop: a shell that holds real pages, and page templates that someone
can copy to document component 41 without asking anyone how. Templates as committed files, not as a
description of what a page should contain.

Each component page carries all eight sections in the fixed order, every time, including the ones
that feel unnecessary for a simple component. Full detail on every one. In particular:

- The live example block is the hardest part and everything depends on it. Render above, code
  below, toggle between them, copy control, prop controls where a component has real variants.
- The code shown is generated from the same source as the render. Never hand-written beside it.
  A wrong example in docs is worse than a missing one.
- When to use and when not to use, as two lists. Every system skips this and it is the section that
  decides whether the system gets used correctly.
- Accessibility including what the component does not do.

Build in the order `verbs/docs.md` gives. The shell with one real page first, not a placeholder.

**2. It must not look like default AI output.**

The mechanism is in the skill, so use it rather than trying to be original by force. Declare a
lineage from `references/lineages/INDEX.md` and an intensity vector before writing a single token.
Both stated in plain text, both in the stamp.

Specific things to refuse unless the brief asks for them by name: a warm off-white field with a
high-contrast serif and a warm clay or terracotta accent, which is the current giveaway; a near-black
field with one saturated accent; a neutral grotesque as the only face; an 8px unit with a 1.25
ratio and a blue primary near 60% lightness; a nine-step neutral ramp; three shadow levels; radius
between 6 and 10.

None of those are wrong. They are defaults. Arriving at one by choice is fine and the reason gets
written down. Arriving at one because nothing steered you is the failure.

The docs shell has the same problem in its own right. Every design system docs site currently looks
identical. Structure stays conventional because readers arrive to find things. Surface comes from
the lineage. Test it: screenshot the shell, remove the wordmark, and ask whether it is still
identifiable. If it could belong to anyone, it drifted.

**3. Creative range is a vector, not a dial.**

Six axes, set independently. The arithmetic in `references/intensity.md` is enforced by a script,
not by judgement. A flat profile is rejected. An extreme axis has to be paid for with two quiet
ones. Do not try to be bold on all six.

## Non-negotiables

Run the scripts. Do not eyeball what a script decides.

```
python3 kiln/scripts/check_vector.py --vector C,T,G,S,M,D --log .kiln/log.json
python3 kiln/scripts/check_tokens.py <token file>
```

Every token carries a source note naming the lineage, the reference card, or a stated ratio. A
token without one is a default wearing a variable name.

Every gate answer carries what produced it. A script output, a resolved value, a screenshot, a file
you opened. A gate answered from confidence is not answered. Where you cannot check something in
this environment, report it as not run. Not run is a usable result; an unbacked yes is not, because
it stops anyone looking again.

Citing an existing component or an existing exception is a claim, not a fact. Open the source
before citing it. Check an exception against its own stated scope, because the exclusion clause is
usually the line that decides the question.

State the files you will create, modify, or delete before touching an existing project. Deletions
need explicit confirmation.

Do not publish, do not run npm login, do not touch a credential.

## Before the first real build, once

`kiln/references/baseline.md` has an empty ban list. Gate G12 cannot run until it is measured.

```
python3 kiln/scripts/measure_baseline.py briefs
```

Eight briefs, each in a clean context with no skill loaded and no follow-up. Record with
`template`, then `tally runs.json`, then paste the table into `baseline.md` and delete its
predictions section.

One session, permanent value, and it is measuring this model rather than inheriting someone else's
list. Do it before you trust anything the skill says about defaults.

## Report back

The declared lineage and one line on why it fits the brief's problem rather than its mood.

The vector, the named loud axis, and what was paid to afford it.

Gate results with evidence per gate, and the brief-specific acceptance criteria separately. A system
can pass every craft gate and fail what it was built for.

What you did not check and why.

Anything the system cannot express that the brief needed, named plainly rather than bent to fit.
