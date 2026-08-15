# Template catalog — full-page example templates

The gap this file closes: a docs site with dense per-component pages but no full-page example
that composes many components into something a reader would actually ship. This is the same gap
between "component reference" and "Bootstrap-grade docs" — a reference lists parts; examples show
the parts assembled.

## Canonical catalog (coverage outline only — never a fixed list)

dashboard · settings · sign-in/auth · pricing · checkout/form-heavy · list-detail · blog/article ·
landing/marketing · empty-states · error pages (404/500)

This is a coverage OUTLINE per the research protocol (`research-protocol.md`) — it names the
categories serious component libraries ship examples for, not a mandatory checklist every repo
must complete. The catalog actually emitted for a given repo is DERIVED from the inventory scan
below, never copied from this list wholesale.

## Inventory gate — run before building anything

For each catalog entry, map its realistically-required components against the repo's actual
public exports (the barrel/index file, read directly — never assumed from memory of what a
"typical" library ships). Three outcomes:

- **BUILDABLE** — every component the template realistically needs exists in the public API.
- **BUILDABLE-WITH-GAPS** — the template can be built by composing from primitives that DO exist
  (e.g. a layout shell built from `Box`/`Flex`/`Stack` when there's no dedicated `AppShell`), but
  a dedicated component a mature library would have is missing. This is not a blocker — compose
  from primitives — but the gap is real and gets logged as a CATALOG SIGNAL (below), not silently
  worked around.
- **BLOCKED** — the template cannot be built at all without a component that doesn't exist and
  can't be reasonably composed from primitives (e.g. a rich-text editor, a calendar/date-picker
  for a booking template). Listed in the plan with the exact missing piece named — never faked
  with a placeholder that pretends the capability exists.

Never build a template's page by importing from the library's internal `src/` paths to work
around a missing public export — per the standing rule, that's itself a finding (a capability
that exists internally but isn't public), logged as CATALOG SIGNAL, not silently patched around
via a deep import.

## CATALOG SIGNAL — the dogfooding record

Every gap a template build exposes gets one entry: what was missing, which template exposed it,
and how the template worked around it (composed from primitives / skipped a feature / simplified
scope). This is the intended output of building examples — a docs site's example templates are
also the library's own best pressure-test, and the signal is only useful if it's written down
even when the template still shipped successfully around the gap.

Do not fix the library in response to a CATALOG SIGNAL during this same run — per the standing
rule, template-building runs log signal, they don't turn into component-engineering runs. A
CATALOG SIGNAL that recurs across multiple templates (e.g. "no AppShell" surfacing on every
shell-shaped template) should be logged ONCE, cross-referencing every template it affected —
not repeated verbatim per template.

## Skeleton diversity

Template-contract point 6 requires every template use a genuinely different page skeleton — same
requirement, cross-checked at the catalog level: before building, assign each buildable template a
named skeleton (e.g. "centered-card," "three-column-comparison," "persistent-shell," "measured-
prose-single-column") and confirm no two buildable templates in the same run share one. If two
would naturally collapse to the same skeleton, that's a signal to either differentiate them
deliberately or drop one from this run's scope — never ship two templates that are the same page
with different words.
