import type { ReactNode } from 'react'
import type {
  ProgressBarRenderProps,
  ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { ProgressBar } from 'react-aria-components'

import type { IndicatorTone } from '../../indicator/styles'

import { IndicatorLabels, IndicatorLine } from '../../indicator'
import { indicatorStyles } from '../../indicator/styles'
import { mergeStatefulStyles } from '../../styles/merge'
import { colors, radii } from '../../tokens/design.tokens.stylex'

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
// The animations are Material's own rather than something assembled from
// the motion tokens: an indeterminate indicator is a piece of choreography,
// and one written from scratch reads as a different component beside a
// Material app. Material Web and Angular Material both descend from the
// same implementation and agree on every number, so the numbers here are
// theirs — the line's two bars and their four keyframe sets, the buffer's
// scrolling dots, the ring's 1333ms arc, its four-arc cycle and its 1568ms
// rotation, and the 250ms and 500ms a determinate value moves over.
//
// Two things are decided differently, both after reading the two of them.
//
// The ring is one dashed arc rather than two halves. Material Web draws it
// as a pair of bordered half-circles, Angular as a pair of clipped SVG
// circles with a patch over the seam between them; both constructions exist
// to work around that split, and a single arc whose dash pattern is
// animated needs neither and shares its geometry with the determinate ring.
// The three effects it composes are still theirs: the arc grows and shrinks
// over the arc's duration, its start travels the circle over four of those,
// and the whole thing turns over the rotation's.
//
// Under `prefers-reduced-motion` the motion slows rather than stopping,
// which is Angular's answer and the better one: an indicator that freezes
// stops saying the work is going on, and a frozen arc caught at its short
// end reads as broken. The multipliers are Angular's — two for the line,
// and a quarter more for the ring.
//
// React Aria's `ProgressBar` is the root: it carries the role, the value and
// its text, and reports the percentage and whether it is indeterminate as
// render state, which is what everything here is drawn from.

// The circle the arcs are cut from. The radius is the diameter less the
// stroke, halved, so the stroke sits inside the 40dp box rather than
// straddling its edge.
//
// The thickness and the gap are the same 4dp the shared line is drawn at,
// written again rather than imported from `src/indicator/styles`: StyleX
// evaluates the values inside `stylex.create` and `stylex.keyframes` as it
// compiles, and will not follow an import to a module that is not a theme
// to reach one — an imported constant fails the transform outright.
const CIRCULAR_SIZE = 40
const THICKNESS = 4
const GAP = 4
const RADIUS = (CIRCULAR_SIZE - THICKNESS) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// The ring's timings. The arc is 1333ms; a full cycle is four of them; and
// the rotation is the arc scaled by 360/306, which is the arc's start
// rotation plus the circle less the arc's size.
const ARC_MS = 1333
const CYCLE_MS = ARC_MS * 4
const ROTATE_MS = Math.round((ARC_MS * 360) / 306)
const RING_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

// The line's own: 2s for an indeterminate pass, and the 250ms the buffer's
// dots take to scroll one pitch. What a determinate value moves over is the
// shared line's, since a meter moves the same way.
const INDETERMINATE_MS = 2000
const BUFFER_MS = 250

// What `prefers-reduced-motion` slows each shape by.
const LINE_SLOWDOWN = 2
const RING_SLOWDOWN = 1.25

// The two bars of the indeterminate line, translated and scaled at once.
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

// The buffer's dots scroll by one pitch of the pattern and start again.
const buffering = stylex.keyframes({
  from: { backgroundPositionX: `${THICKNESS * 2.5}px` },
  to: { backgroundPositionX: '0px' },
})

// The arc's own length, written against a path the circle normalises to 100
// with `pathLength`, so these are percentages of the circumference rather
// than lengths StyleX would have to work out.
//
// Material contracts to 10 degrees of turn and grows to 270. The 270 is 75
// of the circumference and is written as it is; the 10 is not, because the
// page's rounded ends change what a short dash draws. A round cap adds half
// the stroke at each end, so a 10-degree dash on the 40dp ring is 3px of
// path inside a 7px capsule of 4px stroke — a dot rather than the sliver
// Material's square-cut ends give at the same angle. 8 is the shortest the
// cap still draws as an arc, and it is the floor for that reason rather
// than because the page names it.
const expandArc = stylex.keyframes({
  '0%': { strokeDasharray: '8 100' },
  '50%': { strokeDasharray: '75 100' },
  '100%': { strokeDasharray: '8 100' },
})

// Where the arc starts. Material turns it in eight increments of 135 degrees
// rather than at a constant rate, each eased with the same curve the arc's
// growth uses, so it settles at each position and springs to the next; three
// full turns over the cycle, under the rotation's own single turn. The
// numbers here are those angles along a path of 100: 135 degrees is 37.5 of
// it, and 1080 degrees is 300.
const travelArc = stylex.keyframes({
  '12.5%': { strokeDashoffset: '-37.5' },
  '25%': { strokeDashoffset: '-75' },
  '37.5%': { strokeDashoffset: '-112.5' },
  '50%': { strokeDashoffset: '-150' },
  '62.5%': { strokeDashoffset: '-187.5' },
  '75%': { strokeDashoffset: '-225' },
  '87.5%': { strokeDashoffset: '-262.5' },
  '100%': { strokeDashoffset: '-300' },
})

const spin = stylex.keyframes({
  to: { transform: 'rotate(360deg)' },
})

const styles = stylex.create({
  arcActive: {
    stroke: colors.primary,
  },
  // Two of the ring's three animations: the arc's length, and its start
  // travelling the circle.
  arcIndeterminate: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${ARC_MS * RING_SLOWDOWN}ms, ${CYCLE_MS * RING_SLOWDOWN}ms`,
    },
    animationDuration: `${ARC_MS}ms, ${CYCLE_MS}ms`,
    animationIterationCount: 'infinite, infinite',
    animationName: `${expandArc}, ${travelArc}`,
    animationTimingFunction: `${RING_EASING}, ${RING_EASING}`,
    stroke: colors.primary,
    transitionProperty: 'none',
  },
  // Material's own transition for a determinate ring, on both arcs rather
  // than on the active one alone. `arcsFor` moves the track's dash pattern
  // and its offset with the value just as much as the active arc's, so
  // easing one and not the other snapped the 4dp gap between them shut and
  // open again while the active arc grew smoothly.
  arcMotion: {
    transitionDuration: '500ms',
    transitionProperty: 'stroke-dasharray, stroke-dashoffset',
    transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  arcTrack: {
    stroke: colors.secondaryContainer,
  },
  circular: {
    boxSizing: 'border-box',
    display: 'block',
    // The dash pattern starts at three o'clock; the page's indicator starts
    // at the top.
    transform: 'rotate(-90deg)',
  },
  // The third of the ring's animations: the whole thing turning, under the
  // arc's own growth and travel.
  circularIndeterminate: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${Math.round(ROTATE_MS * RING_SLOWDOWN)}ms`,
    },
    animationDuration: `${ROTATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: spin,
    animationTimingFunction: 'linear',
    transform: 'none',
  },
  // How wide the ring is drawn. The circle inside keeps its 40 user units,
  // so the stroke and the gap scale with it rather than needing numbers of
  // their own — a ring in a button is the button's own type size.
  circularSize: (size: string) => ({
    blockSize: size,
    inlineSize: size,
  }),
  // The scrolling dots beyond the buffer: the track's colour, at half the
  // thickness, one pitch of five apart.
  dots: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${BUFFER_MS * LINE_SLOWDOWN}ms`,
    },
    animationDuration: `${BUFFER_MS}ms`,
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
  // The bars of the indeterminate line: full width, scaled and translated
  // from the leading edge, and started off it.
  indeterminateBar: {
    blockSize: `${THICKNESS}px`,
    boxSizing: 'border-box',
    inlineSize: '100%',
    insetBlockStart: 0,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  // The bars of the indeterminate line carry the same pill every other part
  // of the component draws, which is what Material gives its own inner bar.
  // The radius is drawn under the bar's own scale, so it flattens as the bar
  // narrows — that is inherent to scaling the bar rather than sizing it, and
  // Material's does the same.
  indeterminateBarInner: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    boxSizing: 'border-box',
    inset: 0,
    position: 'absolute',
  },
  // The row the bars run inside, which clips them at both ends.
  indeterminateRow: {
    blockSize: `${THICKNESS}px`,
    borderRadius: radii.full,
    boxSizing: 'border-box',
    inlineSize: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  indeterminateTrack: {
    backgroundColor: colors.secondaryContainer,
    inset: 0,
    position: 'absolute',
  },
  primaryBar: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${INDETERMINATE_MS * LINE_SLOWDOWN}ms`,
    },
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: primaryTranslate,
    animationTimingFunction: 'linear',
    insetInlineStart: '-145.167%',
  },
  primaryBarInner: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${INDETERMINATE_MS * LINE_SLOWDOWN}ms`,
    },
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: primaryScale,
    animationTimingFunction: 'linear',
  },
  // A circular indicator is its own size rather than the room it is given.
  rootCircular: {
    alignItems: 'flex-start',
    inlineSize: 'auto',
  },
  secondaryBar: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${INDETERMINATE_MS * LINE_SLOWDOWN}ms`,
    },
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: secondaryTranslate,
    animationTimingFunction: 'linear',
    insetInlineStart: '-54.8889%',
  },
  secondaryBarInner: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: `${INDETERMINATE_MS * LINE_SLOWDOWN}ms`,
    },
    animationDuration: `${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: secondaryScale,
    animationTimingFunction: 'linear',
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
  /**
   * How wide the ring is drawn, as a CSS length. Everything inside scales
   * with it, so `1em` gives a ring the size of the type around it. Ignored
   * by the line, which fills the width it is given.
   * @default '40px'
   */
  size?: string
  /** A function may compute the style from the indicator's render state. */
  style?: RACProgressBarProps['style']
  /**
   * Which colours it is drawn in. `primary` is the page's own pair — the
   * active indicator in primary over a secondary container track — and
   * `inherit` takes the colour around it, for an indicator inside something
   * that already has one, such as a button, where primary would be the fill.
   * @default 'primary'
   */
  tone?: ProgressIndicatorTone
  /**
   * The line the page draws, or the ring: `linear` fills the width it is
   * given, `circular` is 40dp across.
   * @default 'linear'
   */
  variant?: ProgressIndicatorVariant
} & Omit<RACProgressBarProps, 'children' | 'className' | 'style'>

// The two of the shared line's four tones an indicator draws. The other two
// say how a measurement reads, which is a meter's business rather than a
// running task's.
type ProgressIndicatorTone = Extract<IndicatorTone, 'inherit' | 'primary'>

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
  size,
  tone,
}: {
  isIndeterminate: boolean
  percentage: number | undefined
  size: string
  tone: ProgressIndicatorTone
}) {
  const inherit = tone === 'inherit'
  const arcs = arcsFor(percentage)

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${CIRCULAR_SIZE} ${CIRCULAR_SIZE}`}
      {...stylex.props(
        styles.circular,
        styles.circularSize(size),
        isIndeterminate && styles.circularIndeterminate,
      )}
    >
      {isIndeterminate ? null : (
        <circle
          cx={CIRCULAR_SIZE / 2}
          cy={CIRCULAR_SIZE / 2}
          fill="none"
          r={RADIUS}
          strokeDasharray={arcs.track.strokeDasharray}
          strokeDashoffset={arcs.track.strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={THICKNESS}
          {...stylex.props(
            styles.arcMotion,
            styles.arcTrack,
            inherit && indicatorStyles.inheritTrack,
          )}
        />
      )}
      <circle
        cx={CIRCULAR_SIZE / 2}
        cy={CIRCULAR_SIZE / 2}
        fill="none"
        pathLength={isIndeterminate ? 100 : undefined}
        r={RADIUS}
        strokeDasharray={
          isIndeterminate ? undefined : arcs.active.strokeDasharray
        }
        strokeDashoffset={
          isIndeterminate ? undefined : arcs.active.strokeDashoffset
        }
        strokeLinecap="round"
        strokeWidth={THICKNESS}
        {...stylex.props(
          isIndeterminate ? styles.arcIndeterminate : styles.arcMotion,
          isIndeterminate ? null : styles.arcActive,
          inherit && indicatorStyles.inheritActive,
        )}
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
  size: string,
  tone: ProgressIndicatorTone,
) {
  return (state: ProgressBarRenderProps) => (
    <>
      <IndicatorLabels
        label={label}
        value={
          showValue && !state.isIndeterminate ? state.valueText : undefined
        }
      />
      {variant === 'circular' ? (
        <CircularTrack
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
          size={size}
          tone={tone}
        />
      ) : (
        <LinearTrack
          buffer={bufferShare(buffer, state.percentage, minValue, maxValue)}
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
          tone={tone}
        />
      )}
    </>
  )
}

function LinearTrack({
  buffer,
  isIndeterminate,
  percentage,
  tone,
}: {
  buffer: number | undefined
  isIndeterminate: boolean
  percentage: number | undefined
  tone: ProgressIndicatorTone
}) {
  const inherit = tone === 'inherit'
  if (isIndeterminate) {
    return (
      <div {...stylex.props(styles.indeterminateRow)}>
        <span
          {...stylex.props(
            styles.indeterminateTrack,
            inherit && indicatorStyles.inheritTrack,
          )}
        />
        <span {...stylex.props(styles.indeterminateBar, styles.primaryBar)}>
          <span
            {...stylex.props(
              styles.indeterminateBarInner,
              styles.primaryBarInner,
              inherit && indicatorStyles.inheritActive,
            )}
          />
        </span>
        <span {...stylex.props(styles.indeterminateBar, styles.secondaryBar)}>
          <span
            {...stylex.props(
              styles.indeterminateBarInner,
              styles.secondaryBarInner,
              inherit && indicatorStyles.inheritActive,
            )}
          />
        </span>
      </div>
    )
  }

  return (
    <IndicatorLine percentage={percentage ?? 0} tone={tone}>
      {buffer === undefined ? undefined : (
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
    </IndicatorLine>
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
  size = `${CIRCULAR_SIZE}px`,
  tone = 'primary',
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
          indicatorStyles.root,
          variant === 'circular' && styles.rootCircular,
        ),
        props,
      )}
    >
      {indicatorContent(
        label,
        showValue,
        variant,
        buffer,
        minValue,
        maxValue,
        size,
        tone,
      )}
    </ProgressBar>
  )
}

export type {
  ProgressIndicatorProps,
  ProgressIndicatorTone,
  ProgressIndicatorVariant,
}

export default ProgressIndicator
