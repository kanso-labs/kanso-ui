import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Feed from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import ProductIcon from '../product-icon'
import Tag from '../tag'
import Text from '../text'

// A mark of awkward proportions, inline so the story needs no fixture served
// alongside it. Wide on purpose: it is what shows ProductIcon letterboxing
// rather than cropping when these are seen at a glance. Its colours are
// plain `#` hex, since `encodeURIComponent` escapes the `#` itself: a `%23`
// written here would be escaped a second time into no colour at all.
const MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 32"><rect width="96" height="32" rx="4" fill="#394b47"/><circle cx="16" cy="16" r="8" fill="#74d9af"/><rect x="32" y="12" width="52" height="8" rx="4" fill="#e7edea"/></svg>`,
  )

const ITEMS = [
  { label: 'First item', supporting: 'Supporting line' },
  {
    label: 'Second item',
    supporting:
      'A longer supporting line, to show a card growing to its content',
  },
  { label: 'Third item', supporting: 'Supporting line' },
  { label: 'Fourth item', supporting: 'Supporting line' },
  { label: 'Fifth item', supporting: 'Supporting line' },
  { label: 'Sixth item', supporting: 'Supporting line' },
]

const ITEM_MIN_WIDTH = '260px'

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  head: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
  },
  narrow: {
    inlineSize: '300px',
  },
  // alignItems, because a flex column stretches its children and an
  // inline-flex Tag would otherwise span the whole card.
  stack: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  wide: {
    inlineSize: '640px',
  },
})

function ItemCard({
  label,
  supporting,
}: {
  label: string
  supporting: string
}) {
  return (
    <Card variant="outlined">
      <div {...stylex.props(styles.stack)}>
        <div {...stylex.props(styles.head)}>
          <ProductIcon name={label} size="sm" src={MARK} />
          <Text variant="titleSmall">{label}</Text>
        </div>
        <Text tone="muted" variant="bodySmall">
          {supporting}
        </Text>
        <Tag tone="neutral" variant="outlined">
          Label
        </Tag>
      </div>
    </Card>
  )
}

function Items({ count = ITEMS.length }: { count?: number }) {
  return ITEMS.slice(0, count).map((item) => (
    <ItemCard key={item.label} {...item} />
  ))
}

const meta = {
  args: {
    children: <Items />,
    minItemWidth: ITEM_MIN_WIDTH,
  },
  component: Feed,
  title: 'Components/Feed',
} satisfies Meta<typeof Feed>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a single column is the arrangement most of the
// argument is about, and the default width never reaches it.
const SingleColumn: Story = {
  args: {
    children: <Items count={3} />,
    minItemWidth: '100%',
  },
}

// Its own story because the grid answers to the room it is given rather than
// to the width of the window, so a feed inside a pane reflows with the pane:
// the same feed and cell minimum, in containers of different widths.
const ContainerWidths: Story = {
  render: () => (
    <div {...stylex.props(styles.column)}>
      <div {...stylex.props(styles.wide)}>
        <Feed minItemWidth={ITEM_MIN_WIDTH}>
          <Items count={4} />
        </Feed>
      </div>
      <div {...stylex.props(styles.narrow)}>
        <Feed minItemWidth={ITEM_MIN_WIDTH}>
          <Items count={2} />
        </Feed>
      </div>
    </div>
  ),
}

// Its own story because two items in a row with space for four stay the width
// of a cell rather than stretching to share the row, so a short feed reads as
// the start of a longer one.
const ShortRow: Story = {
  args: {
    children: <Items count={2} />,
  },
}

export { ContainerWidths, Default, ShortRow, SingleColumn }

export default meta
