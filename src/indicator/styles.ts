import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
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
// end — at 4dp thick with 4dp between them. The row is a flex line and the
// two gaps are its `gap`. The active indicator takes the value's share of
// what the two gaps and the stop leave, and the track takes the rest, so the
// stop ends the row at every value.
//
// Under forced colours every part here is a background, which that mode
// paints in a system colour, so the line drew nothing at all. The active
// indicator and the stop take `Highlight` there, as the slider's filled part
// does, and the track keeps a `CanvasText` edge, drawn as an outline inside
// it so it takes no room from the line.
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

/**
 * What the page gives a value that changes to move over. The duration is the
 * motion scale's own step rather than a constant beside it — src/tokens/
 * values.ts keeps a number in JS only where one has to reach
 * `element.animate()` or a timer, and nothing here does.
 */
export const DETERMINATE_EASING = 'cubic-bezier(0.4, 0, 0.6, 1)'

export type IndicatorTone = 'inherit' | 'negative' | 'positive' | 'primary'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

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
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    blockSize: '100%',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    flexShrink: 0,
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'inline-size',
    transitionTimingFunction: DETERMINATE_EASING,
  },
  // How far along the active indicator has come: the value's share of the
  // row less the two gaps and the stop, which the line draws at every value.
  // A share of the whole row would run the row 12dp long at the maximum,
  // with the stop drawn past its end. A dynamic style, since StyleX compiles
  // its classes ahead of time and the number is the value.
  activeAt: (percentage: number) => ({
    inlineSize: `calc((100% - ${GAP * 2 + THICKNESS}px) * ${percentage / 100})`,
  }),
  // Drawn on something that already carries a colour. The active indicator
  // takes the colour it inherits, and the track a quarter of it. The fill
  // repeats the forced-colours branch every tone carries, since a fill
  // written without it would replace `active`'s whole.
  inheritActive: {
    backgroundColor: { default: 'currentColor', [FORCED_COLORS]: 'Highlight' },
    stroke: { default: 'currentColor', [FORCED_COLORS]: 'Highlight' },
  },
  // The ring's track under forced colours is `CanvasText`, as its own
  // track's is — see `arcTrack` in the progress indicator.
  inheritTrack: {
    backgroundColor: 'color-mix(in srgb, currentColor 25%, transparent)',
    stroke: {
      default: 'color-mix(in srgb, currentColor 25%, transparent)',
      [FORCED_COLORS]: 'CanvasText',
    },
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
  // The label's own part of the line. It gives way, and breaks a word wider
  // than the room rather than widening the line — a file name or a compound
  // otherwise pushed the value off the end and the page with it. Not
  // hyphenated, since such a word is as often a name as a compound.
  labelText: {
    minInlineSize: 0,
    overflowWrap: 'anywhere',
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
    backgroundColor: { default: colors.negative, [FORCED_COLORS]: 'Highlight' },
  },
  positiveActive: {
    backgroundColor: { default: colors.positive, [FORCED_COLORS]: 'Highlight' },
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
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    blockSize: `${THICKNESS}px`,
    borderRadius: radii.circle,
    boxSizing: 'border-box',
    flexShrink: 0,
    inlineSize: `${THICKNESS}px`,
  },
  // The track: whatever the active indicator and the gaps leave. Given
  // something to hold it becomes a row of its own; empty it is drawn solid.
  track: {
    blockSize: '100%',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    minInlineSize: 0,
    // The track's edge under forced colours. An outline inside the track
    // rather than a border, since a border would hold the track open at 2px
    // when the value leaves it none, and push the stop past the row again.
    outlineColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    outlineOffset: { default: null, [FORCED_COLORS]: '-1px' },
    outlineStyle: { default: null, [FORCED_COLORS]: 'solid' },
    outlineWidth: { default: null, [FORCED_COLORS]: '1px' },
    overflow: 'hidden',
  },
  trackSolid: {
    backgroundColor: colors.secondaryContainer,
  },
  // The value: whole, on one line, and at the end of the line whether or not
  // a label is beside it — a lone child of a spaced-between line otherwise
  // sat at its start.
  value: {
    flexShrink: 0,
    marginInlineStart: 'auto',
    whiteSpace: 'nowrap',
  },
})
