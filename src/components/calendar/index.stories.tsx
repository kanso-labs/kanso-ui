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
// on, which is the point of it. The calendar opens on today's month and moves
// from it as any other does: `focusedValue` here, with nothing to hand a move
// back, held it on that month whatever was pressed.
//
// Kept from Chromatic, since a snapshot of it would change every day and ask
// for both modes to be accepted again. The outline itself is pinned by the
// `today` cases in index.test.tsx.
const Today: Story = {
  args: {
    defaultFocusedValue: today(getLocalTimeZone()),
    defaultValue: undefined,
  },
  parameters: {
    chromatic: { disableSnapshot: true },
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

// Disabled, holding a date. Every date, the weekday row and the chevrons fade
// to the page's 38%, and the date held stays a circle, in the disabled
// filled container, rather than turning into one more faded date.
const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

// Read-only, holding a date. The dates stay at full strength, since the
// calendar still reports its value, but a press does not change it, so they
// draw neither the pointer nor a state layer. The chevrons still move the
// month.
const ReadOnly: Story = {
  args: {
    isReadOnly: true,
  },
}

// Invalid, with the reason under the months. The date held turns to the
// error container colours, and React Aria points its description at the
// message.
const Invalid: Story = {
  args: {
    error: 'Choose another date.',
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
  Disabled,
  Invalid,
  MonthAndYearMenus,
  MonthList,
  ReadOnly,
  Today,
  TwoMonths,
  TwoMonthsWithMenus,
}

export default meta
