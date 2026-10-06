import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Carousel from '.'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // What an item holds: a block of colour standing in for an image, with
  // its label at the bottom, so the stories show the carousel alone.
  tile: {
    alignItems: 'flex-end',
    blockSize: '200px',
    boxSizing: 'border-box',
    display: 'flex',
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    inlineSize: '100%',
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    padding: spacing.lg,
    whiteSpace: 'nowrap',
  },
})

// The container pairs, in turn, so neighbouring items read apart.
const tones = stylex.create({
  primary: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  secondary: {
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
  },
  tertiary: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
})

const TONES = [tones.primary, tones.secondary, tones.tertiary]

const LABELS = [
  'First item',
  'Second item',
  'Third item',
  'Fourth item',
  'Fifth item',
  'Sixth item',
]

const ITEMS = LABELS.map((label, index) => (
  <Carousel.Item key={label}>
    <div {...stylex.props(styles.tile, TONES[index % TONES.length])}>
      {label}
    </div>
  </Carousel.Item>
))

const meta = {
  args: {
    children: ITEMS,
    label: 'Label',
  },
  component: Carousel,
  title: 'Components/Carousel',
} satisfies Meta<typeof Carousel>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Carousel
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A row of items that scrolls on and off the screen.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Multi-browse
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            As many large items as fit, then a medium one and a small one,
            filling the width. Scrolling moves one item at a time, and each
            shrinks as it leaves and grows as it arrives.
          </Text>
        </div>
        <Carousel label="Multi-browse">{ITEMS}</Carousel>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Hero
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            One large item and one small, for an item meant to be looked at on
            its own.
          </Text>
        </div>
        <Carousel label="Hero" layout="hero">
          {ITEMS}
        </Carousel>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Uncontained
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Every item at the same width, scrolling past the edge of the
            carousel rather than changing size.
          </Text>
        </div>
        <Carousel label="Uncontained" layout="uncontained">
          {ITEMS}
        </Carousel>
      </section>
    </div>
  ),
}

const Default: Story = {}

const Hero: Story = {
  args: { layout: 'hero' },
}

const Uncontained: Story = {
  args: { layout: 'uncontained' },
}

export { Default, Hero, Overview, Uncontained }

export default meta
