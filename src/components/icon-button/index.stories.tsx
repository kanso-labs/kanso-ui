import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import IconButton from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // Sized in `em` so it follows the button's own type size, which is what
  // makes one icon serve all three sizes.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  sample: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// A plain glyph rather than an icon set, so the stories stay a demonstration
// of the button and not of a dependency the library does not have.
function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

const meta = {
  args: {
    'aria-label': 'Add',
    children: <PlusIcon />,
  },
  component: IconButton,
  title: 'Components/IconButton',
} satisfies Meta<typeof IconButton>

type Story = StoryObj<typeof meta>

// Every variant and size on one page, for one Chromatic snapshot per theme.
// `disableRipple` has nothing to show here: it changes what happens on press,
// and at rest the two are the same pixels.
const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          IconButton
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A button whose whole label is its icon, at the same control heights as
          Button.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Variants
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `standard` is transparent and tints whatever it sits on; `filled`
            and `tonal` carry a container of their own.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="standard">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              standard
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="filled">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="tonal">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              tonal
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sizes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same three heights Button uses, so the two line up beside each
            other in a row. One icon serves all three: it is drawn in `em`, so
            it scales with the button rather than needing a size of its own.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="xs">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              xs · 32px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="md">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              md · 40px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="lg">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              lg · 56px
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same on-surface opacity composites over every variant, so the
            three converge rather than each fading in its own colour.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" disabled variant="standard">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              standard
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" disabled variant="filled">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" disabled variant="tonal">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              tonal
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
