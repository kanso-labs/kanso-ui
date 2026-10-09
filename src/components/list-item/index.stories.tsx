// The leading and trailing slots take nodes, so passing JSX to them is this
// component's API rather than a misuse of it — and in a list the node depends
// on the row's own data, so there is nothing to hoist. react-perf guards
// against a fresh element identity defeating memoization, which the React
// Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ListItem from '.'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Card from '../card'
import Separator from '../separator'
import Text from '../text'

// A row can lead with a tinted tile holding a glyph, or with an avatar. Both
// are just content in the leading slot, which is why the slot takes a node
// rather than an icon prop.
const styles = stylex.create({
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
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
  // A styled span rather than a Text: the value column wants mono with tabular
  // figures so 01/02/03 line up down the list, and Text carries neither — its
  // variants set the family, and it spreads its own StyleX class last so the
  // call site cannot add font-variant-numeric.
  value: {
    color: colors.onSurface,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelLargeSize,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.weightMedium,
  },
  width: {
    inlineSize: '380px',
  },
})

const LIST_ROWS = [
  ['First item', 'Supporting line · Metadata · Detail', '01', '★'],
  ['Second item', 'Supporting line · Metadata · Detail', '02', '◆'],
  ['Third item', 'Supporting line · Metadata · Detail', '03', '●'],
] as const satisfies [string, string, string, string][]

// A row fills its container, so it needs one to have a width. Wrapping in a
// decorator rather than inside a `render` is what lets the stories below be
// nothing but `args`, and so leaves every prop live in the Controls panel.
const Constrained: Decorator = (Story) => (
  <div {...stylex.props(styles.width)}>
    <Story />
  </div>
)

const meta = {
  args: {
    children: 'Headline',
    supporting: 'Supporting line · Metadata · Detail',
  },
  component: ListItem,
  title: 'Components/ListItem',
} satisfies Meta<typeof ListItem>

type Story = StoryObj<typeof meta>

const Default: Story = {
  decorators: [Constrained],
}

// Interactive, since a disabled row is most often an action that is not
// available yet. A row that only presents is drawn the same way.
const Disabled: Story = {
  args: {
    interactive: true,
    isDisabled: true,
  },
  decorators: [Constrained],
}

// Its own story because it is a different element — a button rather than a
// div — with focus and ripple behaviour a snapshot cannot show.
const Interactive: Story = {
  args: {
    interactive: true,
  },
  decorators: [Constrained],
}

// Its own story because it is a different layout, not a different line: the
// leading and trailing slots move to the top of the row with the third line,
// which is why this sample fills both of them. An overline on its own changes
// nothing but the type, and is a prop away on Default.
const ThreeLine: Story = {
  args: {
    children: 'Headline',
    leading: <Avatar name="Ada Lovelace" size="md" />,
    overline: 'Overline',
    supporting: 'Supporting line · Metadata · Detail',
    trailing: <span {...stylex.props(styles.value)}>01</span>,
  },
  decorators: [Constrained],
}

// Its own story because it is the composition the component is for: an
// outlined Card with no padding, a rule between rows and a row per entry, each
// one a button that ripples.
const InAList: Story = {
  decorators: [Constrained],
  render: () => (
    <Card padding="none" variant="outlined">
      {LIST_ROWS.map(([title, supporting, value, glyph], index) => (
        <div key={title}>
          {index === 0 ? null : <Separator />}
          <ListItem
            interactive
            leading={<span {...stylex.props(styles.tile)}>{glyph}</span>}
            supporting={supporting}
            trailing={<span {...stylex.props(styles.value)}>{value}</span>}
          >
            {title}
          </ListItem>
        </div>
      ))}
    </Card>
  ),
}

// Its own story because nothing truncates: a headline that needs two lines
// takes two and the row grows, and the middle column gives way rather than
// shoving the trailing slot off the end. A string with nowhere to break, an
// address here, breaks inside itself rather than painting over the slot.
const LongContent: Story = {
  decorators: [Constrained],
  render: () => (
    <div {...stylex.props(styles.rows)}>
      <ListItem
        leading={<Avatar name="Grace Hopper" size="md" tone="tertiary" />}
        supporting="Supporting line · Metadata · a very long supporting line that keeps going"
        trailing={
          <Text tone="muted" variant="labelSmall">
            Label
          </Text>
        }
      >
        A headline long enough that it has nowhere left to go on one line
      </ListItem>
      <ListItem
        leading={<Avatar name="Grace Hopper" size="md" tone="tertiary" />}
        supporting="firstname.lastname@organisation.example.com"
        trailing={
          <Text tone="muted" variant="labelSmall">
            Label
          </Text>
        }
      >
        Headline
      </ListItem>
    </div>
  ),
}

export { Default, Disabled, InAList, Interactive, LongContent, ThreeLine }

export default meta
