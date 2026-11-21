import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { KuiTheme } from '../../theme-scope'

import EmptyState from '.'
import { ThemeScope } from '../../theme-scope'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'

const styles = stylex.create({
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  // The width of a phone, which is where a first-use screen is usually read.
  screen: {
    backgroundColor: colors.surface,
    inlineSize: '360px',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    inlineSize: '360px',
  },
})

// A plain shape rather than an icon set, so the stories show the empty state
// alone. Sized in `em`, so it takes the size the mark sets.
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

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const ICON = <CircleIcon />
const noop = () => {}
const ACTION = { label: 'Label', onPress: noop }

// A module's own colours, as an app hands a section of itself through
// ThemeScope: the mark and the button take the scope's primary.
const MODULE_THEME: KuiTheme = {
  '--kui-color-on-primary': '#ffffff',
  '--kui-color-on-primary-container': '#002113',
  '--kui-color-primary': '#006c4c',
  '--kui-color-primary-container': '#89f8c7',
}

const meta = {
  args: {
    action: ACTION,
    description: 'Supporting line that says what will appear here',
    icon: ICON,
    title: 'Headline',
  },
  component: EmptyState,
  render: (args) => (
    <div {...stylex.props(styles.screen)}>
      <EmptyState {...args} />
    </div>
  ),
  title: 'Components/EmptyState',
} satisfies Meta<typeof EmptyState>

type Story = StoryObj<typeof meta>

// First use: a module or a list with nothing in it yet, with the one thing
// to do about it.
const Default: Story = {}

// A screen that cannot show what it was opened for: a neutral mark and an
// outlined button, a way round rather than the screen's main action.
const Status: Story = {
  args: {
    description: 'Supporting line that says what went wrong',
    kind: 'status',
  },
}

// The two row forms inside a card, as they sit among a screen's sections: a
// section with nothing in it yet, and a list emptied, lined up where its
// rows were.
const Rows: Story = {
  render: () => (
    <div {...stylex.props(styles.stack)}>
      <Card padding="none" variant="outlined">
        <EmptyState description="Supporting line" icon={ICON} size="inline" />
      </Card>
      <Card padding="none" variant="outlined">
        <EmptyState description="Supporting line" kind="done" />
      </Card>
    </div>
  ),
}

// Inside a module's own theme scope, where the mark and the button take the
// module's primary rather than the app's.
const InAScope: Story = {
  render: (args) => (
    <ThemeScope theme={MODULE_THEME}>
      <div {...stylex.props(styles.screen)}>
        <EmptyState {...args} />
        <EmptyState description="Supporting line" icon={ICON} size="inline" />
        <EmptyState description="Supporting line" kind="done" />
      </div>
    </ThemeScope>
  ),
}

export { Default, InAScope, Rows, Status }

export default meta
