import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ProgressIndicator from '.'
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

const styles = stylex.create({
  // A linear indicator fills its container, so the samples need a width.
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
  rings: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.xl,
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
  component: ProgressIndicator,
  title: 'Components/ProgressIndicator',
} satisfies Meta<typeof ProgressIndicator>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ProgressIndicator
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Progress through a task, as a line or a ring.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Determinate
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The active indicator takes the value&apos;s share, the track what is
            left, and the stop indicator marks the end. Pass showValue to put
            the percentage beside the label.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ProgressIndicator label="Quarter" value={25} />
          <ProgressIndicator label="Half" showValue value={50} />
          <ProgressIndicator label="Nearly done" showValue value={90} />
        </div>
        <div {...stylex.props(styles.rings)}>
          <ProgressIndicator
            aria-label="Quarter"
            value={25}
            variant="circular"
          />
          <ProgressIndicator aria-label="Half" value={50} variant="circular" />
          <ProgressIndicator
            aria-label="Nearly done"
            value={90}
            variant="circular"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Buffer
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            How far the work is loaded ahead of the value — a video&apos;s
            buffered seconds, a queue&apos;s fetched pages. The track is solid
            up to the buffer and dotted beyond it, and the dots scroll.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ProgressIndicator buffer={70} label="Buffered" value={30} />
          <ProgressIndicator buffer={45} label="Just ahead" value={30} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Indeterminate
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            For work whose length is not known. The line sweeps and the ring
            turns, and both stop where they stand for a reader who has asked for
            reduced motion — the indicator still says the work is going on,
            without the movement.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ProgressIndicator isIndeterminate label="Working" />
        </div>
        <div {...stylex.props(styles.rings)}>
          <ProgressIndicator
            aria-label="Working"
            isIndeterminate
            variant="circular"
          />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const WithValue: Story = {
  args: {
    showValue: true,
  },
}

const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
    value: undefined,
  },
}

const WithBuffer: Story = {
  args: {
    buffer: 70,
    value: 30,
  },
}

const Circular: Story = {
  args: {
    variant: 'circular',
  },
}

const CircularIndeterminate: Story = {
  args: {
    isIndeterminate: true,
    value: undefined,
    variant: 'circular',
  },
}

export {
  Circular,
  CircularIndeterminate,
  Default,
  Indeterminate,
  Overview,
  WithBuffer,
  WithValue,
}

export default meta
