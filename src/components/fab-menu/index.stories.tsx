import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import FabMenu from '.'
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
  // A row of samples, bottom-aligned so the three sizes share a baseline.
  row: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  sample: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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
  title: 'Components/FabMenu',
} satisfies Meta<typeof FabMenu>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          FabMenu
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A FAB that opens two to six related actions above it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The FAB
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Closed, the menu is a FAB at any of its three sizes. Open, the FAB
            becomes a 56px close button in the tone itself and the actions stand
            above it on the tone&apos;s container, lined up on its trailing edge
            — the Open story shows it.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.sample)}>
            <FabMenu aria-label="Label" icon={PLUS} size="md">
              {ACTIONS}
            </FabMenu>
            <Text tone="muted" variant="labelSmall">
              md
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <FabMenu aria-label="Label" icon={PLUS} size="lg">
              {ACTIONS}
            </FabMenu>
            <Text tone="muted" variant="labelSmall">
              lg
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <FabMenu aria-label="Label" icon={PLUS} size="xl">
              {ACTIONS}
            </FabMenu>
            <Text tone="muted" variant="labelSmall">
              xl
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tones
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The page&apos;s three colour sets. The FAB rests on the tone&apos;s
            container, and the close button and the actions it opens contrast
            with each other.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.sample)}>
            <FabMenu aria-label="Label" icon={PLUS}>
              {ACTIONS}
            </FabMenu>
            <Text tone="muted" variant="labelSmall">
              primary
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <FabMenu aria-label="Label" icon={PLUS} tone="secondary">
              {ACTIONS}
            </FabMenu>
            <Text tone="muted" variant="labelSmall">
              secondary
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <FabMenu aria-label="Label" icon={PLUS} tone="tertiary">
              {ACTIONS}
            </FabMenu>
            <Text tone="muted" variant="labelSmall">
              tertiary
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The menu open: the close button, and the actions above it.
const Open: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '420px', inline: false } } },
}

export { Default, Open, Overview }

export default meta
