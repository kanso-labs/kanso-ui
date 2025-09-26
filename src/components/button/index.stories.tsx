import type { Meta, StoryObj } from '@storybook/react-vite'

import Button from '.'

const meta = {
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Button',
  },
}

export const Primary: Story = {
  args: {
    label: 'Button',
    primary: true,
  },
}
