import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Fab from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // Centred, so a row of the three sizes lines up on their middles.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  // Rows a story draws one under the other.
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const SIZES = ['md', 'lg', 'xl'] as const

const TONES = ['primary', 'secondary', 'tertiary'] as const

// The pages' default first.
const VARIANTS = ['tonal', 'filled'] as const

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

const Default: Story = {}

// The FAB with a label after its icon.
const Extended: Story = {
  args: {
    'aria-label': undefined,
    label: 'Label',
  },
}

// The three sizes, the FAB over the extended FAB. Each keeps its height and
// corner in the extended form, and its icon, padding, gap and type grow with
// it.
const Sizes: Story = {
  render: () => (
    <div {...stylex.props(styles.rows)}>
      <div {...stylex.props(styles.row)}>
        {SIZES.map((size) => (
          <Fab aria-label="Label" key={size} size={size}>
            {PLUS}
          </Fab>
        ))}
      </div>
      <div {...stylex.props(styles.row)}>
        {SIZES.map((size) => (
          <Fab key={size} label="Label" size={size}>
            {PLUS}
          </Fab>
        ))}
      </div>
    </div>
  ),
}

// Each tone in each variant, tonal over filled: the tone's container pair,
// then the tone itself. Drawn extended, so each pair shows on a label as
// well as an icon.
const Variants: Story = {
  render: () => (
    <div {...stylex.props(styles.rows)}>
      {VARIANTS.map((variant) => (
        <div key={variant} {...stylex.props(styles.row)}>
          {TONES.map((tone) => (
            <Fab key={tone} label="Label" tone={tone} variant={variant}>
              {PLUS}
            </Fab>
          ))}
        </div>
      ))}
    </div>
  ),
}

// The FAB and the extended FAB disabled. Every tone and variant draws the
// same faint on-surface mix, 12% for the container and 38% for the icon and
// label, and the shadow goes.
const Disabled: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <Fab aria-label="Label" isDisabled>
        {PLUS}
      </Fab>
      <Fab isDisabled label="Label">
        {PLUS}
      </Fab>
    </div>
  ),
}

export { Default, Disabled, Extended, Sizes, Variants }

export default meta
