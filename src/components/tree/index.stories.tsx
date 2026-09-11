// A row's slots take nodes, so passing JSX to them is this component's API
// rather than a misuse of it — and in a tree the node depends on the row's
// own data, so there is nothing to hoist. react-perf guards against a fresh
// element identity defeating memoization, which the React Compiler this repo
// builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tree from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components rather than from shell components of its own, and
// why its sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '420px',
  },
})

const OPEN = ['first', 'second']

const meta = {
  args: {
    'aria-label': 'Label',
  },
  component: Tree,
  title: 'Components/Tree',
} satisfies Meta<typeof Tree>

type Story = StoryObj<typeof meta>

function Sample(props: {
  selectionMode?: 'multiple' | 'none' | 'single'
  supporting?: boolean
}) {
  return (
    <Card padding="none" variant="outlined">
      <Tree
        aria-label="Label"
        defaultExpandedKeys={OPEN}
        defaultSelectedKeys={OPEN}
        selectionMode={props.selectionMode}
      >
        <Tree.Item
          headline="First item"
          id="first"
          supporting={props.supporting === true ? 'Supporting line' : undefined}
        >
          <Tree.Item
            headline="Second item"
            id="second"
            supporting={
              props.supporting === true ? 'Supporting line' : undefined
            }
          >
            <Tree.Item headline="Third item" id="third" />
          </Tree.Item>
          <Tree.Item headline="Fourth item" id="fourth" />
        </Tree.Item>
        <Tree.Item headline="Fifth item" id="fifth" />
      </Tree>
    </Card>
  )
}

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Tree
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A list whose rows nest, with a caret on the rows that open.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Nesting
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Each row is the row every list here draws, so a tree beside a list
            reads as the same thing at a different depth. A level indents by one
            caret&apos;s width, and a row with no children takes that width as
            space rather than a caret — which is what keeps a leaf&apos;s
            headline in line with the headline of a sibling that opens.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <Sample />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A tree that toggles draws a checkbox on every row, after the caret
            and before whatever the row was given. A selected row takes the
            primary container — the same one a selected list row takes, so the
            two cannot disagree on a page holding both.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <Sample selectionMode="multiple" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Two lines
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The row&apos;s own slots are all here: a supporting line under the
            headline grows the row past its 56px floor exactly as it does in a
            list, and the caret stays centred against the pair.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <Sample supporting />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample />
    </div>
  ),
}

// Its own story because the checkbox column changes the row's leading edge,
// which a snapshot shows and the overview's copy cannot.
const Selectable: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample selectionMode="multiple" />
    </div>
  ),
}

export { Default, Overview, Selectable }

export default meta
