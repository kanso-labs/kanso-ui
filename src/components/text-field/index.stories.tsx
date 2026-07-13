import type { Meta, StoryObj } from '@storybook/react-vite'

import TextField from '.'

const meta = {
  args: {
    label: 'Description',
    placeholder: 'Dinner at the pier',
  },
  component: TextField,
  title: 'Components/TextField',
} satisfies Meta<typeof TextField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const WithDescription: Story = {
  args: {
    description: 'Visible to everyone in the group.',
  },
}

const WithError: Story = {
  args: {
    error: 'A description is required.',
  },
}

const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export { Default, Disabled, WithDescription, WithError }

export default meta
