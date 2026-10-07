import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import NavigationBar from '.'

const styles = stylex.create({
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// Plain shapes rather than an icon set, so the stories show the bar alone.
// Sized in `em`, so each takes the 24dp the destination's icon slot sets.
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

function DiamondIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M12 3 21 12 12 21 3 12z" />
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
const DIAMOND = <DiamondIcon />
const SQUARE = <SquareIcon />
const STAR = <StarIcon />
const TRIANGLE = <TriangleIcon />

const THREE = (
  <>
    <NavigationBar.Item href="#first" icon={CIRCLE}>
      First item
    </NavigationBar.Item>
    <NavigationBar.Item href="#second" icon={SQUARE}>
      Second item
    </NavigationBar.Item>
    <NavigationBar.Item href="#third" icon={TRIANGLE}>
      Third item
    </NavigationBar.Item>
  </>
)

const FIVE = (
  <>
    <NavigationBar.Item href="#first" icon={CIRCLE}>
      First item
    </NavigationBar.Item>
    <NavigationBar.Item href="#second" icon={SQUARE}>
      Second item
    </NavigationBar.Item>
    <NavigationBar.Item href="#third" icon={TRIANGLE}>
      Third item
    </NavigationBar.Item>
    <NavigationBar.Item href="#fourth" icon={STAR}>
      Fourth item
    </NavigationBar.Item>
    <NavigationBar.Item href="#fifth" icon={DIAMOND}>
      Fifth item
    </NavigationBar.Item>
  </>
)

const BADGED = (
  <>
    <NavigationBar.Item href="#first" icon={CIRCLE}>
      First item
    </NavigationBar.Item>
    <NavigationBar.Item
      aria-label="Second item, 3 new"
      badge={3}
      href="#second"
      icon={SQUARE}
    >
      Second item
    </NavigationBar.Item>
    <NavigationBar.Item
      aria-label="Third item, new"
      badge
      href="#third"
      icon={TRIANGLE}
    >
      Third item
    </NavigationBar.Item>
  </>
)

// Below the medium breakpoint, where the destinations turn vertical. Sizes
// the frame in Storybook itself, and tells Chromatic the width through its
// modes — see sheet/index.stories.tsx, `BottomSheet`, for why both.
const COMPACT = {
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    chromatic: {
      modes: {
        dark: { theme: 'dark', viewport: { height: 700, width: 375 } },
        light: { theme: 'light', viewport: { height: 700, width: 375 } },
      },
    },
  },
} as const

const meta = {
  args: {
    'aria-label': 'Label',
    children: THREE,
    selectedRoute: '#first',
  },
  component: NavigationBar,
  title: 'Components/NavigationBar',
} satisfies Meta<typeof NavigationBar>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The vertical destinations the bar draws in a compact window.
const Compact: Story = {
  ...COMPACT,
}

// The five destinations the page allows at most, in a compact window.
const FiveDestinations: Story = {
  ...COMPACT,
  args: {
    children: FIVE,
  },
}

// Badges on two destinations' icons, in a compact window.
const WithBadges: Story = {
  ...COMPACT,
  args: {
    children: BADGED,
  },
}

export { Compact, Default, FiveDestinations, WithBadges }

export default meta
