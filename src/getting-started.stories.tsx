import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Card from './components/card'
import Code from './components/code'
import CopyField from './components/copy-field'
import Link from './components/link'
import ListItem from './components/list-item'
import ProductIcon from './components/product-icon'
import Separator from './components/separator'
import Text from './components/text'
import { spacing, typography } from './tokens/design.tokens.stylex'

// See avatar/index.stories.tsx for why the page is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards. This one has more
// reason to follow that than any component overview does: it is the first page
// a reader opens, so it is also the first evidence that the system holds
// together. The Cards further down are not an exception to that rule — they
// hold a code block and a list of rows, which is a surface inside a section
// rather than a box around one.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// Every link on this page leaves Storybook, and a story renders inside the
// preview iframe — so without a target the destination would load into that
// frame, under a manager still showing the sidebar and the toolbar.
const LINK_TARGET = { rel: 'noreferrer', target: '_blank' } as const

const INSTALL = 'npm install @kanso-labs/kanso-ui'

const USAGE = `import { Button } from '@kanso-labs/kanso-ui'

function Example() {
  return <Button>Save changes</Button>
}`

const POSITIONING = `<Card className="col-span-2" style={{ marginBlockStart: '2rem' }} />`

const RENDERING = `<Text render={<h2 />}>Headline</Text>
<Card render={<a href="/items/1" />}>First item</Card>

// Button and IconButton take href instead, and render an anchor.
<Button href="/items/1">Label</Button>`

const LAYOUT = `<Container>
  <Stack gap="xl">
    <Stack align="center" direction="row" justify="between">
      <Text variant="titleLarge">Headline</Text>
      <Button>Save changes</Button>
    </Stack>
    <Feed minItemWidth="260px">{items}</Feed>
  </Stack>
</Container>`

const OVERLAYS = `<Sheet>
  <Button>Open</Button>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>Headline</Sheet.Title>
      <IconButton aria-label="Close" slot="close">
        <CloseIcon />
      </IconButton>
    </Sheet.Header>
  </Sheet.Content>
</Sheet>`

const UTILITIES = `import { I18nProvider, parseColor, useListData } from '@kanso-labs/kanso-ui'

// Dates take @internationalized/date values, from the ./date subpath.
import { CalendarDate, today, getLocalTimeZone } from '@kanso-labs/kanso-ui/date'`

const THEMING = `:root {
  --kui-color-primary: #ff5722;
  --kui-color-on-primary: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --kui-color-primary: #ffab91;
    --kui-color-on-primary: #3e0800;
  }
}`

const STYLESHEET = `import '@kanso-labs/kanso-ui/styles.css'`

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  // Prose here runs the width of the page, as it does on every component
  // overview. This page used to hold it to a 58ch measure, which suits a
  // column of body copy and stopped suiting this one: the samples beside it
  // are the page's full width by necessity, and once the prose grew past a
  // paragraph or two the page read as half-empty rather than well set. The
  // page's own 960 is the measure.
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  // A row rather than a stack: the three sit close enough to read as one set
  // of pointers away from here, which is also what earns them the hover-only
  // rule Link reserves for links their position already announces.
  linkRow: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // A column with a gap. `Text` carries no margin, the same as every other
  // component here, so two paragraphs in a row have nothing between them
  // unless the thing holding both supplies it.
  prose: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // The Card around this paints the surface; what is left for the <pre> is the
  // UA margin it arrives with, and a line too long for the page. Code sizes
  // itself in em, so the size set here is what its 0.875em is measured
  // against — without it the block would be scaled off the browser's own
  // monospace default rather than off the type scale.
  snippet: {
    fontSize: typography.bodyMediumSize,
    margin: 0,
    overflowX: 'auto',
  },
  title: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.lg,
  },
})

function GettingStartedPage() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.title)}>
          <ProductIcon name="kanso-ui" size="lg" />
          <Text render={HEADING_1} variant="displaySmall">
            kanso-ui
          </Text>
        </div>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A React component library built on{' '}
          <Link href="https://react-aria.adobe.com" {...LINK_TARGET}>
            React Aria Components
          </Link>{' '}
          primitives and styled with{' '}
          <Link href="https://stylexjs.com" {...LINK_TARGET}>
            StyleX
          </Link>
          . Every design token carries a built-in default, in both light and
          dark, so a component renders correctly the moment it is imported.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Install
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            One package, and nothing to wire up after it. There is no provider
            to mount and no stylesheet to link. React 19 or newer is the only
            thing it expects to find already there.
          </Text>
        </div>
        <CopyField value={INSTALL} />
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{USAGE}</Code>
          </pre>
        </Card>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Importing from the package pulls in the stylesheet the library
            compiles, so a component renders correctly the moment it is imported
            — in light and dark both, following the reader&apos;s own setting. A
            bundler is what resolves that stylesheet. Where one cannot, import
            it yourself and nothing else changes:
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{STYLESHEET}</Code>
          </pre>
        </Card>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Positioning a component
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            <Code>className</Code> and <Code>style</Code> reach the element a
            component renders, so one is placed from the call site like any
            other element.
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{POSITIONING}</Code>
          </pre>
        </Card>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The library&apos;s own rules compile into a CSS <Code>@layer</Code>{' '}
            and an app&apos;s stylesheet is unlayered, so your rules win
            wherever the two meet — no specificity contest, and no{' '}
            <Code>!important</Code>.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            No component carries a margin of its own. The space between two
            things belongs to whatever holds both of them, which is what{' '}
            <Code>Stack</Code> is for.
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Rendering as a different element
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            <Code>render</Code> swaps the element a component produces while
            keeping its styling — a <Code>Text</Code> that should be a heading,
            a <Code>Card</Code> that should be a link.
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{RENDERING}</Code>
          </pre>
        </Card>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Laying out a page
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            <Code>Container</Code> centres content at a measure and{' '}
            <Code>Stack</Code> puts one gap from the spacing scale between a row
            or a column. Both paint nothing and wrap no child. For the
            page-level shapes — a list beside a detail pane, a main pane with a
            companion — reach for <Code>ListDetail</Code> and{' '}
            <Code>SupportingPane</Code>.
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{LAYOUT}</Code>
          </pre>
        </Card>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Opening an overlay
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            <Code>Sheet</Code>, <Code>Popover</Code> and <Code>Dialog</Code> are
            opened by a button placed directly inside them, and closed by any
            button in their content given <Code>slot=&quot;close&quot;</Code>.
            Neither needs a prop of its own.
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{OVERLAYS}</Code>
          </pre>
        </Card>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Utilities, and one thing not to install
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The utilities an app needs around these components come from this
            package too — the providers, the collection and data hooks, drag and
            drop, colour parsing, the virtualizer and its layouts. Date
            components take <Code>@internationalized/date</Code> values, which
            the <Code>./date</Code> subpath re-exports whole.
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{UTILITIES}</Code>
          </pre>
        </Card>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Do not install <Code>react-aria-components</Code> alongside this
            package. A second copy carries a second set of contexts and the two
            never meet: a <Code>Button</Code> inside a <Code>Sheet</Code> from
            here opens nothing when the trigger context it looks for belongs to
            your copy. Everything above is the same object the components use,
            which is what keeps them talking to each other.
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            What's here
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The sidebar holds the rest. Each page opens on an overview that
            shows the part in use, with its individual states listed under it.
          </Text>
        </div>
        {/* An outlined Card with no padding of its own is the design's
            bordered list container, so the rows keep their own inset and the
            rules between them still span the full width. */}
        <Card padding="none" variant="outlined">
          <ListItem supporting="One page per component, with its props in the Controls panel below the canvas.">
            Components
          </ListItem>
          <Separator />
          <ListItem supporting="The tokens every component is built from — colour, type, spacing, radii, shadows, motion.">
            Foundations
          </ListItem>
          <Separator />
          <ListItem supporting="The same page under five schemes, so what a token moves is the only thing that differs.">
            Theming
          </ListItem>
        </Card>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The Theme control in the toolbar switches the canvas between light,
            dark, and each of those five schemes — on this page and on every
            other.
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Theming
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Every token is backed by a CSS custom property under the{' '}
            <Code>--kui-*</Code> namespace. Redeclare one and every component
            follows, whatever your own build tooling is.
          </Text>
        </div>
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{THEMING}</Code>
          </pre>
        </Card>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            An override has to land on <Code>:root</Code>, or on another
            selector matching the <Code>&lt;html&gt;</Code> element. Components
            resolve their tokens once, at the root, so a <Code>--kui-*</Code>{' '}
            property redeclared on a smaller scope never reaches them.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            <Code>@kanso-labs/kanso-ui/tokens.css</Code> lists every variable
            and its current default. It is a reference for finding names rather
            than something to import at runtime — the components already carry
            their defaults.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            An app that uses StyleX itself should reach for{' '}
            <Code>stylex.createTheme()</Code> instead, which produces a scoped
            override class rather than a global one.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            How far that goes is the Theming section&apos;s question: five
            schemes, one page, and nothing between them but the tokens they set.
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Elsewhere
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The source, the published package, and the notes for each version.
          </Text>
        </div>
        <div {...stylex.props(styles.linkRow)}>
          <Link
            href="https://github.com/kanso-labs/kanso-ui"
            underline="hover"
            {...LINK_TARGET}
          >
            GitHub
          </Link>
          <Link
            href="https://www.npmjs.com/package/@kanso-labs/kanso-ui"
            underline="hover"
            {...LINK_TARGET}
          >
            npm
          </Link>
          <Link
            href="https://github.com/kanso-labs/kanso-ui/releases"
            underline="hover"
            {...LINK_TARGET}
          >
            Releases
          </Link>
        </div>
      </section>
    </div>
  )
}

const meta = {
  component: GettingStartedPage,
  title: 'Getting started',
} satisfies Meta<typeof GettingStartedPage>

type Story = StoryObj<typeof meta>

// Named after the title rather than 'Overview' like every component page, and
// the name is what does the work: Storybook folds a component holding a single
// story of the same name into one sidebar leaf. Renaming this to 'Overview'
// puts a disclosure triangle with one child in front of the first page anyone
// opens. The export is the title with its space taken out, which is what
// Storybook compares against.
const GettingStarted: Story = {}

export { GettingStarted }

export default meta
