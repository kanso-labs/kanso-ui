import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import { colors } from './colors.stylex'
import { radii } from './radii.stylex'
import { spacing } from './spacing.stylex'
import { typography } from './typography.stylex'

const styles = stylex.create({
  grid: {
    display: 'grid',
    gap: spacing.md,
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  },
  heading: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
  },
  page: {
    backgroundColor: colors.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    padding: spacing.xl,
  },
  swatch: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    height: '48px',
  },
  swatchName: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizeXs,
  },
  typeSample: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    margin: 0,
  },
})

const swatchStyles = stylex.create({
  border: { backgroundColor: colors.border },
  borderStrong: { backgroundColor: colors.borderStrong },
  brand: { backgroundColor: colors.brand },
  brandHover: { backgroundColor: colors.brandHover },
  brandSubtle: { backgroundColor: colors.brandSubtle },
  danger: { backgroundColor: colors.danger },
  dangerHover: { backgroundColor: colors.dangerHover },
  dangerSubtle: { backgroundColor: colors.dangerSubtle },
  focusRing: { backgroundColor: colors.focusRing },
  negative: { backgroundColor: colors.negative },
  negativeSubtle: { backgroundColor: colors.negativeSubtle },
  positive: { backgroundColor: colors.positive },
  positiveSubtle: { backgroundColor: colors.positiveSubtle },
  surface: { backgroundColor: colors.surface },
  surfaceHover: { backgroundColor: colors.surfaceHover },
  surfaceRaised: { backgroundColor: colors.surfaceRaised },
  surfaceSunken: { backgroundColor: colors.surfaceSunken },
  textMuted: { backgroundColor: colors.textMuted },
  textPrimary: { backgroundColor: colors.textPrimary },
  textSecondary: { backgroundColor: colors.textSecondary },
})

const sizeStyles = stylex.create({
  size2xl: { fontSize: typography.size2xl },
  sizeLg: { fontSize: typography.sizeLg },
  sizeMd: { fontSize: typography.sizeMd },
  sizeSm: { fontSize: typography.sizeSm },
  sizeXl: { fontSize: typography.sizeXl },
  sizeXs: { fontSize: typography.sizeXs },
})

function Tokens() {
  return (
    <div {...stylex.props(styles.page)}>
      <section>
        <h2 {...stylex.props(styles.heading)}>Colors</h2>
        <div {...stylex.props(styles.grid)}>
          {Object.keys(swatchStyles).map((name) => (
            <div key={name}>
              <div
                {...stylex.props(
                  styles.swatch,
                  swatchStyles[name as keyof typeof swatchStyles],
                )}
              />
              <span {...stylex.props(styles.swatchName)}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 {...stylex.props(styles.heading)}>Type scale</h2>
        {Object.keys(sizeStyles).map((name) => (
          <p
            key={name}
            {...stylex.props(
              styles.typeSample,
              sizeStyles[name as keyof typeof sizeStyles],
            )}
          >
            {name} — Trip to Lisbon, you are owed $128.00
          </p>
        ))}
      </section>
    </div>
  )
}

const meta = {
  component: Tokens,
  title: 'Foundations/Tokens',
} satisfies Meta<typeof Tokens>

type Story = StoryObj<typeof meta>

const Overview: Story = {}

export { Overview }

export default meta
