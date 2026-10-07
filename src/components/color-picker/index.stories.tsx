import type { Meta, StoryObj } from '@storybook/react-vite'

import ColorPicker from '.'

const PURPLE = '#6750A4'

const meta = {
  args: {
    defaultValue: PURPLE,
    label: 'Label',
  },
  component: ColorPicker,
  title: 'Components/ColorPicker',
} satisfies Meta<typeof ColorPicker>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because the surface is the half a closed picker cannot show,
// and it is the state a reviewer most wants to look at.
const Open: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '560px', inline: false } } },
}

// Its own story because the alpha strip adds a row to the surface, which
// only shows while it is open.
const WithAlpha: Story = {
  args: {
    alpha: true,
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '640px', inline: false } } },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

// Disabled and open at once, which the surface opening independently of the
// trigger makes reachable: a picker already open when a form disables it.
// Its own story because a closed one shows the trigger alone, and the
// controls on the surface are the half that has to look inert too.
const DisabledOpen: Story = {
  args: {
    defaultOpen: true,
    isDisabled: true,
  },
  parameters: { docs: { story: { height: '560px', inline: false } } },
}

export { Default, Disabled, DisabledOpen, Open, WithAlpha }

export default meta
