# kiln-ds-tokens

Design tokens for **kiln-ds** in three tiers (primitive → semantic → component), built from DTCG
JSON. Most projects install the React package instead, which carries these tokens inside it; this
package is for projects without React.

```sh
npm install kiln-ds-tokens            # or the tarball from `pnpm run release:pack`
```

| Entry | What it is |
|---|---|
| `kiln-ds-tokens/css` | Every `--ds-*` custom property, the theme blocks and the responsive layout blocks |
| `kiln-ds-tokens/js` | ESM `tokens` (resolved values) and `cssVar` (`var()` references), typed with `TokenName` |
| `kiln-ds-tokens/scss` | `$ds-*` (var() references) and `$ds-raw-*` (resolved values, for media queries) |
| `kiln-ds-tokens/json` | Every token with tier, type, reference, resolved value and its reason |

```css
@import 'kiln-ds-tokens/css';
.note { padding: var(--ds-gap-inset); border-radius: var(--ds-corner-inner); }
```

```js
import { tokens, cssVar } from 'kiln-ds-tokens/js';
```

Use `cssVar` in styles so themes keep working; use `tokens` (resolved values) only where custom
properties can't go, such as media queries or canvas. The full reference is the docs book, chapter
Reference → Tokens.
