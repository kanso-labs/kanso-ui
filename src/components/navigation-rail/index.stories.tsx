import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useMemo, useState } from 'react'

import NavigationRail from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  // The rail runs the height of what holds it, as it would the window's.
  frame: {
    blockSize: '440px',
    display: 'flex',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          NavigationRail
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Top-level destinations down the leading edge of a medium or wider
          window.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Collapsed and expanded
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Collapsed, the rail is a 96px column with each label under its icon.
            With `isExpanded` it widens to between 220px and 360px and each
            destination becomes a 56px pill, its label beside the icon — the
            form the page has replace the navigation drawer. The current
            destination is the one `selectedRoute` names.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.frame)}>
            <NavigationRail aria-label="Collapsed" selectedRoute="#first">
              {DESTINATIONS}
            </NavigationRail>
          </div>
          <div {...stylex.props(styles.frame)}>
            <NavigationRail
              aria-label="Expanded"
              isExpanded
              selectedRoute="#first"
            >
              {DESTINATIONS}
            </NavigationRail>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A header
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `header` draws what sits above the destinations — here the menu
            button that expands the rail and collapses it again.
          </Text>
        </div>
        <Expandable />
      </section>
    </div>
  ),
}

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

export { Default, Expanded, Overview, WithHeader }

export default meta
