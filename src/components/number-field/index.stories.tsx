import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import NumberField from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// Hoisted so each is one stable object per render rather than a fresh one,
// which is what react-perf's no-new-object-as-prop is after.
const EURO = { currency: 'EUR', style: 'currency' } as const
const PERCENT = { style: 'percent' } as const
const KILOGRAMS = { style: 'unit', unit: 'kilogram' } as const

const styles = stylex.create({
  // A field fills its container, so the samples need a width to fill. Two
  // side by side is also what shows that a field with a message below it does
  // not shift the one beside it.
  columns: {
    display: 'grid',
    gap: spacing.lg,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    defaultValue: 1234.5,
    label: 'Label',
  },
  component: NumberField,
  title: 'Components/NumberField',
} satisfies Meta<typeof NumberField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          NumberField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A filled field holding a number, read in the page&apos;s locale, with
          steppers at its end.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Formatting
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The value is a number, and how it reads is a format: a plain
            decimal, a currency, a percentage, a unit. Typing accepts what the
            format accepts, and the value comes back as a number. The mono face
            with tabular figures is on by default, so a column of these lines
            up.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <NumberField defaultValue={1234.5} label="Decimal" />
          <NumberField
            defaultValue={1234.5}
            formatOptions={EURO}
            label="Currency"
          />
          <NumberField
            defaultValue={0.25}
            formatOptions={PERCENT}
            label="Percentage"
          />
          <NumberField
            defaultValue={12}
            formatOptions={KILOGRAMS}
            label="Unit"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Steppers and bounds
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The steppers move the value by a step, as the arrow keys do, and a
            bound disables the stepper that would cross it.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <NumberField defaultValue={5} label="In steps of five" step={5} />
          <NumberField
            defaultValue={10}
            label="Between zero and ten"
            maxValue={10}
            minValue={0}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Stepper layouts
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The steppers stack at the end of the box, the plus over the minus,
            flush with its edge, or sit side by side as extra-small icon
            buttons.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <NumberField defaultValue={1234.5} label="Stacked" />
          <NumberField
            defaultValue={1234.5}
            label="Side by side"
            steppers="horizontal"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The description, the error and the disabled state are the field
            chrome&apos;s, the same as TextField&apos;s.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <NumberField
            defaultValue={1234.5}
            description="Supporting line"
            label="With a description"
          />
          <NumberField error="Enter a number." label="With an error" />
          <NumberField defaultValue={1234.5} isDisabled label="Disabled" />
          <NumberField
            defaultValue={1234.5}
            label="Without the mono face"
            numeric={false}
          />
        </div>
      </section>
    </div>
  ),
}

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
  Overview,
  WithDescription,
  WithError,
}

export default meta
