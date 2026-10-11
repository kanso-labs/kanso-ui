import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useMemo, useState } from 'react'

import NavigationRail from '.'
import IconButton from '../icon-button'

const styles = stylex.create({
  // The rail runs the height of what holds it, as it would the window's.
  frame: {
    blockSize: '440px',
    display: 'flex',
  },
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// Plain shapes rather than an icon set, so the stories show the rail alone.
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

function MenuIcon() {
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
      <path d="M4 7h16M4 12h16M4 17h16" />
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
const SQUARE = <SquareIcon />
const TRIANGLE = <TriangleIcon />

const DESTINATIONS = (
  <>
    <NavigationRail.Item href="#first" icon={CIRCLE}>
      First item
    </NavigationRail.Item>
    <NavigationRail.Item
      aria-label="Second item, 3 new"
      badge={3}
      href="#second"
      icon={SQUARE}
    >
      Second item
    </NavigationRail.Item>
    <NavigationRail.Item href="#third" icon={TRIANGLE}>
      Third item
    </NavigationRail.Item>
  </>
)

const ORDINALS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
]
const SHAPES = [CIRCLE, SQUARE, TRIANGLE]

// Ten destinations, more than the 440px frame holds.
const TEN_DESTINATIONS = ORDINALS.map((ordinal, index) => (
  <NavigationRail.Item
    href={`#${ordinal.toLowerCase()}`}
    icon={SHAPES[index % SHAPES.length]}
    key={ordinal}
  >
    {`${ordinal} item`}
  </NavigationRail.Item>
))

const MENU_BUTTON = (
  <IconButton aria-label="Menu">
    <MenuIcon />
  </IconButton>
)

// A rail whose header holds the menu button that expands and collapses it,
// which is how the page has a reader move between the two forms.
function Expandable() {
  const [isExpanded, setExpanded] = useState(false)
  const toggle = useCallback(() => {
    setExpanded((expanded) => !expanded)
  }, [])
  const header = useMemo(
    () => (
      <IconButton aria-expanded={isExpanded} aria-label="Menu" onPress={toggle}>
        <MenuIcon />
      </IconButton>
    ),
    [isExpanded, toggle],
  )

  return (
    <div {...stylex.props(styles.frame)}>
      <NavigationRail
        aria-label="Label"
        header={header}
        isExpanded={isExpanded}
        selectedRoute="#first"
      >
        {DESTINATIONS}
      </NavigationRail>
    </div>
  )
}

const meta = {
  args: {
    'aria-label': 'Label',
    children: DESTINATIONS,
    selectedRoute: '#first',
  },
  component: NavigationRail,
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <NavigationRail {...args} />
    </div>
  ),
  title: 'Components/NavigationRail',
} satisfies Meta<typeof NavigationRail>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The expanded form, each destination a pill.
const Expanded: Story = {
  args: {
    isExpanded: true,
  },
}

// A menu button in the header that expands the rail and collapses it.
const WithHeader: Story = {
  render: () => <Expandable />,
}

// More destinations than the rail has room for: they scroll in their own
// block under the header, each keeping the page's 56dp, rather than
// squashing or running past the rail. The header's menu button sits at the
// leading edge with its icon over the destinations' icons.
const ManyDestinations: Story = {
  args: {
    children: TEN_DESTINATIONS,
    header: MENU_BUTTON,
    isExpanded: true,
  },
}

export { Default, Expanded, ManyDestinations, WithHeader }

export default meta
