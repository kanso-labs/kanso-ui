import type { Meta, StoryObj } from '@storybook/react-vite'
import type { DateValue } from 'react-aria-components'

import RangeCalendar from '.'
import { CalendarDate, getLocalTimeZone } from '../../date'

// A fixed range in a fixed month, so every snapshot reads the same whenever
// it is taken.
const RANGE = {
  end: new CalendarDate(2026, 9, 15),
  start: new CalendarDate(2026, 9, 8),
}

// A range that crosses a month boundary, which is what two months side by
// side are usually for. February into March 2026, so both months it shows
// lie before today: the calendar outlines today wherever it falls in view,
// and a pair ending in October 2026 moved the outline every day through that
// month.
const ACROSS = {
  end: new CalendarDate(2026, 3, 6),
  start: new CalendarDate(2026, 2, 24),
}

const VISIBLE_TWO = { months: 2 }

const meta = {
  args: {
    'aria-label': 'Label',
    defaultValue: RANGE,
  },
  component: RangeCalendar,
  title: 'Components/RangeCalendar',
} satisfies Meta<typeof RangeCalendar>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a band that crosses a month boundary is the thing two
// months side by side are for, and a snapshot is what shows it joining.
const TwoMonths: Story = {
  args: {
    defaultValue: ACROSS,
    visibleDuration: VISIBLE_TWO,
  },
}

// Its own story because a range stopping at a ruled-out date is a different
// shape from one that runs clean through.
const Bounded: Story = {
  args: {
    isDateUnavailable: isWeekend,
    minValue: new CalendarDate(2026, 9, 5),
  },
}

// The docked date picker's header, as `Calendar` draws it with the same
// prop: the month and the year as menu buttons.
const MonthAndYearMenus: Story = {
  args: {
    showMonthYearMenus: true,
  },
}

function isWeekend(date: DateValue) {
  const day = date.toDate(getLocalTimeZone()).getDay()
  return day === 0 || day === 6
}

export { Bounded, Default, MonthAndYearMenus, TwoMonths }

export default meta
