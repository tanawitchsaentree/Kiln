# Verb — component

`kiln component <name>`. One installable package against a stamped system, in a clean session.
Never batched — this is the mechanism that keeps Package scale from drifting, and it holds even when
batching feels efficient.

## Load

`references/package.md` in full — it's the anatomy, the build order, and the consistency checks in
one file. Read the stamp for lineage, vector, and token set. Read `references/api-conventions.md`
for the naming vocabulary already established across the system's existing components.

## Before writing anything

Open the source of the closest existing component. Its prop shape, its state coverage, and its
actual behaviour are a claim until the file is actually read — documentation and code drift, and the
code is what ships.

## Build

Follow `references/package.md`'s six-step build order: anatomy, state coverage, tokens (semantic
tier only, no new primitive), non-colour cue per state, accessibility, API. Run the consistency
checks against the closest sibling before considering it done.

Run `scripts/check_tokens.py` against any new token file introduced. A token with no source note
does not ship, at this verb same as everywhere else.

## Document it

Build the component's own documentation page from the template in `references/docs-shell.md`, filled
in, not a placeholder. A component without its documentation page — especially without a working
live example block — is not a finished component per this skill's own definition.

## When it doesn't fit

Say so and name what would have to change at the system level, per `references/package.md`'s closing
section. Do not bend the component quietly to fit a system that genuinely doesn't have room for it
yet — that's information about the system's limits, worth surfacing, not a problem to route around.

## Output

The component, its documentation page, and a one-line confirmation of which existing tokens it
reused and which sibling component it checked consistency against.
