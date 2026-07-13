import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Button from '.'
import { spacing } from '../../tokens/spacing.stylex'

const styles = stylex.create({
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
  },
})

const meta = {
  args: {
    children: 'Button',
  },
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const Primary: Story = {
  args: {
    variant: 'primary',
  },
}

const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
}

const Danger: Story = {
  args: {
    variant: 'danger',
  },
}

const Sizes: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Button {...args} size="sm" />
      <Button {...args} size="md" />
      <Button {...args} size="lg" />
    </div>
  ),
}

const Loading: Story = {
  args: {
    loading: true,
  },
}

const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export { Danger, Disabled, Ghost, Loading, Primary, Secondary, Sizes }

export default meta
