import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Color } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { parseColor } from 'react-aria-components'

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
const TRANSLUCENT = parseColor('hsla(200, 100%, 50%, 0.6)')

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

// A plane and an alpha slider holding one translucent value, which is how
// a colour with transparency is edited here: the plane carries two of the
// colour's own channels and the slider its alpha, as ColorPicker composes
// them. Alpha is not given to the plane, whose colours would then disagree
// with its own handle; see the component's header.
function TranslucentPicker() {
  const [value, setValue] = useState<Color>(TRANSLUCENT)

  return (
    <div {...stylex.props(styles.picker)}>
      <ColorArea
        onChange={setValue}
        value={value}
        xChannel="saturation"
        yChannel="lightness"
      />
      <ColorSlider
        channel="alpha"
        label="Alpha"
        onChange={setValue}
        value={value}
      />
    </div>
  )
}

// Its own story because alpha is the one channel a consumer is most likely
// to hand the plane, and the one that belongs beside it instead.
const Alpha: Story = {
  render: () => <TranslucentPicker />,
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
