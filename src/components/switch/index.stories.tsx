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

// The description fades with the label it explains.
//
// `color-contrast` is off for this story alone, as it is for DropZone's
// `Disabled`. The faded description is the 38% on the content role every
// disabled control here fades to, and WCAG 1.4.3 exempts text that is part of
// an inactive component from the 4.5:1 it would otherwise ask for. axe passes
// the label, which is tied to the disabled input, but reads the description
// beside it as ordinary body text and reports 2.35:1. The rest of the rules
// still run here.
const Disabled: Story = {
  args: {
    description: 'Supporting line',
    isDisabled: true,
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ enabled: false, id: 'color-contrast' }],
      },
    },
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
