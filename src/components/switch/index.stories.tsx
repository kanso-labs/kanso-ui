import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Switch from '.'

const styles = stylex.create({
  // Narrower than the address, so it has to break.
  narrow: {
    inlineSize: '200px',
  },
})

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

// Its own story because a word with nowhere to break — an address, a long
// compound — breaks inside the label and the line under it rather than
// widening the page.
const LongLabel: Story = {
  args: {
    children: 'firstname.lastname@organisation.example.com',
    description: 'Unterstützungszeilenüberschrift',
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <Switch {...args} />
    </div>
  ),
}

export {
  Default,
  Disabled,
  LongLabel,
  On,
  WithDescription,
  WithError,
  WithIcon,
}

export default meta
