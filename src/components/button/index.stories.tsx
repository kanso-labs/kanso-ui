import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Button from '.'
import { rippleStyles } from '../../styles/ripple'
import { spacing } from '../../tokens/design.tokens.stylex'

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

const styles = stylex.create({
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  // Narrower than the long label on one line, so it wraps.
  narrow: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    inlineSize: '240px',
    maxInlineSize: '100%',
  },
})

// A plain shape rather than an icon set, so the stories show the button
// alone. Drawn `1em` square in `currentColor`, as the README asks of every
// icon, so it takes the size and colour the button's slot sets.
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
    children: 'Button',
  },
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const Default: Story = {}

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
// function, so a snapshot would diff against itself. Default already covers
// the filled button visually.
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
  tags: ['!autodocs', '!dev'],
}

// The label is kept in the flow while the ring shows, so the button stays
// the width it was.
const Pending: Story = {
  args: {
    children: 'Label',
    isPending: true,
  },
}

const Elevated: Story = {
  args: { variant: 'elevated' },
}

// Its own story because it takes a narrow container as well as a long label: a
// label too long for the row wraps, as a translation often does at a phone's
// width, and the container grows to hold every line rather than keeping its
// height. A label on one line still draws the size's own height.
const LongLabels: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow)}>
      <Button variant="filled">
        A label long enough that it wraps onto more lines than one
      </Button>
      <Button variant="tonal">
        A label long enough that it wraps onto more lines than one
      </Button>
      <Button variant="outlined">
        A label long enough that it wraps onto more lines than one
      </Button>
    </div>
  ),
}

// A toggle, selected: the tonal pair moved to secondary, and the pill traded
// for the square corner.
const Toggle: Story = {
  args: { defaultSelected: true, variant: 'tonal' },
}

const Square: Story = {
  args: { shape: 'square' },
}

// An icon before the label at each of the five sizes, where it takes the
// page's icon size for that size and the gap the size sets before the label.
const WithIcon: Story = {
  render: (args) => (
    <div {...stylex.props(styles.inline)}>
      <Button {...args} icon={PLUS} size="xs" />
      <Button {...args} icon={PLUS} size="md" />
      <Button {...args} icon={PLUS} size="lg" />
      <Button {...args} icon={PLUS} size="xl" />
      <Button {...args} icon={PLUS} size="xxl" />
    </div>
  ),
}

export {
  Default,
  Elevated,
  LongLabels,
  Pending,
  Pressed,
  Square,
  Toggle,
  WithIcon,
}

export default meta
