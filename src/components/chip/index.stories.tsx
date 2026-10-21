import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Selection } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import Chip from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Menu from '../menu'

const FILTERS = ['First filter', 'Second filter', 'Third filter'] as const

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

// The arrow the page's dropdown filter chip draws after its label, drawn here
// for the same reason.
const ARROW = (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  >
    <path d="M7 10l5 5 5-5z" />
  </svg>
)

const styles = stylex.create({
  // Narrower than either label, so each chip is held to the room and cuts its
  // label short.
  narrow: {
    alignItems: 'flex-start',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    inlineSize: '200px',
  },
  // Tighter than the page's sample gap: a set of chips is one control, and
  // spacing them like separate samples would read as four unrelated buttons.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

// A filter chip as a menu's trigger, which is the page's dropdown filter chip.
// Controlled by what the menu has chosen rather than by its own press, so the
// press that opens the menu does not select it: the chip reads as selected
// once an item is chosen, and the arrow stays after its label.
function DropdownChip() {
  const [selected, setSelected] = useState<Selection>(() => new Set())
  const chosen = selected === 'all' || selected.size > 0

  return (
    <Menu>
      <Chip isSelected={chosen} trailingIcon={ARROW}>
        Label
      </Chip>
      <Menu.Content
        onSelectionChange={setSelected}
        selectedKeys={selected}
        selectionMode="single"
      >
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item id="second">Second item</Menu.Item>
        <Menu.Item id="third">Third item</Menu.Item>
      </Menu.Content>
    </Menu>
  )
}

// Pulled out so its handler can be one stable reference per chip. Inline in
// the map below it would be a fresh closure per render, which is what
// react-perf's no-new-function-as-prop objects to.
function FilterChip({
  label,
  onSelect,
  selected,
}: {
  label: string
  onSelect: (label: string) => void
  selected: boolean
}) {
  const handleSelectedChange = useCallback(() => {
    onSelect(label)
  }, [label, onSelect])

  return (
    <Chip isSelected={selected} onChange={handleSelectedChange}>
      {label}
    </Chip>
  )
}

// Controlled: one selection at a time, which is a rule only the call site can
// enforce here — the chip itself has no notion of its neighbours. A set with a
// selection rule is what ChipGroup is for, which keeps the rule and moves
// between the chips with the arrow keys; this is the chip on its own, in a
// group labelled as such a set still has to be.
function SingleSelect() {
  const [selected, setSelected] = useState<string>(FILTERS[0])

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a `<fieldset>` brings a border, padding and a minimum width of the browser's own to a row that only names its buttons as one set
    <div aria-label="Label" role="group" {...stylex.props(styles.row)}>
      {FILTERS.map((label) => (
        <FilterChip
          key={label}
          label={label}
          onSelect={setSelected}
          selected={selected === label}
        />
      ))}
    </div>
  )
}

const meta = {
  args: {
    children: 'Label',
  },
  component: Chip,
  title: 'Components/Chip',
} satisfies Meta<typeof Chip>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const WithIcon: Story = {
  args: { icon: DOT },
}

const Assist: Story = {
  args: { icon: DOT, variant: 'assist' },
}

const Suggestion: Story = {
  args: { variant: 'suggestion' },
}

// Chosen: the secondary container, and the check in front of the label,
// which is what tells it from an unchosen chip without colour.
const Selected: Story = {
  args: { defaultSelected: true },
}

// Raised off the page on a container of its own, which a hovering pointer
// lifts further and a press brings back down. A chosen chip keeps the
// secondary container and takes the shadow with it, and an assist chip is
// raised the same way.
const Elevated: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <Chip elevated>{FILTERS[0]}</Chip>
      <Chip defaultSelected elevated>
        {FILTERS[1]}
      </Chip>
      <Chip elevated icon={DOT} variant="assist">
        Label
      </Chip>
    </div>
  ),
}

// The three containers a disabled chip can be on, then an assist chip, whose
// icon fades with its label rather than keeping the primary role. Each is
// translucent, so it reads as a faint version of itself on whatever it is
// placed on.
const Disabled: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <Chip isDisabled>{FILTERS[0]}</Chip>
      <Chip defaultSelected isDisabled>
        {FILTERS[1]}
      </Chip>
      <Chip elevated isDisabled>
        {FILTERS[2]}
      </Chip>
      <Chip icon={DOT} isDisabled variant="assist">
        Label
      </Chip>
    </div>
  ),
}

// In a room narrower than its label: the chip stops at the room's edge and
// the label ends in an ellipsis, while the icons on either side keep their
// place. The whole label stays the chip's name.
const LongLabel: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow)}>
      <Chip icon={DOT} variant="assist">
        Label long enough to run past the edge
      </Chip>
      <Chip trailingIcon={ARROW}>Label long enough to run past the edge</Chip>
    </div>
  ),
}

// Closed, since the chip is what this shows: pressing it opens the menu.
const Dropdown: Story = {
  render: () => <DropdownChip />,
}

// What the Overview page prints under Controlled. Storybook writes no snippet
// for a story whose render takes no args, which left this one's panel empty,
// and the state is inside SingleSelect in any case, so the pattern is written
// out by hand. It is SingleSelect's, with the row's styles and the one stable
// handler per chip left out.
const CONTROLLED_SOURCE = `const [selected, setSelected] = useState('First filter')

<div aria-label="Label" role="group">
  {['First filter', 'Second filter', 'Third filter'].map((label) => (
    <Chip
      isSelected={selected === label}
      key={label}
      onChange={() => setSelected(label)}
    >
      {label}
    </Chip>
  ))}
</div>`

// Its own story because the interaction is the point: a snapshot can only show
// which chip is selected at rest, and what matters is that picking one clears
// the last. Each state on its own has a story above: Selected, Elevated and
// Disabled.
const Controlled: Story = {
  parameters: {
    docs: { source: { code: CONTROLLED_SOURCE, language: 'tsx' } },
  },
  render: () => <SingleSelect />,
}

export {
  Assist,
  Controlled,
  Default,
  Disabled,
  Dropdown,
  Elevated,
  LongLabel,
  Selected,
  Suggestion,
  WithIcon,
}

export default meta
