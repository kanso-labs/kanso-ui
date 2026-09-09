import type { ReactNode } from 'react'
import type {
  ProgressBarRenderProps,
  ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Label, ProgressBar } from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// The progress indicators page's two shapes, drawn flat: the page's wavy
// shape is the Expressive column's alone, and its amplitude and wavelength
// belong to a variant rather than to this. Both carry the three parts the
// page's anatomy names — the active indicator in primary, the track in
// secondary container, and, on the line, the stop indicator in primary at
// the end — at the page's 4dp thickness, with the 4dp gap its measurements
// give either side of the track. The ring is the page's default 40dp of the
// four sizes it draws.
//
// The determinate line is a row of those parts, so the active indicator's
// width is the percentage itself and the track takes what is left. The
// determinate ring is two arcs of one circle, cut by the dash pattern: the
// active arc runs from the top for its share of the circumference, and the
// track picks up 4dp past it and stops 4dp before it comes back round,
// which is the same gap measured along the curve.
//
// Every animation here is Material Web's, matched to
// https://github.com/material-components/material-web/tree/main/progress
// rather than assembled from the motion tokens — an indeterminate indicator
// is a piece of choreography, and one written from scratch reads as a
// different component beside a Material app. Its numbers are copied with
// its own comments: the line's two bars and their four keyframe sets, the
// buffer's scrolling dots, and the ring's three composed rotations. The
// durations are Material Web's own constants rather than steps of the
// motion scale, since the arc timings are derived from the geometry.
//
// React Aria's `ProgressBar` is the root: it carries the role, the value and
// its text, and reports the percentage and whether it is indeterminate as
// render state, which is what everything here is drawn from.

// The circle the determinate arcs are cut from. The radius is the diameter
// less the stroke, halved, so the stroke sits inside the 40dp box rather
// than straddling its edge.
const CIRCULAR_SIZE = 40
const THICKNESS = 4
const GAP = 4
const RADIUS = (CIRCULAR_SIZE - THICKNESS) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Material Web's own timings. The arc is 1333ms; a full cycle is four of
// them; and the linear rotation is the arc scaled by 360/306, which is the
// arc's start rotation plus the circle less the arc's size.
const ARC_MS = 1333
const CYCLE_MS = ARC_MS * 4
const LINEAR_ROTATE_MS = Math.round((ARC_MS * 360) / 306)
const INDETERMINATE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

// The line: 2s for the indeterminate pass, 250ms for a value that changes.
const INDETERMINATE_MS = 2000
const DETERMINATE_MS = 250
const DETERMINATE_EASING = 'cubic-bezier(0.4, 0, 0.6, 1)'

// The two bars of the indeterminate line, translated and scaled at once.
// The numbers are Material Web's, which took them from the Material
// Components implementation before it.
const primaryTranslate = stylex.keyframes({
  '0%': { transform: 'translateX(0px)' },
  '20%': {
    animationTimingFunction: 'cubic-bezier(0.5, 0, 0.701732, 0.495819)',
    transform: 'translateX(0px)',
  },
  '59.15%': {
    animationTimingFunction: 'cubic-bezier(0.302435, 0.381352, 0.55, 0.956352)',
    transform: 'translateX(83.6714%)',
  },
  '100%': { transform: 'translateX(200.611%)' },
})

const primaryScale = stylex.keyframes({
  '0%': { transform: 'scaleX(0.08)' },
  '36.65%': {
    animationTimingFunction: 'cubic-bezier(0.334731, 0.12482, 0.785844, 1)',
    transform: 'scaleX(0.08)',
  },
  '69.15%': {
    animationTimingFunction: 'cubic-bezier(0.06, 0.11, 0.6, 1)',
    transform: 'scaleX(0.661479)',
  },
  '100%': { transform: 'scaleX(0.08)' },
})

const secondaryTranslate = stylex.keyframes({
  '0%': {
    animationTimingFunction: 'cubic-bezier(0.15, 0, 0.515058, 0.409685)',
    transform: 'translateX(0px)',
  },
  '25%': {
    animationTimingFunction: 'cubic-bezier(0.31033, 0.284058, 0.8, 0.733712)',
    transform: 'translateX(37.6519%)',
  },
  '48.35%': {
    animationTimingFunction: 'cubic-bezier(0.4, 0.627035, 0.6, 0.902026)',
    transform: 'translateX(84.3862%)',
  },
  '100%': { transform: 'translateX(160.278%)' },
})

const secondaryScale = stylex.keyframes({
  '0%': {
    animationTimingFunction:
      'cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971)',
    transform: 'scaleX(0.08)',
  },
  '19.15%': {
    animationTimingFunction:
      'cubic-bezier(0.152313, 0.196432, 0.648374, 1.00432)',
    transform: 'scaleX(0.457104)',
  },
  '44.15%': {
    animationTimingFunction:
      'cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179)',
    transform: 'scaleX(0.72796)',
  },
  '100%': { transform: 'scaleX(0.08)' },
})

// The buffer's dots scroll by one pitch of the pattern and start again. The
// pitch is five half-thicknesses, which is Material Web's dot background.
const buffering = stylex.keyframes({
  from: { backgroundPositionX: '10px' },
  to: { backgroundPositionX: '0px' },
})

// The ring's three composed animations, all Material Web's: an arc expanding
// between 10 and 270 degrees, that arc travelling round the circle in
// 135-degree increments, and the whole thing rotating linearly on top.
const expandArc = stylex.keyframes({
  '0%': { transform: 'rotate(265deg)' },
  '50%': { transform: 'rotate(130deg)' },
  '100%': { transform: 'rotate(265deg)' },
})

const rotateArc = stylex.keyframes({
  '12.5%': { transform: 'rotate(135deg)' },
  '25%': { transform: 'rotate(270deg)' },
  '37.5%': { transform: 'rotate(405deg)' },
  '50%': { transform: 'rotate(540deg)' },
  '62.5%': { transform: 'rotate(675deg)' },
  '75%': { transform: 'rotate(810deg)' },
  '87.5%': { transform: 'rotate(945deg)' },
  '100%': { transform: 'rotate(1080deg)' },
})

const linearRotate = stylex.keyframes({
  to: { transform: 'rotate(360deg)' },
})

const styles = stylex.create({
  // The determinate active indicator: the percentage's own share of the row.
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
  // StyleX compiles its classes ahead of time and the number is the value —
  // it is written to a custom property inline.
  activeAt: (percentage: number) => ({
    inlineSize: `${percentage}%`,
  }),
  arcActive: {
    stroke: colors.primary,
    // Material Web's own transition for a determinate ring.
    transitionDuration: '500ms',
    transitionProperty: 'stroke-dasharray, stroke-dashoffset',
    transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  arcTrack: {
    stroke: colors.secondaryContainer,
  },
  // One half of the expanding arc, drawn as a bordered circle clipped to its
  // side. Two of them, offset by half the arc's duration, make one arc that
  // grows and shrinks.
  circle: {
    animationDuration: `${ARC_MS}ms`,
    animationFillMode: 'both',
    animationIterationCount: 'infinite',
    animationName: expandArc,
    animationTimingFunction: INDETERMINATE_EASING,
    // Material Web colours the top and the trailing edge, which is the
    // quadrant the two halves join into one arc across.
    borderBlockEndColor: 'transparent',
    borderBlockStartColor: colors.primary,
    borderInlineEndColor: colors.primary,
    borderInlineStartColor: 'transparent',
    borderRadius: radii.full,
    borderStyle: 'solid',
    borderWidth: `${THICKNESS}px`,
    boxSizing: 'border-box',
    position: 'absolute',
  },
  circleLeft: {
    inset: `0 -100% 0 0`,
    rotate: '135deg',
  },
  circleRight: {
    animationDelay: `${-0.5 * ARC_MS}ms`,
    inset: `0 0 0 -100%`,
    rotate: '100deg',
  },
  circular: {
    blockSize: `${CIRCULAR_SIZE}px`,
    boxSizing: 'border-box',
    display: 'block',
    inlineSize: `${CIRCULAR_SIZE}px`,
    // The dash pattern starts at three o'clock; the page's indicator starts
    // at the top.
    transform: 'rotate(-90deg)',
  },
  // The indeterminate ring, which is the two clipped halves rather than the
  // determinate arcs.
  circularIndeterminate: {
    animationDuration: `${LINEAR_ROTATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: linearRotate,
    animationTimingFunction: 'linear',
    blockSize: `${CIRCULAR_SIZE}px`,
    boxSizing: 'border-box',
    inlineSize: `${CIRCULAR_SIZE}px`,
    position: 'relative',
  },
  // The scrolling dots beyond the buffer: the track's colour, at half the
  // thickness, one pitch of five apart.
  dots: {
    animationDuration: `${DETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: buffering,
    animationTimingFunction: 'linear',
    backgroundImage: `radial-gradient(circle at ${THICKNESS / 2}px 50%, ${colors.secondaryContainer} ${THICKNESS / 2}px, transparent ${THICKNESS / 2}px)`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: `${THICKNESS * 2.5}px ${THICKNESS}px`,
    blockSize: '100%',
    boxSizing: 'border-box',
    flexGrow: 1,
    minInlineSize: 0,
  },
  // Half the ring, clipping its circle to one side.
  half: {
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'absolute',
  },
  halfLeft: {
    inset: '0 50% 0 0',
  },
  halfRight: {
    inset: '0 0 0 50%',
  },
  // The bars of the indeterminate line: full width, scaled and translated
  // from the left, and started off the leading edge.
  indeterminateBar: {
    blockSize: `${THICKNESS}px`,
    boxSizing: 'border-box',
    inlineSize: '100%',
    insetBlockStart: 0,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  indeterminateBarInner: {
    backgroundColor: colors.primary,
    boxSizing: 'border-box',
    inset: 0,
    position: 'absolute',
  },
  // The row the indeterminate bars run inside, which clips them at both ends.
  indeterminateRow: {
    blockSize: `${THICKNESS}px`,
    borderRadius: radii.full,
    boxSizing: 'border-box',
    inlineSize: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  // Nothing moves under reduced motion, on either shape. The indicator is
  // left where it stands, so the control still reads as working.
  indeterminateStill: {
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
  },
  indeterminateTrack: {
    backgroundColor: colors.secondaryContainer,
    inset: 0,
    position: 'absolute',
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
  // The three parts of a determinate line, with the page's 4dp between them.
  linear: {
    alignItems: 'center',
    blockSize: `${THICKNESS}px`,
    boxSizing: 'border-box',
    display: 'flex',
    gap: `${GAP}px`,
    inlineSize: '100%',
  },
  primaryBar: {
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: primaryTranslate,
    animationTimingFunction: 'linear',
    insetInlineStart: '-145.167%',
  },
  primaryBarInner: {
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: primaryScale,
    animationTimingFunction: 'linear',
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    inlineSize: '100%',
  },
  // A circular indicator is its own size rather than the room it is given.
  rootCircular: {
    alignItems: 'flex-start',
    inlineSize: 'auto',
  },
  secondaryBar: {
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: secondaryTranslate,
    animationTimingFunction: 'linear',
    insetInlineStart: '-54.8889%',
  },
  secondaryBarInner: {
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: secondaryScale,
    animationTimingFunction: 'linear',
  },
  // The arc travelling round the circle, under the linear rotation.
  spinner: {
    animationDuration: `${CYCLE_MS}ms`,
    animationFillMode: 'both',
    animationIterationCount: 'infinite',
    animationName: rotateArc,
    animationTimingFunction: INDETERMINATE_EASING,
    boxSizing: 'border-box',
    inset: 0,
    position: 'absolute',
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
  // The track: whatever the active indicator and the gaps leave. Given a
  // buffer it is split, the solid part reaching the buffer and the dots
  // running on to the end.
  track: {
    blockSize: '100%',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    minInlineSize: 0,
    overflow: 'hidden',
  },
  trackBuffered: {
    backgroundColor: colors.secondaryContainer,
    blockSize: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  // How far the buffer reaches into the track.
  trackBufferedAt: (share: number) => ({
    inlineSize: `${share}%`,
  }),
  trackSolid: {
    backgroundColor: colors.secondaryContainer,
  },
})

type ProgressIndicatorProps = {
  /**
   * How far the work is loaded ahead of the value — a video's buffered
   * seconds, a queue's fetched pages. Read on the same scale as `value`: the
   * track is solid up to it and dotted beyond. Ignored while the indicator
   * is indeterminate, and left out for work with nothing to buffer.
   */
  buffer?: number
  /** A function may compute the class from the indicator's render state. */
  className?: RACProgressBarProps['className']
  /**
   * What the work is, shown above the indicator. A screen reader reads it as
   * the indicator's name; an indicator whose surroundings name it takes
   * `aria-label` instead and leaves this out.
   */
  label?: ReactNode
  /**
   * Whether the value is shown beside the label. Ignored while the indicator
   * is indeterminate, which has no value to show.
   * @default false
   */
  showValue?: boolean
  /** A function may compute the style from the indicator's render state. */
  style?: RACProgressBarProps['style']
  /**
   * The line the page draws, or the ring: `linear` fills the width it is
   * given, `circular` is 40dp across.
   * @default 'linear'
   */
  variant?: ProgressIndicatorVariant
} & Omit<RACProgressBarProps, 'children' | 'className' | 'style'>

type ProgressIndicatorVariant = 'circular' | 'linear'

// The dashes that cut the two arcs out of one circle. The active arc runs
// from the top for its share of the circumference; the track picks up 4dp
// after it and stops 4dp before it comes back round, which is the page's gap
// measured along the curve.
function arcsFor(percentage: number | undefined) {
  const active = ((percentage ?? 0) / 100) * CIRCUMFERENCE
  const track = Math.max(0, CIRCUMFERENCE - active - 2 * GAP)

  return {
    active: {
      strokeDasharray: `${active} ${CIRCUMFERENCE}`,
      strokeDashoffset: 0,
    },
    track: {
      strokeDasharray: `${track} ${CIRCUMFERENCE}`,
      strokeDashoffset: -(active + GAP),
    },
  }
}

// How much of the track the buffer covers. The buffer is read on the value's
// scale, and the track holds what the value has not taken, so the solid part
// is the buffer's share of that remainder.
function bufferShare(
  buffer: number | undefined,
  percentage: number | undefined,
  minValue: number,
  maxValue: number,
) {
  if (buffer === undefined) {
    return undefined
  }
  const value = percentage ?? 0
  const range = maxValue - minValue
  const buffered = range === 0 ? 0 : ((buffer - minValue) / range) * 100
  const remaining = 100 - value
  if (remaining <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, ((buffered - value) / remaining) * 100))
}

function CircularTrack({
  isIndeterminate,
  percentage,
}: {
  isIndeterminate: boolean
  percentage: number | undefined
}) {
  if (isIndeterminate) {
    return (
      <div
        aria-hidden="true"
        {...stylex.props(
          styles.circularIndeterminate,
          styles.indeterminateStill,
        )}
      >
        <Spinner />
      </div>
    )
  }

  const arcs = arcsFor(percentage)

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${CIRCULAR_SIZE} ${CIRCULAR_SIZE}`}
      {...stylex.props(styles.circular)}
    >
      <circle
        cx={CIRCULAR_SIZE / 2}
        cy={CIRCULAR_SIZE / 2}
        fill="none"
        r={RADIUS}
        strokeDasharray={arcs.track.strokeDasharray}
        strokeDashoffset={arcs.track.strokeDashoffset}
        strokeLinecap="round"
        strokeWidth={THICKNESS}
        {...stylex.props(styles.arcTrack)}
      />
      <circle
        cx={CIRCULAR_SIZE / 2}
        cy={CIRCULAR_SIZE / 2}
        fill="none"
        r={RADIUS}
        strokeDasharray={arcs.active.strokeDasharray}
        strokeDashoffset={arcs.active.strokeDashoffset}
        strokeLinecap="round"
        strokeWidth={THICKNESS}
        {...stylex.props(styles.arcActive)}
      />
    </svg>
  )
}

// What the indicator draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
function indicatorContent(
  label: ReactNode,
  showValue: boolean,
  variant: ProgressIndicatorVariant,
  buffer: number | undefined,
  minValue: number,
  maxValue: number,
) {
  return (state: ProgressBarRenderProps) => (
    <>
      {label === undefined && !showValue ? null : (
        <div {...stylex.props(styles.labels)}>
          {label === undefined ? null : (
            <Label {...stylex.props(styles.label)}>{label}</Label>
          )}
          {showValue && !state.isIndeterminate ? (
            <span {...stylex.props(styles.label)}>{state.valueText}</span>
          ) : null}
        </div>
      )}
      {variant === 'circular' ? (
        <CircularTrack
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
        />
      ) : (
        <LinearTrack
          buffer={bufferShare(buffer, state.percentage, minValue, maxValue)}
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
        />
      )}
    </>
  )
}

function LinearTrack({
  buffer,
  isIndeterminate,
  percentage,
}: {
  buffer: number | undefined
  isIndeterminate: boolean
  percentage: number | undefined
}) {
  if (isIndeterminate) {
    return (
      <div {...stylex.props(styles.indeterminateRow)}>
        <span {...stylex.props(styles.indeterminateTrack)} />
        <span
          {...stylex.props(
            styles.indeterminateBar,
            styles.primaryBar,
            styles.indeterminateStill,
          )}
        >
          <span
            {...stylex.props(
              styles.indeterminateBarInner,
              styles.primaryBarInner,
              styles.indeterminateStill,
            )}
          />
        </span>
        <span
          {...stylex.props(
            styles.indeterminateBar,
            styles.secondaryBar,
            styles.indeterminateStill,
          )}
        >
          <span
            {...stylex.props(
              styles.indeterminateBarInner,
              styles.secondaryBarInner,
              styles.indeterminateStill,
            )}
          />
        </span>
      </div>
    )
  }

  return (
    <div {...stylex.props(styles.linear)}>
      <span
        {...stylex.props(styles.active, styles.activeAt(percentage ?? 0))}
      />
      <span
        {...stylex.props(
          styles.track,
          buffer === undefined && styles.trackSolid,
        )}
      >
        {buffer === undefined ? null : (
          <>
            <span
              {...stylex.props(
                styles.trackBuffered,
                styles.trackBufferedAt(buffer),
              )}
            />
            <span {...stylex.props(styles.dots)} />
          </>
        )}
      </span>
      <span {...stylex.props(styles.stop)} />
    </div>
  )
}

/**
 * Progress through a task, as a line or a ring. Its value is React Aria's:
 * pass `value` between `minValue` and `maxValue`, or leave `value` out and
 * set `isIndeterminate` for work whose length is not known. `formatOptions`
 * says how the value reads, in the locale the page is in, and `buffer` marks
 * how far the work is loaded ahead of it.
 *
 * The call site's `className` and `style` land on the indicator as a whole,
 * which is the element a layout positions.
 */
function ProgressIndicator({
  buffer,
  label,
  maxValue = 100,
  minValue = 0,
  showValue = false,
  variant = 'linear',
  ...props
}: ProgressIndicatorProps) {
  return (
    <ProgressBar
      maxValue={maxValue}
      minValue={minValue}
      {...props}
      {...mergeStatefulStyles(
        stylex.props(
          styles.root,
          variant === 'circular' && styles.rootCircular,
        ),
        props,
      )}
    >
      {indicatorContent(label, showValue, variant, buffer, minValue, maxValue)}
    </ProgressBar>
  )
}

// The indeterminate ring: an arc that grows and shrinks, travelling round the
// circle, with the whole thing rotating on top — Material Web's three
// composed animations. Each half of the arc is a bordered circle clipped to
// its own side, the second offset by half the arc's duration.
function Spinner() {
  return (
    <div {...stylex.props(styles.spinner, styles.indeterminateStill)}>
      <div {...stylex.props(styles.half, styles.halfLeft)}>
        <div
          {...stylex.props(
            styles.circle,
            styles.circleLeft,
            styles.indeterminateStill,
          )}
        />
      </div>
      <div {...stylex.props(styles.half, styles.halfRight)}>
        <div
          {...stylex.props(
            styles.circle,
            styles.circleRight,
            styles.indeterminateStill,
          )}
        />
      </div>
    </div>
  )
}

export type { ProgressIndicatorProps, ProgressIndicatorVariant }

export default ProgressIndicator
