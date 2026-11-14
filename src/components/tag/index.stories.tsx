// ListItem's trailing slot takes a node, so passing a Tag to it is that
// component's API rather than a misuse of it. react-perf guards against a
// fresh element identity defeating memoization, which the React Compiler this
// repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tag from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ListItem from '../list-item'
import Separator from '../separator'

const styles = stylex.create({
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxInlineSize: '420px',
  },
  // Centred, so a row of tags lines up on their middles.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Rows a story draws one under the other.
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// The default first, then the three that name a direction.
const TONES = ['neutral', 'primary', 'positive', 'negative'] as const

// The default first.
const VARIANTS = ['filled', 'outlined'] as const

const meta = {
  args: {
    children: 'Label',
  },
  component: Tag,
  title: 'Components/Tag',
} satisfies Meta<typeof Tag>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The common home for a tag is a list row's trailing slot, so it is drawn
// there: figures sit on a fixed advance, which keeps a column of them lined up
// rather than wobbling from row to row.
const InListRow: Story = {
  render: () => (
    <div {...stylex.props(styles.list)}>
      <ListItem supporting="Supporting line" trailing={<Tag>01</Tag>}>
        First item
      </ListItem>
      <Separator />
      <ListItem supporting="Supporting line" trailing={<Tag>02</Tag>}>
        Second item
      </ListItem>
      <Separator />
      <ListItem
        supporting="Supporting line"
        trailing={<Tag tone="positive">03</Tag>}
      >
        Third item
      </ListItem>
    </div>
  ),
}

// Each tone in each variant, filled over outlined: the tone's container under
// its on-colour, then the tone itself at full strength for the rule and the
// text, with neutral's rule in outline variant. The two rows are the same
// size, since filled keeps its 1px border, transparent.
const Tones: Story = {
  render: () => (
    <div {...stylex.props(styles.rows)}>
      {VARIANTS.map((variant) => (
        <div key={variant} {...stylex.props(styles.row)}>
          {TONES.map((tone) => (
            <Tag key={tone} tone={tone} variant={variant}>
              Label
            </Tag>
          ))}
        </div>
      ))}
    </div>
  ),
}

export { Default, InListRow, Tones }

export default meta
