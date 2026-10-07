import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { I18nProvider } from 'react-aria-components'

import DateField from '.'
import { CalendarDate, CalendarDateTime } from '../../date'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '260px',
  },
})

// A fixed date, so every snapshot reads the same whenever it is taken.
const DATE = new CalendarDate(2026, 9, 15)

// A granularity below a day needs a value carrying a time; React Aria rejects
// `minute` against a date-only value.
const DATE_TIME = new CalendarDateTime(2026, 9, 15, 9, 30)

const meta = {
  args: {
    defaultValue: DATE,
    label: 'Label',
  },
  component: DateField,
  title: 'Components/DateField',
} satisfies Meta<typeof DateField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because an empty field is the one that shows the segment
// placeholders, which are the thing a reader types over.
const Empty: Story = {
  args: {
    defaultValue: undefined,
  },
}

// Its own story because the outlined box is a different shape, not a
// different state.
const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// Its own story because time segments change how many focus stops the field
// has, which is what `granularity` is for.
const WithTime: Story = {
  args: {
    defaultValue: DATE_TIME,
    granularity: 'minute',
  },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

// Its own story because how many segments there are, and in what order, is the
// reader's locale, set through React Aria's `I18nProvider`: the same date reads
// month-first under `en-US` and day-first under `en-GB`.
const Locales: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <I18nProvider locale="en-US">
        <div {...stylex.props(styles.width)}>
          <DateField defaultValue={DATE} description="en-US" label="Label" />
        </div>
      </I18nProvider>
      <I18nProvider locale="en-GB">
        <div {...stylex.props(styles.width)}>
          <DateField defaultValue={DATE} description="en-GB" label="Label" />
        </div>
      </I18nProvider>
    </div>
  ),
}

export { Default, Empty, Locales, Outlined, WithError, WithTime }

export default meta
