import type { Meta, StoryObj } from '@storybook/react-vite'

import Chip from '.'

const meta = {
  component: Chip,
  title: 'Components/Chip',
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Chip',
  },
}

export const Primary: Story = {
  args: {
    label: 'Chip',
    primary: true,
  },
}
