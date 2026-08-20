# kiln

Design systems that carry a point of view — not another AI-generated default.

Most AI-generated design systems converge on the same handful of defaults — a warm off-white
field, a neutral grotesque, an 8px/1.25 spacing scale, one saturated accent — regardless of what
they were actually asked to build. kiln exists to stop that: every system it builds declares a real
lineage (a named tradition from outside web/UI) and a six-axis intensity vector before a single
token gets written, and every claim it makes about the result — contrast, spacing, form, density —
is backed by a measured gate, not a description of what the CSS should do.

kiln is the orchestrator. It runs the full pipeline (lineage → vector → tokens → components → docs
→ gates) and calls into four bundled sub-skills at the points where a generic pass isn't enough,
rather than making them separate things to remember to run:

| Sub-skill | Called from | What it does |
|---|---|---|
| `docs-engine` | `kiln docs` | A real Bootstrap/MUI-grade documentation site — content model + gate set (G-D1-G-D11) |
| `spacing-engine` | Phase 6, via the tokens foundation | Spacing rules actually measured in a browser instead of eyeballed — turns "spacing encodes relationship" into a measured gate |
| `form-language` | Phase 6, via the depth foundation | Derives what a control's SHAPE should be from its lineage reference, not just its color — per-component-class (control/input/surface/display/separator) silhouette+depth derivation |
| `variant-foundry` | Phase 6, for identity components | Generates genuinely distinct candidates instead of one safe default dressed up three ways — K-candidate generation, floor-filtered, judged by a role separated from the generator |

This marketplace also carries **design-system-forge** — a separate, self-contained design-system
builder (seed → tokens/components/states/dark-mode → an art-directed docs shell), with its own
five verbs (`build`/`audit`/`study`/`redesign`/`audit-kit`), a sourced anti-generic standard checked
against Anthropic's and Google Material Design 3's live artifacts, a motion system so nothing ships
static, and an auto-audit hook that runs its checker on every edit in a project it manages, not just
when someone remembers to ask for one. See
`plugins/design-system-forge/skills/design-system-forge/SKILL.md` and its own `CHANGELOG.md` for
detail — it doesn't share kiln's lineage/vector pipeline, it's a different tool bundled in the same
marketplace.

## Install

One command installs everything in this marketplace — kiln and design-system-forge both:

```bash
npx github:tanawitchsaentree/Kiln
```

Same command, later, to update both to the latest commit:

```bash
npx github:tanawitchsaentree/Kiln update
```

Then **restart Claude Code — fully quit and reopen, not just a new session or a `/reload`.** This
is a real Claude Code requirement, not something this script can do for you: `claude plugin
update`'s own success message says "Restart to apply changes," and a plugin merely reported as
"already installed" does not mean it's the latest version. That's it — two steps, every time,
install or update.

**Only want one of the two plugins?** The marketplace step is shared; install just the one you want
from inside Claude Code:

```
/plugin marketplace add tanawitchsaentree/Kiln
/plugin install kiln@kiln-marketplace
/plugin install design-system-forge@kiln-marketplace
```

or the CLI equivalent (`claude plugin marketplace add tanawitchsaentree/Kiln`, then `claude plugin
install <name>@kiln-marketplace`). Update one at a time the same way: `claude plugin update
<name>@kiln-marketplace` — not `install` again, which reports "already installed" and stops
without checking for a newer version.

## Use

Once installed, just describe what you're building — a design system, a docs site, an audit of an
existing one — and the right one of the two plugins activates per its own SKILL.md description; you
don't have to pick between them yourself. Or invoke a verb directly:

```
kiln study <image or URL>
kiln audit <target>
kiln extend <target>
kiln component <name>
kiln docs
```

See `plugins/kiln/skills/kiln/SKILL.md` and
`plugins/design-system-forge/skills/design-system-forge/SKILL.md` for each plugin's full verb table.

## Structure

```
.claude-plugin/marketplace.json   — marketplace manifest (this repo)
plugins/kiln/
  .claude-plugin/plugin.json      — plugin manifest
  skills/
    kiln/                         — the orchestrator itself (phases, verbs, gates, lineages)
    docs-engine/
    spacing-engine/
    form-language/
    variant-foundry/
plugins/design-system-forge/
  .claude-plugin/plugin.json      — plugin manifest
  skills/design-system-forge/     — build/audit/study/redesign/audit-kit, anti-generic standard,
                                     motion system
  CHANGELOG.md
```

## Gate Proof discipline

Every gate any of these skills checks (six-axis vector arithmetic, spacing clearance/rhythm,
form-recipe markers, docs density floors) is proven by planting a real violation, confirming red
with the exact measured value, reverting, and confirming green again — not asserted from reading
source. See each skill's own `references/gates.md` (or equivalent) for the exact protocol.

## License

MIT
