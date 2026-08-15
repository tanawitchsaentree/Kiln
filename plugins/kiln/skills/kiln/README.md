# kiln

A design system generator that refuses the statistical middle.

Every system it produces declares a **lineage**, which is one named design tradition from outside
web and UI, and an **intensity vector**, which is six axes with enforced arithmetic. Those two
declarations are what stop the output collapsing toward the same neutral grotesque, 8px unit,
blue-600 system that appears when nothing is steering.

Range runs from restrained institutional systems to extreme expressive ones, and the extreme end is
harder than the quiet end because the arithmetic makes you pay for it.

## Install

```
~/.claude/skills/kiln/          Claude Code
.codex/skills/kiln/             Codex, project-scoped
```

Copy the whole folder. The phase and reference files are loaded on demand and the structure matters.

## Use

```
build me a design system for <thing>     runs the full flow
kiln study <image or URL>                extract relationships from a reference
kiln audit <target>                      score an existing system, no edits
kiln extend <target>                     add to a stamped system
kiln component <name>                    one installable package
kiln docs                                the documentation shell
```

## Scale

Decided at intake and stated in the first reply.

**Spec** is one session. Tokens with source notes, the nine-part system document, a specimen, one
component at full state coverage.

**Package** is one component per session, indefinitely, each an installable package. Consistency
comes from the stamp and the extension protocol rather than from memory, which is why batching is
forbidden.

**Program** adds governance. The skill writes the artefacts and cannot run the processes they
describe, and it says so rather than letting you find out.

## What it writes to your project

```
.kiln/log.json        lineage and vector per run, used for rotation
.kiln/cache.json      pre-flight scan and any relationship card
```

Plus a stamp comment at the top of the system file.

## Scripts

```
python3 scripts/check_vector.py --vector 3,8,2,1,2,6
python3 scripts/check_tokens.py tokens.css
python3 scripts/measure_baseline.py briefs
```

The first two are gates that do not need a model. The third generates the measurement run for the
ban list.

## Before you trust it

`references/baseline.md` has never been measured. Its ban list is empty and gate G12 reports as not
run until you execute the protocol. Run `measure_baseline.py briefs`, do the eight runs in clean
contexts, and tally. It takes one session and it is the highest-value thing you can do to this skill.

`evals/briefs.md` has eight test runs. None have been executed. Everything in this skill is a
design hypothesis until they are.

Maintainer notes, including where each mechanism came from and what is still weak, are in
`BUILD-NOTES.md`.
