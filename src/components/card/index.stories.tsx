import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Card from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

const styles = stylex.create({
  // The card sets no padding in this mode, so the rows carry their own and
  // the rules between them reach both edges.
  listRow: {
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
  },
  row: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: spacing.lg,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  wide: {
    inlineSize: '260px',
  },
})

const meta = {
  component: Card,
  title: 'Components/Card',
} satisfies Meta<typeof Card>

type Story = StoryObj<typeof meta>

function Body({ title }: { title: string }) {
  return (
    <div {...stylex.props(styles.stack)}>
      <Text variant="titleMedium">{title}</Text>
      <Text tone="muted" variant="bodySmall">
        Supporting line beneath the title
      </Text>
    </div>
  )
}

// Side by side rather than one story each, because the three differ only in
// how they separate themselves from the page and that is a comparison.
const Variants: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Card {...args} variant="elevated" {...stylex.props(styles.wide)}>
        <Body title="Elevated" />
      </Card>
      <Card {...args} variant="filled" {...stylex.props(styles.wide)}>
        <Body title="Filled" />
      </Card>
      <Card {...args} variant="outlined" {...stylex.props(styles.wide)}>
        <Body title="Outlined" />
      </Card>
    </div>
  ),
}

// Renders a button, so it ripples and takes focus. Worth its own story
// because the resting state is the only part a snapshot can show — the lift
// and the ripple are what you get by pressing it.
const Interactive: Story = {
  args: {
    interactive: true,
  },
  render: (args) => (
    <Card {...args} {...stylex.props(styles.wide)}>
      <Body title="Interactive" />
    </Card>
  ),
}

// The design's bordered list container is exactly this: an outlined card with
// no padding of its own, holding rows separated by rules. It is the reason
// the library has no List component.
const AsAList: Story = {
  args: {
    padding: 'none',
    variant: 'outlined',
  },
  render: (args) => (
    <Card {...args} {...stylex.props(styles.wide)}>
      {['First item', 'Second item', 'Third item'].map((label, index) => (
        <div key={label}>
          {index === 0 ? null : <Separator />}
          <div {...stylex.props(styles.listRow)}>
            <Text variant="bodyMedium">{label}</Text>
          </div>
        </div>
      ))}
    </Card>
  ),
}

export { AsAList, Interactive, Variants }

export default meta
