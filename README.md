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

### Layout

`Container` centres content at a measure, and `Stack` puts one gap from the
spacing scale between a row or a column of children. Between them they cover
page measure, section rhythm, and the ordinary rows and columns that would
otherwise be bespoke CSS in every consuming app:

```tsx
<Container>
  <Stack gap="xl">
    <Stack align="center" direction="row" justify="between">
      <Text variant="titleLarge">Headline</Text>
      <Button>Save changes</Button>
    </Stack>
    <Feed minItemWidth="260px">{items}</Feed>
  </Stack>
</Container>
```

Both are layout only: they paint no surface and wrap no child. `Stack` is why no
component here carries a margin of its own, since the space between two things
belongs to whatever holds both of them. For the page-level layouts — a list
beside a detail pane, a main pane with a companion — reach for `ListDetail` and
`SupportingPane` instead.

An `AppBar` that paints edge to edge can still line its contents up with the
page beneath it. Give it the page's measure and the page's gutter:

```tsx
<AppBar contentInset="24px" contentMaxInlineSize="960px" headline="Headline" />
<Container maxInlineSize="960px">{page}</Container>
```

`AppBar` takes `scrolled` and `collapsed`, and both are controlled — only the
app knows which element scrolls. A pinned flexible bar gives its height back as
the page scrolls, becoming the small bar:

```tsx
<AppBar
  collapsed={scrollTop > 24}
  contentMaxInlineSize="960px"
  headline="Headline"
  scrolled={scrollTop > 0}
  size="large"
/>
```

### Rendering as a different element

`Text` renders a `<span>`, which is right for a run of text inside a line and
wrong for a paragraph. `block` renders a `<p>` instead, so multi-sentence copy
needs no element named at the call site:

```tsx
<Text block>First sentence of the copy.</Text>
```

It carries no margin, the same as every other `Text`, so the space between two
paragraphs is a decision the container makes rather than one the browser makes
for it.

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
