import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import NavigationBar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          NavigationBar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Three to five top-level destinations along the bottom of a compact
          window.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Destinations
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Each destination is a link, and the one `selectedRoute` names is the
            current page: its pill on the secondary container, its label in the
            secondary role. In a window this wide each is the page&apos;s
            horizontal pill; below 600px each turns vertical, its label under a
            56px by 32px indicator, and the destinations share the bar&apos;s
            width — the Compact story shows it.
          </Text>
        </div>
        <NavigationBar aria-label="First label" selectedRoute="#first">
          {THREE}
        </NavigationBar>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Badges
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `badge` puts the badges page&apos;s mark on a destination&apos;s
            icon: `true` for the small dot, a number for the count. The mark is
            hidden from assistive technology, so the destination&apos;s
            `aria-label` says what it says.
          </Text>
        </div>
        <NavigationBar aria-label="Second label" selectedRoute="#first">
          {BADGED}
        </NavigationBar>
      </section>
    </div>
  ),
}

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

export { Compact, Default, FiveDestinations, Overview, WithBadges }

export default meta
