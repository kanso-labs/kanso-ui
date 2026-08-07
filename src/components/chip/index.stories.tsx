import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import Chip from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const FILTERS = ['First filter', 'Second filter', 'Third filter'] as const

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
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
  // Tighter than the page's sample gap: a set of chips is one control, and
  // spacing them like separate samples would read as four unrelated buttons.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
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

// Pulled out so its handler can be one stable reference per chip. Inline in
// the map below it would be a fresh closure per render, which is what
// react-perf's no-new-function-as-prop objects to.
function FilterChip({
  label,
  onSelect,
  selected,
}: {
  label: string
  onSelect: (label: string) => void
  selected: boolean
}) {
  const handlePressedChange = useCallback(() => {
    onSelect(label)
  }, [label, onSelect])

  return (
    <Chip onPressedChange={handlePressedChange} pressed={selected}>
      {label}
    </Chip>
  )
}

// Controlled: one selection at a time, which is a rule only the call site can
// enforce — the chip itself has no notion of its neighbours.
function SingleSelect() {
  const [selected, setSelected] = useState<string>(FILTERS[0])

  return (
    <div {...stylex.props(styles.row)}>
      {FILTERS.map((label) => (
        <FilterChip
          key={label}
          label={label}
          onSelect={setSelected}
          selected={selected === label}
        />
      ))}
    </div>
  )
}

const meta = {
  args: {
    children: 'Label',
  },
  component: Chip,
  title: 'Components/Chip',
} satisfies Meta<typeof Chip>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Chip
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A two-state button. Selection is its whole subject, announced through
          `aria-pressed` rather than a role of its own.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Selected carries a container of its own; unselected is an outline on
            the page. Disabled composites the same on-surface opacity over both,
            so the two converge.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Chip>Label</Chip>
            <Text tone="muted" variant="labelSmall">
              unselected
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Chip defaultPressed>Label</Chip>
            <Text tone="muted" variant="labelSmall">
              defaultPressed
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Chip disabled>Label</Chip>
            <Text tone="muted" variant="labelSmall">
              disabled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Chip defaultPressed disabled>
              Label
            </Chip>
            <Text tone="muted" variant="labelSmall">
              both
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Left alone, a chip keeps its own state and styles itself from it.
            Passing `pressed` with `onPressedChange` takes that over, which is
            how a set enforces one selection at a time — a rule only the call
            site can apply, since the chip has no notion of its neighbours.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.row)}>
              {FILTERS.map((label) => (
                <Chip key={label}>{label}</Chip>
              ))}
            </div>
            <Text tone="muted" variant="labelSmall">
              uncontrolled · each keeps its own state
            </Text>
          </div>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <SingleSelect />
            <Text tone="muted" variant="labelSmall">
              controlled · one at a time
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the interaction is the point: a snapshot can only show
// which chip is selected at rest, and what matters is that picking one clears
// the last. Overview covers the states visually.
const Controlled: Story = {
  render: () => <SingleSelect />,
}

export { Controlled, Default, Overview }

export default meta
