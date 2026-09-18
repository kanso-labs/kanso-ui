# Kanso UI

[![npm version][npm-version-shield]][npm]
[![npm downloads][npm-downloads-shield]][npm]
[![License][license-shield]][license] [![Build][build-shield]][build-workflow]
[![Test][test-shield]][test-workflow] [![Coverage][coverage-shield]][codecov]

A React component library built on [StyleX](https://stylexjs.com) and
[React Aria Components](https://react-aria.adobe.com), with design tokens
sourced from a single
[W3C Design Tokens (DTCG)](https://design-tokens.github.io/community-group/format/)
file and compiled via [Style Dictionary](https://styledictionary.com).

Every component is documented in Storybook, published from the latest release at
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

### React Aria utilities

The components are built on
[React Aria Components](https://react-aria.adobe.com), and the utilities an app
needs around them come from this package too: `I18nProvider` and
`RouterProvider`, `Collection`, `VisuallyHidden`, `Focusable` and `Pressable`,
`SharedElement` and `SharedElementTransition`, `Virtualizer` with its layouts,
the `useFilter`, `useListData`, `useTreeData` and `useAsyncList` hooks,
`useDragAndDrop` with `useDrag`, `useDrop`, the drop item guards and
`DIRECTORY_DRAG_TYPE`, `useLocale`, `parseColor` and `getColorChannels`,
`TokenFieldValue`, and the `Key`, `Selection`, `SortDescriptor` and `PressEvent`
types.

A virtualized collection needs to be told how tall its rows are, and
`collectionSizes` is what the collections here measure — `listRow`, `menuRow`,
`tableRow` and the rest — so a `Virtualizer`'s `layoutOptions` take a number the
components agree with rather than one guessed at the call site.

```tsx
import { I18nProvider, useListData } from '@kanso-labs/kanso-ui'
```

**Do not install `react-aria-components` alongside this package.** A second copy
of the library carries a second set of contexts, and the two never meet: a
`Button` placed inside a `Sheet` from this package opens nothing when the
trigger context it looks for belongs to your copy. Everything above is the same
object the components use, which is what keeps them talking to each other.

### Date values

The date components — `DatePicker`, `DateField`, `Calendar`, `RangeCalendar`,
`DateRangePicker` and `TimeField` — take the values
[`@internationalized/date`](https://react-spectrum.adobe.com/internationalized/date/)
builds, and this package publishes them at its own `./date` subpath:

```ts
import {
  CalendarDate,
  getLocalTimeZone,
  today,
} from '@kanso-labs/kanso-ui/date'
```

**Do not install `@internationalized/date` alongside this package.** A
`CalendarDate` built from a second copy is a different class, and a `Calendar`'s
`value` rejects it. The subpath is what makes installing it unnecessary, and it
is a subpath rather than part of the main entry so an app with no date component
pays nothing for it.

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
<div style={{ overflowAnchor: 'none', overflowY: 'auto' }} onScroll={onScroll}>
  <AppBar
    collapsed={scrollTop > 24}
    contentMaxInlineSize="960px"
    headline="Headline"
    scrolled={scrollTop > 0}
    size="large"
  />
  {page}
</div>
```

The scroll container needs `overflow-anchor: none`. Collapsing hands the page
back the height the bar gives up, and a browser answers that by moving the
scroll offset the same distance so the content underneath stays put — which is
the offset `collapsed` was derived from, so the bar expands again and the two
take turns. Turning anchoring off is also the movement you want, since the
content then follows the bar's bottom edge up instead of standing still behind
it.

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
```

`Button` and `IconButton` take `href` instead: given one, they render an `<a>`
with the same styles and ripple, announced as the link it is.

```tsx
<Button href="/items/1">Label</Button>
```

The overlays — `Sheet`, `Dialog` and `Popover` — are opened by a `Button` or
`IconButton` placed directly inside them, and closed by any button inside their
content given `slot="close"`:

```tsx
<Sheet>
  <Button>Open</Button>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>Headline</Sheet.Title>
      <IconButton aria-label="Close" slot="close">
        <CloseIcon />
      </IconButton>
    </Sheet.Header>
  </Sheet.Content>
</Sheet>
```

An open overlay carries a visually hidden dismiss button for screen readers,
whose label React Aria ships in some thirty languages. A bundler includes all of
them unless told which the app supports; React Aria's
[`@react-aria/optimize-locales-plugin`](https://www.npmjs.com/package/@react-aria/optimize-locales-plugin)
is how an app says so.

### Icons

The package ships no glyph icons, so every icon comes from the app — an icon
set, or an inline SVG of its own. Three things are asked of it:

- **`aria-hidden`**, since the control around it carries the name. An
  `IconButton` takes its name from `aria-label`, and a field's icon is
  decoration beside a label that already says what the field is for.
- **`currentColor`** for `fill` or `stroke`, so the icon takes the colour the
  slot sets — muted in a field, the on-container role inside a filled button,
  and the disabled fade in either.
- **`1em` square**, which is what makes one icon serve every size.

```tsx
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" />
    </svg>
  )
}
```

`1em` works because the slots that own an icon's size set it as a font size, and
the icon inherits it:

| Slot                                       | Size an `em` icon takes                              |
| ------------------------------------------ | ---------------------------------------------------- |
| `IconButton`                               | 20px, 24px, 24px, 32px and 40px across `xs` to `xxl` |
| A field's `leadingIcon` and `trailingIcon` | 24px                                                 |
| `SegmentedButton.Segment`'s `icon`         | 18px                                                 |

**The `leading` and `trailing` slots on a row are different.** A list item, a
menu item, a tree item and an app bar set no icon size, so an icon there takes
the size of the text beside it — 16px in a list row. Give an icon in one of
those a size of its own:

```tsx
<ListItem leading={<StarIcon height="24" width="24" />}>Headline</ListItem>
```

An SVG with a `viewBox` and no size at all has no size to shrink from, so what
it does next belongs to the slot rather than to the icon. In an `IconButton` it
fills the button edge to edge; in a field's icon slot it collapses and draws
nothing. Sizing it is what avoids both.

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
themselves (`colors`, `typography`, `spacing`, `radii`, `shadows`,
`stateLayerOpacity` and `motion`) aren't part of the public API yet; open an
issue if you need them exported.

## Development

Fork, then clone the repository:

```shell
git clone https://github.com/your-username/kanso-ui.git
```

Install with the Node version in [`.tool-versions`](.tool-versions). CI resolves
it from that file, and an older npm rewrites `package-lock.json` as it installs.
If `node --version` disagrees:

```shell
mise exec node@"$(awk '/^nodejs/{print $2}' .tool-versions)" -- npm install
```

`npm install` also fetches the Playwright browsers the tests run in, through the
`prepare` script.

### The commands CI runs

Between them these are the whole gate:

```shell
npm run lint   # oxlint, then ESLint, then oxfmt --check
npm run build  # tsc -b, then tsdown into dist/
npm test       # Storybook story tests, vitest in headless Chromium
```

`npm run package:check` runs publint over `dist/`, so it needs a build first.

**oxfmt formats this repository, not Prettier**, and it covers Markdown, JSON
and YAML as well as TypeScript. `npm run lint -- --fix` will not reformat
anything — reach for `npm run format`.

### Everything else

| Command                           | What it does                                          |
| --------------------------------- | ----------------------------------------------------- |
| `npm run storybook`               | the component playground (`npm run dev` is an alias)  |
| `npm run build-storybook`         | that playground as a static site, as CI publishes it  |
| `npm run test:coverage`           | the suite with v8 coverage, written to `coverage/`    |
| `npm run tokens:build`            | regenerate `src/tokens/design.tokens.*` from the JSON |
| `npm run component:new -- <name>` | scaffold `src/components/<name>` and its entries      |

[`AGENTS.md`](AGENTS.md) carries the conventions every component follows, the
reasoning behind them, and the traps. It is written for coding agents and is
equally the fullest thing a human contributor can read.

Contribution guidelines for the organization are in
[`kanso-labs/.github`](https://github.com/kanso-labs/.github).

## License

MIT

[build-shield]:
  https://img.shields.io/github/actions/workflow/status/kanso-labs/kanso-ui/build.yaml?branch=main&label=Build
[build-workflow]:
  https://github.com/kanso-labs/kanso-ui/actions/workflows/build.yaml
[codecov]: https://codecov.io/gh/kanso-labs/kanso-ui
[coverage-shield]:
  https://img.shields.io/codecov/c/github/kanso-labs/kanso-ui?label=Coverage
[license]: ./LICENSE
[license-shield]: https://img.shields.io/github/license/kanso-labs/kanso-ui
[npm]: https://www.npmjs.com/package/@kanso-labs/kanso-ui
[npm-downloads-shield]: https://img.shields.io/npm/dm/@kanso-labs/kanso-ui
[npm-version-shield]: https://img.shields.io/npm/v/@kanso-labs/kanso-ui
[test-shield]:
  https://img.shields.io/github/actions/workflow/status/kanso-labs/kanso-ui/test.yaml?branch=main&label=Test
[test-workflow]:
  https://github.com/kanso-labs/kanso-ui/actions/workflows/test.yaml
