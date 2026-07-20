import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
  typography,
} from './design.tokens.stylex'

const styles = stylex.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    boxShadow: shadows.elevation1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  cardDescription: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamilyPlain,
    fontSize: typography.bodyMediumSize,
    margin: 0,
  },
  cardHeading: {
    color: colors.onSurface,
    fontFamily: typography.fontFamilyBrand,
    fontSize: typography.titleLargeSize,
    fontWeight: typography.titleLargeWeight,
    lineHeight: typography.titleLargeLineHeight,
    margin: 0,
  },
  cardIntro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  eyebrow: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamilyPlain,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: '0.06em',
    margin: 0,
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gap: spacing.md,
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  },
  page: {
    backgroundColor: colors.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxWidth: '960px',
    padding: spacing.xxl,
  },
  pageHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  pageSubtitle: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamilyPlain,
    fontSize: typography.bodyLargeSize,
    margin: 0,
  },
  pageTitle: {
    color: colors.onSurface,
    fontFamily: typography.fontFamilyBrand,
    fontSize: typography.displaySmallSize,
    fontWeight: typography.displaySmallWeight,
    lineHeight: typography.displaySmallLineHeight,
    margin: 0,
  },
  radiiBox: {
    backgroundColor: colors.primary,
    height: '48px',
    width: '48px',
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
  },
  rowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  shadowBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    height: '48px',
    width: '48px',
  },
  spacingBar: {
    backgroundColor: colors.primary,
    borderRadius: radii.xs,
    height: '16px',
  },
  stateSwatch: (backgroundColor: string) => ({
    backgroundColor,
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    height: '56px',
  }),
  subsection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  swatch: (backgroundColor: string) => ({
    backgroundColor,
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    height: '56px',
  }),
  swatchName: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelSmallSize,
  },
  tokenLabel: {
    color: colors.onSurfaceVariant,
    flexShrink: 0,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelSmallSize,
    width: '160px',
  },
  typeSample: {
    color: colors.onSurface,
    margin: 0,
  },
  typeScaleSample: (
    font: string,
    size: string,
    weight: string,
    tracking: string,
    lineHeight: string,
  ) => ({
    color: colors.onSurface,
    fontFamily: font,
    fontSize: size,
    fontWeight: weight,
    letterSpacing: tracking,
    lineHeight,
    margin: 0,
  }),
})

const familyStyles = stylex.create({
  brand: { fontFamily: typography.fontFamilyBrand },
  mono: { fontFamily: typography.fontFamilyMono },
  plain: { fontFamily: typography.fontFamilyPlain },
})

// `colors`' real type is StyleX's branded VarGroup — colors & { __opaqueId,
// __tokens } & typeof StyleXVarGroupTag — and keyof over that unique-symbol
// intersection pulls in Symbol.prototype's own members (description,
// toString, ...) alongside the actual role names. Naming the 57 roles
// explicitly, once, keeps that branding out of every lookup below.
type ColorRole = Exclude<
  keyof typeof colors,
  '__opaqueId' | '__tokens' | keyof symbol
>

// Grouped the way a tonal-palette color system organizes its roles —
// primary/secondary/tertiary/error, an app's own custom colors, then the
// surface + outline roles everything else sits on.
const COLOR_GROUPS: { roles: ColorRole[]; title: string }[] = [
  {
    roles: [
      'primary',
      'onPrimary',
      'primaryContainer',
      'onPrimaryContainer',
      'primaryFixed',
      'primaryFixedDim',
      'onPrimaryFixed',
      'onPrimaryFixedVariant',
      'inversePrimary',
    ],
    title: 'Primary',
  },
  {
    roles: [
      'secondary',
      'onSecondary',
      'secondaryContainer',
      'onSecondaryContainer',
      'secondaryFixed',
      'secondaryFixedDim',
      'onSecondaryFixed',
      'onSecondaryFixedVariant',
    ],
    title: 'Secondary',
  },
  {
    roles: [
      'tertiary',
      'onTertiary',
      'tertiaryContainer',
      'onTertiaryContainer',
      'tertiaryFixed',
      'tertiaryFixedDim',
      'onTertiaryFixed',
      'onTertiaryFixedVariant',
    ],
    title: 'Tertiary',
  },
  {
    roles: ['error', 'onError', 'errorContainer', 'onErrorContainer'],
    title: 'Error',
  },
  {
    roles: [
      'positive',
      'onPositive',
      'positiveContainer',
      'onPositiveContainer',
      'negative',
      'onNegative',
      'negativeContainer',
      'onNegativeContainer',
    ],
    title: 'Custom colors',
  },
  {
    roles: [
      'background',
      'onBackground',
      'surface',
      'onSurface',
      'surfaceVariant',
      'onSurfaceVariant',
      'surfaceDim',
      'surfaceBright',
      'surfaceContainerLowest',
      'surfaceContainerLow',
      'surfaceContainer',
      'surfaceContainerHigh',
      'surfaceContainerHighest',
      'inverseSurface',
      'inverseOnSurface',
    ],
    title: 'Surface',
  },
  {
    roles: ['outline', 'outlineVariant', 'scrim', 'shadow', 'surfaceTint'],
    title: 'Outline & utility',
  },
]

// The full 15-style type scale, largest to smallest: display (most
// expressive) down through label (smallest, UI text).
const TYPE_SCALE: {
  font: string
  lineHeight: string
  name: string
  size: string
  tracking: string
  weight: string
}[] = [
  {
    font: typography.displayLargeFont,
    lineHeight: typography.displayLargeLineHeight,
    name: 'displayLarge',
    size: typography.displayLargeSize,
    tracking: typography.displayLargeTracking,
    weight: typography.displayLargeWeight,
  },
  {
    font: typography.displayMediumFont,
    lineHeight: typography.displayMediumLineHeight,
    name: 'displayMedium',
    size: typography.displayMediumSize,
    tracking: typography.displayMediumTracking,
    weight: typography.displayMediumWeight,
  },
  {
    font: typography.displaySmallFont,
    lineHeight: typography.displaySmallLineHeight,
    name: 'displaySmall',
    size: typography.displaySmallSize,
    tracking: typography.displaySmallTracking,
    weight: typography.displaySmallWeight,
  },
  {
    font: typography.headlineLargeFont,
    lineHeight: typography.headlineLargeLineHeight,
    name: 'headlineLarge',
    size: typography.headlineLargeSize,
    tracking: typography.headlineLargeTracking,
    weight: typography.headlineLargeWeight,
  },
  {
    font: typography.headlineMediumFont,
    lineHeight: typography.headlineMediumLineHeight,
    name: 'headlineMedium',
    size: typography.headlineMediumSize,
    tracking: typography.headlineMediumTracking,
    weight: typography.headlineMediumWeight,
  },
  {
    font: typography.headlineSmallFont,
    lineHeight: typography.headlineSmallLineHeight,
    name: 'headlineSmall',
    size: typography.headlineSmallSize,
    tracking: typography.headlineSmallTracking,
    weight: typography.headlineSmallWeight,
  },
  {
    font: typography.titleLargeFont,
    lineHeight: typography.titleLargeLineHeight,
    name: 'titleLarge',
    size: typography.titleLargeSize,
    tracking: typography.titleLargeTracking,
    weight: typography.titleLargeWeight,
  },
  {
    font: typography.titleMediumFont,
    lineHeight: typography.titleMediumLineHeight,
    name: 'titleMedium',
    size: typography.titleMediumSize,
    tracking: typography.titleMediumTracking,
    weight: typography.titleMediumWeight,
  },
  {
    font: typography.titleSmallFont,
    lineHeight: typography.titleSmallLineHeight,
    name: 'titleSmall',
    size: typography.titleSmallSize,
    tracking: typography.titleSmallTracking,
    weight: typography.titleSmallWeight,
  },
  {
    font: typography.bodyLargeFont,
    lineHeight: typography.bodyLargeLineHeight,
    name: 'bodyLarge',
    size: typography.bodyLargeSize,
    tracking: typography.bodyLargeTracking,
    weight: typography.bodyLargeWeight,
  },
  {
    font: typography.bodyMediumFont,
    lineHeight: typography.bodyMediumLineHeight,
    name: 'bodyMedium',
    size: typography.bodyMediumSize,
    tracking: typography.bodyMediumTracking,
    weight: typography.bodyMediumWeight,
  },
  {
    font: typography.bodySmallFont,
    lineHeight: typography.bodySmallLineHeight,
    name: 'bodySmall',
    size: typography.bodySmallSize,
    tracking: typography.bodySmallTracking,
    weight: typography.bodySmallWeight,
  },
  {
    font: typography.labelLargeFont,
    lineHeight: typography.labelLargeLineHeight,
    name: 'labelLarge',
    size: typography.labelLargeSize,
    tracking: typography.labelLargeTracking,
    weight: typography.labelLargeWeight,
  },
  {
    font: typography.labelMediumFont,
    lineHeight: typography.labelMediumLineHeight,
    name: 'labelMedium',
    size: typography.labelMediumSize,
    tracking: typography.labelMediumTracking,
    weight: typography.labelMediumWeight,
  },
  {
    font: typography.labelSmallFont,
    lineHeight: typography.labelSmallLineHeight,
    name: 'labelSmall',
    size: typography.labelSmallSize,
    tracking: typography.labelSmallTracking,
    weight: typography.labelSmallWeight,
  },
]

const spacingStyles = stylex.create({
  lg: { width: spacing.lg },
  md: { width: spacing.md },
  sm: { width: spacing.sm },
  xl: { width: spacing.xl },
  xs: { width: spacing.xs },
  xxl: { width: spacing.xxl },
  xxs: { width: spacing.xxs },
  xxxl: { width: spacing.xxxl },
})
// stylex.create()'s keys must stay alphabetical (lint rule), which doesn't
// match ascending scale order — render order comes from these lists instead.
const spacingOrder: (keyof typeof spacingStyles)[] = [
  'xxs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'xxl',
  'xxxl',
]

const radiiStyles = stylex.create({
  full: { borderRadius: radii.full },
  lg: { borderRadius: radii.lg },
  md: { borderRadius: radii.md },
  none: { borderRadius: radii.none },
  sm: { borderRadius: radii.sm },
  xl: { borderRadius: radii.xl },
  xs: { borderRadius: radii.xs },
})
const radiiOrder: (keyof typeof radiiStyles)[] = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'full',
]

const shadowStyles = stylex.create({
  elevation1: { boxShadow: shadows.elevation1 },
  elevation2: { boxShadow: shadows.elevation2 },
  elevation3: { boxShadow: shadows.elevation3 },
  elevation4: { boxShadow: shadows.elevation4 },
  elevation5: { boxShadow: shadows.elevation5 },
})

// State layers composite an 'on-color' over its container at one of these
// opacities (see stateLayerOpacity in design.tokens.json) rather than using a
// separate hover/pressed color — this is the same color-mix() formula
// Button's own hover/focus/pressed/disabled styles use.
function overOpacity(layer: string, over: string, opacity: string) {
  return `color-mix(in srgb, ${layer} calc(${opacity} * 100%), ${over})`
}

const STATE_LAYERS: { name: string; swatch: string }[] = [
  {
    name: 'hover',
    swatch: overOpacity(
      colors.onPrimary,
      colors.primary,
      stateLayerOpacity.hover,
    ),
  },
  {
    name: 'focus',
    swatch: overOpacity(
      colors.onPrimary,
      colors.primary,
      stateLayerOpacity.focus,
    ),
  },
  {
    name: 'pressed',
    swatch: overOpacity(
      colors.onPrimary,
      colors.primary,
      stateLayerOpacity.pressed,
    ),
  },
  {
    name: 'dragged',
    swatch: overOpacity(
      colors.onPrimary,
      colors.primary,
      stateLayerOpacity.dragged,
    ),
  },
  {
    name: 'disabledContainer',
    swatch: overOpacity(
      colors.onSurface,
      colors.surface,
      stateLayerOpacity.disabledContainer,
    ),
  },
  {
    name: 'disabledContent',
    swatch: overOpacity(
      colors.onSurface,
      colors.surface,
      stateLayerOpacity.disabledContent,
    ),
  },
]

function Tokens() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.pageHeader)}>
        <h1 {...stylex.props(styles.pageTitle)}>Design tokens</h1>
        <p {...stylex.props(styles.pageSubtitle)}>
          The full token system every kanso-ui component is built from.
        </p>
      </header>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>Colors</h2>
          <p {...stylex.props(styles.cardDescription)}>
            The semantic roles components import — not the raw tonal palette.
          </p>
        </div>
        {COLOR_GROUPS.map((group) => (
          <div key={group.title} {...stylex.props(styles.subsection)}>
            <p {...stylex.props(styles.eyebrow)}>{group.title}</p>
            <div {...stylex.props(styles.grid)}>
              {group.roles.map((role) => (
                <div key={role}>
                  <div {...stylex.props(styles.swatch(colors[role]))} />
                  <span {...stylex.props(styles.swatchName)}>{role}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>Typography</h2>
          <p {...stylex.props(styles.cardDescription)}>
            The full 15-style type scale and its two typeface roles.
          </p>
        </div>

        <div {...stylex.props(styles.subsection)}>
          <p {...stylex.props(styles.eyebrow)}>Type scale</p>
          <div {...stylex.props(styles.rowList)}>
            {TYPE_SCALE.map((s) => (
              <div key={s.name} {...stylex.props(styles.row)}>
                <span {...stylex.props(styles.tokenLabel)}>{s.name}</span>
                <p
                  {...stylex.props(
                    styles.typeScaleSample(
                      s.font,
                      s.size,
                      s.weight,
                      s.tracking,
                      s.lineHeight,
                    ),
                  )}
                >
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            ))}
          </div>
        </div>

        <div {...stylex.props(styles.subsection)}>
          <p {...stylex.props(styles.eyebrow)}>Typeface roles</p>
          <div {...stylex.props(styles.rowList)}>
            <div {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.tokenLabel)}>fontFamilyBrand</span>
              <p {...stylex.props(styles.typeSample, familyStyles.brand)}>
                The quick brown fox
              </p>
            </div>
            <div {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.tokenLabel)}>fontFamilyPlain</span>
              <p {...stylex.props(styles.typeSample, familyStyles.plain)}>
                Pack my box with five dozen jugs
              </p>
            </div>
            <div {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.tokenLabel)}>fontFamilyMono</span>
              <p {...stylex.props(styles.typeSample, familyStyles.mono)}>
                0123456789
              </p>
            </div>
          </div>
        </div>
      </section>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>Spacing</h2>
          <p {...stylex.props(styles.cardDescription)}>
            4px-based scale for padding, gaps, and margins.
          </p>
        </div>
        <div {...stylex.props(styles.rowList)}>
          {spacingOrder.map((name) => (
            <div key={name} {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.tokenLabel)}>{name}</span>
              <div {...stylex.props(styles.spacingBar, spacingStyles[name])} />
            </div>
          ))}
        </div>
      </section>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>Shape</h2>
          <p {...stylex.props(styles.cardDescription)}>
            Corner rounding from sharp to fully round.
          </p>
        </div>
        <div {...stylex.props(styles.rowList)}>
          {radiiOrder.map((name) => (
            <div key={name} {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.tokenLabel)}>{name}</span>
              <div {...stylex.props(styles.radiiBox, radiiStyles[name])} />
            </div>
          ))}
        </div>
      </section>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>Elevation</h2>
          <p {...stylex.props(styles.cardDescription)}>
            Five shadow levels, rendered identically in light and dark — depth
            in dark mode instead comes from the surface container tones above,
            not a stronger shadow.
          </p>
        </div>
        <div {...stylex.props(styles.grid)}>
          {Object.entries(shadowStyles).map(([name, shadowStyle]) => (
            <div key={name}>
              <div {...stylex.props(styles.shadowBox, shadowStyle)} />
              <span {...stylex.props(styles.swatchName)}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>State layers</h2>
          <p {...stylex.props(styles.cardDescription)}>
            hover/focus/pressed/dragged are conveyed by compositing an
            'on-color' over its container at one of these opacities, rather than
            a separate discrete color — shown here over primary
            (disabledContainer/disabledContent over surface).
          </p>
        </div>
        <div {...stylex.props(styles.grid)}>
          {STATE_LAYERS.map((state) => (
            <div key={state.name}>
              <div {...stylex.props(styles.stateSwatch(state.swatch))} />
              <span {...stylex.props(styles.swatchName)}>{state.name}</span>
            </div>
          ))}
        </div>
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
