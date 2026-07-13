import type { Meta, StoryObj } from '@storybook/react-vite'

import { Plus, Receipt, Users } from '@phosphor-icons/react'
import * as stylex from '@stylexjs/stylex'

import Icon from '.'
import { spacing } from '../../tokens/spacing.stylex'

const styles = stylex.create({
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.sm,
  },
})

const meta = {
  component: Icon,
  title: 'Components/Icon',
} satisfies Meta<typeof Icon>

type Story = StoryObj<typeof meta>

const Default: Story = {
  args: {
    icon: Receipt,
  },
}

const Sizes: Story = {
  args: {
    icon: Plus,
  },
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
    </div>
  ),
}

const Weights: Story = {
  args: {
    icon: Receipt,
  },
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Icon {...args} weight="thin" />
      <Icon {...args} weight="regular" />
      <Icon {...args} weight="bold" />
      <Icon {...args} weight="fill" />
      <Icon {...args} weight="duotone" />
    </div>
  ),
}

const WithLabel: Story = {
  args: {
    icon: Users,
    label: 'Group members',
  },
}

export { Default, Sizes, Weights, WithLabel }

export default meta
