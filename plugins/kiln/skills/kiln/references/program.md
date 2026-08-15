# Program — governance above the packages

Loaded at Program scale. This is a drafting file, not an operating one — every artefact here is
something this skill can write and cannot run. Say that limit to the user before drafting, not
after.

## Status model

Every component carries a status: experimental, stable, deprecated. State what each status permits
— experimental may have breaking changes without a major version, stable may not, deprecated works
until a named removal version. Publish the status next to the component name everywhere it's listed,
including in the documentation shell's left rail per `references/docs-shell.md`.

## Versioning

Version the token package independently of the component packages, per `references/export.md` — a
token rename is a breaking change for consumers even when no component changed. State the semver
policy explicitly: what counts as a breaking change (a prop removal, a token removal, a default
value change) versus what does not (a new optional prop, a new token, a bug fix that changes visual
output within stated tolerance — and state the tolerance).

## Contribution

Who may propose a new component, what the review checks against — the contract, the API
conventions, the state-coverage list — and what happens when a contribution is close to an existing
component rather than genuinely new. The default answer to "should this be a new component" is
usually no; state that default so it doesn't get re-litigated per contribution.

CSS and code conventions belong here too: how a contributor's component code should read before a
reviewer will look at anything else — token usage per `references/foundations/tokens.md`, naming
per `references/api-conventions.md`, logical properties per `references/foundations/i18n.md`.

## Compliance statement

Per `references/foundations/a11y.md`: the standard and level targeted, what was actually tested and
how, what does not yet conform, and who to contact. Publish known gaps openly. A blanket compliance
claim is disproved by the first real user who hits a gap, and it takes the rest of the statement's
credibility with it.

**This skill cannot be the audit.** It can draft the statement's structure and state what a real
audit needs to check. It cannot perform automated scanning across a live product, run a screen
reader pass, or recruit users with disabilities to test with. Say this in the statement's own
drafting notes so the gap is visible to whoever inherits it.

## Support

Name the channel, the expected response time, and who is responsible — as a policy to be filled in
by the team that will actually staff it, not as a commitment this skill is making on their behalf.

## Adoption and enforcement

Per `references/adoption.md`: the CI rules (no raw values outside tokens, no un-reviewed internal
overrides, accessibility checks as build failures), the adoption metrics worth tracking, and the gap
register — the public list of things the system doesn't cover yet that product teams have built
themselves. The gap register is the highest-value artefact in this section because it turns the
system's backlog into something answerable to real demand instead of to whoever on the system team
finds a problem interesting.

## Migration and deprecation

Every breaking change ships with a before/after migration note, and a codemod where the change is
mechanical — most renames are. Deprecation runs on a stated timeline: marked, then warned, then
removed in a named major version, announced at the start rather than the end of that timeline.
Never remove a component in the release that deprecates it.

## What Program scale does not produce

A team. A release calendar that holds itself to. A support inbox with someone reading it. An audit
that has actually been performed. These are the standing commitments named in `SKILL.md`'s "what
this does not do" section, and Program scale is where a user is most likely to expect this skill to
have crossed into providing them. It has not. State this at the point of drafting each artefact, not
only once at the start, because it is the point at which the gap is easiest to forget.
