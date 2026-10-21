import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Selection } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'
import { expect, waitFor } from 'storybook/test'

import ChipGroup from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Popover from '../popover'
import Text from '../text'

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

// Labels built from text and a number, which JSX hands a chip as an array.
const NUMBERED_CHIPS = (
  <>
    <ChipGroup.Chip id="first">First item {1}</ChipGroup.Chip>
    <ChipGroup.Chip id="second">Second item {2}</ChipGroup.Chip>
    <ChipGroup.Chip id="third">Third item {3}</ChipGroup.Chip>
  </>
)

// Labels holding an element, which name nothing on their own.
const RICH_CHIPS = (
  <>
    <ChipGroup.Chip id="first" textValue="First item">
      <strong>First</strong> item
    </ChipGroup.Chip>
    <ChipGroup.Chip id="second" textValue="Second item">
      <strong>Second</strong> item
    </ChipGroup.Chip>
    <ChipGroup.Chip id="third" textValue="Third item">
      <strong>Third</strong> item
    </ChipGroup.Chip>
  </>
)

const styles = stylex.create({
  // Leaves the open panel somewhere to go below its trigger, so the snapshot
  // frames both — see popover/index.stories.tsx.
  frame: {
    display: 'flex',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
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

function emptyState() {
  return (
    <Text tone="muted" variant="bodyMedium">
      Empty state
    </Text>
  )
}

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

// One removable chip and an empty state for after it, so a single removal
// empties the group.
function RemovableToEmpty() {
  const [ids, setIds] = useState(['first'])
  const remove = useCallback((keys: Selection) => {
    setIds((current) => current.filter((id) => keys !== 'all' && !keys.has(id)))
  }, [])

  return (
    <ChipGroup label="Label" onRemove={remove} renderEmptyState={emptyState}>
      {ids.map((id) => (
        <ChipGroup.Chip id={id} key={id}>
          First item
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
  // A tab of its own beside the group's in the Overview page's props table,
  // since a group is written with its chips.
  subcomponents: { 'ChipGroup.Chip': ChipGroup.Chip },
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

// The page's input chips: removable, with nothing to choose. Only the close
// target answers a press, so the chips draw the arrow cursor, no layer and
// no ripple, and the close target keeps the pointer.
const InputChips: Story = {
  args: { onRemove: noop },
  render: Default.render,
}

// A filter set in a Popover, which is where a group usually sits. Escape on a
// chip keeps the chosen filters and closes the popover on the first press;
// `escapeKeyBehavior="clearSelection"` would empty them first instead. Open
// on load, since a closed popover renders nothing for Chromatic to compare.
const InAPopover: Story = {
  args: {
    defaultSelectedKeys: FIRST_AND_THIRD,
    selectionMode: 'multiple',
  },
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Popover defaultOpen>
        <Button variant="outlined">Open</Button>
        <Popover.Content>
          <ChipGroup {...args} />
        </Popover.Content>
      </Popover>
    </div>
  ),
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

// A label built from text and a number names its chip by itself: each row
// is read as `First item 1` and so on, with no `textValue`.
const NumberedLabels: Story = {
  args: { children: NUMBERED_CHIPS, selectionMode: 'multiple' },
  render: Default.render,
}

// A label holding an element names nothing by itself, so each chip says what
// it is worth through `textValue`, which is what its row is read as.
const RichLabels: Story = {
  args: { children: RICH_CHIPS, selectionMode: 'multiple' },
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

// The group once its last chip is removed: React Aria moves focus onto the
// emptied list, which draws the ring a chip draws, and keeps a chip's height
// so nothing under it moves. Removed by its `play`, so the snapshot shows the
// state after it.
const EmptyState: Story = {
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole('row', { name: 'First item' })
    chip.focus()
    await userEvent.keyboard('{Delete}')
    await waitFor(async () => {
      await expect(canvas.queryByRole('row')).not.toBeInTheDocument()
    })
    const list = canvas.getByText('Empty state').parentElement
    if (list === null) {
      throw new Error('expected the empty state to sit in the list')
    }
    await waitFor(async () => {
      await expect(document.activeElement).toBe(list)
    })
    await expect(getComputedStyle(list).outlineStyle).toBe('solid')
  },
  render: () => (
    <div {...stylex.props(styles.width)}>
      <RemovableToEmpty />
    </div>
  ),
}

// The `Removing` story shows the close target rather than what pressing it
// does, which `RemovableChips` covers instead.
function noop(_keys: Selection) {}

export {
  Default,
  Disabled,
  EmptyState,
  InAPopover,
  InputChips,
  Invalid,
  LongLabel,
  MultipleSelection,
  NumberedLabels,
  RemovableChips,
  Removing,
  RichLabels,
  SingleSelection,
  WithDescription,
  WithIcons,
}

export default meta
