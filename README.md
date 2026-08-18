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

## Install

```bash
npx github:tanawitchsaentree/Kiln
```

That runs both setup steps for you. If you'd rather do it by hand, or from inside Claude Code:

```
/plugin marketplace add tanawitchsaentree/Kiln
/plugin install kiln@kiln-marketplace
```

Or from the CLI:

```bash
claude plugin marketplace add tanawitchsaentree/Kiln
claude plugin install kiln@kiln-marketplace
```

## Use

Once installed, just describe what you're building — a design system, a docs site, an audit of an
existing one — and kiln activates per its own SKILL.md description. Or invoke a verb directly:

```
kiln study <image or URL>
kiln audit <target>
kiln extend <target>
kiln component <name>
kiln docs
```

See `plugins/kiln/skills/kiln/SKILL.md` for the full verb table and phase sequence.

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
```

## Gate Proof discipline

Every gate any of these skills checks (six-axis vector arithmetic, spacing clearance/rhythm,
form-recipe markers, docs density floors) is proven by planting a real violation, confirming red
with the exact measured value, reverting, and confirming green again — not asserted from reading
source. See each skill's own `references/gates.md` (or equivalent) for the exact protocol.

## License

MIT
