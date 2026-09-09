import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Meter from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const BYTES = {
  notation: 'compact',
  style: 'unit',
  unit: 'gigabyte',
} as const

const styles = stylex.create({
  // A meter fills its container, so the samples need a width.
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    maxInlineSize: '360px',
  },
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

const meta = {
  args: {
    label: 'Label',
    value: 40,
  },
  component: Meter,
  title: 'Components/Meter',
} satisfies Meta<typeof Meter>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Meter
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          How full something is, on a scale it names.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Measurement
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The active indicator takes the value&apos;s share, the track what is
            left, and the stop indicator marks the end. The value is shown
            beside the label, since the number is the measurement.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Meter label="First item" value={20} />
          <Meter label="Second item" value={55} />
          <Meter label="Third item" value={90} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tone
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Whether the measurement is good or bad is the call site&apos;s to
            decide — nothing here reads the number and picks. Only the active
            indicator changes colour, so a column of meters still shares one
            track.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Meter label="Neutral" value={40} />
          <Meter label="Healthy" tone="positive" value={40} />
          <Meter label="Running out" tone="negative" value={94} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Scale
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A meter is read on the scale it is given rather than as a
            percentage. Set minValue and maxValue for the range, and
            formatOptions for how the figure reads in the page&apos;s locale.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Meter
            formatOptions={BYTES}
            label="First item"
            maxValue={512}
            value={318}
          />
          <Meter label="Second item" maxValue={5} showValue={false} value={4} />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const WithoutValue: Story = {
  args: {
    showValue: false,
  },
}

const Positive: Story = {
  args: {
    tone: 'positive',
  },
}

const Negative: Story = {
  args: {
    tone: 'negative',
    value: 94,
  },
}

const OnItsOwnScale: Story = {
  args: {
    formatOptions: BYTES,
    label: 'Label',
    maxValue: 512,
    value: 318,
  },
}

export { Default, Negative, OnItsOwnScale, Overview, Positive, WithoutValue }

export default meta
