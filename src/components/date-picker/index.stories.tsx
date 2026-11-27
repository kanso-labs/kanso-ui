import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import DatePicker from '.'
import { CalendarDate } from '../../date'
import { colors } from '../../tokens/design.tokens.stylex'

// A fixed date, so every snapshot reads the same whenever it is taken.
const DATE = new CalendarDate(2026, 9, 15)
const MIN = new CalendarDate(2026, 9, 8)

const styles = stylex.create({
  // A column narrower than the picker's segments and its calendar button
  // together, outlined so the column reads beside the field.
  narrow: {
    inlineSize: '170px',
    outlineColor: colors.outlineVariant,
    outlineOffset: '4px',
    outlineStyle: 'dashed',
    outlineWidth: '1px',
  },
})

// The picker in that column.
const InNarrowColumn: Decorator = (Story) => (
  <div {...stylex.props(styles.narrow)}>
    <Story />
  </div>
)

const meta = {
  args: {
    defaultValue: DATE,
    label: 'Label',
  },
  component: DatePicker,
  title: 'Components/DatePicker',
} satisfies Meta<typeof DatePicker>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because an empty picker is the one that shows the segment
// placeholders beside the trigger.
const Empty: Story = {
  args: {
    defaultValue: undefined,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// Its own story because the open calendar is the half a closed picker cannot
// show, and it is the state a reviewer most wants to look at. Below the
// medium breakpoint it is the modal picker, under its headline and over
// Cancel and OK.
const Open: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '500px', inline: false } } },
}

// The docked picker the page draws: open, with the month and the year as
// menu buttons in the calendar's header.
const OpenWithMenus: Story = {
  args: {
    defaultOpen: true,
    showMonthYearMenus: true,
  },
  parameters: { docs: { story: { height: '500px', inline: false } } },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

// Its own story because a bound is a date rather than a toggle, so it needs a
// value of its own, and it reaches the calendar's days as well as the
// segments. Open, since the days before it are where the bound shows.
const WithMinValue: Story = {
  args: {
    defaultOpen: true,
    description: 'from the 8th',
    minValue: MIN,
  },
  parameters: { docs: { story: { height: '500px', inline: false } } },
}

// A picker in a column narrower than it needs. It is as wide as its whole
// date, past the column's dashed edge, rather than clipping the year.
const Narrow: Story = {
  decorators: [InNarrowColumn],
}

export {
  Default,
  Empty,
  Narrow,
  Open,
  OpenWithMenus,
  Outlined,
  WithError,
  WithMinValue,
}

export default meta
