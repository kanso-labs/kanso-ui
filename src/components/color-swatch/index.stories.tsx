import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorSwatch from '.'
import { parseColor } from '../../react-aria'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  large: {
    blockSize: '72px',
    inlineSize: '72px',
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

const meta = {
  args: {
    color: '#6750A4',
  },
  // `color` takes a CSS string or a parsed `Color`, and Storybook infers an
  // arg's type from the story's own value where no type is declared — so
  // Transparent, which passes a `Color`, infers `object`, which the colour
  // matcher in .storybook/preview.tsx then warns it cannot build a colour
  // control from. Declaring the type is what stops that inference. The panel
  // edits a CSS string either way, which is what the control accepts.
  argTypes: {
    color: { control: 'color', type: 'string' },
  },
  component: ColorSwatch,
  title: 'Components/ColorSwatch',
} satisfies Meta<typeof ColorSwatch>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because the chequer is the component's one drawing decision,
// and an opaque swatch never shows it.
const Transparent: Story = {
  args: {
    color: parseColor('hsla(200, 100%, 50%, 0.4)'),
  },
}

// Its own story because the size comes from the call site: its class lands on
// the square around the swatch, and the colour fills whatever square it is
// given. The default one stands beside it for scale.
const CustomSize: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <ColorSwatch color="#6750A4" />
      <ColorSwatch
        color={parseColor('hsla(200, 100%, 50%, 0.4)')}
        {...stylex.props(styles.large)}
      />
    </div>
  ),
}

export { CustomSize, Default, Transparent }

export default meta
