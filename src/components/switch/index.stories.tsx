import type { Meta, StoryObj } from '@storybook/react-vite'

import Switch from '.'

const meta = {
  args: {
    children: 'Label',
  },
  component: Switch,
  title: 'Components/Switch',
} satisfies Meta<typeof Switch>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const On: Story = {
  args: {
    defaultSelected: true,
  },
}

const WithIcon: Story = {
  args: {
    defaultSelected: true,
    icon: true,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

const WithError: Story = {
  args: {
    description: 'Supporting line',
    error: 'Turn this on.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export { Default, Disabled, On, WithDescription, WithError, WithIcon }

export default meta
