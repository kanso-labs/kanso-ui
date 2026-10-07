import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Selection } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import ChipGroup from '.'

const SECOND = ['second']
const FIRST_AND_THIRD = ['first', 'third']
const LONG = ['long']

const CHIPS = (
  <>
    <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
    <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
    <ChipGroup.Chip id="third">Third item</ChipGroup.Chip>
  </>
)

// An icon slot takes any node; a plain glyph keeps the sample generic. The
// library's own glyphs are private to it, so a story draws its own, `1em`
// square as the README asks.
const DOT = (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  >
    <circle cx="12" cy="12" r="6" />
  </svg>
)

const ICON_CHIPS = (
  <>
    <ChipGroup.Chip icon={DOT} id="first">
      First item
    </ChipGroup.Chip>
    <ChipGroup.Chip icon={DOT} id="second">
      Second item
    </ChipGroup.Chip>
    <ChipGroup.Chip icon={DOT} id="third">
      Third item
    </ChipGroup.Chip>
  </>
)

const styles = stylex.create({
  // Narrower than the long label on one line.
  narrow: {
    maxInlineSize: '280px',
  },
  width: {
    inlineSize: '420px',
  },
})

// A group whose chips can actually be removed, since removal is the one
// thing a static story cannot show.
const ITEMS = [
  { id: 'first', label: 'First item' },
  { id: 'second', label: 'Second item' },
  { id: 'third', label: 'Third item' },
]

function Removable() {
  const [items, setItems] = useState(ITEMS)
  const remove = useCallback((keys: Selection) => {
    setItems((current) =>
      current.filter((item) => keys === 'all' || !keys.has(item.id)),
    )
  }, [])

  return (
    <ChipGroup label="Removable" onRemove={remove} selectionMode="multiple">
      {items.map((item) => (
        <ChipGroup.Chip id={item.id} key={item.id}>
          {item.label}
        </ChipGroup.Chip>
      ))}
    </ChipGroup>
  )
}

const meta = {
  args: {
    children: CHIPS,
    label: 'Label',
  },
  component: ChipGroup,
  title: 'Components/ChipGroup',
} satisfies Meta<typeof ChipGroup<object>>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ChipGroup {...args} />
    </div>
  ),
}

const SingleSelection: Story = {
  args: { defaultSelectedKeys: SECOND, selectionMode: 'single' },
  render: Default.render,
}

const MultipleSelection: Story = {
  args: {
    defaultSelectedKeys: FIRST_AND_THIRD,
    selectionMode: 'multiple',
  },
  render: Default.render,
}

const Removing: Story = {
  args: { onRemove: noop, selectionMode: 'multiple' },
  render: Default.render,
}

const WithDescription: Story = {
  args: { description: 'Supporting line' },
  render: Default.render,
}

const Invalid: Story = {
  args: { error: 'Choose at least one' },
  render: Default.render,
}

const Disabled: Story = {
  args: { disabledKeys: SECOND },
  render: Default.render,
}

const WithIcons: Story = {
  args: {
    children: ICON_CHIPS,
    defaultSelectedKeys: SECOND,
    selectionMode: 'multiple',
  },
  render: Default.render,
}

// Its own story because it takes a narrow row as well as a long label: a chip
// is never wider than its row, so a label with no room ends in an ellipsis
// rather than wrapping, and the check and close target stay inside the pill.
const LongLabel: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow)}>
      <ChipGroup
        defaultSelectedKeys={LONG}
        label="Label"
        onRemove={noop}
        selectionMode="multiple"
      >
        <ChipGroup.Chip id="long">
          A label long enough that it has nowhere left to go on one line
        </ChipGroup.Chip>
        <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
      </ChipGroup>
    </div>
  ),
}

// Its own story because removal is the one thing a static story cannot show:
// the group keeps its chips in state, so the close target, Backspace and Delete
// each remove one, and the arrow keys move between them.
const RemovableChips: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Removable />
    </div>
  ),
}

// The `Removing` story shows the close target rather than what pressing it
// does, which `RemovableChips` covers instead.
function noop(_keys: Selection) {}

export {
  Default,
  Disabled,
  Invalid,
  LongLabel,
  MultipleSelection,
  RemovableChips,
  Removing,
  SingleSelection,
  WithDescription,
  WithIcons,
}

export default meta
