import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { I18nProvider } from 'react-aria-components'

import TimeField from '.'
import { Time } from '../../date'
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
    inlineSize: '240px',
  },
})

// A fixed time, so every snapshot reads the same whenever it is taken.
const TIME = new Time(9, 30)

const meta = {
  args: {
    defaultValue: TIME,
    label: 'Label',
  },
  component: TimeField,
  title: 'Components/TimeField',
} satisfies Meta<typeof TimeField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          TimeField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A time typed a segment at a time.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The box
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Every part of it is DateField&apos;s: the segment treatment, the
            muted placeholder, the filled focus and the punctuation between. A
            time on a form and a date on the same form are the same field
            holding different values.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <TimeField defaultValue={TIME} label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimeField label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimeField label="Label" variant="outlined" />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Twelve or twenty-four hours
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Which clock a reader sees is their locale, through React Aria&apos;s
            `I18nProvider` — `en-US` adds a day-period segment and `en-GB` does
            not. `granularity` takes the field down to seconds.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <I18nProvider locale="en-US">
            <div {...stylex.props(styles.width)}>
              <TimeField
                defaultValue={TIME}
                description="en-US"
                label="Label"
              />
            </div>
          </I18nProvider>
          <I18nProvider locale="en-GB">
            <div {...stylex.props(styles.width)}>
              <TimeField
                defaultValue={TIME}
                description="en-GB"
                label="Label"
              />
            </div>
          </I18nProvider>
          <div {...stylex.props(styles.width)}>
            <TimeField
              defaultValue={TIME}
              description="seconds"
              granularity="second"
              label="Label"
            />
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
            the box, and the disabled fade every control here takes.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <TimeField
              defaultValue={TIME}
              description="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimeField
              defaultValue={TIME}
              error="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimeField defaultValue={TIME} isDisabled label="Label" />
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because an empty field is the one that shows the segment
// placeholders, which are what a reader types over.
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

// Its own story because seconds change how many focus stops the field has.
const WithSeconds: Story = {
  args: {
    granularity: 'second',
  },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

export { Default, Empty, Outlined, Overview, WithError, WithSeconds }

export default meta
