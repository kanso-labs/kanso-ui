import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import DateRangePicker from '.'
import { CalendarDate } from '../../date'
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
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '320px',
  },
})

// A fixed range, so every snapshot reads the same whenever it is taken.
const RANGE = {
  end: new CalendarDate(2026, 9, 20),
  start: new CalendarDate(2026, 9, 15),
}
const MIN = new CalendarDate(2026, 9, 8)

const meta = {
  args: {
    defaultValue: RANGE,
    label: 'Label',
  },
  component: DateRangePicker,
  title: 'Components/DateRangePicker',
} satisfies Meta<typeof DateRangePicker>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          DateRangePicker
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A date range typed into a field, or picked from a calendar behind a
          button.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Two ends, one field
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The segments are DateField&apos;s and the calendar is RangeCalendar,
            so everything either of them does it does here. Both segment groups
            and the trigger sit inside one React Aria `Group`, so the box draws
            once around all three and a reader tabs start, end, trigger.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The dash between the two ends is decoration. React Aria names every
            segment for the end it belongs to, so a screen reader is already
            told which is which.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker defaultValue={RANGE} label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker label="Label" variant="outlined" />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Supporting text under the box, an error that replaces it and turns
            the box, bounds that reach the calendar as well as the segments, and
            the disabled fade every control here takes — the trigger included.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker
              defaultValue={RANGE}
              description="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker
              defaultValue={RANGE}
              error="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker defaultValue={RANGE} isDisabled label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateRangePicker
              defaultValue={RANGE}
              description="from the 8th"
              label="Label"
              minValue={MIN}
            />
          </div>
        </div>
      </section>
    </div>
  ),
}

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
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

export { Default, Empty, Open, Outlined, Overview, WithError }

export default meta
