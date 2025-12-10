import type { Meta, StoryObj } from '@storybook/react-vite'

import Field from '.'

const meta = {
  component: Field,
  title: 'Components/Field',
} satisfies Meta<typeof Field>

type Story = StoryObj<typeof meta>

const Default: Story = {
  args: {
    label: 'Field',
  },
}

const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Field',
  },
}

export { Default, Disabled }

export default meta
