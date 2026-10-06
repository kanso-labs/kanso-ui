import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ButtonGroup from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
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
  column: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

// Hoisted so it is one stable array per render, which is what react-perf's
// jsx-no-new-array-as-prop is after.
const SECOND = ['second']

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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ButtonGroup
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Buttons set side by side, spaced and shaped as one.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Standard
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Buttons set apart by the size&apos;s own space — 12px here, at the
            default size. A pressed button widens and its neighbours narrow to
            make the room, so the group&apos;s width holds. The size the group
            names is the size every button in it takes.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ButtonGroup aria-label="First label">{BUTTONS}</ButtonGroup>
          <ButtonGroup aria-label="Second label" size="lg">
            {ICON_BUTTONS}
          </ButtonGroup>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Connected
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Buttons 2px apart, their inner corners squared off and the
            group&apos;s two ends round. A pressed button&apos;s inner corners
            tighten; a selected one&apos;s round off. With `selectionMode` the
            group keeps the selection, by the buttons&apos; `id`s — the
            connected group is the page&apos;s replacement for the segmented
            button.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ButtonGroup
            aria-label="Third label"
            defaultSelectedKeys={SECOND}
            selectionMode="single"
            variant="connected"
          >
            {BUTTONS}
          </ButtonGroup>
          <ButtonGroup
            aria-label="Fourth label"
            selectionMode="multiple"
            shape="square"
            variant="connected"
          >
            {ICON_BUTTONS}
          </ButtonGroup>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The connected group selecting one of its buttons.
const Connected: Story = {
  args: {
    defaultSelectedKeys: ['second'],
    selectionMode: 'single',
    variant: 'connected',
  },
}

export { Connected, Default, Overview }

export default meta
