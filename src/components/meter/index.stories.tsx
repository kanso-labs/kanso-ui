import type { Meta, StoryObj } from '@storybook/react-vite'

import Meter from '.'

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

export { Default, Negative, OnItsOwnScale, Positive, WithoutValue }

export default meta
