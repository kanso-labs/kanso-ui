import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Fab from '.'
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

// A plain shape rather than an icon set, so the stories show the FAB alone.
// Drawn `1em` square in `currentColor`, as the README asks of every icon, so
// it takes the size and colour the FAB's slot sets.
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
    'aria-label': 'Label',
    children: PLUS,
  },
  component: Fab,
  title: 'Components/Fab',
} satisfies Meta<typeof Fab>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Fab
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A screen&apos;s primary action, raised over its content.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sizes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The pages&apos; FAB, medium FAB and large FAB, each a square with
            its own corner and icon size. The FAB rests on a shadow and lifts
            further under a pointer.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" size="md">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              md · 56px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" size="lg">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              lg · 80px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" size="xl">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              xl · 96px
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Colour
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Three tones, each as its container pair — `tonal`, the default — or
            as the tone itself — `filled`.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label">{PLUS}</Fab>
            <Text tone="muted" variant="labelSmall">
              primary · tonal
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" tone="secondary">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              secondary · tonal
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" tone="tertiary">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              tertiary · tonal
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" variant="filled">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              primary · filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" tone="secondary" variant="filled">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              secondary · filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Fab aria-label="Label" tone="tertiary" variant="filled">
              {PLUS}
            </Fab>
            <Text tone="muted" variant="labelSmall">
              tertiary · filled
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Extended
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `label` sets text after the icon, which makes the extended FAB: the
            size&apos;s height and corner, as wide as what it holds, with the
            label in the size&apos;s type role.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Fab label="Label" size="md">
            {PLUS}
          </Fab>
          <Fab label="Label" size="lg">
            {PLUS}
          </Fab>
          <Fab label="Label" size="xl">
            {PLUS}
          </Fab>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The FAB with a label after its icon.
const Extended: Story = {
  args: {
    'aria-label': undefined,
    label: 'Label',
  },
}

export { Default, Extended, Overview }

export default meta
