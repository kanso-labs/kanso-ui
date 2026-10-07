import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Carousel from '.'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
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

const Default: Story = {}

const Hero: Story = {
  args: { layout: 'hero' },
}

const Uncontained: Story = {
  args: { layout: 'uncontained' },
}

export { Default, Hero, Uncontained }

export default meta
