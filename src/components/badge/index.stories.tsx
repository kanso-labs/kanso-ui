import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Badge from '.'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'
import Text from '../text'

const styles = stylex.create({
  // The colour a standard icon button gives its icon, so a bare one reads
  // on the surface in either theme.
  icon: {
    blockSize: '24px',
    color: colors.onSurfaceVariant,
    inlineSize: '24px',
  },
  // A label and the badge after it, 4dp apart as the tabs page sets them.
  line: {
    alignItems: 'center',
    display: 'inline-flex',
    gap: spacing.xs,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
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

// Its own story because it is the badge's setting that changes, not a prop:
// with nothing to wrap it is the mark alone and stands in the line after a
// label, which is how a tab draws one.
const InLine: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.line)}>
        <Text variant="titleSmall">Label</Text>
        <Badge />
      </span>
      <span {...stylex.props(styles.line)}>
        <Text variant="titleSmall">Label</Text>
        <Badge count={3} />
      </span>
    </div>
  ),
}

// On an icon button, whose name carries what the hidden mark says.
const OnControl: Story = {
  render: (args) => (
    <IconButton aria-label="Label, 3 new">
      <Badge {...args} count={3} />
    </IconButton>
  ),
}

export { Capped, Count, Default, InLine, OnControl }

export default meta
