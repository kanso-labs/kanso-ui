import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import Chip from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

const FILTERS = ['First filter', 'Second filter', 'Third filter'] as const

const meta = {
  args: {
    children: 'Label',
  },
  component: Chip,
  title: 'Components/Chip',
} satisfies Meta<typeof Chip>

type Story = StoryObj<typeof meta>

// Both states side by side, since the whole component is the difference
// between them.
const States: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Chip {...args}>Unselected</Chip>
      <Chip {...args} defaultPressed>
        Selected
      </Chip>
      <Chip {...args} disabled>
        Disabled
      </Chip>
      <Chip {...args} defaultPressed disabled>
        Selected disabled
      </Chip>
    </div>
  ),
}

// Uncontrolled: the chip keeps its own state, and styles itself from it
// without this story tracking anything.
const Uncontrolled: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      {FILTERS.map((label) => (
        <Chip {...args} key={label}>
          {label}
        </Chip>
      ))}
    </div>
  ),
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
  const handlePressedChange = useCallback(() => {
    onSelect(label)
  }, [label, onSelect])

  return (
    <Chip onPressedChange={handlePressedChange} pressed={selected}>
      {label}
    </Chip>
  )
}

// Controlled: one selection at a time, which is a rule only the call site can
// enforce — the chip itself has no notion of its neighbours.
function SingleSelect() {
  const [selected, setSelected] = useState<string>(FILTERS[0])

  return (
    <div {...stylex.props(styles.row)}>
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

const Controlled: Story = {
  render: () => <SingleSelect />,
}

export { Controlled, States, Uncontrolled }

export default meta
