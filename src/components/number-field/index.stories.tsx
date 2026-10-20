import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import NumberField from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // Narrower than the long label, so the label is cut short and where it
  // stops shows against the steppers.
  narrow: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    maxInlineSize: '320px',
  },
})

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

// The steppers move an amount by `step`, which is 1 unless the call site
// says otherwise: a whole euro here.
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

// A value typed rather than stepped, with no steppers drawn: the box is a
// text field's, and the arrow keys still step the value.
const NoSteppers: Story = {
  args: {
    steppers: 'none',
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// The value and the side-by-side steppers on the outlined box's centre line,
// as the stacked pair and a text field's value are.
const OutlinedHorizontalSteppers: Story = {
  args: {
    steppers: 'horizontal',
    variant: 'outlined',
  },
}

// A label longer than the box, in each layout: it is cut short where the
// value ends, clear of the steppers rather than under them.
const LongLabel: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow)}>
      <NumberField label="A label that runs on past the width of its box" />
      <NumberField
        label="A label that runs on past the width of its box"
        steppers="horizontal"
      />
      <NumberField
        defaultValue={1234.5}
        label="A label that runs on past the width of its box"
        steppers="horizontal"
        variant="outlined"
      />
    </div>
  ),
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
  LongLabel,
  NoSteppers,
  Outlined,
  OutlinedHorizontalSteppers,
  WithDescription,
  WithError,
}

export default meta
