# kiln

kiln makes every design system it builds declare a real lineage, a named tradition borrowed from
outside web design, before a single token gets written.

Most AI-generated design systems land on the same handful of choices. A warm off-white field. A
neutral grotesque typeface. An 8px, 1.25 spacing scale. One saturated accent. It doesn't matter what
they were actually asked to build. kiln's lineage requirement, plus a six-axis intensity vector
decided at the same time, is what breaks that pattern. Every claim it makes about the result
(contrast, spacing, form, density) is backed by a measured gate. Run the script. Read the number.

kiln is the orchestrator. Lineage becomes a vector, which becomes tokens, then components, then
docs, then gates. It calls into four bundled sub-skills at the points where a generic pass isn't
enough. You never have to remember to run them yourself.

| Sub-skill | Called from | What it does |
|---|---|---|
| `docs-engine` | `kiln docs` | A real Bootstrap or MUI grade documentation site, with a full content model and a gate set (G-D1 through G-D11) |
| `spacing-engine` | Phase 6, via the tokens foundation | Spacing rules measured in a real browser instead of eyeballed. Turns "spacing encodes relationship" into an actual measured gate |
| `form-language` | Phase 6, via the depth foundation | Works out what a control's shape should be, derived from its lineage reference, covering silhouette and depth per component class (control, input, surface, display, separator) |
| `variant-foundry` | Phase 6, for identity components | Generates candidates that are genuinely different from each other. Floor-filtered. Then judged by a role separate from the one that generated them |

This marketplace also carries design-system-forge, a separate design-system builder. Its five verbs
are build, audit, study, redesign, and audit-kit. It works from a seed all the way to tokens,
components, every component state, and dark mode, plus an art-directed docs shell. Its anti-generic
standard is checked against real, live artifacts from Anthropic and Google Material Design 3. It
ships a motion system so nothing sits static. It also ships an auto-audit hook that runs its checker
on every edit, automatically. See
`plugins/design-system-forge/skills/design-system-forge/SKILL.md` and its own `CHANGELOG.md` for
detail. It doesn't share kiln's lineage and vector pipeline. It's a different tool, bundled in the
same marketplace.

## Install

This one command installs kiln and design-system-forge together:

```bash
npx github:tanawitchsaentree/Kiln
```

Run that same command later to update both to the latest commit:

```bash
npx github:tanawitchsaentree/Kiln update
```

Then restart Claude Code. Quit it fully and reopen it. A new session or a `/reload` is not enough.
This is a real Claude Code requirement, and this script cannot do it for you. `claude plugin
update`'s own success message says "Restart to apply changes," and a plugin reported as "already
installed" does not mean it's the latest version. It's always the same two steps, install or
update, then restart.

Want just one of the two plugins? The marketplace step above is shared. Install only the one you
want from inside Claude Code:

```
/plugin marketplace add tanawitchsaentree/Kiln
/plugin install kiln@kiln-marketplace
/plugin install design-system-forge@kiln-marketplace
```

The CLI works the same way (`claude plugin marketplace add tanawitchsaentree/Kiln`, then `claude
plugin install <name>@kiln-marketplace`). Update one at a time with `claude plugin update
<name>@kiln-marketplace`. Running `install` again just reports "already installed" and skips the
version check.

## Use

Once installed, describe what you're building. A design system, a docs site, or an audit of
something that already exists all work. The right plugin activates on its own, per its own
SKILL.md description. You don't have to choose between them. Or invoke a verb directly:

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
.claude-plugin/marketplace.json   marketplace manifest (this repo)
plugins/kiln/
  .claude-plugin/plugin.json      plugin manifest
  skills/
    kiln/                         the orchestrator itself (phases, verbs, gates, lineages)
    docs-engine/
    spacing-engine/
    form-language/
    variant-foundry/
plugins/design-system-forge/
  .claude-plugin/plugin.json      plugin manifest
  skills/design-system-forge/     build, audit, study, redesign, audit-kit, anti-generic
                                   standard, motion system
  CHANGELOG.md
```

## Gate Proof discipline

Every gate any of these skills checks (six-axis vector arithmetic, spacing clearance and rhythm,
form-recipe markers, docs density floors) gets proven the same way. Plant a real violation. Confirm
red, with the exact measured value. Revert. Confirm green again. Nothing here is asserted just from
reading the source. See each skill's own `references/gates.md` (or equivalent) for the exact
protocol.

## License

MIT
