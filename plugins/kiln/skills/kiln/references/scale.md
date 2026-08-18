# Scale — Spec, Package, Program, and the honest limits of each

Decided at Phase 0, stated in the first reply, never changed mid-build without the user asking for
it. Each scale is a different-sized deliverable, not a different quality bar — a Spec-scale system
still passes every gate its vector requires.

## Spec

One session. The output is a token set with source notes, the nine-part contract document, one
specimen at full state coverage, and — if a reference exists — the extraction table behind it.

Spec is the right scale for: deciding whether a direction is worth pursuing, a pitch, a proof of
concept, or a brief too small to justify Package scale's per-component overhead.

Spec's honest limit: it produces one component built to full depth and a system document describing
the rest. It does not produce a component library. Someone reading a Spec-scale deliverable and
expecting forty working components will be disappointed by design, and saying so up front is
cheaper than the disappointment.

## Package

One component per session — a 10-component kit means 10 separate conversations with this skill,
each an installable package built against the stamp from
`verbs/component.md`. Consistency comes from the stamp, the token set, and the extension protocol —
not from one long context holding every component in memory, because that context degrades before
forty components are done and the fortieth drifts from the first without anyone noticing in the
moment.

Batching components in one session is explicitly rejected at this scale. See `BUILD-NOTES.md` for
why: context degrades faster than the consistency requirement does, and a batched run produces
components that drift from each other in exactly the ways a reviewer catches one at a time and
misses in bulk.

Package's honest limit: it produces components. It does not produce the governance that keeps forty
components coherent as they change hands — that is Program scale, named explicitly rather than
implied by "and so on."

## Program

Adds the governance layer in `references/program.md`: status model, versioning, contribution
process, a compliance statement, a support commitment, deprecation mechanics, a gap register.

The honest limit, stated once and worth restating here because it is the whole reason this scale
exists as its own thing: **the skill writes the artefacts and cannot run the processes they
describe.** It can draft a support-channel policy. It cannot staff the channel. It can draft a
release-cadence document. It cannot hold to the cadence across a year of actual releases. It can
draft a compliance statement. It cannot be the audit that verifies the statement stays true.

A programme like Alaska Airlines' Auro — around forty component packages, separate token and
stylesheet packages, published status and release history, support matrices, contribution and CSS
conventions, an accessibility statement, a maintained documentation site — is not one artefact. It
is many small packages held together by governance run by people. This skill produces the packages
and drafts the governance. It does not become the team that runs it.

Say this to the user at Phase 0 if Program scale is requested, in the same reply that confirms the
scale: what will be drafted, and what still needs a person once the drafting is done.

## Choosing between them

If the brief is "show me a direction," Spec. If the brief is "build the library," Package, one
component at a time, and say so — a user expecting forty components in one session at Package scale
has not understood the mechanism that keeps Package scale from drifting.

If the brief includes words like "team," "contribution," "versioning," "release," or "compliance,"
that is Program scale asking to happen, even if the user asked for it under a different name. Name
the governance layer's honest limit before starting rather than after the user discovers it.
