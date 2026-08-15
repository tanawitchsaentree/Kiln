# Research protocol — what to do when a checklist item lacks material

Applies whenever a component-page checklist point (`content-model.md`) has nothing obvious to
fill it with — e.g. a Checkbox page needs an "indeterminate + controlled groups" composition demo
but no existing story shows one. The skill researches before it degrades to a placeholder.

## Order, always in this sequence

1. **Read the component's own source, types, stories, tests.** Most "missing" content is
   actually derivable and just hasn't been assembled yet. Check: does the prop type support this
   case even if no story demos it? Does a test exercise it even if no story shows it visually? A
   real capability with no demo is a docs gap, not a SPEC DEBT — build the demo.

2. **Consult the documented canon of that component class, as a coverage OUTLINE only.** What
   does every serious library document for a Checkbox — indeterminate, groups, label placement,
   controlled vs. uncontrolled? Use this exclusively to know *which sections a Checkbox page
   should have the shape to include*, then fill each section from this repo's actual code. Two
   hard rules:
   - Never copy foreign prose. The outline tells you a "controlled vs. uncontrolled" section
     should exist; it does not supply the sentence that goes in it.
   - Never document behavior this library does not have. If the canon outline expects a
     `defaultIndeterminate` prop and this component doesn't have one, that section is omitted
     entirely (or becomes a SPEC DEBT entry if the omission looks like an unintentional gap
     worth flagging) — never invented to match the outline.

3. **If network access is available, equivalents' docs may be checked for COVERAGE COMPARISON
   only** — which sections exist on their page, never their content. This is the same rule as
   step 2, just extended to real external references instead of general model knowledge. If
   network access is unavailable, skip this step silently; it's optional, not blocking.

4. **Only after steps 1-3 fail to produce real material: emit a SPEC DEBT entry.** Name exactly
   what's missing and which truth source would resolve it (e.g. "Table's sortable-columns demo
   needs a real sortable dataset story — none exists; `Table.stories.tsx` only shows a static
   3-row example"). The page gets a placeholder for that specific section, linking to the SPEC
   DEBT entry by name — never a silently blank section, never invented filler.

## Provenance stamping

Every content block sourced through this protocol carries a stamp, one of:

- `derived-from-source` — read directly from the component's `.tsx`/type file.
- `derived-from-tests` — backed by an assertion in a real test/conformance spec.
- `researched-canon` — shaped by step 2's coverage outline, content still 100% from this repo's
  own code (never omit this stamp just because the *shape* came from general knowledge — the
  reader should be able to tell prose that followed a known-good outline from prose invented
  wholesale).
- `spec` — sourced from a DECISIONS/spec doc (rank ⑤ truth source, prose intent).

A block with no stamp and no real backing is the Honesty Rule violation this protocol exists to
prevent — every behavior claim must be backed by code that runs or a test that exists.
