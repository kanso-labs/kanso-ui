import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import IconButton from '.'

const styles = stylex.create({
  // Sized in `em` so it follows the button's own type size, which is what
  // makes one icon serve all five sizes.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// A plain glyph rather than an icon set, so the stories stay a demonstration
// of the button alone.
function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// A second glyph for the toggle samples: a plus that turns on and off reads
// as an odd thing to do, where a star is the shape a toggle usually carries.
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" />
    </svg>
  )
}

const meta = {
  args: {
    'aria-label': 'Add',
    children: <PlusIcon />,
  },
  component: IconButton,
  title: 'Components/IconButton',
} satisfies Meta<typeof IconButton>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Pending: Story = {
  args: {
    'aria-label': 'Add',
    isPending: true,
  },
}

const Toggle: Story = {
  args: {
    'aria-label': 'Star',
    children: <StarIcon />,
    defaultSelected: false,
    variant: 'filled',
  },
}

const ToggleSelected: Story = {
  args: {
    'aria-label': 'Star',
    children: <StarIcon />,
    defaultSelected: true,
    variant: 'filled',
  },
}

const Outlined: Story = {
  args: { variant: 'outlined' },
}

export { Default, Outlined, Pending, Toggle, ToggleSelected }

export default meta
