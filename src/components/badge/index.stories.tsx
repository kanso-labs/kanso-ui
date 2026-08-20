// ListItem's trailing slot takes a node, so passing a Badge to it is that
// component's API rather than a misuse of it. react-perf guards against a
// fresh element identity defeating memoization, which the React Compiler this
// repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Badge from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ListItem from '../list-item'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const TONES = ['neutral', 'primary', 'positive', 'negative'] as const

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
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxInlineSize: '420px',
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // Tighter than the page's sample gap: a set of badges reads as one legend
  // rather than as separate samples.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sample: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    children: 'Label',
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
          A short, read-only label attached to something else. It takes no
          interaction — for a label that can be selected, reach for Chip.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tones
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Neutral states without ranking. The other three name a direction, so
            reach for one only where the direction is the point — a row of
            badges in four colours ranks nothing and reads as decoration.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Variants
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Filled sits on a container of its own; outlined is a rule on the
            page, for a badge that should not compete with the thing it labels.
            Both are the same size, so one can be emphasised without moving its
            neighbours.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <div {...stylex.props(styles.row)}>
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                Label
              </Badge>
            ))}
          </div>
          <Text tone="muted" variant="labelSmall">
            filled
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <div {...stylex.props(styles.row)}>
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant="outlined">
                Label
              </Badge>
            ))}
          </div>
          <Text tone="muted" variant="labelSmall">
            outlined
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            In a row
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The common home for a badge is a list row's trailing slot. Figures
            sit on a fixed advance, so a column of them lines up rather than
            wobbling from row to row.
          </Text>
        </div>
        <div {...stylex.props(styles.list)}>
          <ListItem supporting="Supporting line" trailing={<Badge>01</Badge>}>
            First item
          </ListItem>
          <Separator />
          <ListItem supporting="Supporting line" trailing={<Badge>02</Badge>}>
            Second item
          </ListItem>
          <Separator />
          <ListItem
            supporting="Supporting line"
            trailing={<Badge tone="positive">03</Badge>}
          >
            Third item
          </ListItem>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
