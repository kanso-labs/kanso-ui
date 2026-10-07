import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ButtonGroup from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'

const styles = stylex.create({
  column: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// Plain shapes rather than an icon set, so the stories show the group alone.
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

const BUTTONS = [
  <Button id="first" key="first" variant="tonal">
    First item
  </Button>,
  <Button id="second" key="second" variant="tonal">
    Second item
  </Button>,
  <Button id="third" key="third" variant="tonal">
    Third item
  </Button>,
]

const ICON_BUTTONS = [
  <IconButton aria-label="First item" id="first" key="first" variant="filled">
    <CircleIcon />
  </IconButton>,
  <IconButton
    aria-label="Second item"
    id="second"
    key="second"
    variant="filled"
  >
    <SquareIcon />
  </IconButton>,
  <IconButton aria-label="Third item" id="third" key="third" variant="filled">
    <TriangleIcon />
  </IconButton>,
]

const meta = {
  args: {
    'aria-label': 'Label',
    children: BUTTONS,
  },
  component: ButtonGroup,
  title: 'Components/ButtonGroup',
} satisfies Meta<typeof ButtonGroup>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The connected group selecting one of its buttons.
const Connected: Story = {
  args: {
    defaultSelectedKeys: ['second'],
    selectionMode: 'single',
    variant: 'connected',
  },
}

// Its own story because the buttons are of another kind: a group takes
// IconButtons as readily as Buttons, standard or connected, and gives them the
// size it names.
const IconButtons: Story = {
  render: () => (
    <div {...stylex.props(styles.column)}>
      <ButtonGroup aria-label="First label" size="lg">
        {ICON_BUTTONS}
      </ButtonGroup>
      <ButtonGroup
        aria-label="Second label"
        selectionMode="multiple"
        shape="square"
        variant="connected"
      >
        {ICON_BUTTONS}
      </ButtonGroup>
    </div>
  ),
}

export { Connected, Default, IconButtons }

export default meta
