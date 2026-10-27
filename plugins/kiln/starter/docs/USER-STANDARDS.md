# User standards — Definition of Done for every system kiln builds

These came from the first real build (Pane, 2026-10-26). Each one the user had to ask for at least
once; the point of this file is that nobody asks again. Read it at Phase 0 and before calling any
docs or system work done. Every item has a gate that fails closed.

| # | Standard | Gate / where it lives |
|---|---|---|
| 1 | Anchor round before building: 3–4 variants of one concept-dense component, user picks one | CLAUDE.md rule 9 |
| 2 | A decided pick is never re-asked; sub-decisions are the agent's, stated in one line | CLAUDE.md rule 9 |
| 3 | Docs are a dense book: every chapter a page, content-model floors met | rule 10 · docs-engine content model |
| 4 | Shell: page-per-chapter opening at the top, collapsing Menu on narrow screens, container-owned spacing, no fade-in on page content | G-S1–G-S5 |
| 5 | Every rendered sentence passes human-tone lint | G-P1 / G-P2 · `tooling/tone-gate.mjs` |
| 6 | **Foundation pages are playgrounds**: at least one interactive control per page (range / select / toggle) that changes a live preview, plus copy-ready output of the current setting | G-F1 |
| 7 | **Copy is one click**: every code block shows a copy button without opening anything; tokens copy from any table; each component page has a short usage snippet | G-C1 / G-C2 |
| 8 | **Light and dark themes** from Phase 1: both tokenised, switchable (system / light / dark), and every contrast measurement runs in both | G-T1 · evidence runs per theme |
| 9 | **Backdrops**: every component page shows the component on a bright and a dark backdrop in both themes, and says in words what changes | G-B1 |
| 10 | Glass reads thin and clear; motion is slow and soft (≥400ms, long ease-out); reduced motion zeroes it | tokens · G-S5 |
| 11 | Packages install in another project: css/js(+types)/scss/json for tokens, ESM+CJS+types+css for components, release tarballs, smoke-tested. **One install, one import**: the React package carries the tokens (`npm i <name>-react`, `import '<name>-react/all.css'`), typechecked strictly in an empty project (2026-10-27: "กูจะติดตั้งอันเดียวได้หมดต้องไปทางไหน") | `tooling/smoke-import.mjs` checks 9–10 |
| 18 | **Every page knows what the best systems cover**: foundations, patterns and guides start from a topic list taken from at least three reference systems' equivalent pages, and every topic is covered with live, token-generated material or declined with a reason from the concept. The user should never be the one who finds a missing topic | `foundation-depth.md` · `benchmarks/topics/` · G-BT1 |
| 17 | **Derived, not recalled**: no component's form comes from a pattern library or habit (accent-stripe alerts, icon-disc notifications, default Radix popovers, iOS sliders). Each is derived from the principles, compared against the default it avoids, rendered three ways and picked by the user before code. Benchmarks decide documentation depth only | `references/derivation.md` · derivation-guard hook · G-X1 · rationale derivation checks |
| 16 | **Concept before design**: principles distilled from the concept come first, each with a consequence for every axis; every token, part, state and motion, seen or unseen, names its principle and a reason that is not taste (no "rounded because it looks nice"); the docs show the reasons | `references/concept.md` · `tooling/kiln/rationale.mjs` · G-W1 |
| 15 | **Plain docs chrome**: the reading layout is opaque and ordinary (top bar, side nav, content, on-this-page), however expressive the system is; the system's look appears only on demo stages in foundations, components and patterns. Docs text must be readable, fast and obviously clickable (≥16px reading text, clear link affordance, first frame final) | G-SH1 · G-R1 · G-A1 · G-PF1 · G-PF2 |
| 14 | **Carbon depth on every component page**: four tabs (Usage / Style / Code / Accessibility); Usage covers variants with purpose, numbered anatomy, sizes with use cases, emphasis, placement, combinations to use and avoid, content rules with live RTL and overflow, behaviours and states, a deep dive per variant with in-context examples, modifiers, ≥2 external references; Style is generated from computed style; usage depth ≥ 0.5 × Carbon's page for the same component. "Pilot" changes how many components, never how deep | `component-depth.md` · G-K1–G-K8, G-IA1 |
| 13 | **Every control is the system's own**: the docs build their controls from the system's components (Select with a crafted list popup, Slider, Checkbox, Switch…), never browser controls or docs-only CSS, in either theme. A control the docs need that the system lacks is built as a component first (2026-10-27: the dropdown still opened the macOS menu, and the slider was docs CSS, not part of the system) | G-N1 |
| 12 | **Reference-grade page furniture** (matches Carbon, Primer, Atlassian, HIG, GOV.UK): status label with criteria, per-component change history from the changelog, Limitations, a11y split into what-you-get / what-you-must-do / how-tested, and a component × test accessibility matrix that says "Not tested" honestly | G-L1 / G-M1 |
| 19 | **Questions up front, then silence**: every requirement question is asked once in one batch at the start (`system/INTAKE.md`); the anchor pick is the only later question; every other pick is the agent's, rendered, reasoned and listed in `system/REVIEW.md` for one review at the milestone (2026-10-27) | CLAUDE.md "Talking to the user" · rationale agent picks · milestone |
| 20 | **Replies in the user's language**, every message, long reports included; code and identifiers unchanged | CLAUDE.md "Talking to the user" |
| 21 | **Touch targets**: every control in a demo and in the shell takes a pointer over at least 44px each way (drawn smaller is fine, the hit area is not) | G-TT1 |
| 22 | **Green means green**: a milestone closes only on a full verify recorded on the code on disk, with no gate run by `--only` and none left advisory; facts in the book are checked against the code | `verify.mjs` · `milestone.mjs` · rule 15 |
| 23 | **The machine stays usable**: browser checks at `nice -n 19`, one preview server at most, no orphan processes, `verify:quick` while working | CLAUDE.md rule 16 · `verify.mjs` |
| 24 | **Nothing missing silently**: every `var(--ds-*)` resolves to a token; every page in the TOC is reachable from the nav at phone and desktop width; an in-page link lands clear of the sticky header | token-contract · G-NAV1 · G-SM1 |

If a new system can't meet one of these, record it in `system/EXCEPTIONS.md` with the narrowest
scope, the way E-001 records thin-glass contrast — never drop it silently.
