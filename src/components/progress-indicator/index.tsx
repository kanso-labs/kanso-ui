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
  motion,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// The progress indicators page's two shapes, drawn flat: the page's wavy
// shape is the Expressive column's alone, and its amplitude and wavelength
// belong to a variant rather than to this. Both shapes carry the same three
// parts the page's anatomy names — the active indicator in primary, the
// track in secondary container, and the stop indicator in primary at the end
// — and the same 4dp thickness with a 4dp gap either side of the track,
// which is what the page's measurements give.
//
// The linear indicator is a row of those three parts, so the active
// indicator's width is the percentage itself and the track takes what is
// left; the page's 4dp gap is the row's own. The circular one is two arcs of
// a single circle, cut by the dash pattern: the active arc runs from the top
// for its share of the circumference, and the track runs from 4dp past it to
// 4dp before it comes back round, which is the same gap measured along the
// curve. Its 40dp diameter and 4dp thickness are the page's default of the
// four sizes it draws.
//
// Indeterminate, the page has the active indicator running the length of the
// track over and over. The linear one sweeps across; the circular one is a
// quarter of the ring, turning. Both stop under `prefers-reduced-motion`,
// where the indicator is left where it stands rather than vanishing —
// something has to say the work is still going on.
//
// React Aria's `ProgressBar` is the root: it carries the role, the value and
// its text, and reports the percentage and whether it is indeterminate as
// render state, which is what everything here is drawn from.

// The circle the arcs are cut from. The radius is the diameter less the
// stroke, halved, so the stroke sits inside the 40dp box rather than
// straddling its edge.
const CIRCULAR_SIZE = 40
const THICKNESS = 4
const GAP = 4
const RADIUS = (CIRCULAR_SIZE - THICKNESS) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const sweep = stylex.keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(250%)' },
})

const turn = stylex.keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

// A quarter of the circle, which is the arc an indeterminate ring turns.
// Set as an attribute rather than in the keyframes, since StyleX compiles
// those ahead of time and cannot take a number worked out here.
const INDETERMINATE_ARC = CIRCUMFERENCE / 4

const styles = stylex.create({
  // The active indicator: the percentage's own share of the row.
  active: {
    backgroundColor: colors.primary,
    blockSize: '100%',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    flexShrink: 0,
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'inline-size',
    transitionTimingFunction: motion.easingStandard,
  },
  // How far along the active indicator has come. A dynamic style, since
  // StyleX compiles its classes ahead of time and the number is the value —
  // it is written to a custom property inline.
  activeAt: (percentage: number) => ({
    inlineSize: `${percentage}%`,
  }),
  // Indeterminate, it is a fixed length sweeping across the track instead.
  activeIndeterminate: {
    animationDuration: motion.durationLong3,
    animationIterationCount: 'infinite',
    animationName: sweep,
    animationTimingFunction: motion.easingStandard,
    inlineSize: '40%',
    transitionProperty: 'none',
  },
  arcActive: {
    stroke: colors.primary,
  },
  arcTrack: {
    stroke: colors.secondaryContainer,
  },
  circular: {
    animationDuration: motion.durationLong2,
    animationIterationCount: 'infinite',
    animationName: 'none',
    animationTimingFunction: 'linear',
    blockSize: `${CIRCULAR_SIZE}px`,
    boxSizing: 'border-box',
    display: 'block',
    inlineSize: `${CIRCULAR_SIZE}px`,
    // The dash pattern starts at three o'clock; the page's indicator starts
    // at the top.
    transform: 'rotate(-90deg)',
  },
  circularIndeterminate: {
    animationName: turn,
  },
  // Nothing moves under reduced motion, on either shape. The indicator is
  // left where its animation would have put it early on, so the control
  // still reads as working rather than empty.
  indeterminateStill: {
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
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
  // The three parts of a linear indicator, with the page's 4dp between them.
  linear: {
    alignItems: 'center',
    blockSize: `${THICKNESS}px`,
    boxSizing: 'border-box',
    display: 'flex',
    gap: `${GAP}px`,
    inlineSize: '100%',
    // Indeterminate, the sweeping indicator runs past both ends.
    overflow: 'hidden',
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
  // The track: whatever the active indicator and the gaps leave.
  track: {
    backgroundColor: colors.secondaryContainer,
    blockSize: '100%',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    flexGrow: 1,
    minInlineSize: 0,
  },
})

type ProgressIndicatorProps = Omit<
  RACProgressBarProps,
  'children' | 'className' | 'style'
> & {
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
}

type ProgressIndicatorVariant = 'circular' | 'linear'

// The dashes that cut the two arcs out of one circle. The active arc runs
// from the top for its share of the circumference; the track picks up 4dp
// after it and stops 4dp before it comes back round, which is the page's gap
// measured along the curve. Indeterminate, the active arc is animated and
// the track is the whole circle.
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

function CircularTrack({
  isIndeterminate,
  percentage,
}: {
  isIndeterminate: boolean
  percentage: number | undefined
}) {
  const arcs = arcsFor(percentage)

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${CIRCULAR_SIZE} ${CIRCULAR_SIZE}`}
      {...stylex.props(
        styles.circular,
        isIndeterminate && styles.circularIndeterminate,
        isIndeterminate && styles.indeterminateStill,
      )}
    >
      <circle
        cx={CIRCULAR_SIZE / 2}
        cy={CIRCULAR_SIZE / 2}
        fill="none"
        r={RADIUS}
        strokeDasharray={
          isIndeterminate ? undefined : arcs.track.strokeDasharray
        }
        strokeDashoffset={
          isIndeterminate ? undefined : arcs.track.strokeDashoffset
        }
        strokeLinecap="round"
        strokeWidth={THICKNESS}
        {...stylex.props(styles.arcTrack)}
      />
      <circle
        cx={CIRCULAR_SIZE / 2}
        cy={CIRCULAR_SIZE / 2}
        fill="none"
        r={RADIUS}
        strokeDasharray={
          isIndeterminate
            ? `${INDETERMINATE_ARC} ${CIRCUMFERENCE}`
            : arcs.active.strokeDasharray
        }
        strokeDashoffset={isIndeterminate ? 0 : arcs.active.strokeDashoffset}
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
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
        />
      )}
    </>
  )
}

function LinearTrack({
  isIndeterminate,
  percentage,
}: {
  isIndeterminate: boolean
  percentage: number | undefined
}) {
  return (
    <div {...stylex.props(styles.linear)}>
      <span
        {...stylex.props(
          styles.active,
          !isIndeterminate && styles.activeAt(percentage ?? 0),
          isIndeterminate && styles.activeIndeterminate,
          isIndeterminate && styles.indeterminateStill,
        )}
      />
      <span {...stylex.props(styles.track)} />
      <span {...stylex.props(styles.stop)} />
    </div>
  )
}

/**
 * Progress through a task, as a line or a ring. Its value is React Aria's:
 * pass `value` between `minValue` and `maxValue`, or leave `value` out and
 * set `isIndeterminate` for work whose length is not known. `formatOptions`
 * says how the value reads, in the locale the page is in.
 *
 * The call site's `className` and `style` land on the indicator as a whole,
 * which is the element a layout positions.
 */
function ProgressIndicator({
  label,
  showValue = false,
  variant = 'linear',
  ...props
}: ProgressIndicatorProps) {
  return (
    <ProgressBar
      {...props}
      {...mergeStatefulStyles(
        stylex.props(
          styles.root,
          variant === 'circular' && styles.rootCircular,
        ),
        props,
      )}
    >
      {indicatorContent(label, showValue, variant)}
    </ProgressBar>
  )
}

export type { ProgressIndicatorProps, ProgressIndicatorVariant }

export default ProgressIndicator
