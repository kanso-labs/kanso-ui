import type { Meta, StoryObj } from '@storybook/react-vite'
import type { DateValue } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import Calendar from '.'
import { CalendarDate, getLocalTimeZone, today } from '../../date'
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

// A fixed month, so every snapshot reads the same whenever it is taken. The
// `Today` story is the one that asks for the real date, since what it shows
// is the outline today carries.
const SEPTEMBER = new CalendarDate(2026, 9, 15)
const MAX = new CalendarDate(2026, 9, 24)
const MIN = new CalendarDate(2026, 9, 8)
const VISIBLE_TWO = { months: 2 }

const meta = {
  args: {
    'aria-label': 'Label',
    defaultValue: SEPTEMBER,
  },
  component: Calendar,
  title: 'Components/Calendar',
} satisfies Meta<typeof Calendar>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Calendar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A month calendar for picking a date.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The month
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The date pickers page&apos;s docked calendar: a 360px container on
            the high surface container, dates at its 40px state layer with 48px
            between their centres, and body-large for both the weekday row and
            the dates. The date the calendar holds fills its circle in the
            primary role.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The page&apos;s 456px container height is a picker&apos;s, counting
            a headline and an action row a calendar does not draw — so this is
            as tall as its weeks, and a six-week month is taller than a
            five-week one.
          </Text>
        </div>
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Bounds
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `minValue` and `maxValue` bound the calendar, and
            `isDateUnavailable` rules out dates one at a time — weekends here.
            Either way the date fades to the page&apos;s 38% and stops taking a
            press, which is the same treatment every disabled control here
            takes.
          </Text>
        </div>
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          isDateUnavailable={isWeekend}
          maxValue={MAX}
          minValue={MIN}
        />
      </section>
    </div>
  ),
}

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
// where it is, which a snapshot shows and prose cannot.
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
    visibleDuration: VISIBLE_TWO,
  },
}

function isWeekend(date: DateValue) {
  const day = date.toDate(getLocalTimeZone()).getDay()
  return day === 0 || day === 6
}

export { Bounded, Default, Overview, Today, TwoMonths }

export default meta
