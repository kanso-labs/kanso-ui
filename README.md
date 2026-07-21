# Kanso UI

A React component library built on [StyleX](https://stylexjs.com) and
[Base UI](https://base-ui.com), with design tokens sourced from a single
[W3C Design Tokens (DTCG)](https://design-tokens.github.io/community-group/format/)
file and compiled via [Style Dictionary](https://styledictionary.com).

## Installation

```bash
npm install kanso-ui
```

## Usage

```tsx
import { Button } from 'kanso-ui'

function Example() {
  return <Button>Click me</Button>
}
```

Components render correctly with no further setup — every design token has a
built-in default, in both light and dark (respecting the OS-level
`prefers-color-scheme`).

## Theming

Every design token — color, spacing, radii, shadows, typography, state-layer
opacity — is backed by a CSS custom property under the `--kui-*` namespace.
Override any of them in your own stylesheet to retheme every Kanso component,
independent of your app's build tooling:

```css
:root {
  --kui-color-primary: #ff5722;
  --kui-color-on-primary: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --kui-color-primary: #ffab91;
    --kui-color-on-primary: #3e0800;
  }
}
```

Overrides must target `:root` (or another selector matching the `<html>`
element) — components resolve their tokens once, at the root, so redeclaring a
`--kui-*` property on a smaller scope (e.g. a wrapping `<div>`) doesn't reach
them.

[`kanso-ui/tokens.css`](src/tokens/design.tokens.css) is the canonical,
generated reference for every available variable and its current default value —
useful for discovering names, not required at runtime (components already carry
their defaults inline):

```ts
import 'kanso-ui/tokens.css'
```

### For StyleX consumers

If your app also uses StyleX, theme with
[`stylex.createTheme()`](https://stylexjs.com/docs/learn/theming/) instead — it
produces a scoped override class rather than a global one. The token objects
themselves (`colors`, `spacing`, `typography`, `radii`, `shadows`,
`stateLayerOpacity`) aren't part of the public API yet; open an issue if you
need them exported.

## Development

- `npm run storybook` — component playground
- `npm run tokens:build` — regenerate `src/tokens/design.tokens.*` from
  `src/tokens/design.tokens.json`
- `npm test` — Storybook story tests (vitest, headless Chromium)
- `npm run build` — build the publishable package into `dist/`
