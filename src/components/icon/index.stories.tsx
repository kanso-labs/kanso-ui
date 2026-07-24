import type { Meta, StoryObj } from '@storybook/react-vite'

import { ReceiptIcon } from '@phosphor-icons/react'
import * as stylex from '@stylexjs/stylex'

import Icon from '.'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  cell: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // Icon has no color of its own (§6.1: always currentColor) — every story
  // needs an explicit foreground so it's visible against ThemeWrapper's
  // surface background, which sets no default text color of its own.
  context: {
    color: colors.onSurface,
    display: 'inline-flex',
  },
  label: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelSmallFont,
    fontSize: typography.labelSmallSize,
  },
  row: {
    alignItems: 'flex-end',
    display: 'flex',
    gap: spacing.xl,
  },
})

const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const

const meta = {
  args: {
    icon: ReceiptIcon,
  },
  component: Icon,
  decorators: [
    (Story) => (
      <div {...stylex.props(styles.context)}>
        <Story />
      </div>
    ),
  ],
  title: 'Components/Icon',
} satisfies Meta<typeof Icon>

type Story = StoryObj<typeof meta>

const Sizes: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.cell)}>
        <Icon icon={ReceiptIcon} label="Receipt" size="sm" />
        <span {...stylex.props(styles.label)}>sm (18px)</span>
      </div>
      <div {...stylex.props(styles.cell)}>
        <Icon icon={ReceiptIcon} label="Receipt" size="md" />
        <span {...stylex.props(styles.label)}>md (24px)</span>
      </div>
    </div>
  ),
}

const Weights: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      {WEIGHTS.map((weight) => (
        <div key={weight} {...stylex.props(styles.cell)}>
          <Icon icon={ReceiptIcon} label="Receipt" weight={weight} />
          <span {...stylex.props(styles.label)}>{weight}</span>
        </div>
      ))}
    </div>
  ),
}

const Decorative: Story = {}

const Labeled: Story = {
  args: {
    label: 'Receipt',
  },
}

export { Decorative, Labeled, Sizes, Weights }

export default meta
