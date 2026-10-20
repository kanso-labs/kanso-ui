import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import IconButton from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // Sized in `em` so it follows the button's own type size, which is what
  // makes one icon serve all five sizes.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  // One variant's pair, unchosen beside chosen.
  pair: {
    display: 'flex',
    gap: spacing.sm,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
})

const VARIANTS = ['filled', 'tonal', 'outlined', 'standard'] as const

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

// A toggle whose new state is still being saved: the ring takes the icon's
// place, and a press changes nothing until the call site clears `isPending`.
const TogglePending: Story = {
  args: {
    'aria-label': 'Star',
    children: <StarIcon />,
    defaultSelected: true,
    isPending: true,
    variant: 'filled',
  },
}

// Each variant disabled, unchosen beside chosen. The corner is what tells
// the two apart, so each chosen one keeps a container for it to show on: a
// standard toggle's is a departure from the page, drawn so the pair differ.
const ToggleDisabled: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      {VARIANTS.map((variant) => (
        <div key={variant} {...stylex.props(styles.pair)}>
          <IconButton
            aria-label="Star"
            defaultSelected={false}
            isDisabled
            variant={variant}
          >
            <StarIcon />
          </IconButton>
          <IconButton
            aria-label="Star"
            defaultSelected
            isDisabled
            variant={variant}
          >
            <StarIcon />
          </IconButton>
        </div>
      ))}
    </div>
  ),
}

const Outlined: Story = {
  args: { variant: 'outlined' },
}

export {
  Default,
  Outlined,
  Pending,
  Toggle,
  ToggleDisabled,
  TogglePending,
  ToggleSelected,
}

export default meta
