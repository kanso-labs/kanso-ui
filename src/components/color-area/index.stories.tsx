import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorArea from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ColorSlider from '../color-slider'

const styles = stylex.create({
  // A picker is the plane with the channels it does not carry beside it,
  // which is the arrangement ColorPicker composes.
  picker: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: spacing.md,
    inlineSize: '240px',
  },
  row: {
    alignItems: 'flex-start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  width: {
    inlineSize: '240px',
  },
  widthNarrow: {
    inlineSize: '140px',
  },
})

const BLUE = 'hsl(200, 100%, 50%)'
// RGB, not HSL: alpha is a channel of a colour area only in RGB, and in
// HSL React Aria quietly draws saturation and lightness instead.
const TRANSLUCENT = 'rgba(0, 170, 255, 0.6)'

const meta = {
  args: {
    defaultValue: BLUE,
    xChannel: 'saturation',
    yChannel: 'lightness',
  },
  component: ColorArea,
  title: 'Components/ColorArea',
} satisfies Meta<typeof ColorArea>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorArea {...args} />
    </div>
  ),
}

// Its own story because alpha is the one channel pairing that behaves
// differently from the rest — and the one a consumer is most likely to
// reach for and find does nothing in HSL.
const Alpha: Story = {
  args: {
    defaultValue: TRANSLUCENT,
    xChannel: 'red',
    yChannel: 'alpha',
  },
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorArea {...args} />
    </div>
  ),
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorArea {...args} />
    </div>
  ),
}

// Its own story because the plane has to be seen beside a ColorSlider, whose
// handle it shares, and at another width: it takes the width it is given and
// stays square, since an oblong would give its two channels unequal travel.
const WithSlider: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.picker)}>
        <ColorArea
          defaultValue={BLUE}
          xChannel="saturation"
          yChannel="lightness"
        />
        <ColorSlider channel="hue" defaultValue={BLUE} label="Hue" />
      </div>
      <div {...stylex.props(styles.widthNarrow)}>
        <ColorArea
          defaultValue={BLUE}
          xChannel="saturation"
          yChannel="lightness"
        />
      </div>
    </div>
  ),
}

export { Alpha, Default, Disabled, WithSlider }

export default meta
