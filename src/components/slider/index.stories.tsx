import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Slider from '.'
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

// Hoisted so each is one stable array per render rather than a fresh one,
// which is what react-perf's no-new-array-as-prop is after.
const RANGE = [20, 60]
const THUMB_LABELS = ['Start', 'End']

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
  // A slider fills its container, so the samples need a width to fill, and
  // room above for the value indicator.
  sample: {
    maxInlineSize: '420px',
    paddingBlockStart: spacing.xxxl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    defaultValue: 40,
    label: 'Label',
  },
  component: Slider,
  title: 'Components/Slider',
} satisfies Meta<typeof Slider>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Slider
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A handle along a track, for one value or a range.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Value
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The active part of the track is primary and the inactive part
            secondary container, with a stop at the far end; both stop short of
            the handle. Drag the handle, or focus it and use the arrow keys, to
            see the value over it.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Slider defaultValue={40} label="Label" />
        </div>
        <div {...stylex.props(styles.sample)}>
          <Slider defaultValue={40} label="In steps of ten" step={10} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Range
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A pair of values gives two handles, with the active part between
            them. Each handle takes a name of its own, since two named by the
            same label cannot be told apart.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Slider
            defaultValue={RANGE}
            label="Label"
            thumbLabels={THUMB_LABELS}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Vertical and disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A vertical slider runs along the block axis, rising from the bottom,
            and is 240px tall until its style says otherwise. Disabled, the
            parts and the handle dim.
          </Text>
        </div>
        <Slider defaultValue={40} label="Vertical" orientation="vertical" />
        <div {...stylex.props(styles.sample)}>
          <Slider defaultValue={40} isDisabled label="Disabled" />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

const Range: Story = {
  args: {
    defaultValue: RANGE,
    thumbLabels: THUMB_LABELS,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Slider {...args} />
    </div>
  ),
}

export { Default, Disabled, Overview, Range, Vertical }

export default meta
