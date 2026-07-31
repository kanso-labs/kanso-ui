import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Button from '.'
import { rippleStyles } from '../../styles/ripple'

// The classes StyleX generates for the pressed state are the observable signal
// that the hook considers itself pressed, without reaching into React.
const pressedClassNames = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

function isPressed(button: HTMLElement) {
  const span = button.querySelector('span[aria-hidden="true"] > span')
  if (!span) {
    return false
  }
  // The length check matters: `[].every()` is vacuously true, so an empty
  // class list would report "pressed" unconditionally.
  return (
    pressedClassNames.length > 0 &&
    pressedClassNames.every((className) => span.classList.contains(className))
  )
}

const meta = {
  args: {
    children: 'Button',
  },
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Disabled: Story = {
  args: {
    disabled: true,
  },
}

const NoRipple: Story = {
  args: {
    disableRipple: true,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

const OutlinedDisabled: Story = {
  args: {
    disabled: true,
    variant: 'outlined',
  },
}

// One full press against real timers and real animations. index.test.tsx stubs
// both the clock and the Web Animations API, so it proves the state machine but
// not that the two work together — this story is where that gets proven, and it
// is deliberately the only copy of that check. It also happens to be the sole
// interaction the Storybook Testing widget can attribute to useRipple, since
// that widget runs this project alone and never the unit tests.
//
// So it is a test rather than documentation, and is kept out of the sidebar to
// stay one: `!dev` subtracts the tag the sidebar filters on, leaving `test`
// untouched, so the story still runs under `npm test` and still counts toward
// the widget's percentage. Hidden, not removed — it stays in the index and is
// still reachable by URL, which is also why Chromatic needs telling separately.
// It skips this one because the ripple is mid-animation for most of the play
// function, so a snapshot would diff against itself. Default already covers the
// filled button visually.
const Pressed: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button')

    // Held rather than clicked: while the press is down the hook has no timer
    // running that could clear `pressed`, so the first assertion can't race a
    // release that already happened. The state machine's own edges — touch
    // delay, cancel, context menu, non-primary pointers — stay in
    // index.test.tsx, where the clock can be controlled.
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button })
    await waitFor(
      async () => {
        await expect(isPressed(button)).toBe(true)
      },
      { timeout: 2000 },
    )

    await userEvent.pointer({ keys: '[/MouseLeft]', target: button })
    await waitFor(
      async () => {
        await expect(isPressed(button)).toBe(false)
      },
      { timeout: 2000 },
    )
  },
  tags: ['!dev'],
}

const Text: Story = {
  args: {
    variant: 'text',
  },
}

const TextDisabled: Story = {
  args: {
    disabled: true,
    variant: 'text',
  },
}

export {
  Default,
  Disabled,
  NoRipple,
  Outlined,
  OutlinedDisabled,
  Pressed,
  Text,
  TextDisabled,
}

export default meta
