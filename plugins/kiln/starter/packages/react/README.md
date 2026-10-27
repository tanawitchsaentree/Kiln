# kiln-ds-react

React components for **kiln-ds**. The tokens are bundled inside, so this is the only package a
project needs.

```sh
npm install kiln-ds-react   # React 18+
```

```tsx
import 'kiln-ds-react/all.css';   // tokens and component styles in one file, once at the root
import { Container, Grid, GridItem, Stack } from 'kiln-ds-react';
```

| Entry | What it is |
|---|---|
| `kiln-ds-react` | The components (ESM and CJS, typed) |
| `kiln-ds-react/all.css` | Tokens, then component styles |
| `kiln-ds-react/styles.css` | Component styles only, for projects that load the tokens themselves |
| `kiln-ds-react/tokens.css`, `/tokens`, `/tokens.json` | The bundled tokens |

Every component, its props, keyboard behaviour and contrast evidence is in the docs book.
The tokens alone, for a project without React, are the separate package `kiln-ds-tokens`.
