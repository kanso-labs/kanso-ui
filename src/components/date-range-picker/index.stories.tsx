import type { Meta, StoryObj } from '@storybook/react-vite'

import DateRangePicker from '.'
import { breakpointModes } from '../../../.storybook/modes'
import { CalendarDate } from '../../date'

// A fixed range, so every snapshot reads the same whenever it is taken.
const RANGE = {
  end: new CalendarDate(2026, 9, 20),
  start: new CalendarDate(2026, 9, 15),
}
const MIN = new CalendarDate(2026, 9, 8)

// A range in February 2026 for the two-month story, so the months it shows
// are fixed and long past: September 2026 and the month after it would put
// whichever day is today in October in the snapshot. February is also the
// four-week month, which shows the room each month holds when they stack.
const FEBRUARY = {
  end: new CalendarDate(2026, 2, 17),
  start: new CalendarDate(2026, 2, 10),
}

const meta = {
  args: {
    defaultValue: RANGE,
    label: 'Label',
  },
  component: DateRangePicker,
  title: 'Components/DateRangePicker',
} satisfies Meta<typeof DateRangePicker>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because an empty range is the one that shows both sets of
// segment placeholders with the dash between them.
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

// Its own story because the band across the selected days is the half a
// closed picker cannot show, and it is the state a reviewer most wants to
// look at.
const Open: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '500px', inline: false } } },
}

// Two months side by side, which is what a range is usually picked from, and
// the docked surface twice as wide for it. Captured at the medium and the
// compact width too, where the months stack: docked at the first and modal
// at the second.
const OpenTwoMonths: Story = {
  args: {
    defaultOpen: true,
    defaultValue: FEBRUARY,
    visibleDuration: { months: 2 },
  },
  parameters: {
    chromatic: {
      modes: {
        compact: breakpointModes.compact,
        medium: breakpointModes.medium,
      },
    },
    docs: { story: { height: '500px', inline: false } },
  },
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

export {
  Default,
  Empty,
  Open,
  OpenTwoMonths,
  Outlined,
  WithError,
  WithMinValue,
}

export default meta
