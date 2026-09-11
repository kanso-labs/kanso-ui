import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import DatePicker from '.'
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
    inlineSize: '280px',
  },
})

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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          DatePicker
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A date typed into a field, or picked from a calendar behind a button.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            One field, two ways in
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The segments are DateField&apos;s and the calendar is Calendar, so
            everything either of them does it does here. React Aria&apos;s
            `Group` is what holds the segments and the trigger together, so the
            box draws once around both and a reader reaches the button at the
            end of the segments rather than as a separate control.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Above the medium breakpoint the calendar is docked to the field;
            below it, it opens centred, which is the page&apos;s modal picker —
            the same swap Sheet makes, and done the same way, in CSS.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <DatePicker defaultValue={DATE} label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DatePicker label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DatePicker label="Label" variant="outlined" />
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
            the disabled fade every control here takes.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <DatePicker
              defaultValue={DATE}
              description="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <DatePicker
              defaultValue={DATE}
              error="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <DatePicker defaultValue={DATE} isDisabled label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DatePicker
              defaultValue={DATE}
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
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

export { Default, Empty, Open, Outlined, Overview, WithError }

export default meta
