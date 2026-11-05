import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { CarouselItemRenderProps } from '.'

import Carousel from '.'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  label: (opacity: number) => ({ opacity }),
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

// How far the mask closes in before a label is gone: 16px from each side,
// the tile's padding, so the label fades out before the mask reaches a
// letter and comes back as its item is drawn large. Material Design's
// carousel shows an item's text on its large items alone.
const FADE = 32

function labelOpacity({ visibleWidth, width }: CarouselItemRenderProps) {
  return Math.min(Math.max(1 - (width - visibleWidth) / FADE, 0), 1)
}

const ITEMS = LABELS.map((label, index) => (
  <Carousel.Item key={label}>
    {(state) => (
      <div {...stylex.props(styles.tile, TONES[index % TONES.length])}>
        <span {...stylex.props(styles.label(labelOpacity(state)))}>
          {label}
        </span>
      </div>
    )}
  </Carousel.Item>
))

const meta = {
  args: {
    children: ITEMS,
    label: 'Label',
  },
  component: Carousel,
  subcomponents: { 'Carousel.Item': Carousel.Item },
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
