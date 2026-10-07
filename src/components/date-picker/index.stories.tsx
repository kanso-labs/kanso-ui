import type { Meta, StoryObj } from '@storybook/react-vite'

import DatePicker from '.'
import { CalendarDate } from '../../date'

// A fixed date, so every snapshot reads the same whenever it is taken.
const DATE = new CalendarDate(2026, 9, 15)
const MIN = new CalendarDate(2026, 9, 8)

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
// show, and it is the state a reviewer most wants to look at.
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

export {
  Default,
  Empty,
  Open,
  OpenWithMenus,
  Outlined,
  WithError,
  WithMinValue,
}

export default meta
