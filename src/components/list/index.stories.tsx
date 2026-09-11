import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { ListLayout, useListData, Virtualizer } from 'react-aria-components'

import List from '.'
import { useDragAndDrop } from '../../drag/hooks'
import { collectionSizes } from '../../layout'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Currency from '../currency'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's array and JSX rules are after.
const SECOND = ['second']
const FIRST_AND_THIRD = ['first', 'third']
const ADA = <Avatar name="Ada Lovelace" size="sm" />
const GRACE = <Avatar name="Grace Hopper" size="sm" />
const AMOUNT_ONE = <Currency value={1250} />
const AMOUNT_TWO = <Currency value={480} />

const ROWS = (
  <>
    <List.Item id="first">First item</List.Item>
    <List.Item id="second">Second item</List.Item>
    <List.Item id="third">Third item</List.Item>
  </>
)

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
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  // A virtualized list needs a box it can be taller than, which is what makes
  // it render only the rows in view.
  scroller: {
    blockSize: '320px',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // A list fills what it is given, so the samples need a width and something
  // to sit on.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '360px',
    overflow: 'hidden',
  },
})

const meta = {
  args: {
    'aria-label': 'Label',
    children: ROWS,
    selectionMode: 'multiple',
  },
  component: List,
  title: 'Components/List',
} satisfies Meta<typeof List<object>>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          List
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A list of rows one or more of which can be selected.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A list that toggles draws a checkbox on every row, from the state
            React Aria reports rather than a prop on each. It is the
            library&apos;s Checkbox, so it looks like every other one on the
            page. A selected row takes primary container.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <List
              aria-label="Multiple"
              defaultSelectedKeys={FIRST_AND_THIRD}
              selectionMode="multiple"
            >
              {ROWS}
            </List>
          </div>
          <div {...stylex.props(styles.surface)}>
            <List
              aria-label="Single"
              defaultSelectedKeys={SECOND}
              selectionBehavior="replace"
              selectionMode="single"
            >
              {ROWS}
            </List>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Slots
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A row is the row every list here draws, so it takes the same
            leading, supporting and trailing content ListItem does. ListItem is
            the static row; this is the collection that draws it.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <List aria-label="Slots" selectionMode="none">
              <List.Item
                id="first"
                leading={ADA}
                supporting="Supporting line"
                trailing={AMOUNT_ONE}
              >
                Ada Lovelace
              </List.Item>
              <List.Item
                id="second"
                leading={GRACE}
                supporting="Supporting line"
                trailing={AMOUNT_TWO}
              >
                Grace Hopper
              </List.Item>
            </List>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sections and loading
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A section groups rows under a heading, which is what names it for a
            screen reader. The load-more row is a sentinel: React Aria calls
            onLoadMore when it comes into view, and draws the ring only while
            isLoading.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <List aria-label="Sections" selectionMode="none">
              <List.Section header="First group">
                <List.Item id="first">First item</List.Item>
                <List.Item id="second">Second item</List.Item>
              </List.Section>
              <List.Section header="Second group">
                <List.Item id="third">Third item</List.Item>
              </List.Section>
              <List.LoadMore isLoading />
            </List>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <List {...args} />
    </div>
  ),
}

const Selected: Story = {
  args: { defaultSelectedKeys: FIRST_AND_THIRD },
  render: Default.render,
}

const SingleSelection: Story = {
  args: {
    defaultSelectedKeys: SECOND,
    selectionBehavior: 'replace',
    selectionMode: 'single',
  },
  render: Default.render,
}

const WithoutSelection: Story = {
  args: { selectionMode: 'none' },
  render: Default.render,
}

const Disabled: Story = {
  args: { disabledKeys: SECOND },
  render: Default.render,
}

const Sections: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <List {...args}>
        <List.Section header="First group">
          <List.Item id="first">First item</List.Item>
          <List.Item id="second">Second item</List.Item>
        </List.Section>
        <List.Section header="Second group">
          <List.Item id="third">Third item</List.Item>
        </List.Section>
      </List>
    </div>
  ),
}

const Loading: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <List {...args}>
        <List.Item id="first">First item</List.Item>
        <List.Item id="second">Second item</List.Item>
        <List.LoadMore isLoading />
      </List>
    </div>
  ),
}

// Its own story because reordering is a behaviour rather than a state: the
// line between two rows is drawn only while a drag is in flight, so a
// snapshot shows the list at rest and the drag itself has to be tried.
//
// The hooks come from this package rather than from React Aria, which is what
// gives the drag its styled line and preview without wiring either.
const Reorderable: Story = {
  render: function Reorderable() {
    const rows = useListData({
      initialItems: [
        { id: 'first', name: 'First item' },
        { id: 'second', name: 'Second item' },
        { id: 'third', name: 'Third item' },
      ],
    })

    const { dragAndDropHooks } = useDragAndDrop({
      getItems: (keys) =>
        [...keys].map((key) => ({
          'text/plain': rows.getItem(key)?.name ?? String(key),
        })),
      onReorder: (event) => {
        if (event.target.dropPosition === 'before') {
          rows.moveBefore(event.target.key, event.keys)
          return
        }
        rows.moveAfter(event.target.key, event.keys)
      },
    })

    return (
      <div {...stylex.props(styles.surface)}>
        <List
          aria-label="Label"
          dragAndDropHooks={dragAndDropHooks}
          items={rows.items}
        >
          {(row) => (
            <List.Item id={row.id} supporting="Supporting line">
              {row.name}
            </List.Item>
          )}
        </List>
      </div>
    )
  },
}

// Hoisted so the identity is stable across renders, which is what react-perf's
// jsx-no-new-object-as-prop is after.
const LIST_LAYOUT = { rowSize: collectionSizes.listRowTwoLine }

// Its own story because a virtualized list is a different thing at the DOM
// level — only the rows in view are rendered — which a snapshot of the top of
// the list cannot show, but which is exactly what a reviewer would want to
// look at against the same list drawn whole.
//
// `collectionSizes` is what the layout is told, rather than a number written
// here: src/layout.test.tsx measures the real row, so the two cannot drift.
const Virtualized: Story = {
  render: function Virtualized() {
    // Enough rows to be worth virtualizing, and no more: under `NODE_ENV=test`
    // React Aria renders every one of them rather than the window, so a story
    // with thousands would cost the suite and Chromatic real time for no
    // extra information.
    const rows = Array.from({ length: 200 }, (_unused, index) => ({
      id: `row${index}`,
      name: `Item ${String(index + 1).padStart(4, '0')}`,
    }))

    return (
      <div {...stylex.props(styles.surface, styles.scroller)}>
        <Virtualizer layout={ListLayout} layoutOptions={LIST_LAYOUT}>
          <List aria-label="Label" items={rows}>
            {(row) => (
              <List.Item id={row.id} supporting="Supporting line">
                {row.name}
              </List.Item>
            )}
          </List>
        </Virtualizer>
      </div>
    )
  },
}

export {
  Default,
  Disabled,
  Loading,
  Overview,
  Reorderable,
  Sections,
  Selected,
  SingleSelection,
  Virtualized,
  WithoutSelection,
}

export default meta
