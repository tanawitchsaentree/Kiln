# Token architecture

Three tiers. Skipping the middle tier is the most common and most expensive mistake in a design
system, because it makes theming impossible without renaming everything.

## Tier 1 — Primitive

Raw values with descriptive names. `--blue-500`, `--space-4`, `--size-16`. No meaning, no context,
no opinion about use.

Components never reference these. Ever. A component using `--blue-500` cannot be themed.

Generated from a scale rather than picked individually. Colour ramps derive from an anchor via a
lightness curve, spacing derives from the unit, type derives from the ratio.

**Spacing specifically needs a second derivation pass beyond the raw scale — the `spacing-engine`
skill.** A base unit and a scale (e.g. steps of 0, 8, 16, 24, 32, and up) answer "what numbers
exist." They don't answer "which relationship gets which number" (bound-pair vs.
component↔component vs. section↔section),
and a scale with no relationship ladder is how a real numeral ends up sitting flush against its own
divider even though every individual spacing rule looks correct in isolation. Once the base unit and
lineage mood (spacious vs. dense) are set, invoke `spacing-engine` to derive the OPEN relationship
ladder (which scale step covers which relationship class) and lock it — see that skill's own
derivation protocol. Its IRON laws (scale purity, monotonic proximity, clearance, rhythm) apply to
every system regardless of scale; only the ladder's actual step assignments are per-system.

## Tier 2 — Semantic

What the value is for, not what it is. `--color-text-primary`, `--color-surface-raised`,
`--space-component-gap`, `--color-border-focus`.

This is the tier components use, and it is the tier a theme swaps. The name survives a full palette
change. If renaming a colour forces you to rename a semantic token, the semantic name was describing
the value rather than the role.

Test each name by asking whether it still makes sense in a mode where every value inverts. A token
called `--color-surface-white` fails. `--color-surface-default` passes.

## Tier 3 — Component

Only where a component genuinely needs a value nothing else does. `--button-height-compact`,
`--table-row-height`. Always aliases a semantic token rather than a primitive.

Most systems overuse this tier. A component token that could have been semantic is a semantic
decision hidden inside one component, and the second component with the same need will invent its
own.

## Naming

One convention, applied without exception. Category, then property, then variant, then state.
`color-text-primary-hover`, `space-inset-compact`, `border-width-focus`.

Decide singular or plural once. Decide whether the system prefixes everything. Decide the separator.
Write these down, because reviewers reject work on naming more than on anything else.

Never encode a value in a name. `--space-8` at tier 1 is fine because it is the value. `--gap-8` at
tier 2 is not, because the gap will change and the name will lie.

## Pipeline

The source of truth is one machine-readable file, not a stylesheet. DTCG JSON is the safe default.
Everything else is generated from it.

Target formats, their rules, and what must never be exported are in `references/export.md`.

Generation runs in CI. A token changed by hand in a generated file is the beginning of drift, and it
will be found six months later by someone who cannot tell which file is authoritative.

Version the token package independently and treat a token rename as a breaking change, because for
consumers it is.

## Source notes survive the pipeline

Every token carries its source note into the generated output as a comment or a description field.
DTCG has a `$description` field, so use it. A generated CSS file with no rationale is how a system
loses its reasoning within two years of the people who made it leaving.
