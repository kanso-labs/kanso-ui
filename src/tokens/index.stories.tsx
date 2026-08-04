import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import {
  colors,
  motion,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
  typography,
} from './design.tokens.stylex'

// Every bar is already as long as its duration is slow, so pairing this with
// a per-token animation-duration makes all nine advance at exactly the same
// rate: a run reads as nine bars setting off together and stopping one after
// another, which is the comparison the numbers alone don't give.
const growBar = stylex.keyframes({
  from: { transform: 'scaleX(0)' },
  to: { transform: 'scaleX(1)' },
})

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
  curve: {
    height: '56px',
    // The two spring curves overshoot past 1, which puts part of the path
    // above the viewBox — visible only because the cell below reserves
    // vertical room for it to spill into.
    overflow: 'visible',
    width: '56px',
  },
  curveCell: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    paddingBlock: spacing.lg,
    width: '72px',
  },
  curveFrame: {
    fill: 'none',
    stroke: colors.outlineVariant,
    strokeWidth: '2',
  },
  curvePath: {
    fill: 'none',
    stroke: colors.primary,
    strokeWidth: '4',
  },
  durationBar: (width: string) => ({
    backgroundColor: colors.primary,
    height: '100%',
    width,
  }),
  // animationDuration is not set here — it comes from the per-token style
  // alongside it, which is the same declaration the resolved value is read
  // back from, so the sample can never run at a different speed than the
  // number printed next to it.
  durationBarPlaying: {
    animationName: growBar,
    animationTimingFunction: 'linear',
    transformOrigin: 'left center',
  },
  durationTrack: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.xs,
    flexGrow: 1,
    height: '16px',
    overflow: 'hidden',
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
  motionValue: {
    color: colors.onSurfaceVariant,
    flexShrink: 0,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelSmallSize,
    // The duration rows right-align this on their own, since the track
    // between label and value grows; the easing rows have nothing that
    // grows, so the auto margin is what lines both subsections up.
    marginInlineStart: 'auto',
    whiteSpace: 'nowrap',
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
  // Tonal treatment, composited the same way Button's variants are — see the
  // header comment there for why color-mix() has to be written out at each
  // property rather than factored into a helper.
  playButton: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
    },
    borderRadius: radii.full,
    borderWidth: 0,
    color: colors.onSecondaryContainer,
    cursor: 'pointer',
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: spacing.xs,
    paddingInline: spacing.md,
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
  subsection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  subsectionHeader: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'space-between',
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

// Every motion token compiles to a var(--kui-motion-*, <literal>) reference,
// so the literal it resolves to exists only in the browser's computed style.
// Each row below carries its own token as a real animation or transition
// property and the value is read back off that element, rather than restated
// here — which keeps this section from drifting out of step with
// design.tokens.json, and is also the only way to plot an easing curve, since
// an SVG path can't be handed a CSS timing function.
//
// The duration half deliberately uses animation-duration rather than
// transition-duration: it is the property the sample animation actually runs
// on, so the printed number is read from the same declaration that times the
// bar instead of from a parallel one that could drift away from it.
const motionProbeStyles = stylex.create({
  durationLong1: { animationDuration: motion.durationLong1 },
  durationLong2: { animationDuration: motion.durationLong2 },
  durationLong3: { animationDuration: motion.durationLong3 },
  durationMedium1: { animationDuration: motion.durationMedium1 },
  durationMedium2: { animationDuration: motion.durationMedium2 },
  durationMedium3: { animationDuration: motion.durationMedium3 },
  durationShort1: { animationDuration: motion.durationShort1 },
  durationShort2: { animationDuration: motion.durationShort2 },
  durationShort3: { animationDuration: motion.durationShort3 },
  easingEmphasized: { transitionTimingFunction: motion.easingEmphasized },
  easingEmphasizedAccelerate: {
    transitionTimingFunction: motion.easingEmphasizedAccelerate,
  },
  easingEmphasizedDecelerate: {
    transitionTimingFunction: motion.easingEmphasizedDecelerate,
  },
  easingSpringFast: { transitionTimingFunction: motion.easingSpringFast },
  easingSpringSlow: { transitionTimingFunction: motion.easingSpringSlow },
  easingStandard: { transitionTimingFunction: motion.easingStandard },
})

type MotionToken = keyof typeof motionProbeStyles

function isMotionToken(value: string | undefined): value is MotionToken {
  return value !== undefined && value in motionProbeStyles
}

// Ascending by speed and, for easings, grouped emphasized-then-spring —
// neither of which is the alphabetical order stylex.create() above requires.
const DURATION_ORDER: MotionToken[] = [
  'durationShort1',
  'durationShort2',
  'durationShort3',
  'durationMedium1',
  'durationMedium2',
  'durationMedium3',
  'durationLong1',
  'durationLong2',
  'durationLong3',
]

const EASING_ORDER: MotionToken[] = [
  'easingStandard',
  'easingEmphasized',
  'easingEmphasizedDecelerate',
  'easingEmphasizedAccelerate',
  'easingSpringFast',
  'easingSpringSlow',
]

// Progress runs bottom-to-top so the curve reads the way easing curves are
// conventionally drawn — time along x, progress up y — which means flipping
// each control point's y through the 100-unit box.
function bezierPath([x1, y1, x2, y2]: number[]) {
  return `M 0 100 C ${x1 * 100} ${100 - y1 * 100}, ${x2 * 100} ${100 - y2 * 100}, 100 0`
}

function bezierPoints(resolved: string | undefined) {
  const points = resolved
    ?.match(/^cubic-bezier\((.+)\)$/)?.[1]
    .split(',')
    .map(Number)
  return points?.length === 4 && points.every((p) => Number.isFinite(p))
    ? points
    : undefined
}

// Computed animation-duration comes back in seconds ('0.15s'), so it is
// rounded back to whole milliseconds — the unit design.tokens.json states it
// in — rather than shown as the browser's own normalization.
function durationMs(resolved: string | undefined) {
  return resolved === undefined
    ? 0
    : Math.round(Number.parseFloat(resolved) * 1000)
}

// State layers composite an 'on-color' over its container at one of these
// opacities (see stateLayerOpacity in design.tokens.json) rather than using a
// separate hover/pressed color — this is the same color-mix() formula
// Button's own hover/focus/pressed/disabled styles use.
function overOpacity(layer: string, over: string, opacity: string) {
  return `color-mix(in srgb, ${layer} calc(${opacity} * 100%), ${over})`
}

function useResolvedMotion() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [resolved, setResolved] = useState<
    Partial<Record<MotionToken, string>>
  >({})
  // Layout effect, not a plain effect: this runs before paint, so neither a
  // reader nor a Chromatic snapshot ever sees the unresolved first render.
  useLayoutEffect(() => {
    const probes = rootRef.current?.querySelectorAll<HTMLElement>(
      '[data-motion-token]',
    )
    if (!probes) return
    const next: Partial<Record<MotionToken, string>> = {}
    for (const probe of probes) {
      const token = probe.dataset.motionToken
      if (!isMotionToken(token)) continue
      const computed = getComputedStyle(probe)
      next[token] = token.startsWith('duration')
        ? computed.animationDuration
        : computed.transitionTimingFunction
    }
    setResolved(next)
  }, [])
  return { resolved, rootRef }
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
  const { resolved, rootRef } = useResolvedMotion()
  const [runId, setRunId] = useState(0)
  // useCallback only to satisfy react-perf/jsx-no-new-function-as-prop — the
  // React Compiler would memoize this anyway.
  const play = useCallback(() => {
    setRunId((n) => n + 1)
  }, [])
  const longestDuration = Math.max(
    ...DURATION_ORDER.map((token) => durationMs(resolved[token])),
    1,
  )

  return (
    <div ref={rootRef} {...stylex.props(styles.page)}>
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
              <div {...stylex.props(styles.swatch(state.swatch))} />
              <span {...stylex.props(styles.swatchName)}>{state.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.cardIntro)}>
          <h2 {...stylex.props(styles.cardHeading)}>Motion</h2>
          <p {...stylex.props(styles.cardDescription)}>
            Durations and easing curves are kept independent rather than paired
            into named transitions, so a component can hold one curve while
            varying speed per property.
          </p>
        </div>

        <div {...stylex.props(styles.subsection)}>
          <div {...stylex.props(styles.subsectionHeader)}>
            <p {...stylex.props(styles.eyebrow)}>Duration</p>
            <button
              onClick={play}
              type="button"
              {...stylex.props(styles.playButton)}
            >
              Play durations
            </button>
          </div>
          <div {...stylex.props(styles.rowList)}>
            {DURATION_ORDER.map((token) => {
              const ms = durationMs(resolved[token])
              return (
                <div key={token} {...stylex.props(styles.row)}>
                  <span {...stylex.props(styles.tokenLabel)}>{token}</span>
                  <div {...stylex.props(styles.durationTrack)}>
                    {/* Remounted on every run so the animation restarts —
                        re-applying the same animation-name to a live element
                        would not. runId 0 is the untouched first render, which
                        is what Chromatic snapshots. */}
                    <div
                      data-motion-token={token}
                      key={runId}
                      {...stylex.props(
                        styles.durationBar(`${(ms / longestDuration) * 100}%`),
                        motionProbeStyles[token],
                        runId > 0 && styles.durationBarPlaying,
                      )}
                    />
                  </div>
                  <span {...stylex.props(styles.motionValue)}>{ms}ms</span>
                </div>
              )
            })}
          </div>
        </div>

        <div {...stylex.props(styles.subsection)}>
          <p {...stylex.props(styles.eyebrow)}>Easing</p>
          <div {...stylex.props(styles.rowList)}>
            {EASING_ORDER.map((token) => {
              const points = bezierPoints(resolved[token])
              return (
                <div key={token} {...stylex.props(styles.row)}>
                  <span {...stylex.props(styles.tokenLabel)}>{token}</span>
                  <div
                    data-motion-token={token}
                    {...stylex.props(
                      styles.curveCell,
                      motionProbeStyles[token],
                    )}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      {...stylex.props(styles.curve)}
                    >
                      <rect
                        height="100"
                        width="100"
                        x="0"
                        y="0"
                        {...stylex.props(styles.curveFrame)}
                      />
                      {points ? (
                        <path
                          d={bezierPath(points)}
                          {...stylex.props(styles.curvePath)}
                        />
                      ) : null}
                    </svg>
                  </div>
                  <span {...stylex.props(styles.motionValue)}>
                    {resolved[token]}
                  </span>
                </div>
              )
            })}
          </div>
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
