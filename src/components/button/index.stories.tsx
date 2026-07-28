import type { Meta, StoryObj } from '@storybook/react-vite'

import Button from '.'

const meta = {
  args: {
    children: 'Button',
  },
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Disabled: Story = {
  args: {
    disabled: true,
  },
}

const NoRipple: Story = {
  args: {
    disableRipple: true,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

const OutlinedDisabled: Story = {
  args: {
    disabled: true,
    variant: 'outlined',
  },
}

const Text: Story = {
  args: {
    variant: 'text',
  },
}

const TextDisabled: Story = {
  args: {
    disabled: true,
    variant: 'text',
  },
}

export {
  Default,
  Disabled,
  NoRipple,
  Outlined,
  OutlinedDisabled,
  Text,
  TextDisabled,
}

export default meta
