// The leading and trailing slots take nodes, so passing JSX to them is this
// component's API rather than a misuse of it — and in a list the node depends
// on the row's own data, so there is nothing to hoist. react-perf guards
// against a fresh element identity defeating memoization, which the React
// Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ListItem from '.'
import { colors, radii, typography } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Card from '../card'
import Separator from '../separator'
import Text from '../text'

// The design's activity rows lead with a tinted tile holding an icon, and its
// people rows lead with an avatar. Both are just content in the leading slot,
// which is why the slot takes a node rather than an icon prop.
const styles = stylex.create({
  amount: {
    color: colors.onSurface,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelLargeSize,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.weightMedium,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    blockSize: '36px',
    borderRadius: radii.md,
    color: colors.onPrimaryContainer,
    display: 'flex',
    fontSize: typography.titleMediumSize,
    inlineSize: '36px',
    justifyContent: 'center',
  },
  width: {
    inlineSize: '380px',
  },
})

const ACTIVITY = [
  [
    'Groceries at Trader Joe’s',
    'You paid · Split 3 ways · Today',
    '$42.80',
    '🧾',
  ],
  ['Dinner at Lottie’s', 'Sam paid · You owe $26 · Sun', '$78.00', '🍜'],
  ['Utilities — March', 'You paid · Priya owes $90 · Mar 1', '$180.00', '⚡'],
] as const satisfies [string, string, string, string][]

const meta = {
  args: {
    children: 'Groceries at Trader Joe’s',
    supporting: 'You paid · Split 3 ways · Today',
  },
  component: ListItem,
  title: 'Components/ListItem',
} satisfies Meta<typeof ListItem>

type Story = StoryObj<typeof meta>

// Each slot on its own, so it is clear which part of the row each one is.
const Slots: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ListItem {...args} />
      <ListItem
        {...args}
        leading={<Avatar name="Mia Ng" size="md" tone="positive" />}
      />
      <ListItem
        {...args}
        leading={<Avatar name="Mia Ng" size="md" tone="positive" />}
        trailing={<span {...stylex.props(styles.amount)}>$42.80</span>}
      />
    </div>
  ),
}

// A row with no supporting line still holds its 56px floor, which is what
// keeps a mixed list from looking ragged.
const HeadlineOnly: Story = {
  args: {
    supporting: undefined,
  },
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ListItem {...args}>Settle up</ListItem>
    </div>
  ),
}

// What the component is for: the design's activity list, composed from an
// outlined Card with no padding, rules between rows, and a row per expense.
const InAList: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Card padding="none" variant="outlined">
        {ACTIVITY.map(([title, meta_, amount, glyph], index) => (
          <div key={title}>
            {index === 0 ? null : <Separator />}
            <ListItem
              interactive
              leading={<span {...stylex.props(styles.tile)}>{glyph}</span>}
              supporting={meta_}
              trailing={<span {...stylex.props(styles.amount)}>{amount}</span>}
            >
              {title}
            </ListItem>
          </div>
        ))}
      </Card>
    </div>
  ),
}

// Long content has to shrink rather than push the amount off the end, which
// is the one layout behaviour a row cannot be allowed to get wrong.
const Truncating: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ListItem
        {...args}
        leading={<Avatar name="Priya R" size="md" tone="tertiary" />}
        supporting="You paid · Priya owes $90 · a very long supporting line that keeps going"
        trailing={
          <Text tone="muted" variant="labelSmall">
            Mar 1
          </Text>
        }
      >
        A headline long enough that it has nowhere left to go on one line
      </ListItem>
    </div>
  ),
}

export { HeadlineOnly, InAList, Slots, Truncating }

export default meta
