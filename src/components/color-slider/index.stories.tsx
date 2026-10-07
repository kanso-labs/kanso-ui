import type { Meta, StoryObj } from '@storybook/react-vite'

import ColorSlider from '.'

const BLUE = 'hsl(200, 100%, 50%)'
const TRANSLUCENT = 'hsla(200, 100%, 50%, 0.6)'

const meta = {
  args: {
    channel: 'hue',
    defaultValue: BLUE,
    label: 'Label',
  },
  component: ColorSlider,
  title: 'Components/ColorSlider',
} satisfies Meta<typeof ColorSlider>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because the chequer is only visible under a channel that
// fades out, and no other channel does.
const Alpha: Story = {
  args: {
    channel: 'alpha',
    defaultValue: TRANSLUCENT,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
}

export { Alpha, Default, Disabled, Vertical }

export default meta
