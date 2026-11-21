import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { KuiTheme } from '../../theme-scope'

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

// The container pair of one part of an app, as an app hands one action the
// colours of the part it opens: a map per scheme, as ThemeScope's own docs
// ask, the story taking the one for the scheme in the toolbar. The demo
// schemes take the light map, which states both colours of its pair and so
// reads on any of them.
const PART_THEMES: Record<'dark' | 'light', KuiTheme> = {
  dark: {
    '--kui-color-on-primary-container': '#89f8c7',
    '--kui-color-primary-container': '#005139',
  },
  light: {
    '--kui-color-on-primary-container': '#002113',
    '--kui-color-primary-container': '#89f8c7',
  },
}

// Four actions, each in a colour of its own: two of the page's other tones,
// one under a theme of its own, and one left in the menu's.
function tonedActions(partTheme: KuiTheme) {
  return [
    <FabMenu.Item icon={CIRCLE} id="first" key="first" tone="secondary">
      First item
    </FabMenu.Item>,
    <FabMenu.Item icon={SQUARE} id="second" key="second" tone="tertiary">
      Second item
    </FabMenu.Item>,
    <FabMenu.Item icon={TRIANGLE} id="third" key="third" theme={partTheme}>
      Third item
    </FabMenu.Item>,
    <FabMenu.Item icon={CIRCLE} id="fourth" key="fourth">
      Fourth item
    </FabMenu.Item>,
  ]
}

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
  subcomponents: { 'FabMenu.Item': FabMenu.Item },
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

// Each action in a colour of its own, while the close button keeps the
// menu's tone.
const ItemTones: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '420px', inline: false } } },
  render: (args, context) => (
    <div {...stylex.props(styles.frame)}>
      <FabMenu {...args}>
        {tonedActions(
          PART_THEMES[context.globals.theme === 'dark' ? 'dark' : 'light'],
        )}
      </FabMenu>
    </div>
  ),
}

export { Default, ItemTones, Open }

export default meta
