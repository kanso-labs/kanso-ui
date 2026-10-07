import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { ListLayout, useListData, Virtualizer } from 'react-aria-components'
import { expect, waitFor } from 'storybook/test'

import List from '.'
import { useDragAndDrop } from '../../drag/hooks'
import { collectionSizes } from '../../layout'
import { colors, radii } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Currency from '../currency'
import IconButton from '../icon-button'

// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's array and JSX rules are after.
const SECOND = ['second']
const FIRST_AND_THIRD = ['first', 'third']
const ADA = <Avatar name="Ada Lovelace" size="sm" />
const GRACE = <Avatar name="Grace Hopper" size="sm" />
const AMOUNT_ONE = <Currency value={1250} />
const AMOUNT_TWO = <Currency value={480} />

// The grip, drawn inline the way the other stories draw their glyphs.
const DragIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="20"
    viewBox="0 0 24 24"
    width="20"
  >
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
)

// Every draggable row carries one. React Aria starts a drag from the pointer
// on its own, and a button in the row's `drag` slot is what gives a keyboard
// or screen reader user the same move — it is the collections' requirement
// rather than this story's decoration, and a draggable row without one warns.
const DRAG_HANDLE = (
  <IconButton aria-label="Reorder" size="xs" slot="drag">
    <DragIcon />
  </IconButton>
)

const ROWS = (
  <>
    <List.Item id="first">First item</List.Item>
    <List.Item id="second">Second item</List.Item>
    <List.Item id="third">Third item</List.Item>
  </>
)

const styles = stylex.create({
  // A virtualized list needs a box it can be taller than, which is what makes
  // it render only the rows in view.
  scroller: {
    blockSize: '320px',
    overflowY: 'auto',
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

const ThreeLine: Story = {
  args: {
    children: (
      <>
        <List.Item id="first" overline="Overline" supporting="Supporting line">
          First item
        </List.Item>
        <List.Item id="second" overline="Overline">
          Second item
        </List.Item>
        <List.Item id="third" supporting="Supporting line">
          Third item
        </List.Item>
      </>
    ),
  },
  render: Default.render,
}

// Its own story because the row is the one ListItem draws, so it takes the
// same leading, supporting and trailing content — each a node on the item,
// which the Controls panel cannot reach through `children`.
const WithSlots: Story = {
  args: {
    children: (
      <>
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
      </>
    ),
    selectionMode: 'none',
  },
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
// snapshot shows the list at rest. The `play` reorders it first, from the
// keyboard as a keyboard or screen reader user would, which is also what
// checks that a reorder works at all: Enter on the first row's handle starts
// the drag, the arrow key moves the line to the next gap, and Enter drops the
// row there.
//
// The hooks come from this package rather than from React Aria, which is what
// gives the drag its styled line and preview without wiring either.
const Reorderable: Story = {
  play: async ({ canvas, userEvent }) => {
    const [handle] = canvas.getAllByRole('button', { name: 'Reorder' })
    handle.focus()
    await userEvent.keyboard('{Enter}')
    // React Aria puts focus on the first place the row could land a frame
    // after the drag starts, and only then listens for the keys that move
    // and drop it.
    await waitFor(async () => {
      await expect(document.activeElement).toHaveAttribute(
        'aria-roledescription',
        'drop indicator',
      )
    })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(async () => {
      await expect(
        canvas.getAllByRole('row').map((row) => row.getAttribute('aria-label')),
      ).toEqual(['Second item', 'First item', 'Third item'])
    })
  },
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
            <List.Item
              id={row.id}
              leading={DRAG_HANDLE}
              supporting="Supporting line"
            >
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
  Reorderable,
  Sections,
  Selected,
  SingleSelection,
  ThreeLine,
  Virtualized,
  WithoutSelection,
  WithSlots,
}

export default meta
