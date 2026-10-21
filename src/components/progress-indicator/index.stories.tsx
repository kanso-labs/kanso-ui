import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ProgressIndicator from '.'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // A line and a ring, one under the other.
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
  },
  // Running text, for a ring sized to it.
  line: {
    color: colors.onSurface,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    margin: 0,
  },
  // Narrower than the label's one word, so it has to break.
  narrow: {
    inlineSize: '200px',
  },
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

const BYTES = {
  notation: 'compact',
  style: 'unit',
  unit: 'gigabyte',
} as const

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

// Rings in a line of text, at the text's own size: each is as wide as its
// ring and sits in the line like a word, with nothing laying it out.
const InText: Story = {
  render: () => (
    <div {...stylex.props(styles.line)}>
      First item{' '}
      <ProgressIndicator
        aria-label="First item"
        diameter="1em"
        value={40}
        variant="circular"
      />{' '}
      Second item{' '}
      <ProgressIndicator
        aria-label="Second item"
        diameter="1em"
        isIndeterminate
        variant="circular"
      />
    </div>
  ),
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

// The wave while the work has no value, on the line and on the ring. The
// line's travelling bars are drawn at a 20dp wavelength, half the
// determinate line's.
const WavyIndeterminate: Story = {
  render: () => (
    <div {...stylex.props(styles.column)}>
      <ProgressIndicator isIndeterminate label="Label" shape="wavy" />
      <ProgressIndicator
        aria-label="Label"
        isIndeterminate
        shape="wavy"
        variant="circular"
      />
    </div>
  ),
}

// A scale of its own. The first measures in units the value is written in;
// the second runs from 1 to 5, so its third step is halfway, and names its
// value in words of the page's choosing.
const OnItsOwnScale: Story = {
  render: () => (
    <div {...stylex.props(styles.column)}>
      <ProgressIndicator
        formatOptions={BYTES}
        label="Label"
        maxValue={512}
        showValue
        value={318}
      />
      <ProgressIndicator
        label="Label"
        maxValue={5}
        minValue={1}
        showValue
        value={3}
        valueLabel="Step 3 of 5"
      />
    </div>
  ),
}

// Its own story because a label with nowhere to break — a file name, a long
// compound — breaks inside itself, and the value keeps its place at the end
// of the line rather than being pushed out of it.
const LongLabel: Story = {
  args: {
    label: 'Unterstützungszeilenüberschrift',
    showValue: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <ProgressIndicator {...args} />
    </div>
  ),
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
  InText,
  LongLabel,
  OnItsOwnScale,
  Wavy,
  WavyCircular,
  WavyIndeterminate,
  WithBuffer,
  WithValue,
}

export default meta
