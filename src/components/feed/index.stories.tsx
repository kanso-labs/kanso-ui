import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Feed from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Badge from '../badge'
import Card from '../card'
import ProductIcon from '../product-icon'
import Separator from '../separator'
import Text from '../text'

// A mark of awkward proportions, inline so the story needs no fixture served
// alongside it. Wide on purpose: it is what shows ProductIcon letterboxing
// rather than cropping when these are seen at a glance.
const MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 32"><rect width="96" height="32" rx="4" fill="%23394b47"/><circle cx="16" cy="16" r="8" fill="%2374d9af"/><rect x="32" y="12" width="52" height="8" rx="4" fill="%23e7edea"/></svg>`,
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

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  head: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
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
  // The three widths the "Any container" section pours the same feed into.
  narrow: {
    inlineSize: '300px',
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
  // alignItems, because a flex column stretches its children and an
  // inline-flex Badge would otherwise span the whole card.
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
        <Badge tone="neutral" variant="outlined">
          Label
        </Badge>
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

const Overview: Story = {
  render: (args) => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Feed
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Material 3's feed layout. A grid of comparable items that fits as many
          columns as the space allows, down to one when it allows only one.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Described by its cell
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            There is no column count and there are no breakpoints. You say how
            narrow a cell may get, and the grid fits as many as it can — which
            is how M3 describes an adaptive grid, and why the same feed suits a
            phone and an ultrawide without being told about either.
          </Text>
        </div>
        <Feed {...args} />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Any container, not just any window
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            It answers to the room it is given rather than to the width of the
            browser, so a feed inside a pane reflows with the pane. Both below
            are the same feed with the same cell minimum, in containers of
            different widths — no window was resized to show this.
          </Text>
        </div>
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
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A short row keeps its shape
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Two items in a row with space for four stay the width of a cell
            rather than stretching to share the row between them. A feed of
            three should look like the first three of a longer one.
          </Text>
        </div>
        <Feed minItemWidth={ITEM_MIN_WIDTH}>
          <Items count={2} />
        </Feed>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because a single column is the arrangement most of the
// argument is about, and the default width never reaches it.
const SingleColumn: Story = {
  args: {
    children: <Items count={3} />,
    minItemWidth: '100%',
  },
}

export { Default, Overview, SingleColumn }

export default meta
