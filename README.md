# Kanso UI

A React component library built on [StyleX](https://stylexjs.com) and
[Base UI](https://base-ui.com), with design tokens sourced from a single
[W3C Design Tokens (DTCG)](https://design-tokens.github.io/community-group/format/)
file and compiled via [Style Dictionary](https://styledictionary.com).

Every component is documented in Storybook, published from `main` at
**[kanso-ui.kansolabs.org](https://kanso-ui.kansolabs.org/)**.

## Installation

```bash
npm install @kanso-labs/kanso-ui
```

## Usage

```tsx
import { Button } from '@kanso-labs/kanso-ui'

function Example() {
  return <Button>Click me</Button>
}
```

Components render correctly with no further setup. Importing from the package
pulls in the stylesheet the library compiles, every design token has a built-in
default, in both light and dark (respecting the OS-level
`prefers-color-scheme`), and every component sizes itself with
`box-sizing: border-box` rather than leaving that to a reset you supply.

A bundler is what resolves that stylesheet. In an environment that cannot import
CSS from JavaScript — some server-side renderers, or a plain Node process —
import it yourself instead and the components style themselves the same way:

```ts
import '@kanso-labs/kanso-ui/styles.css'
```

`className` and `style` reach the element a component renders, so a component is
positioned from the call site like any other element:

```tsx
<Card className="col-span-2" style={{ marginBlockStart: '2rem' }} />
```

StyleX compiles the library's own rules into a CSS `@layer`, and your app's
stylesheet is unlayered, so your rules win the cascade wherever the two meet —
no specificity contest, and no `!important`.

`AppBar` takes `scrolled` and `collapsed`, and both are controlled — only the
app knows which element scrolls. A pinned flexible bar gives its height back as
the page scrolls, becoming the small bar:

```tsx
<AppBar
  collapsed={scrollTop > 24}
  headline="Headline"
  scrolled={scrollTop > 0}
  size="large"
/>
```

### Rendering as a different element

`render` swaps the element a component produces, keeping its styling:

```tsx
<Text render={<h2 />}>Headline</Text>
<Card render={<a href="/items/1" />}>First item</Card>
<Button render={<a href="/items/1" />}>Label</Button>
```

`Button` and `IconButton` read the tag off `render` and tell Base UI whether it
is a real `<button>`, so an anchor needs no `nativeButton={false}` and logs no
error. Base UI then supplies the button semantics that anchor has no native
version of, which means it is announced as a **button** rather than as a link.
For a control that should be announced as the link it is, reach for `Link`, or
`Card` with `render`.

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

[`@kanso-labs/kanso-ui/tokens.css`](src/tokens/design.tokens.css) is the
canonical, generated reference for every available variable and its current
default value — useful for discovering names, not required at runtime
(components already carry their defaults inline):

```ts
import '@kanso-labs/kanso-ui/tokens.css'
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
- `npm run build-storybook` — build that playground as a static site, the same
  way the `Deploy Storybook` workflow does
- `npm run tokens:build` — regenerate `src/tokens/design.tokens.*` from
  `src/tokens/design.tokens.json`
- `npm test` — Storybook story tests (vitest, headless Chromium)
- `npm run build` — build the publishable package into `dist/`
