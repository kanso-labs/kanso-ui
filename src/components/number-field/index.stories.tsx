import type { Meta, StoryObj } from '@storybook/react-vite'

import NumberField from '.'

// Hoisted so each is one stable object per render rather than a fresh one,
// which is what react-perf's no-new-object-as-prop is after.
const EURO = { currency: 'EUR', style: 'currency' } as const

const meta = {
  args: {
    defaultValue: 1234.5,
    label: 'Label',
  },
  component: NumberField,
  title: 'Components/NumberField',
} satisfies Meta<typeof NumberField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Currency: Story = {
  args: {
    formatOptions: EURO,
  },
}

const HorizontalSteppers: Story = {
  args: {
    steppers: 'horizontal',
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

const WithError: Story = {
  args: {
    defaultValue: undefined,
    error: 'Enter a number.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export {
  Currency,
  Default,
  Disabled,
  HorizontalSteppers,
  WithDescription,
  WithError,
}

export default meta
