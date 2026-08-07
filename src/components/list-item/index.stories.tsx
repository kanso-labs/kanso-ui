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

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// A row can lead with a tinted tile holding a glyph, or with an avatar. Both
// are just content in the leading slot, which is why the slot takes a node
// rather than an icon prop.
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
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  // Fixed rather than fit-content so the samples beside every label start at
  // the same x, which is what makes a column of them comparable at a glance.
  rowLabel: {
    flexShrink: 0,
    inlineSize: '128px',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ListItem
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          One row of a list: a headline, an optional second line, and a slot at
          each end.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Slots
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Both end slots take a node rather than an icon prop, so a row can
            lead with an avatar, a tinted tile, or a checkbox without the
            component knowing which.
          </Text>
        </div>
        <div {...stylex.props(styles.rows)}>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                children
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem>Headline</ListItem>
            </div>
          </div>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                + supporting
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem supporting="Supporting line · Metadata · Detail">
                Headline
              </ListItem>
            </div>
          </div>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                + leading
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem
                leading={<Avatar name="Ada Lovelace" size="md" />}
                supporting="Supporting line · Metadata · Detail"
              >
                Headline
              </ListItem>
            </div>
          </div>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                + trailing
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem
                leading={<Avatar name="Ada Lovelace" size="md" />}
                supporting="Supporting line · Metadata · Detail"
                trailing={<span {...stylex.props(styles.value)}>01</span>}
              >
                Headline
              </ListItem>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Height
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A row with no supporting line still holds its 56px floor, which is
            what keeps a list of mixed rows from looking ragged.
          </Text>
        </div>
        <div {...stylex.props(styles.rows)}>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                one line
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem>Headline only</ListItem>
            </div>
          </div>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                two lines
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem supporting="Supporting line · Metadata · Detail">
                Headline
              </ListItem>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Long content
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Nothing truncates: a headline that needs two lines takes two and the
            row grows past its 56px floor. What matters is that the middle
            column gives way rather than shoving the trailing slot off the end —
            including when the content cannot wrap at all.
          </Text>
        </div>
        <div {...stylex.props(styles.rows)}>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                wraps
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem
                leading={
                  <Avatar name="Grace Hopper" size="md" tone="tertiary" />
                }
                supporting="Supporting line · Metadata · a very long supporting line that keeps going"
                trailing={
                  <Text tone="muted" variant="labelSmall">
                    Label
                  </Text>
                }
              >
                A headline long enough that it has nowhere left to go on one
                line
              </ListItem>
            </div>
          </div>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                unbreakable
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <ListItem
                leading={
                  <Avatar name="Grace Hopper" size="md" tone="tertiary" />
                }
                supporting="no-spaces-anywhere-in-this-supporting-line-at-all"
                trailing={
                  <Text tone="muted" variant="labelSmall">
                    Label
                  </Text>
                }
              >
                Headline
              </ListItem>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            In a list
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            What the component is for: an outlined Card with no padding, rules
            between rows, and a row per entry. `interactive` makes each one a
            button that ripples.
          </Text>
        </div>
        <div {...stylex.props(styles.rows)}>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                interactive
              </Text>
            </div>
            <div {...stylex.props(styles.width)}>
              <Card padding="none" variant="outlined">
                {LIST_ROWS.map(([title, supporting, value, glyph], index) => (
                  <div key={title}>
                    {index === 0 ? null : <Separator />}
                    <ListItem
                      interactive
                      leading={
                        <span {...stylex.props(styles.tile)}>{glyph}</span>
                      }
                      supporting={supporting}
                      trailing={
                        <span {...stylex.props(styles.value)}>{value}</span>
                      }
                    >
                      {title}
                    </ListItem>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
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

export { Default, Interactive, Overview }

export default meta
