import type { Meta, StoryObj } from '@storybook/react-vite'

import ColorField from '.'
import ColorSwatch from '../color-swatch'

const PURPLE = '#6750A4'

const meta = {
  args: {
    defaultValue: PURPLE,
    label: 'Label',
  },
  component: ColorField,
  title: 'Components/ColorField',
} satisfies Meta<typeof ColorField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a swatch beside the value is what makes the field
// show the colour, and it is the call site's to pass.
const WithSwatch: Story = {
  args: {
    leadingIcon: <ColorSwatch color={PURPLE} />,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// Its own story because a channel field holds a number rather than a colour,
// which is a different thing to look at.
const Channel: Story = {
  args: {
    channel: 'hue',
    colorSpace: 'hsl',
    label: 'Hue',
  },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

export { Channel, Default, Outlined, WithError, WithSwatch }

export default meta
