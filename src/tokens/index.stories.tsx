import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import Separator from '../components/separator'
import Text from '../components/text'
import {
  breakpoints,
  colors,
  media,
  motion,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
  typography,
} from './design.tokens.stylex'

// Below this the rows stop fitting on one line — the widest easing value,
// 'cubic-bezier(0.34, 1.56, 0.64, 1)', is on its own about a third of a
// phone's viewport — so each row's label takes a line of its own and the
// rest flows underneath it.
const NARROW = '@media (max-width: 640px)'

// Headings and prose go through Text's `render`, so this page is set in the
// library it documents and matches the component overviews beside it. The
// samples below stay raw: they exist to show what a token resolves to, and
// routing one through a component would document the component instead.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_3 = <h3 />
const PARAGRAPH = <p />

const DOT_SIZE = '16px'

// Every bar is already as long as its duration is slow, so pairing this with
// a per-token animation-duration makes all nine advance at exactly the same
// rate: a run reads as nine bars setting off together and stopping one after
// another, which is the comparison the numbers alone don't give.
const growBar = stylex.keyframes({
  from: { transform: 'scaleX(0)' },
  to: { transform: 'scaleX(1)' },
})

// Easings all travel the same distance over the same time, so the only thing
// separating one lane from another is the shape of the curve driving it.
// The lane deliberately doesn't clip: the two spring curves overshoot past 1
// and the dot running out beyond the end of its track before settling back
// is the clearest read of what 'overshoot' actually costs you on screen.
const travelDot = stylex.keyframes({
  from: { insetInlineStart: '0' },
  to: { insetInlineStart: `calc(100% - ${DOT_SIZE})` },
})

const styles = stylex.create({
  breakpointMarker: {
    borderRadius: radii.xs,
    flexGrow: 1,
    height: '16px',
    minWidth: 0,
  },
  breakpointValue: {
    color: colors.onSurfaceVariant,
    flexShrink: 0,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelSmallSize,
    // Right-aligns onto its own line once the row has wrapped, the same way
    // the motion rows' values do.
    marginInlineStart: 'auto',
    whiteSpace: 'nowrap',
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
    minWidth: 0,
    overflow: 'hidden',
  },
  easingDot: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    height: DOT_SIZE,
    insetBlockStart: 0,
    insetInlineStart: 0,
    position: 'absolute',
    width: DOT_SIZE,
  },
  // animationTimingFunction is the one thing this doesn't set — it comes from
  // the per-token style beside it, which is the same declaration the printed
  // cubic-bezier() and the plotted curve are both read back from.
  //
  // fillMode forwards because the default, none, drops the dot back to its
  // base position the instant the animation ends — the dot would travel the
  // lane and then teleport home, which reads as a glitch rather than as an
  // arrival.
  easingDotPlaying: {
    animationDuration: motion.durationLong3,
    animationFillMode: 'forwards',
    animationName: travelDot,
  },
  // The end margin is overshoot headroom, not decoration: springFast peaks at
  // ~110% of the travel, so at this page's widest the dot clears the end of
  // its track by a bit under 40px. Without the reservation it would land on
  // the cubic-bezier() text sitting next to it.
  easingLane: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    flexBasis: '96px',
    flexGrow: 1,
    height: DOT_SIZE,
    marginInlineEnd: spacing.xxxl,
    minWidth: '64px',
    position: 'relative',
  },
  grid: {
    display: 'grid',
    gap: spacing.md,
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  // Wider than the shared tokenLabel it sits on top of, because
  // 'easingEmphasizedDecelerate' is 172px of mono and would otherwise spill
  // out of a 160px box straight into the curve beside it. Scoped to this
  // section rather than widening the shared label, which would shift every
  // other row on the page for one section's benefit.
  motionLabel: {
    width: { default: '184px', [NARROW]: '100%' },
  },
  motionValue: {
    color: colors.onSurfaceVariant,
    flexShrink: 0,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.labelSmallSize,
    // Right-aligns the value on its own line once the row has wrapped.
    marginInlineStart: 'auto',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    // A fixed column, wide enough for the longest cubic-bezier(), rather than
    // letting each value size to its own text. The track beside it takes
    // whatever is left, so sizing to content would hand every row a
    // different-length track and make two dots at the same progress sit at
    // visibly different places — which is precisely the comparison these
    // samples exist to support.
    width: { default: '224px', [NARROW]: 'auto' },
  },
  page: {
    backgroundColor: colors.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxWidth: '960px',
    padding: { default: spacing.xxl, [NARROW]: spacing.lg },
  },
  pageHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
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
  // Wraps rather than overflows: every row here pairs a fixed-width label
  // with content that has a floor of its own (a nowrap cubic-bezier(), a
  // 57px type sample), and below NARROW the two together are wider than the
  // viewport. Nothing moves at desktop width, where it never wraps.
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  rowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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
    width: { default: '160px', [NARROW]: '100%' },
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

// A marker fills once the viewport has reached that class's floor, so the
// column reads cumulatively: at expanded width the first three are filled
// and the last two are not, which is what "this viewport is in the expanded
// class" looks like. One condition per style rather than one style stacking
// all four queries on a single property — that would leave which rule wins a
// question about how StyleX happens to order at-rules, and the answer would
// be invisible here until it was wrong.
//
// compact is unconditional because it has no query: `width >= 0px` is always
// true, so its marker is always filled. That is the point of it, not an
// omission — every style starts in compact and queries up from there.
const breakpointStyles = stylex.create({
  compact: { backgroundColor: colors.primary },
  expanded: {
    backgroundColor: {
      default: colors.surfaceContainerHighest,
      [media.expanded]: colors.primary,
    },
  },
  extraLarge: {
    backgroundColor: {
      default: colors.surfaceContainerHighest,
      [media.extraLarge]: colors.primary,
    },
  },
  large: {
    backgroundColor: {
      default: colors.surfaceContainerHighest,
      [media.large]: colors.primary,
    },
  },
  medium: {
    backgroundColor: {
      default: colors.surfaceContainerHighest,
      [media.medium]: colors.primary,
    },
  },
})

const breakpointOrder: (keyof typeof breakpointStyles)[] = [
  'compact',
  'medium',
  'expanded',
  'large',
  'extraLarge',
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
// The element that each sample animates carries its own token, and the value
// is read back off that element rather than restated here — which keeps this
// section from drifting out of step with design.tokens.json, and is also the
// only way to plot an easing curve, since an SVG path can't be handed a CSS
// timing function.
//
// Both halves deliberately use animation-* rather than transition-*: those
// are the properties the samples actually run on, so the printed number and
// the plotted curve are read from the same declarations that drive the bar
// and the dot, instead of from parallel ones that could drift away from them.
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
  easingEmphasized: { animationTimingFunction: motion.easingEmphasized },
  easingEmphasizedAccelerate: {
    animationTimingFunction: motion.easingEmphasizedAccelerate,
  },
  easingEmphasizedDecelerate: {
    animationTimingFunction: motion.easingEmphasizedDecelerate,
  },
  easingSpringFast: { animationTimingFunction: motion.easingSpringFast },
  easingSpringSlow: { animationTimingFunction: motion.easingSpringSlow },
  easingStandard: { animationTimingFunction: motion.easingStandard },
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

// runId doubles as the samples' React key: re-applying the same
// animation-name to a live element doesn't restart it, so a run remounts the
// animated node instead. 0 is the untouched first render, and it is the only
// state Chromatic ever captures.
function usePlayback() {
  const [runId, setRunId] = useState(0)
  // useCallback only to satisfy react-perf/jsx-no-new-function-as-prop — the
  // React Compiler would memoize this anyway.
  const play = useCallback(() => {
    setRunId((n) => n + 1)
  }, [])
  return { play, runId }
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
        : computed.animationTimingFunction
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
  const durations = usePlayback()
  const easings = usePlayback()
  const longestDuration = Math.max(
    ...DURATION_ORDER.map((token) => durationMs(resolved[token])),
    1,
  )

  return (
    <div ref={rootRef} {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.pageHeader)}>
        <Text render={HEADING_1} variant="displaySmall">
          Design tokens
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          The full token system every kanso-ui component is built from.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Colors
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The semantic roles components import — not the raw tonal palette.
          </Text>
        </div>
        {COLOR_GROUPS.map((group) => (
          <div key={group.title} {...stylex.props(styles.subsection)}>
            <Text render={HEADING_3} tone="muted" variant="labelMedium">
              {group.title}
            </Text>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Typography
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The full 15-style type scale and its two typeface roles.
          </Text>
        </div>

        <div {...stylex.props(styles.subsection)}>
          <Text render={HEADING_3} tone="muted" variant="labelMedium">
            Type scale
          </Text>
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
          <Text render={HEADING_3} tone="muted" variant="labelMedium">
            Typeface roles
          </Text>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Spacing
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            4px-based scale for padding, gaps, and margins.
          </Text>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Shape
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Corner rounding from sharp to fully round.
          </Text>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Layout
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Window size classes, as the floor of each class. These are the one
            group with no CSS custom property behind them — a media query cannot
            read a var(), so they compile to literals instead and are not part
            of the runtime override contract. Each marker below fills once this
            window has reached that class, so the filled ones are the classes
            currently in effect; resize to watch them turn over.
          </Text>
        </div>
        <div {...stylex.props(styles.rowList)}>
          {breakpointOrder.map((name) => (
            <div key={name} {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.tokenLabel)}>{name}</span>
              <div
                {...stylex.props(
                  styles.breakpointMarker,
                  breakpointStyles[name],
                )}
              />
              <span {...stylex.props(styles.breakpointValue)}>
                {breakpoints[name]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Elevation
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Five shadow levels, rendered identically in light and dark — depth
            in dark mode instead comes from the surface container tones above,
            not a stronger shadow.
          </Text>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            State layers
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            hover/focus/pressed/dragged are conveyed by compositing an
            'on-color' over its container at one of these opacities, rather than
            a separate discrete color — shown here over primary
            (disabledContainer/disabledContent over surface).
          </Text>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Motion
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Durations and easing curves are kept independent rather than paired
            into named transitions, so a component can hold one curve while
            varying speed per property.
          </Text>
        </div>

        <div {...stylex.props(styles.subsection)}>
          <div {...stylex.props(styles.subsectionHeader)}>
            <Text render={HEADING_3} tone="muted" variant="labelMedium">
              Duration
            </Text>
            <button
              onClick={durations.play}
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
                  <span
                    {...stylex.props(styles.tokenLabel, styles.motionLabel)}
                  >
                    {token}
                  </span>
                  <div {...stylex.props(styles.durationTrack)}>
                    <div
                      data-motion-token={token}
                      key={durations.runId}
                      {...stylex.props(
                        styles.durationBar(`${(ms / longestDuration) * 100}%`),
                        motionProbeStyles[token],
                        durations.runId > 0 && styles.durationBarPlaying,
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
          <div {...stylex.props(styles.subsectionHeader)}>
            <Text render={HEADING_3} tone="muted" variant="labelMedium">
              Easing
            </Text>
            <button
              onClick={easings.play}
              type="button"
              {...stylex.props(styles.playButton)}
            >
              Play easings
            </button>
          </div>
          <div {...stylex.props(styles.rowList)}>
            {EASING_ORDER.map((token) => {
              const points = bezierPoints(resolved[token])
              return (
                <div key={token} {...stylex.props(styles.row)}>
                  <span
                    {...stylex.props(styles.tokenLabel, styles.motionLabel)}
                  >
                    {token}
                  </span>
                  <div {...stylex.props(styles.curveCell)}>
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
                  <div {...stylex.props(styles.easingLane)}>
                    <div
                      data-motion-token={token}
                      key={easings.runId}
                      {...stylex.props(
                        styles.easingDot,
                        motionProbeStyles[token],
                        easings.runId > 0 && styles.easingDotPlaying,
                      )}
                    />
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
