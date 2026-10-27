# Page contract — what a docs site exposes so kiln's gates can check it

kiln's docs gates (`tooling/docs/gates.mjs` in the engine) run against the **built** site of any
system. They never read a system's class names. They read the data attributes below, so every docs
app kiln builds (and kiln's own `templates/docs-app`) renders them. A gate that finds none of its
markers FAILS with "NOTHING FOUND" — a missing marker is never a pass.

Paths and lists come from `system/kiln.config.json` → `docs` (see "Config" at the end).

## Shell

| Marker | On | Used by |
|---|---|---|
| `nav[data-book-nav]` | the chapter nav | G-S1, G-IA1 |
| `[data-planned]` + `data-wave="N"` | a nav entry for a catalog item not built yet (not a link) | G-IA1 |
| `#page-title` (tabIndex −1) | the chapter heading | G-S1, G-S5 |
| `button[data-menu-toggle]` | the narrow-screen Menu button | G-S1, G-S2 |
| `[data-surface]` | every panel / card the page is built from | G-S3 spacing |
| `[data-theme-control] button[data-theme-value="light|dark|system"]` | theme switch | G-T1 |
| `[data-scene-control] button[data-scene-value]` | backdrop switch (systems with scenes) | evidence |

## Code and copy

| Marker | On | Used by |
|---|---|---|
| `[data-codeblock]` containing `pre` and `button[data-copy]` | every code block | G-C1, G-C2 |
| `pre[data-clipped]` | a long block shown shortened | G-C2 |
| `button[data-copy-token]` | token copy in tables | G-C2 |

## Foundations

| Marker | On | Used by |
|---|---|---|
| `[data-playground]` with `[data-controls]` and `[data-preview]` | each foundation playground | G-F1 |
| `[data-component="<Name>"]` on the root of every system component the docs render; every select, slider, checkbox, radio, switch and combobox on any docs page sits inside one. A visible native `<select>` fails outright: it opens the operating system's menu. If the system has no such component yet, build it before the docs need it | | G-N1 |

## Component pages

| Marker | On | Used by |
|---|---|---|
| route `/<componentsBase>/<slug>/<tab>` for every tab in config | | G-K1 |
| `[data-component-header]` with `[data-fact="status"]`, `[data-fact="updated"]`, `[data-fact="size"]` | shared header | G-K1, G-L1 |
| `[data-live-demo]` with `select[data-selector="theme"]` and `select[data-selector="variant"]` | header demo | G-K1 |
| `[data-registry="U1"…"U14"]` | each Usage section; or the same element with `data-na="reason"` and the reason as text | G-K2 |
| `[data-registry="U4"] tbody tr[data-option]` | one row per variant option | G-K3 |
| `[data-registry="U6"] tbody tr[data-option]` | one row per size option | G-K3 |
| `[data-deep-dive="<option>"]` with `[data-in-context]`, `[data-do]`, `[data-dont]` | per-variant block inside U12 | G-K4 |
| `[data-spec]` tables on the Style tab, each cell `data-token` + `data-value` | generated spec | G-K5 |
| `[data-registry="U10"] [dir="rtl"]`, `[data-overflow-demo]` | content demos | G-K8 |
| `[data-registry="U14"] a[data-reference][href^="http"]` | references | G-K7 |
| `[data-backdrops] [data-cell][data-theme][data-scene-kind="dark|bright"]` | backdrop matrix (Style tab) | G-B1 |
| `[data-history] tbody tr`, `[data-limitations] li`, `[data-a11y-duties] li` | lifecycle furniture | G-L1 |
| `[data-example]` | each live demo with code | demo floor |

## Reference pages

| Marker | On | Used by |
|---|---|---|
| `table[data-a11y-matrix] tbody tr` | accessibility matrix, one row per component | G-M1 |

## Config (`system/kiln.config.json` → `docs`)

```json
{
  "docs": {
    "app": "apps/docs",
    "dist": "apps/docs/dist",
    "routes": "apps/docs/src/book/routes.json",
    "meta": "apps/docs/src/book/meta.json",
    "componentsDir": "packages/react/src/components",
    "componentsPackage": "packages/react",
    "changelog": "packages/react/CHANGELOG.md",
    "componentsBase": "/components",
    "foundationsBase": "/foundations",
    "tabs": ["usage", "style", "code", "accessibility"],
    "themes": ["dark", "light"],
    "themeParam": "theme",
    "scenes": [],
    "sceneParam": "scene",
    "modes": ["normal", "reduced-transparency", "forced-colors"],
    "contrast": { "threshold": 4.5, "exception": null, "exceptionFloor": null, "harness": null, "gatingGroups": [], "infoGroups": [] },
    "tone": { "lint": null, "exclude": [] },
    "catalog": "docs/CATALOG.md",
    "benchmark": "marketplace/plugins/kiln/skills/docs-engine/benchmarks/carbon-depth.json",
    "depthRatio": 0.5
  }
}
```

`scenes` empty = the system has no backdrop photos; evidence then measures each theme once.
