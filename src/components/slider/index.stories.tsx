import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Slider from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

// Hoisted so each is one stable array per render rather than a fresh one,
// which is what react-perf's no-new-array-as-prop is after.
const RANGE = [20, 60]
const THUMB_LABELS = ['Start', 'End']

// The inset icon the samples draw, a plain glyph of the stories' own rather
// than an icon set's. Drawn `1em` square in `currentColor`, as the README
// asks of every icon, which is what lets each size set it. Hoisted so it is
// one stable element, which is what react-perf's no-jsx-as-prop is after.
const ICON = (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  >
    <circle cx="12" cy="12" r="6" />
  </svg>
)

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

const styles = stylex.create({
  // A slider fills its container, so the samples need a width to fill, and
  // room above for the value indicator.
  sample: {
    maxInlineSize: '420px',
    paddingBlockStart: spacing.xxxl,
  },
  // The sizes, one under another, each with room above for its value.
  sizes: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    maxInlineSize: '420px',
  },
})

const meta = {
  args: {
    defaultValue: 40,
    label: 'Label',
  },
  component: Slider,
  title: 'Components/Slider',
} satisfies Meta<typeof Slider>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

const Range: Story = {
  args: {
    defaultValue: RANGE,
    thumbLabels: THUMB_LABELS,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

const Stops: Story = {
  args: {
    label: 'In steps of ten',
    showStops: true,
    step: 10,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

// Every size, the icon drawn from medium up, as the page gives it.
const Sizes: Story = {
  render: () => (
    <div {...stylex.props(styles.sizes)}>
      {SIZES.map((size) => (
        <Slider
          defaultValue={40}
          icon={ICON}
          key={size}
          label={size}
          size={size}
        />
      ))}
    </div>
  ),
}

const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

export { Default, Disabled, Range, Sizes, Stops, Vertical }

export default meta
