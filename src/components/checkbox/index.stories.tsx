import type { Meta, StoryObj } from '@storybook/react-vite'

import Checkbox from '.'

const meta = {
  args: {
    children: 'Label',
  },
  component: Checkbox,
  title: 'Components/Checkbox',
} satisfies Meta<typeof Checkbox>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Selected: Story = {
  args: {
    defaultSelected: true,
  },
}

const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

// Its own story because the error state is three changes at once — the
// box's colours, the message that replaces the description, and the
// invalid mark.
const WithError: Story = {
  args: {
    description: 'Supporting line',
    error: 'Choose one.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export {
  Default,
  Disabled,
  Indeterminate,
  Selected,
  WithDescription,
  WithError,
}

export default meta
