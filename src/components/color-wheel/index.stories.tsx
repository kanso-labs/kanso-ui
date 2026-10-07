import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorWheel from '.'
import ColorArea from '../color-area'

const styles = stylex.create({
  // What sits in the hole: centred on the wheel, and small enough to clear
  // the band on every side. `left` rather than its logical name, because the
  // translate that pulls it back by half its width is physical, and the pair
  // has to agree for it to stay centred right to left.
  inside: {
    inlineSize: '100px',
    insetBlockStart: '50%',
    left: '50%',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
  },
  nest: {
    display: 'inline-block',
    position: 'relative',
  },
})

const BLUE = 'hsl(200, 100%, 50%)'

const meta = {
  args: {
    defaultValue: BLUE,
  },
  component: ColorWheel,
  title: 'Components/ColorWheel',
} satisfies Meta<typeof ColorWheel>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a band this wide is what shows the inner radius
// following the thickness rather than being set beside it.
const Thick: Story = {
  args: {
    outerRadius: 70,
    thickness: 32,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

// Its own story because the hole is cut with a mask rather than covered by a
// disc, so whatever the wheel sits over shows through: a colour area fits
// inside it, which is what a picker built from both looks like.
const WithColorArea: Story = {
  render: () => (
    <div {...stylex.props(styles.nest)}>
      <ColorWheel defaultValue={BLUE} />
      <ColorArea
        defaultValue={BLUE}
        xChannel="saturation"
        yChannel="lightness"
        {...stylex.props(styles.inside)}
      />
    </div>
  ),
}

export { Default, Disabled, Thick, WithColorArea }

export default meta
