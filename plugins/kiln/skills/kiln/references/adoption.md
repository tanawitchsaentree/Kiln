# Adoption and enforcement

A design system fails from disuse far more often than from bad design. This file is what keeps it
alive after launch. Load at Package or Program scale.

**This file drafts policy; it does not run it.** Every CI rule, support-channel policy, and
migration guide below is something this skill can write for a project to adopt — not a standing
commitment this skill operates going forward. It can draft a support-channel policy; it cannot
staff the channel. See `references/scale.md`'s Program section for the same limit stated against
the governance layer as a whole.

## Enforcement in CI

Rules that a human reviewer will not catch consistently, so a machine should.

No raw colour values in product code. A hex or an `oklch()` outside the token file fails the build.
This single rule prevents most drift.

No spacing values outside the scale. Same mechanism.

No component-level overrides of system internals. If a product needs to reach inside a component,
either the component needs a documented seam or the product needs a different component.

Accessibility checks per component, treated as build failures rather than warnings. A warning is a
thing that accumulates.

Token file generated, never edited. A diff in a generated file fails the build.

Write these as lint rules and ship them with the system, since a rule that each team must configure
is a rule most teams will not.

## Measuring adoption

Count what is actually used rather than what is available.

Proportion of product code importing system components against total component instances. Falling
means the system is being worked around.

Which components are used and which are not. A component nobody uses after two releases either
solves a problem nobody has or is undiscoverable, and those need different fixes.

Number of local overrides, and where. Overrides cluster around the system's real gaps, so this
number is a roadmap.

Time from a system release to a consumer upgrading. Growing means upgrades hurt.

Publish these. A system that measures itself in private is a system that will be surprised.

## Migration

Every breaking change ships with a migration note containing before and after code, not prose.

A codemod where the change is mechanical. Most renames are, and shipping the codemod is the
difference between a migration that happens and one that stalls for a year.

Deprecation runs on a stated timeline. Marked, then warned in the console, then removed in a named
major version. Announce the removal version when the deprecation starts, so nobody is surprised.

Never remove a component in the same release that deprecates it, whatever the pressure.

## Support

Name the channel, the expected response time, and who is responsible. A system without a support
commitment gets forked quietly, and the fork surfaces years later during an audit.

Log every question. Repeated questions are documentation failures, not user failures, and the log is
the best available list of what to write next.

## The gap register

Keep a public list of things the system does not yet cover and product teams have had to build
themselves. This is the highest-value artefact in this file.

It prevents four teams building the same missing component independently, and it makes the system's
roadmap answerable to real demand rather than to what the system team finds interesting.
