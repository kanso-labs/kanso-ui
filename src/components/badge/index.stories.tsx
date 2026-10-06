import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Badge from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  icon: {
    blockSize: '24px',
    inlineSize: '24px',
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
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// A plain glyph rather than an icon set, so the stories show the badge
// alone: the star IconButton's own stories draw, at the 24dp the page
// measures the badge against.
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" />
    </svg>
  )
}

// Hoisted so it is one stable element per render, which is what react-perf's
// no-jsx-as-prop is after.
const STAR = <StarIcon />

const meta = {
  args: {
    children: STAR,
  },
  component: Badge,
  title: 'Components/Badge',
} satisfies Meta<typeof Badge>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Badge
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A mark on the corner of an icon that flags something new there.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Small and large
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The small badge is a 6px dot that flags without counting. Given
            `count`, the large badge holds the number in label small, 16px tall
            and growing toward the end as the number lengthens. Both are the
            page&apos;s error pair.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Badge>
            <StarIcon />
          </Badge>
          <Badge count={3}>
            <StarIcon />
          </Badge>
          <Badge count={42}>
            <StarIcon />
          </Badge>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Past the cap
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A count above `max` reads as `max` and a plus: 999+ by default, the
            page&apos;s four characters, and 99+ here with `max` set to 99.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Badge count={1200}>
            <StarIcon />
          </Badge>
          <Badge count={120} max={99}>
            <StarIcon />
          </Badge>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            On a control
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The mark is hidden from assistive technology, since a number read on
            its own has nothing to count. What it says goes in the name of the
            control it sits on — this button is named “Label, 3 new”.
          </Text>
        </div>
        <IconButton aria-label="Label, 3 new">
          <Badge count={3}>
            <StarIcon />
          </Badge>
        </IconButton>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The large badge, holding a count.
const Count: Story = {
  args: {
    count: 3,
  },
}

// A count past `max`, which the badge caps with a plus.
const Capped: Story = {
  args: {
    count: 1200,
  },
}

// On an icon button, whose name carries what the hidden mark says.
const OnControl: Story = {
  render: (args) => (
    <IconButton aria-label="Label, 3 new">
      <Badge {...args} count={3} />
    </IconButton>
  ),
}

export { Capped, Count, Default, OnControl, Overview }

export default meta
