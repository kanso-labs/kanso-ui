import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { I18nProvider } from 'react-aria-components'

import DateField from '.'
import { CalendarDate, CalendarDateTime } from '../../date'
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
    inlineSize: '260px',
  },
})

// A fixed date, so every snapshot reads the same whenever it is taken.
const DATE = new CalendarDate(2026, 9, 15)

// A granularity below a day needs a value carrying a time; React Aria rejects
// `minute` against a date-only value.
const DATE_TIME = new CalendarDateTime(2026, 9, 15, 9, 30)

const meta = {
  args: {
    defaultValue: DATE,
    label: 'Label',
  },
  component: DateField,
  title: 'Components/DateField',
} satisfies Meta<typeof DateField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          DateField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A date typed a segment at a time, rather than picked from a calendar.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The box
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The box, label and message are the field chrome every field here
            draws, so a date on a form is the same box as the text field beside
            it. A segment not yet filled shows its own placeholder in the muted
            role, and the label stays down until one holds a real value.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <DateField defaultValue={DATE} label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateField label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateField label="Label" variant="outlined" />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Locale and granularity
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            How many segments there are and what order they come in is the
            reader&apos;s locale, through React Aria&apos;s `I18nProvider` — the
            same date reads day-first under `en-GB` and month-first under
            `en-US`. `granularity` adds the time segments.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <I18nProvider locale="en-US">
            <div {...stylex.props(styles.width)}>
              <DateField
                defaultValue={DATE}
                description="en-US"
                label="Label"
              />
            </div>
          </I18nProvider>
          <I18nProvider locale="en-GB">
            <div {...stylex.props(styles.width)}>
              <DateField
                defaultValue={DATE}
                description="en-GB"
                label="Label"
              />
            </div>
          </I18nProvider>
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
            the box, and the disabled fade every control here takes.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <DateField
              defaultValue={DATE}
              description="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateField
              defaultValue={DATE}
              error="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <DateField defaultValue={DATE} isDisabled label="Label" />
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because an empty field is the one that shows the segment
// placeholders, which are the thing a reader types over.
const Empty: Story = {
  args: {
    defaultValue: undefined,
  },
}

// Its own story because the outlined box is a different shape, not a
// different state.
const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// Its own story because time segments change how many focus stops the field
// has, which is what `granularity` is for.
const WithTime: Story = {
  args: {
    defaultValue: DATE_TIME,
    granularity: 'minute',
  },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

export { Default, Empty, Outlined, Overview, WithError, WithTime }

export default meta
