import type { Meta, StoryObj } from '@storybook/react-vite'

import Button from '.'

const meta = {
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const Default: Story = {
  args: {
    label: 'Button',
  },
}

const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Button',
  },
}

export { Default, Disabled }

export default meta
