import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import FabMenu from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // Where a FAB sits on a screen: the bottom trailing corner, with room above
  // it for the actions to open into.
  frame: {
    alignItems: 'flex-end',
    blockSize: '420px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// Plain shapes rather than an icon set, so the stories show the menu alone.
// Drawn `1em` square in `currentColor`, as the README asks of every icon.
function CircleIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}

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

function SquareIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <rect height="14" rx="2" width="14" x="5" y="5" />
    </svg>
  )
}

function TriangleIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M12 4 21 20H3z" />
    </svg>
  )
}

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const CIRCLE = <CircleIcon />
const PLUS = <PlusIcon />
const SQUARE = <SquareIcon />
const TRIANGLE = <TriangleIcon />

const ACTIONS = [
  <FabMenu.Item icon={CIRCLE} id="first" key="first">
    First item
  </FabMenu.Item>,
  <FabMenu.Item icon={SQUARE} id="second" key="second">
    Second item
  </FabMenu.Item>,
  <FabMenu.Item icon={TRIANGLE} id="third" key="third">
    Third item
  </FabMenu.Item>,
]

const meta = {
  args: {
    'aria-label': 'Label',
    children: ACTIONS,
    icon: PLUS,
  },
  component: FabMenu,
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <FabMenu {...args} />
    </div>
  ),
  title: 'Components/FabMenu',
} satisfies Meta<typeof FabMenu>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The menu open: the close button, and the actions above it.
const Open: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '420px', inline: false } } },
}

export { Default, Open }

export default meta
