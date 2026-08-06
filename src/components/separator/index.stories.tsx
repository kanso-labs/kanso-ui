import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Separator from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

// A separator is a 1px rule, so on its own there is nothing to look at and
// nothing to judge it against. Both stories place it where it will actually
// be used — between stacked rows, and between inline items — since what
// matters is whether it reads as a divider next to real content.
const styles = stylex.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    flexDirection: 'column',
    inlineSize: '320px',
    padding: spacing.lg,
  },
  inline: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    gap: spacing.md,
    inlineSize: 'fit-content',
    padding: spacing.lg,
  },
  row: {
    paddingBlock: spacing.md,
  },
})

const meta = {
  component: Separator,
  title: 'Components/Separator',
} satisfies Meta<typeof Separator>

type Story = StoryObj<typeof meta>

const Horizontal: Story = {
  render: (args) => (
    <div {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.row)}>
        <Text variant="bodyMedium">First item</Text>
      </div>
      <Separator {...args} />
      <div {...stylex.props(styles.row)}>
        <Text variant="bodyMedium">Second item</Text>
      </div>
      <Separator {...args} />
      <div {...stylex.props(styles.row)}>
        <Text variant="bodyMedium">Third item</Text>
      </div>
    </div>
  ),
}

// The vertical rule takes its height from this row rather than being given
// one, which is the whole reason it is worth showing next to content of a
// real height.
const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <div {...stylex.props(styles.inline)}>
      <Text variant="labelLarge">First</Text>
      <Separator {...args} />
      <Text variant="labelLarge">Second</Text>
      <Separator {...args} />
      <Text variant="labelLarge">Third</Text>
    </div>
  ),
}

export { Horizontal, Vertical }

export default meta
