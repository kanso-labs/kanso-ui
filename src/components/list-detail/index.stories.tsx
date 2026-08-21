import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ListDetail from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import ListItem from '../list-item'
import Separator from '../separator'
import Text from '../text'

// Every other component in this library can be judged at one width. These two
// cannot: a media query answers to the window, not to a container, so no
// arrangement of samples on one page can show compact beside expanded. The
// widths below are what gives Chromatic a baseline per breakpoint instead —
// one inside compact, one inside medium, one inside expanded — so a rule that
// stops matching is caught by the mode it broke rather than by whichever
// single width the snapshot happened to use.
//
// Six snapshots per themed story is more than the one-width default, and it
// is the cost of the thing these components exist to do.
const BREAKPOINT_VIEWPORTS = [500, 700, 1100]

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const ITEMS = ['First item', 'Second item', 'Third item']

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
  // A dashed outline on each pane, so the tracks are legible in a snapshot.
  // The component paints nothing itself — these are the story's, not its.
  paneOutline: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    padding: spacing.md,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
})

function DetailPane() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <div {...stylex.props(styles.stack)}>
        <Text render={HEADING_2} variant="titleLarge">
          Headline
        </Text>
        <Text tone="muted" variant="bodyMedium">
          Supporting line
        </Text>
        <Separator />
        <Text tone="muted" variant="bodyMedium">
          The detail pane takes the flexible track, so it absorbs whatever the
          list does not.
        </Text>
      </div>
    </div>
  )
}

function ListPane() {
  return (
    <Card padding="none" variant="outlined">
      {ITEMS.map((label, index) => (
        <div key={label}>
          {index === 0 ? null : <Separator />}
          <ListItem interactive supporting="Supporting line">
            {label}
          </ListItem>
        </div>
      ))}
    </Card>
  )
}

const meta = {
  args: {
    detail: <DetailPane />,
    list: <ListPane />,
  },
  component: ListDetail,
  parameters: {
    chromatic: { viewports: BREAKPOINT_VIEWPORTS },
  },
  title: 'Components/ListDetail',
} satisfies Meta<typeof ListDetail>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: (args) => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ListDetail
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Material 3's list-detail layout. A fixed list pane beside a flexible
          detail pane, collapsing to one pane at a time when the window is
          narrower than the expanded breakpoint.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Across the breakpoints
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Resize the window to see it move. Below 840px only the pane named by
            `showing` is on screen; from 840px both are, with the list fixed at
            360px and the detail taking the rest. At 1600px the list widens to
            412px, which is M3's recommended fixed-pane width there.
          </Text>
        </div>
        <ListDetail {...args} />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Showing the detail
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `showing` is controlled, because only the app knows an item was
            selected. It decides which pane survives below the expanded
            breakpoint, and is ignored above it, where both fit.
          </Text>
        </div>
        <ListDetail {...args} showing="detail" />
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because below the expanded breakpoint it is a different
// layout rather than a differently-sized one — the list is gone, not narrower.
const ShowingDetail: Story = {
  args: {
    showing: 'detail',
  },
}

export { Default, Overview, ShowingDetail }

export default meta
