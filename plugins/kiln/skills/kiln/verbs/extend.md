# Verb — extend

`kiln extend <target>`. Add to a stamped system without rotating its lineage. This is what
`evals/briefs.md`'s test 6 checks: whether the stamp and the extension protocol survive the loss of
conversational memory, which is exactly the condition they exist for.

## Load

Read the stamp on the target system's primary token file — the declared lineage, vector, and loud
axis. Read the target's actual token file and at least one existing component's source, per
`references/package.md`'s "before writing anything" rule; a component's behaviour is a claim until
the file is opened.

Do not read the lineage's full file again unless something about applying it to the new addition is
genuinely ambiguous — the stamp already carries what's needed (lineage name, vector, loud axis and
its payment) for most extensions, and re-reading the full lineage file for every extension is exactly
the kind of over-reading `ORDER.md` warns against.

## Never rotate

The lineage stays. A stamped system's lineage is a commitment, not a suggestion to revisit on the
next addition — extending it with a different tradition's logic partway through produces a system
that is, from that point on, two systems wearing one name. If the existing lineage genuinely cannot
serve what's being added, say so and stop; that's a finding for the user to decide, not a decision
this verb makes unilaterally by picking a new one.

## Run

Build the addition — a component, a foundation not yet in use, a pattern — against the existing
token set, aliasing semantic tokens only, introducing no new primitive and no raw value.
`scripts/check_tokens.py` gates this the same way it gates a fresh build.

Match the existing API vocabulary exactly per `references/api-conventions.md` if one is already
established — a `variant` prop stays `variant`, an enum's existing values stay in the same
vocabulary, a new component doesn't invent `kind` because nobody happened to check what the sibling
components already call it.

## Output

The addition, plus a one-line confirmation that the lineage was not rotated and which existing
tokens it reused rather than introduced fresh. If the extension needed something the existing system
genuinely doesn't have — a state the token set has no name for, a foundation never built — name that
gap plainly rather than inventing a workaround that quietly bends the existing system to fit.
