import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect } from 'storybook/test'

import Switch from '.'

const styles = stylex.create({
  // Narrower than the address, so it has to break.
  narrow: {
    inlineSize: '200px',
  },
})

// A plain shape rather than an icon set, so the stories show the switch
// alone. Drawn `1em` square in `currentColor`, as the README asks of every
// icon, so it takes the size and colour the handle sets.
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" />
    </svg>
  )
}

// Hoisted so it is one stable element per render, which is what react-perf's
// no-jsx-as-prop is after.
const STAR = <StarIcon />

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

// The page's form with an icon in both states: the check on and the cross
// off, with the off handle grown to the on handle's size to hold it.
const WithIcons: Story = {
  args: {
    icon: true,
    unselectedIcon: true,
  },
}

// A node in place of the check, drawn at the handle's 16dp in its icon colour.
const WithCustomIcon: Story = {
  args: {
    defaultSelected: true,
    icon: STAR,
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

// On, the track keeps its primary fill inside the error rule, so the switch
// still reads as on.
const OnWithError: Story = {
  args: {
    defaultSelected: true,
    description: 'Supporting line',
    error: 'Turn this off.',
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

// On and disabled, with the check: the track, the handle and the icon each
// take their own faded role, so the switch still reads as on.
const DisabledOn: Story = {
  args: {
    defaultSelected: true,
    icon: true,
    isDisabled: true,
  },
}

// The setting can be read but not changed. It looks as an enabled switch
// does, so it carries no snapshot of its own: what sets it apart is that a
// press leaves it where it was.
const ReadOnly: Story = {
  args: {
    defaultSelected: true,
    isReadOnly: true,
  },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas, userEvent }) => {
    const control = canvas.getByRole('switch', { name: 'Label' })
    await userEvent.click(control)
    await expect(control).toBeChecked()
  },
}

// No label beside it, for a switch whose row already says what it turns on:
// `aria-label` names it instead, and the switch is the track alone.
const WithoutLabel: Story = {
  args: {
    'aria-label': 'Label',
    children: undefined,
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
  DisabledOn,
  LongLabel,
  On,
  OnWithError,
  ReadOnly,
  WithCustomIcon,
  WithDescription,
  WithError,
  WithIcon,
  WithIcons,
  WithoutLabel,
}

export default meta
