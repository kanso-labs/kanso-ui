import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ProgressIndicator from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  rings: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.xl,
  },
  // A surface with a colour of its own, which is what `inherit` is for: on
  // primary, the page's own pair would disappear into the fill.
  surface: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    color: colors.onPrimary,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    maxInlineSize: '360px',
    padding: spacing.lg,
  },
})

const meta = {
  args: {
    label: 'Label',
    value: 40,
  },
  component: ProgressIndicator,
  title: 'Components/ProgressIndicator',
} satisfies Meta<typeof ProgressIndicator>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const WithValue: Story = {
  args: {
    showValue: true,
  },
}

const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
    value: undefined,
  },
}

const WithBuffer: Story = {
  args: {
    buffer: 70,
    value: 30,
  },
}

const Circular: Story = {
  args: {
    variant: 'circular',
  },
}

const CircularIndeterminate: Story = {
  args: {
    isIndeterminate: true,
    value: undefined,
    variant: 'circular',
  },
}

const Wavy: Story = {
  args: {
    shape: 'wavy',
  },
}

const WavyCircular: Story = {
  args: {
    shape: 'wavy',
    variant: 'circular',
  },
}

// Its own story because `inherit` is for a surface with a colour of its own,
// such as a filled button: the indicator takes the colour around it, and its
// track, buffer included, a quarter of that.
const InheritedTone: Story = {
  render: () => (
    <div {...stylex.props(styles.surface)}>
      <ProgressIndicator aria-label="Half" tone="inherit" value={50} />
      <ProgressIndicator
        aria-label="Buffered"
        buffer={70}
        tone="inherit"
        value={30}
      />
      <ProgressIndicator aria-label="Working" isIndeterminate tone="inherit" />
      <div {...stylex.props(styles.rings)}>
        <ProgressIndicator
          aria-label="Quarter"
          tone="inherit"
          value={25}
          variant="circular"
        />
        <ProgressIndicator
          aria-label="Working"
          isIndeterminate
          tone="inherit"
          variant="circular"
        />
      </div>
    </div>
  ),
}

export {
  Circular,
  CircularIndeterminate,
  Default,
  Indeterminate,
  InheritedTone,
  Wavy,
  WavyCircular,
  WithBuffer,
  WithValue,
}

export default meta
