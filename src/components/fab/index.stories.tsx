import type { Meta, StoryObj } from '@storybook/react-vite'

import Fab from '.'

// A plain shape rather than an icon set, so the stories show the FAB alone.
// Drawn `1em` square in `currentColor`, as the README asks of every icon, so
// it takes the size and colour the FAB's slot sets.
function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// Hoisted so it is one stable element per render, which is what react-perf's
// no-jsx-as-prop is after.
const PLUS = <PlusIcon />

const meta = {
  args: {
    'aria-label': 'Label',
    children: PLUS,
  },
  component: Fab,
  title: 'Components/Fab',
} satisfies Meta<typeof Fab>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The FAB with a label after its icon.
const Extended: Story = {
  args: {
    'aria-label': undefined,
    label: 'Label',
  },
}

export { Default, Extended }

export default meta
