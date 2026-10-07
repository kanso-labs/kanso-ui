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

Coming from an earlier 0.x release? [`UPGRADING.md`](UPGRADING.md) lists every
breaking change on the way to 1.0, with the edit each one asks for.

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

A bundler is what resolves that stylesheet, so the package always loads through
one. The main entry imports `./styles.css` itself and Node has no loader for
CSS, so in plain Node an `import` or a `require()` of `@kanso-labs/kanso-ui`
throws `ERR_UNKNOWN_FILE_EXTENSION`; `@kanso-labs/kanso-ui/date` is the one
entry plain Node can load. A server renderer or a test runner that leaves
dependencies to Node takes one setting to hand this package to its bundler
instead, and [Server rendering and tests](#server-rendering-and-tests) gives it
for Vite, Vitest and Jest.

The same stylesheet is published on its own, as
`@kanso-labs/kanso-ui/styles.css`, for CSS that loads it apart from the
JavaScript: an `@import` in a stylesheet of your own, or a `<link>`. It adds the
rules and nothing else, so it is not a way round the main entry's own import.

`className` and `style` reach the element a component renders, so a component is
positioned from the call site like any other element:

```tsx
<Card className="col-span-2" style={{ marginBlockStart: '2rem' }} />
```

### Ordering the library's rules

StyleX compiles the library's own rules into one CSS cascade layer, named
`kanso`. A stylesheet of your own that is not layered beats every rule in it
wherever the two meet — no specificity contest, and no `!important`.

CSS that is layered takes its place from the order its layers are named in, so
an app whose CSS is layered names the order. Tailwind v4 writes its preflight
into `base` and its utilities into `utilities`; put `kanso` between them, so a
utility on the call site wins and the preflight does not empty a button:

```css
@layer theme, base, kanso, components, utilities;
@import 'tailwindcss';
```

A reset that is not layered — Tailwind v3's preflight, or a normalize sheet —
beats every layered rule, the library's included, and turns a filled button
transparent. Give it a layer ordered before `kanso`:

```css
@layer reset, kanso;
@import 'modern-normalize.css' layer(reset);
```

A layer's place is fixed where it is first named, so the statement goes at the
top of the stylesheet your app loads first, ahead of the library's.

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

### Localisation

Wrap the app in `I18nProvider`, which this package re-exports, and every word
the components write follows its locale. React Aria names most of the controls
they draw, in some thirty languages: an overlay's dismiss button, a field's
clear button and steppers, a snackbar's close, a chip's remove, a row's
selection box, a column's resize handle, a picker's trigger and a colour
picker's strips.

Five strings have no word in React Aria, so this package carries them in the
same locales React Aria ships:

- the ring a pending `Button` or `IconButton` shows,
- a collection's loading-more row,
- `CopyField`'s button and what it announces once it has copied,
- and a field's character limit.

These translations are the package's own, and a wrong one is worth an issue.
Every string sits behind a prop for the call site's own words: `pendingLabel`, a
`LoadMore`'s `label`, `copyLabel`, `copiedLabel` and `characterLimitLabel`. The
names React Aria gives sit behind `clearLabel`, `closeLabel` and the rest.

Numbers follow the provider too: `Currency` writes its amount, and a field its
character count, in the locale's digits and grouping.

A bundler includes every language unless told which ones the app supports. React
Aria's
[`@react-aria/optimize-locales-plugin`](https://www.npmjs.com/package/@react-aria/optimize-locales-plugin)
is how an app says so for React Aria's own tables. This package's table is one
small module, included whole.

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
    size="lg"
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
named in the reader's language like every other control here; see
[Localisation](#localisation).

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
| `Button`'s `icon`                          | 20px, 20px, 24px, 32px and 40px across `xs` to `xxl` |
| `Chip`'s and `ChipGroup.Chip`'s `icon`     | 18px                                                 |
| `IconButton`                               | 20px, 24px, 24px, 32px and 40px across `xs` to `xxl` |
| A field's `leadingIcon` and `trailingIcon` | 24px                                                 |
| `SegmentedButton.Segment`'s `icon`         | 18px                                                 |
| `Tabs.Tab`'s `icon`                        | 24px                                                 |

**The `leading` and `trailing` slots on a row are different.** A list item, a
menu item, a tree item and an app bar set no icon size, so an icon there takes
the size of the text beside it — 16px in a list row. Give an icon in one of
those a size of its own:

```tsx
<ListItem leading={<StarIcon height="24" width="24" />}>Headline</ListItem>
```

An SVG with a `viewBox` and no size at all has no size to shrink from, so what
it does next belongs to the slot rather than to the icon. In an `IconButton` it
fills the button edge to edge; in a field's icon slot or a `Button`'s it
collapses and draws nothing. Sizing it is what avoids both.

### Server components

Every component is a client module, so a server component — a page or a layout
in the Next.js App Router — imports and renders one directly:

```tsx
// app/page.tsx
import { Button } from '@kanso-labs/kanso-ui'

export default function Page() {
  return <Button href="/start">Start</Button>
}
```

Four things follow from where that boundary falls.

- **Only serialisable props cross it.** A string, a number or a plain object
  reaches the component from a server component; a function does not, so
  `onPress` and a `render` callback belong in a client component of your own.
  Neither does a class instance, so a `CalendarDate` for a date component is
  built on the client side too.
- **A sub-part is rendered by its own name**, as in `DialogTitle` or `MenuItem`.
  A server component cannot reach into a client module through a property, so
  `<Dialog.Title>` works only from a client component, while every part is also
  exported as its component's name followed by the part's: `SheetContent`,
  `TableRow`, `NavigationTreeItem`. `List.Item` is `ListRow`, since the
  standalone `ListItem` already has that name:

  ```tsx
  // app/settings/page.tsx
  import { Button, Sheet, SheetContent, SheetTitle } from '@kanso-labs/kanso-ui'

  export default function Page() {
    return (
      <Sheet>
        <Button>Open</Button>
        <SheetContent>
          <SheetTitle>Headline</SheetTitle>
        </SheetContent>
      </Sheet>
    )
  }
  ```

- **The React Aria utilities the package re-exports are client-only** —
  `I18nProvider`, `useListData`, `parseColor` and the rest. `collectionSizes`,
  `colorScheme` and `themeScope` are plain values and work on either side.
- **A server-rendered app wraps its tree in `I18nProvider`** with the request's
  locale. React Aria reads the browser's locale on the client and has none on
  the server, so without it a date or a number can render differently on the two
  and fail hydration.

### Server rendering and tests

The main entry imports its own stylesheet, so the package has to reach a bundler
wherever it runs. Three tools hand dependencies to Node by default, and each has
a setting that sends this package through its bundler instead.

**Vite's server rendering** leaves dependencies to Node, in `vite dev` and in a
built server alike, so the server of a Vite-based framework — React Router's
framework mode, TanStack Start, Astro, Vike — throws
`ERR_UNKNOWN_FILE_EXTENSION` for `dist/styles.css` as it starts. Name the
package in `ssr.noExternal`, wherever the framework takes its Vite settings
(Astro's sit under `vite` in `astro.config.mjs`):

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: { noExternal: ['@kanso-labs/kanso-ui'] },
})
```

**Vitest** leaves dependencies to Node too, so the first test that imports a
component fails with `Unknown file extension ".css"`. Inline the package:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { server: { deps: { inline: ['@kanso-labs/kanso-ui'] } } },
})
```

**Jest** wants a stand-in for the stylesheet, since it has no loader for CSS,
and a transform for the package, since the package is ES modules:

```js
// jest.config.cjs
module.exports = {
  moduleNameMapper: { '\\.css$': '<rootDir>/style-stub.cjs' },
  transformIgnorePatterns: [
    '^(?!.*/node_modules/@kanso-labs/kanso-ui/).*/node_modules/',
  ],
}
```

`style-stub.cjs` is `module.exports = {}`, and the transform needs a Babel
config that compiles modules to CommonJS, such as `@babel/preset-env`. The
pattern is written to let in everything under the package, its own
`dist/node_modules` included, which carries StyleX's runtime: the shorter
`/node_modules/(?!@kanso-labs/kanso-ui/)` matches again at that second
`node_modules` and leaves the runtime untransformed. On Node 24.9 or newer, Jest
30 can load the package as ES modules instead, under
`NODE_OPTIONS=--experimental-vm-modules`, and then needs the `moduleNameMapper`
alone.

## Theming

Every design token — color, spacing, radii, sizing, shadows, typography,
state-layer opacity — is backed by a CSS custom property under the `--kui-*`
namespace. Override any of them in your own stylesheet to retheme every Kanso
component, independent of your app's build tooling:

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

Overrides on `:root` reach the whole page. To theme part of one, declare them on
a `ThemeScope` instead — see [Theming part of a page](#theming-part-of-a-page).

[`@kanso-labs/kanso-ui/tokens.css`](src/tokens/design.tokens.css) is the
canonical, generated reference for every available variable and its current
default value — useful for discovering names, not required at runtime
(components already carry their defaults inline):

```ts
import '@kanso-labs/kanso-ui/tokens.css'
```

### Theming part of a page

The tokens resolve once, on `:root`, and every component inherits them already
resolved, so a `--kui-*` property redeclared on a smaller element — a wrapping
`<div>` — reaches nothing on its own. `ThemeScope` resolves them again on an
element of its own. An override declared on the scope, through `className` or
`style`, or on any element around it, reaches every component inside, and the
rest of the page keeps its own tokens:

```css
.accent {
  --kui-color-primary: #7d5260;
  --kui-color-on-primary: #ffffff;
}
```

```tsx
import { Select, ThemeScope } from '@kanso-labs/kanso-ui'

function Section() {
  return (
    <ThemeScope className="accent">
      <Select label="Label">…</Select>
    </ThemeScope>
  )
}
```

`scheme` pins the scope to `'light'` or `'dark'`, whatever the OS asks for. Left
unset, the scope keeps the scheme around it, so a scope inside a dark page stays
dark.

Overlays come along. React Aria portals a popover, a sheet, a tooltip or a
snackbar to the end of `<body>`, outside any wrapper; one opened inside a
`ThemeScope` portals into the scope instead, and takes its tokens with it. The
cost is that an ancestor confining its descendants confines those overlays too —
a `transform` or a `filter` makes a sheet's scrim cover that ancestor rather
than the viewport, and `overflow: hidden` clips a popover — so put the scope
around such an element rather than inside it.

`themeScope` is the same thing as a class name, for an element you render
yourself. Overlays opened under it still portal to the body and keep the page's
tokens, since nothing tells them otherwise.

### Pinning light or dark

The colours follow the reader's OS through `prefers-color-scheme` unless the app
says otherwise. An app with a theme switch of its own pins a scheme with
`colorScheme`: put `colorScheme.light` or `colorScheme.dark` on the `<html>`
element, and remove it to follow the OS again. The `<html>` element is the place
for it, since overlays are portalled to the body and still sit inside it. Either
also works on a smaller element, as a `themeScope` that pins.

Each is several class names separated by spaces, so set it through `className`,
or spread `name.split(' ')` into `classList.add`. A provider that adds one class
per scheme throws on it — next-themes' `value` option is one. With a provider of
that kind, render a `ThemeScope` around the app instead and hand it the
provider's scheme:

```tsx
'use client'

import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ThemeScope } from '@kanso-labs/kanso-ui'

function Scheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const scheme =
    mounted && (resolvedTheme === 'dark' || resolvedTheme === 'light')
      ? resolvedTheme
      : undefined

  return <ThemeScope scheme={scheme}>{children}</ThemeScope>
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme">
      <Scheme>{children}</Scheme>
    </ThemeProvider>
  )
}
```

The server cannot know the stored choice, so the scope takes it only once the
page has mounted, which keeps the first client render matching the server's. The
first paint follows the OS until then.

A `--kui-color-*` override on `:root` still applies under a pinned scheme. To
give one scheme a value of its own, key the override on an attribute your switch
sets beside the class, since the class names are generated.

### For StyleX consumers

An app that also uses StyleX themes the same way, through the `--kui-*`
properties and `ThemeScope`. The token objects
[`stylex.createTheme()`](https://stylexjs.com/docs/learn/theming/) would take
(`colors`, `typography`, `spacing`, `radii`, `sizing`, `shadows`,
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
[license]: ./LICENSE.md
[license-shield]: https://img.shields.io/github/license/kanso-labs/kanso-ui
[npm]: https://www.npmjs.com/package/@kanso-labs/kanso-ui
[npm-downloads-shield]: https://img.shields.io/npm/dm/@kanso-labs/kanso-ui
[npm-version-shield]: https://img.shields.io/npm/v/@kanso-labs/kanso-ui
[test-shield]:
  https://img.shields.io/github/actions/workflow/status/kanso-labs/kanso-ui/test.yaml?branch=main&label=Test
[test-workflow]:
  https://github.com/kanso-labs/kanso-ui/actions/workflows/test.yaml
