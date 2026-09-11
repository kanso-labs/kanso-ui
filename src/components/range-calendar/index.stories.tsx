import type { Meta, StoryObj } from '@storybook/react-vite'
import type { DateValue } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import RangeCalendar from '.'
import { CalendarDate, getLocalTimeZone } from '../../date'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components rather than from shell components of its own, and
// why its sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
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

// A fixed range in a fixed month, so every snapshot reads the same whenever
// it is taken.
const RANGE = {
  end: new CalendarDate(2026, 9, 15),
  start: new CalendarDate(2026, 9, 8),
}

// A range that crosses a month boundary, which is what two months side by
// side are usually for.
const ACROSS = {
  end: new CalendarDate(2026, 10, 6),
  start: new CalendarDate(2026, 9, 24),
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          RangeCalendar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A calendar for picking a range of dates.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The range
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Every part is Calendar&apos;s — the container, the grid, the weekday
            row, the chevrons and the date circle — so the two cannot come
            apart. The two ends take that circle; the days between take a band
            in the secondary container, one step down from the primary the ends
            take.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The date pickers page carries no token for that band, so it is the
            library&apos;s own. It is square where it continues and round where
            it stops, which is what makes a run of days read as one shape rather
            than a row of circles.
          </Text>
        </div>
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Across two months
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `visibleDuration` draws the months side by side, and a range that
            crosses the boundary carries its band across both. Dates ruled out
            by `isDateUnavailable` stop a range at the first of them, unless
            `allowsNonContiguousRanges` lets it skip them.
          </Text>
        </div>
        <RangeCalendar
          aria-label="Label"
          defaultValue={ACROSS}
          visibleDuration={VISIBLE_TWO}
        />
      </section>
    </div>
  ),
}

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

function isWeekend(date: DateValue) {
  const day = date.toDate(getLocalTimeZone()).getDay()
  return day === 0 || day === 6
}

export { Bounded, Default, Overview, TwoMonths }

export default meta
