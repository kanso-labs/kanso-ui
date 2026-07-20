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

export { Default, Disabled }

export default meta
