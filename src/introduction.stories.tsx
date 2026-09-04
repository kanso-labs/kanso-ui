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

const THEMING = `:root {
  --kui-color-primary: #ff5722;
  --kui-color-on-primary: #ffffff;
}`

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    maxInlineSize: '58ch',
  },
  // Component overviews let their intros run the width of the page, which is
  // fine for the sentence or two each of them carries. This page is read
  // rather than looked at, so every run of prose on it is held to one measure
  // instead — 58ch here, in `header`, and in `prose` below. The samples are
  // deliberately not: a code block and a list of rows are the width of the
  // page, and clamping them to the text column would only strand them.
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
    maxInlineSize: '58ch',
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
  prose: {
    maxInlineSize: '58ch',
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

function IntroductionPage() {
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
            to mount and no stylesheet to link.
          </Text>
        </div>
        <CopyField value={INSTALL} />
        <Card variant="filled">
          <pre {...stylex.props(styles.snippet)}>
            <Code>{USAGE}</Code>
          </pre>
        </Card>
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
            bordered list container — the reason there is no List component —
            so the rows keep their own inset and the rules between them still
            span the full width. */}
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
            How far that goes is the Theming section's question: five schemes,
            one page, and nothing between them but the tokens they set.
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
  component: IntroductionPage,
  title: 'Introduction',
} satisfies Meta<typeof IntroductionPage>

type Story = StoryObj<typeof meta>

// Named after the title rather than 'Overview' like every component page, and
// the name is what does the work: Storybook folds a component holding a single
// story of the same name into one sidebar leaf. Renaming this to 'Overview'
// puts a disclosure triangle with one child in front of the first page anyone
// opens.
const Introduction: Story = {}

export { Introduction }

export default meta
