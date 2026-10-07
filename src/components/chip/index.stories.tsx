import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import Chip from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

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

const styles = stylex.create({
  // Tighter than the page's sample gap: a set of chips is one control, and
  // spacing them like separate samples would read as four unrelated buttons.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

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

// Its own story because the interaction is the point: a snapshot can only show
// which chip is selected at rest, and what matters is that picking one clears
// the last. Each state on its own is a prop away on Default.
const Controlled: Story = {
  render: () => <SingleSelect />,
}

export { Assist, Controlled, Default, Suggestion, WithIcon }

export default meta
