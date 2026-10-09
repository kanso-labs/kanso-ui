import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Meter from '.'

const styles = stylex.create({
  // Narrower than the label's one word, so it has to break.
  narrow: {
    inlineSize: '200px',
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
  component: Meter,
  title: 'Components/Meter',
} satisfies Meta<typeof Meter>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const WithoutValue: Story = {
  args: {
    showValue: false,
  },
}

const Positive: Story = {
  args: {
    tone: 'positive',
  },
}

const Negative: Story = {
  args: {
    tone: 'negative',
    value: 94,
  },
}

const OnItsOwnScale: Story = {
  args: {
    formatOptions: BYTES,
    label: 'Label',
    maxValue: 512,
    value: 318,
  },
}

// Its own story because a label with nowhere to break — a file name, a long
// compound — breaks inside itself, and the value keeps its place at the end
// of the line rather than being pushed out of it.
const LongLabel: Story = {
  args: {
    label: 'Unterstützungszeilenüberschrift',
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <Meter {...args} />
    </div>
  ),
}

export { Default, LongLabel, Negative, OnItsOwnScale, Positive, WithoutValue }

export default meta
