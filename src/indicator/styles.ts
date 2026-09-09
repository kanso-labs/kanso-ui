import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  spacing,
  typography,
} from '../tokens/design.tokens.stylex'

// The line the progress indicators page draws, and the label row above it,
// shared by the two components that draw one: ProgressIndicator, which adds
// the ring and the two indeterminate presentations on top, and Meter, which
// is this and nothing else.
//
// The page's anatomy names three parts — the active indicator in primary,
// the track in secondary container, and the stop indicator in primary at the
// end — at 4dp thick with 4dp between them. The active indicator's width is
// the percentage itself and the track takes what is left, so the row is a
// flex line and the two gaps are its `gap`.
//
// `tone` is the line's colour. `primary` is the page's own pair, and it is
// what a progress indicator draws. `negative` and `positive` swap the active
// indicator and the stop indicator alone, leaving the track in secondary
// container, so a column of meters reads as one scale with bars of different
// colours rather than as several unrelated gauges. `inherit` instead takes
// the colour around it for both, and gives the track a quarter of it, which
// is what makes a ring legible inside a filled button, where the page's
// primary is the button's own fill.
//
// Apart from ./index.tsx so that file exports components alone, which is
// what keeps fast refresh working for it.

/** The thickness of every part, and the room the page leaves between them. */
export const THICKNESS = 4
export const GAP = 4

/** What the page gives a value that changes to move over. */
export const DETERMINATE_MS = 250
export const DETERMINATE_EASING = 'cubic-bezier(0.4, 0, 0.6, 1)'

export type IndicatorTone = 'inherit' | 'negative' | 'positive' | 'primary'

export const indicatorStyles = stylex.create({
  // The active indicator: the percentage's own share of the row.
  //
  // Its width is what moves when the value changes, which lays the row out
  // again on every frame. Material animates a `scaleX` from a `left center`
  // origin instead, which the compositor runs on its own, and it can because
  // its line has neither a gap nor a stop indicator: its bar is the whole
  // row, and the scale factor is the value.
  //
  // The page's line has both, and both are fixed 4dp lengths. A scale factor
  // is a unitless ratio, so putting the track's start at `value% + 4dp`
  // needs the row's width in pixels, which no CSS the row itself can carry
  // knows. Scaling the active indicator alone would also flatten the pill it
  // is drawn as — a 9999px radius under `scaleX(0.05)` is a tenth of a pixel
  // across — so the ends would square off as the value fell. The width stays
  // for those two reasons rather than for want of trying the transform.
  active: {
    backgroundColor: colors.primary,
    blockSize: '100%',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    flexShrink: 0,
    transitionDuration: `${DETERMINATE_MS}ms`,
    transitionProperty: 'inline-size',
    transitionTimingFunction: DETERMINATE_EASING,
  },
  // How far along the active indicator has come. A dynamic style, since
  // StyleX compiles its classes ahead of time and the number is the value.
  activeAt: (percentage: number) => ({
    inlineSize: `${percentage}%`,
  }),
  // Drawn on something that already carries a colour. The active indicator
  // takes the colour it inherits, and the track a quarter of it.
  inheritActive: {
    backgroundColor: 'currentColor',
    stroke: 'currentColor',
  },
  inheritTrack: {
    backgroundColor: 'color-mix(in srgb, currentColor 25%, transparent)',
    stroke: 'color-mix(in srgb, currentColor 25%, transparent)',
  },
  label: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  // The label and the value either end of a line above the indicator.
  labels: {
    alignItems: 'baseline',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  // The three parts, with the page's 4dp between them.
  line: {
    alignItems: 'center',
    blockSize: `${THICKNESS}px`,
    boxSizing: 'border-box',
    display: 'flex',
    gap: `${GAP}px`,
    inlineSize: '100%',
  },
  // What `negative` and `positive` draw the active indicator and the stop
  // indicator in, over the same track every other tone uses.
  negativeActive: {
    backgroundColor: colors.negative,
  },
  positiveActive: {
    backgroundColor: colors.positive,
  },
  // The label row and the line, stacked.
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    inlineSize: '100%',
  },
  // The stop indicator: the page draws it at the end of the track, in the
  // same primary as the active indicator.
  stop: {
    backgroundColor: colors.primary,
    blockSize: `${THICKNESS}px`,
    borderRadius: radii.full,
    boxSizing: 'border-box',
    flexShrink: 0,
    inlineSize: `${THICKNESS}px`,
  },
  // The track: whatever the active indicator and the gaps leave. Given
  // something to hold it becomes a row of its own; empty it is drawn solid.
  track: {
    blockSize: '100%',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    minInlineSize: 0,
    overflow: 'hidden',
  },
  trackSolid: {
    backgroundColor: colors.secondaryContainer,
  },
})
