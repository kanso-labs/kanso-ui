import type { Meta, StoryObj } from '@storybook/react-vite'
import type { DateValue } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { expect } from 'storybook/test'

import Calendar from '.'
import { CalendarDate, getLocalTimeZone, today } from '../../date'

// Fixed months, so every snapshot reads the same whenever it is taken. The
// calendar outlines today wherever it falls in view, so a fixed view holds
// still only once every month in it lies before today: September 2026 for
// the stories that show one month, and February and March 2026 for the one
// that shows two, since September and October 2026 moved the outline every
// day through October. The `Today` story is the one that asks for the real
// date, since what it shows is the outline today carries.
const SEPTEMBER = new CalendarDate(2026, 9, 15)
const FEBRUARY = new CalendarDate(2026, 2, 15)
// December 2025, so a two-month view crosses into a second year and still
// lies wholly before today.
const DECEMBER = new CalendarDate(2025, 12, 15)
const MAX = new CalendarDate(2026, 9, 24)
const MIN = new CalendarDate(2026, 9, 8)
const VISIBLE_TWO = { months: 2 }

const styles = stylex.create({
  // A compact window's content: 360dp less its two 16dp margins.
  compact: {
    inlineSize: '328px',
  },
})

const meta = {
  args: {
    'aria-label': 'Label',
    defaultValue: SEPTEMBER,
  },
  component: Calendar,
  title: 'Components/Calendar',
} satisfies Meta<typeof Calendar>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because the outline today carries is the one state that
// cannot be pinned to a fixed month — it moves with the day the page is read
// on, which is the point of it.
const Today: Story = {
  args: {
    defaultValue: undefined,
    focusedValue: today(getLocalTimeZone()),
  },
}

// Its own story because bounds change what a date looks like rather than
// where it is, which a snapshot shows and prose cannot. A date outside
// `minValue` and `maxValue` fades to 38% and stops taking a press; one
// `isDateUnavailable` rules out — weekends here — is struck through at full
// contrast instead, since a reader can still land on it and has to read it.
const Bounded: Story = {
  args: {
    isDateUnavailable: isWeekend,
    maxValue: MAX,
    minValue: MIN,
  },
}

// Two months side by side, which is what a range is usually picked from.
const TwoMonths: Story = {
  args: {
    defaultValue: FEBRUARY,
    visibleDuration: VISIBLE_TWO,
  },
}

// The docked date picker's header: the month and the year as menu buttons,
// for a date far from the one shown.
const MonthAndYearMenus: Story = {
  args: {
    showMonthYearMenus: true,
  },
}

// The month menu open, which lists the months in the grid's place with the
// one shown checked. Opened by its `play`, so the snapshot shows the list.
const MonthList: Story = {
  args: {
    showMonthYearMenus: true,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sep month' }))
    await expect(
      canvas.getByRole('option', { name: 'September' }),
    ).toHaveAttribute('aria-selected', 'true')
  },
}

// The menus asked for beside a second month. They name only the first, so
// the header is the plain one instead, whose heading names both months and
// both years.
const TwoMonthsWithMenus: Story = {
  args: {
    defaultValue: DECEMBER,
    showMonthYearMenus: true,
    visibleDuration: VISIBLE_TWO,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('grid')).toHaveLength(2)
    await expect(
      canvas.queryByRole('button', { name: /month$/ }),
    ).not.toBeInTheDocument()
  },
}

// In a compact window's 328dp, under the page's 360dp docked calendar. The
// columns share what is left, so the calendar fits rather than scrolling the
// page sideways.
const Compact: Story = {
  render: (args) => (
    <div {...stylex.props(styles.compact)}>
      <Calendar {...args} />
    </div>
  ),
}

function isWeekend(date: DateValue) {
  const day = date.toDate(getLocalTimeZone()).getDay()
  return day === 0 || day === 6
}

export {
  Bounded,
  Compact,
  Default,
  MonthAndYearMenus,
  MonthList,
  Today,
  TwoMonths,
  TwoMonthsWithMenus,
}

export default meta
