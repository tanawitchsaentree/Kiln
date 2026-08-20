# Storybook Adapter — when to use it, and how

## The honest tradeoff

| | Custom shell | Real Storybook |
|---|---|---|
| Visual control | Total | Fights the chrome; theming is limited |
| Setup cost | None (static files) | Config, deps, build step |
| Interactive controls | You build them | Free via `argTypes` |
| Interaction / a11y testing | You build it | Free addons (`test`, `a11y`) |
| Ecosystem & familiarity | None | Engineers already know it |
| Works as a pitch artifact | Excellent | Looks like every other Storybook |
| Portability of output | Any host, no build | Needs build + deploy |

**Choose custom** for Level 3–4 systems, client-facing showcases, brand/design-led work, or when the docs themselves are part of the deliverable.

**Choose Storybook** for Level 1–2 systems inside an engineering org, when the team already uses it, or when interaction/visual-regression testing matters more than the docs' looks.

**Best of both:** build the custom shell as the marketing/overview surface *and* generate Storybook stories for engineering use. The token layer is shared, so this costs far less than it sounds — the stories are mostly mechanical once components exist.

---

## Setup

```bash
npx storybook@latest init
npm i -D @storybook/addon-themes @storybook/addon-a11y
```

## Theme decorator — wire the token layers in

The critical step: Storybook's preview iframe must load your token CSS and honor `data-theme`, or every story renders with unresolved variables.

```js
// .storybook/preview.js
import '../css/primitives.css'
import '../css/semantic.css'
import '../css/components/index.css'
import { withThemeByDataAttribute } from '@storybook/addon-themes'

export const decorators = [
  withThemeByDataAttribute({
    themes: { light: 'light', dark: 'dark' },
    defaultTheme: 'light',
    attributeName: 'data-theme',
  }),
]

export const parameters = {
  backgrounds: { disable: true },   // let --bg-canvas own the background
  controls: { expanded: true },
  options: {
    storySort: {
      order: ['Overview', 'Foundations', 'Components', 'Patterns'],
    },
  },
}
```

Make the preview body adopt the system canvas so dark mode isn't framed in white:

```css
/* .storybook/preview-head.html → inline <style>, or an imported css file */
body { background: var(--bg-canvas); color: var(--fg-default); }
```

---

## CSF3 story pattern

```js
// Button.stories.js
export default {
  title: 'Components/Button',
  render: ({ label, ...args }) => {
    const el = document.createElement('button')
    el.className = 'button'
    el.textContent = label
    Object.entries(args).forEach(([k, v]) => {
      if (v) el.dataset[k] = v
    })
    return el
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: { label: 'Button', variant: 'primary', size: 'md' },
}

export const Playground = {}

// The all-states story — the single most valuable story in any system.
// Uses the data-force attributes from shell-blueprint.md to render
// pseudo-states that can't otherwise appear simultaneously.
export const AllStates = {
  parameters: { controls: { disable: true } },
  render: () => {
    const states = ['default', 'hover', 'active', 'focus', 'disabled', 'loading']
    const wrap = document.createElement('div')
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,max-content);gap:24px'
    states.forEach(s => {
      const cell = document.createElement('div')
      const label = document.createElement('div')
      label.textContent = s
      label.style.cssText = 'font:500 11px/1 monospace;opacity:.6;margin-bottom:8px'
      const btn = document.createElement('button')
      btn.className = 'button'
      btn.textContent = 'Button'
      if (s === 'disabled') btn.disabled = true
      else if (s !== 'default') btn.dataset.force = s
      cell.append(label, btn)
      wrap.append(cell)
    })
    return wrap
  },
}
```

For React, the same shape with JSX — `render` returns an element and `argTypes` drives controls identically.

---

## Custom Storybook theme

You can restyle the manager (sidebar/toolbar) but **not** deeply — this is the ceiling that pushes brand-led work toward the custom shell.

```js
// .storybook/theme.js
import { create } from '@storybook/theming/create'

export default create({
  base: 'light',
  brandTitle: 'Your System',
  brandImage: './logo.svg',
  fontBase: '"Instrument Sans", sans-serif',
  fontCode: '"JetBrains Mono", monospace',
  colorPrimary: '#…',
  colorSecondary: '#…',      // drives selection/accent
  appBg: '#…',
  appContentBg: '#…',
  appBorderRadius: 6,
})
```

```js
// .storybook/manager.js
import { addons } from '@storybook/manager-api'
import theme from './theme'
addons.setConfig({ theme })
```

For richer docs pages, use MDX so each component page can carry real prose, anatomy, and do/don't sections rather than only auto-generated tables:

```mdx
{/* Button.mdx */}
import { Meta, Canvas, Controls } from '@storybook/blocks'
import * as ButtonStories from './Button.stories'

<Meta of={ButtonStories} />

# Button
Triggers an action. One primary per page.

<Canvas of={ButtonStories.Playground} />
<Controls />

## All states
<Canvas of={ButtonStories.AllStates} />
```

---

## Free wins worth turning on

```js
// .storybook/main.js
export default {
  stories: ['../**/*.stories.@(js|jsx|ts|tsx)', '../**/*.mdx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',       // axe on every story — catches contrast/ARIA gaps
  ],
}
```

The a11y addon does a real chunk of System 6's verification automatically. Run it across all stories in both themes before claiming the system passes — and note that it catches contrast and ARIA issues but **not** keyboard-order or focus-restore bugs, which still need a manual tab-through.

---

## Porting between the two

Because components read only CSS variables, nothing about them changes between shells. Migration is:

1. Copy `css/primitives.css`, `semantic.css`, `components/*` unchanged
2. Import them in `preview.js`
3. Write one `.stories.js` per component (Playground + AllStates minimum)
4. Wire the theme decorator to the same `data-theme` attribute

This is the payoff of the 3-layer token model: the shell is swappable, the system isn't.
