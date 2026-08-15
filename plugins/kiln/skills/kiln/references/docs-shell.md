# Documentation content model — what kiln owns

Loaded when building the documentation surface, and by `verbs/docs.md` at runtime.

**Chrome ownership settled by the Docs Final Pass order (standing decision 1): kiln does not own
chrome.** Frame, responsive collapse, theme-toggle placement, search shortcut, nav-tree behaviour,
and the three-region layout that used to be specified here are the docs framework's job —
Fumadocs, inside `apps/docs`, per that order's standing decision 2. This file no longer specifies
any of that. What follows is what kiln still owns: page types beyond the default content page, and
the token contract the chrome consumes.

**The component page template and density floors, gates, and cross-framework generation are owned
by the `docs-engine` skill** (bundled alongside this one in the same plugin — see its own
`../docs-engine/references/content-model.md` for the full structure and
`../docs-engine/references/gates.md` for the G-D gate set, including the computed density floor
`demo_count ≥ variant_count + 3`). This file no longer
specifies a competing template — treat `docs-engine`'s content model as canonical for "is this page
dense/complete enough," and use this file only for the token-contract prose below and any page type
beyond the default component page. A project may additionally keep its own project-specific IA
document (Dial's own build used one at `docs/DOCS-IA.md`) for anything framework-specific
`docs-engine` deliberately keeps out of scope — that file is project state, not something this skill
ships or requires.

## Page types beyond the default content page

The default content page is the component page — DOCS-IA's 13-point structure covers it, and this
file has nothing further to add there. Beyond it, name whichever of these the project actually
needs; none is mandatory by default:

**Overview/landing.** What the system is, in one paragraph, linking to foundations and components.
Not a marketing page — the reader arrived looking for something specific.

**Foundations page** (one per token category — colour, type, spacing, motion, icons, etc.). Values
read live from the built token output at build time, never hand-copied into the page's own source.
See "Token contract" below for what "live" means concretely.

**API/reference index.** A single page listing every shipped component with its status if the
project has a status model — useful once the component count is large enough that the nav tree
alone doesn't answer "what exists" quickly.

**Changelog.** Per-version, before/after for breaking changes, per `references/adoption.md` if that
file is loaded for the project's scale.

**Migration guide.** One per breaking change that isn't purely mechanical (mechanical renames ship
as a codemod instead, per `references/adoption.md`).

kiln does not ship a template file for these — they're infrequent enough per project that writing
one from the project's own real content, informed by the component-page template's conventions
(fixed section order, no invented content, live values not hand-copied), is more honest than
forcing a generic shape onto a changelog or a migration guide, which are inherently project- and
change-specific.

## Token contract — what the chrome consumes

The chrome (whichever framework owns it) reads kiln's tier-2 semantic tokens through exactly one
adapter file, never by re-typing a value. This is the boundary between the two vocabularies:

- Kiln's tier-2 semantic tokens are the single source of truth (surface, foreground/text, muted
  foreground, border, accent/action, code-block surface, at minimum — the actual set is whatever
  the project's semantic tier defines).
- The adapter file maps each of those onto the framework's own CSS variable names. The framework's
  variable is the alias; kiln's semantic name wins on any collision.
- If the framework's variable set has no slot for something kiln's tier-2 defines, extend the
  framework through its own documented extension point — never by forking its layout or overriding
  its generated CSS ad hoc.
- The adapter is a real file with a real diff. If a project changes a token, whoever changes it
  re-generates or re-reviews the adapter — this file does not specify the regeneration mechanism
  itself (that's implementation, project-specific), only that hand-retyping a value into the
  framework's namespace instead of updating the adapter is the failure mode this contract exists to
  prevent.
- Both modes (or however many modes the project ships) go through the same adapter — a mode is a
  different resolved value for the same semantic token name, not a second adapter file.

## Machine-readable surface

Independent of who owns the chrome: each component page should be parseable without a browser —
consistent heading structure, prop tables in a real table element with real headers, code blocks
tagged with their language. This falls out of building the page template correctly (see
`docs/DOCS-IA.md`) rather than needing its own separate mechanism, and is unaffected by which
framework renders the chrome around that content.
