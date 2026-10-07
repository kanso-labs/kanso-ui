'use client'

import type { RefAttributes } from 'react'
import type { ProgressBarProps as RACProgressBarProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { ProgressBar } from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import { colors, radii } from '../../tokens/design.tokens.stylex'

// The loading indicator page's indicator, at
// https://m3.material.io/components/loading-indicator/specs: a shape that
// morphs through a sequence of seven while it turns, for a wait short
// enough that how long it takes is not worth showing. It is indeterminate:
// it says that something is happening, and React Aria's `ProgressBar` gives
// it the role a screen reader announces that by.
//
// The page's tokens are a 48dp container with a full corner and a 38dp
// active indicator inside it. Uncontained, the container is transparent and
// the shape is primary; contained, the container is primary container and
// the shape on primary container, for an indicator drawn over content rather
// than beside it.
//
// The seven shapes are the page's, in its order: soft burst, nine-sided
// cookie, pentagon, pill, sunny, four-sided cookie and oval. Each is the
// polygon Material's own shape library builds for it, rounded the way that
// library rounds a corner and normalised to the same box, then traced as 90
// points at 4° steps around its centre — one list of points per shape, all
// the same length, which is what lets `clip-path` interpolate from each to
// the next. They share one scale, the largest at which the widest of them
// still fits the 38dp indicator at every angle it turns through.
//
// The timing is Material's too. Each morph takes the 650ms interval it
// starts, on a spring of damping ratio 0.6 and stiffness 200, which
// overshoots by about a tenth and settles inside the interval; `SPRING` is
// that curve sampled for `linear()`. Every morph turns the shape a further
// quarter on the same spring, and the whole indicator turns once every
// 4666ms underneath, at a constant rate. The quarter turns run on a cycle of
// their own, four of them to a full turn, beside the morph's cycle of seven,
// so each animation loops back to where it started.
//
// Under `prefers-reduced-motion` it slows rather than stopping, as the
// progress indicator's ring does and for its reason: an indicator that
// freezes stops saying the work is going on. The multiplier is the ring's.
//
// Under forced colours the shape is `CanvasText`, with the mode's own
// adjustment turned off for it, since the mode would otherwise paint its
// fill as the page's background and draw nothing at all.

// The shapes as `clip-path` polygons over the 48dp container, generated from
// the definitions in Material's shape library rather than drawn by hand. Each
// starts at three o'clock and runs clockwise, so the nth point of one shape
// becomes the nth point of the next.
const SHAPES = {
  cookie4Sided:
    'polygon(79% 50%, 79.1% 52%, 79.6% 54.2%, 80.4% 56.5%, 81.5% 59%, 82.5% 61.8%, 82.9% 64.7%, 82.9% 67.5%, 82.4% 70.3%, 81.5% 72.9%, 80.2% 75.3%, 78.5% 77.5%, 76.4% 79.4%, 74.1% 80.9%, 71.6% 82%, 68.9% 82.7%, 66.1% 83%, 63.2% 82.8%, 60.4% 82.1%, 57.7% 80.9%, 55.3% 79.9%, 53.1% 79.3%, 51% 79%, 49% 79%, 46.9% 79.3%, 44.7% 79.9%, 42.3% 81%, 39.6% 82.1%, 36.8% 82.8%, 33.9% 83%, 31.1% 82.7%, 28.4% 82%, 25.9% 80.9%, 23.6% 79.4%, 21.5% 77.5%, 19.8% 75.3%, 18.5% 72.9%, 17.6% 70.3%, 17.1% 67.5%, 17.1% 64.7%, 17.5% 61.8%, 18.5% 59%, 19.6% 56.5%, 20.4% 54.2%, 20.9% 52%, 21% 50%, 20.9% 48%, 20.4% 45.8%, 19.6% 43.5%, 18.5% 41%, 17.5% 38.2%, 17.1% 35.3%, 17.1% 32.5%, 17.6% 29.7%, 18.5% 27.1%, 19.8% 24.7%, 21.5% 22.5%, 23.6% 20.6%, 25.9% 19.1%, 28.4% 18%, 31.1% 17.3%, 33.9% 17%, 36.8% 17.2%, 39.6% 17.9%, 42.3% 19.1%, 44.7% 20.1%, 46.9% 20.7%, 49% 21%, 51% 21%, 53.1% 20.7%, 55.3% 20.1%, 57.7% 19%, 60.4% 17.9%, 63.2% 17.2%, 66.1% 17%, 68.9% 17.3%, 71.6% 18%, 74.1% 19.1%, 76.4% 20.6%, 78.5% 22.5%, 80.2% 24.7%, 81.5% 27.1%, 82.4% 29.7%, 82.9% 32.5%, 82.9% 35.3%, 82.5% 38.2%, 81.5% 41%, 80.4% 43.5%, 79.6% 45.8%, 79.1% 48%)',
  cookie9Sided:
    'polygon(82.5% 50%, 81.4% 52.2%, 80.4% 54.3%, 79.9% 56.4%, 79.8% 58.6%, 80.2% 61%, 80.2% 63.4%, 79.6% 65.8%, 78.6% 67.9%, 77.1% 69.7%, 75.2% 71.1%, 72.9% 72.1%, 70.8% 73.1%, 69.1% 74.4%, 67.6% 76.1%, 66.3% 78.3%, 64.7% 80.1%, 62.7% 81.4%, 60.5% 82.3%, 58.1% 82.6%, 55.7% 82.4%, 53.3% 81.7%, 51.1% 81.2%, 48.9% 81.2%, 46.7% 81.7%, 44.3% 82.4%, 41.9% 82.6%, 39.5% 82.3%, 37.3% 81.4%, 35.3% 80.1%, 33.7% 78.3%, 32.4% 76.1%, 30.9% 74.4%, 29.2% 73.1%, 27.1% 72.1%, 24.8% 71.1%, 22.9% 69.7%, 21.4% 67.9%, 20.4% 65.8%, 19.8% 63.4%, 19.8% 61%, 20.2% 58.6%, 20.1% 56.4%, 19.6% 54.3%, 18.6% 52.2%, 17.5% 50%, 17.1% 47.7%, 17.1% 45.4%, 17.7% 43.1%, 18.7% 41%, 20.3% 39.2%, 22.1% 37.6%, 23.4% 35.9%, 24.4% 34%, 24.9% 31.8%, 25.5% 29.5%, 26.6% 27.4%, 28.1% 25.6%, 29.9% 24.2%, 32% 23.3%, 34.3% 22.8%, 36.7% 22.7%, 38.8% 22.4%, 40.8% 21.6%, 42.6% 20.4%, 44.5% 18.9%, 46.6% 17.9%, 48.9% 17.4%, 51.1% 17.4%, 53.4% 17.9%, 55.5% 18.9%, 57.4% 20.4%, 59.2% 21.6%, 61.2% 22.4%, 63.3% 22.7%, 65.7% 22.8%, 68% 23.3%, 70.1% 24.2%, 71.9% 25.6%, 73.4% 27.4%, 74.5% 29.5%, 75.1% 31.8%, 75.6% 34%, 76.6% 35.9%, 77.9% 37.6%, 79.7% 39.2%, 81.3% 41%, 82.3% 43.1%, 82.9% 45.4%, 82.9% 47.7%)',
  oval: 'polygon(80% 50%, 79% 52%, 78.1% 53.9%, 77.1% 55.8%, 76% 57.5%, 75% 59.1%, 73.9% 60.6%, 72.8% 62.1%, 71.7% 63.5%, 70.5% 64.9%, 69.3% 66.2%, 68.1% 67.5%, 66.8% 68.7%, 65.6% 69.9%, 64.2% 71.1%, 62.8% 72.2%, 61.4% 73.3%, 59.9% 74.4%, 58.3% 75.5%, 56.6% 76.6%, 54.9% 77.6%, 53% 78.6%, 51% 79.5%, 48.9% 80.4%, 46.7% 81.2%, 44.4% 81.9%, 41.9% 82.4%, 39.3% 82.8%, 36.7% 83%, 34% 82.9%, 31.2% 82.5%, 28.6% 81.8%, 26.1% 80.6%, 23.8% 79.1%, 21.7% 77.3%, 20.1% 75.1%, 18.8% 72.7%, 17.8% 70.1%, 17.3% 67.4%, 17% 64.7%, 17.1% 62%, 17.4% 59.4%, 17.8% 56.8%, 18.5% 54.4%, 19.2% 52.2%, 20% 50%, 21% 48%, 21.9% 46.1%, 22.9% 44.2%, 24% 42.5%, 25% 40.9%, 26.1% 39.4%, 27.2% 37.9%, 28.3% 36.5%, 29.5% 35.1%, 30.7% 33.8%, 31.9% 32.5%, 33.2% 31.3%, 34.4% 30.1%, 35.8% 28.9%, 37.2% 27.8%, 38.6% 26.7%, 40.1% 25.6%, 41.7% 24.5%, 43.4% 23.4%, 45.1% 22.4%, 47% 21.4%, 49% 20.5%, 51.1% 19.6%, 53.3% 18.8%, 55.6% 18.1%, 58.1% 17.6%, 60.7% 17.2%, 63.3% 17%, 66% 17.1%, 68.8% 17.5%, 71.4% 18.2%, 73.9% 19.4%, 76.2% 20.9%, 78.3% 22.7%, 79.9% 24.9%, 81.2% 27.3%, 82.2% 29.9%, 82.7% 32.6%, 83% 35.3%, 82.9% 38%, 82.6% 40.6%, 82.2% 43.2%, 81.5% 45.6%, 80.8% 47.8%)',
  pentagon:
    'polygon(82% 50%, 81.3% 52.2%, 80.6% 54.3%, 79.9% 56.4%, 79.2% 58.4%, 78.5% 60.4%, 77.9% 62.4%, 77.2% 64.5%, 76.5% 66.5%, 75.8% 68.7%, 75% 71%, 74.2% 73.4%, 73.1% 75.7%, 71.6% 77.7%, 69.7% 79.2%, 67.5% 80.3%, 65.1% 80.9%, 62.5% 81%, 60.1% 81%, 57.7% 81%, 55.5% 81%, 53.3% 81%, 51.1% 81%, 48.9% 81%, 46.7% 81%, 44.5% 81%, 42.3% 81%, 39.9% 81%, 37.5% 81%, 34.9% 80.9%, 32.5% 80.3%, 30.3% 79.2%, 28.4% 77.7%, 26.9% 75.7%, 25.8% 73.4%, 25% 71%, 24.2% 68.7%, 23.5% 66.5%, 22.8% 64.5%, 22.1% 62.4%, 21.5% 60.4%, 20.8% 58.4%, 20.1% 56.4%, 19.4% 54.3%, 18.7% 52.2%, 18% 50%, 17.3% 47.7%, 17% 45.4%, 17.3% 43%, 18% 40.8%, 19.2% 38.8%, 20.9% 37%, 22.9% 35.6%, 24.8% 34.2%, 26.6% 33%, 28.3% 31.8%, 29.9% 30.6%, 31.5% 29.5%, 33.1% 28.4%, 34.7% 27.3%, 36.2% 26.1%, 37.8% 25%, 39.4% 23.9%, 41.1% 22.7%, 42.9% 21.4%, 44.8% 20.3%, 46.8% 19.4%, 48.9% 19%, 51.1% 19%, 53.2% 19.4%, 55.2% 20.3%, 57.1% 21.4%, 58.9% 22.7%, 60.6% 23.9%, 62.2% 25%, 63.8% 26.1%, 65.3% 27.3%, 66.9% 28.4%, 68.5% 29.5%, 70.1% 30.6%, 71.7% 31.8%, 73.4% 33%, 75.2% 34.2%, 77.1% 35.6%, 79.1% 37%, 80.8% 38.8%, 82% 40.8%, 82.7% 43%, 83% 45.4%, 82.7% 47.7%)',
  pill: 'polygon(82.6% 50%, 82.1% 52.2%, 81.4% 54.4%, 80.6% 56.5%, 79.7% 58.5%, 78.6% 60.4%, 77.4% 62.2%, 76.1% 63.9%, 74.7% 65.4%, 73.2% 66.9%, 71.8% 68.3%, 70.4% 69.7%, 69% 71.1%, 67.6% 72.5%, 66.2% 73.9%, 64.7% 75.4%, 63.1% 76.8%, 61.3% 78%, 59.5% 79.2%, 57.5% 80.2%, 55.5% 81.1%, 53.3% 81.8%, 51.1% 82.4%, 48.9% 82.7%, 46.5% 83%, 44.2% 82.9%, 41.9% 82.6%, 39.5% 82.2%, 37.2% 81.7%, 34.9% 80.9%, 32.7% 79.9%, 30.6% 78.7%, 28.6% 77.4%, 26.7% 75.9%, 25% 74.2%, 23.4% 72.4%, 21.9% 70.4%, 20.7% 68.3%, 19.6% 66.2%, 18.7% 63.9%, 18% 61.6%, 17.5% 59.3%, 17.2% 57%, 17% 54.6%, 17.1% 52.3%, 17.4% 50%, 17.9% 47.8%, 18.6% 45.6%, 19.4% 43.5%, 20.3% 41.5%, 21.4% 39.6%, 22.6% 37.8%, 23.9% 36.1%, 25.3% 34.6%, 26.8% 33.1%, 28.2% 31.7%, 29.6% 30.3%, 31% 28.9%, 32.4% 27.5%, 33.8% 26.1%, 35.3% 24.6%, 36.9% 23.2%, 38.7% 22%, 40.5% 20.8%, 42.5% 19.8%, 44.5% 18.9%, 46.7% 18.2%, 48.9% 17.6%, 51.1% 17.3%, 53.5% 17%, 55.8% 17.1%, 58.1% 17.4%, 60.5% 17.8%, 62.8% 18.3%, 65.1% 19.1%, 67.3% 20.1%, 69.4% 21.3%, 71.4% 22.6%, 73.3% 24.1%, 75% 25.8%, 76.6% 27.6%, 78.1% 29.6%, 79.3% 31.7%, 80.4% 33.8%, 81.3% 36.1%, 82% 38.4%, 82.5% 40.7%, 82.8% 43%, 83% 45.4%, 82.9% 47.7%)',
  softBurst:
    'polygon(76% 50%, 76.5% 51.9%, 78.3% 54%, 80.4% 56.5%, 81.5% 59%, 80.8% 61.2%, 78.3% 62.6%, 75.2% 63.4%, 72.5% 64.1%, 71% 65.3%, 70.4% 67.1%, 70.5% 69.8%, 70.8% 73.1%, 70.2% 75.9%, 68.3% 77.2%, 65.5% 76.9%, 62.5% 75.6%, 60% 74.6%, 58% 74.7%, 56.4% 75.8%, 55% 78.1%, 53.2% 80.9%, 51.1% 82.8%, 48.9% 82.8%, 46.8% 80.8%, 45% 78.1%, 43.6% 75.8%, 42% 74.7%, 40% 74.7%, 37.5% 75.7%, 34.5% 76.9%, 31.6% 77.2%, 29.8% 75.9%, 29.2% 73%, 29.5% 69.8%, 29.6% 67.1%, 29% 65.3%, 27.5% 64.1%, 24.8% 63.4%, 21.6% 62.6%, 19.2% 61.2%, 18.5% 59%, 19.7% 56.4%, 21.8% 54%, 23.5% 51.9%, 24% 50%, 23.5% 48.1%, 21.7% 46%, 19.6% 43.5%, 18.5% 41%, 19.2% 38.8%, 21.7% 37.4%, 24.8% 36.6%, 27.5% 35.9%, 29% 34.7%, 29.6% 32.9%, 29.5% 30.2%, 29.2% 26.9%, 29.8% 24.1%, 31.7% 22.8%, 34.5% 23.1%, 37.5% 24.4%, 40% 25.4%, 42% 25.3%, 43.6% 24.2%, 45% 21.9%, 46.8% 19.1%, 48.9% 17.2%, 51.1% 17.2%, 53.2% 19.2%, 55% 21.9%, 56.4% 24.2%, 58% 25.3%, 60% 25.3%, 62.5% 24.3%, 65.5% 23.1%, 68.4% 22.8%, 70.2% 24.1%, 70.8% 27%, 70.5% 30.2%, 70.4% 32.9%, 71% 34.7%, 72.5% 35.9%, 75.2% 36.6%, 78.4% 37.4%, 80.8% 38.8%, 81.5% 41%, 80.3% 43.6%, 78.2% 46%, 76.5% 48.1%)',
  sunny:
    'polygon(83% 50%, 82.5% 52.3%, 80.9% 54.3%, 79.3% 56.2%, 77.8% 58%, 76.4% 59.6%, 75.6% 61.4%, 75.4% 63.5%, 75.2% 65.7%, 75% 68.2%, 74.7% 70.8%, 73.7% 72.9%, 71.9% 74.3%, 69.4% 74.9%, 66.9% 75.1%, 64.6% 75.3%, 62.4% 75.4%, 60.5% 75.9%, 58.8% 77.1%, 57.1% 78.6%, 55.3% 80.1%, 53.3% 81.8%, 51.1% 82.9%, 48.9% 82.9%, 46.7% 81.8%, 44.7% 80.1%, 42.9% 78.6%, 41.2% 77.1%, 39.5% 75.9%, 37.6% 75.4%, 35.4% 75.3%, 33.1% 75.1%, 30.6% 74.9%, 28.1% 74.3%, 26.3% 72.9%, 25.3% 70.8%, 25% 68.2%, 24.8% 65.7%, 24.6% 63.5%, 24.4% 61.4%, 23.6% 59.6%, 22.2% 58%, 20.7% 56.2%, 19.1% 54.3%, 17.5% 52.3%, 17% 50%, 17.5% 47.7%, 19.1% 45.7%, 20.7% 43.8%, 22.2% 42%, 23.6% 40.4%, 24.4% 38.6%, 24.6% 36.5%, 24.8% 34.3%, 25% 31.8%, 25.3% 29.2%, 26.3% 27.1%, 28.1% 25.7%, 30.6% 25.1%, 33.1% 24.9%, 35.4% 24.7%, 37.6% 24.6%, 39.5% 24.1%, 41.2% 22.9%, 42.9% 21.4%, 44.7% 19.9%, 46.7% 18.2%, 48.9% 17.1%, 51.1% 17.1%, 53.3% 18.2%, 55.3% 19.9%, 57.1% 21.4%, 58.8% 22.9%, 60.5% 24.1%, 62.4% 24.6%, 64.6% 24.7%, 66.9% 24.9%, 69.4% 25.1%, 71.9% 25.7%, 73.7% 27.1%, 74.7% 29.2%, 75% 31.8%, 75.2% 34.3%, 75.4% 36.5%, 75.6% 38.6%, 76.4% 40.4%, 77.8% 42%, 79.3% 43.8%, 80.9% 45.7%, 82.5% 47.7%)',
} as const

// One morph's interval, the morph's cycle through all seven, and the quarter
// turns' cycle of four.
const MORPH_MS = 650
const MORPH_CYCLE_MS = MORPH_MS * 7
const TURN_CYCLE_MS = MORPH_MS * 4
const SPIN_MS = 4666

// What `prefers-reduced-motion` slows every animation by.
const SLOWDOWN = 1.25

// The spring, sampled every 25ms of the 650ms interval. It is within half a
// percent of rest by the end, and the last sample is rest itself, so a morph
// lands exactly on its shape before the next begins.
const SPRING =
  'linear(0, 0.054, 0.185, 0.352, 0.527, 0.69, 0.827, 0.934, 1.011, 1.06, 1.086, 1.095, 1.091, 1.079, 1.063, 1.047, 1.031, 1.018, 1.007, 1, 0.995, 0.992, 0.991, 0.991, 0.992, 0.994, 1)'

const FORCED_COLORS = '@media (forced-colors: active)'
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)'

const morph = stylex.keyframes({
  '0%': { animationTimingFunction: SPRING, clipPath: SHAPES.softBurst },
  '14.2857%': {
    animationTimingFunction: SPRING,
    clipPath: SHAPES.cookie9Sided,
  },
  '28.5714%': { animationTimingFunction: SPRING, clipPath: SHAPES.pentagon },
  '42.8571%': { animationTimingFunction: SPRING, clipPath: SHAPES.pill },
  '57.1429%': { animationTimingFunction: SPRING, clipPath: SHAPES.sunny },
  '71.4286%': {
    animationTimingFunction: SPRING,
    clipPath: SHAPES.cookie4Sided,
  },
  '85.7143%': { animationTimingFunction: SPRING, clipPath: SHAPES.oval },
  '100%': { clipPath: SHAPES.softBurst },
})

const turn = stylex.keyframes({
  '0%': { animationTimingFunction: SPRING, transform: 'rotate(0deg)' },
  '25%': { animationTimingFunction: SPRING, transform: 'rotate(90deg)' },
  '50%': { animationTimingFunction: SPRING, transform: 'rotate(180deg)' },
  '75%': { animationTimingFunction: SPRING, transform: 'rotate(270deg)' },
  '100%': { transform: 'rotate(360deg)' },
})

const spin = stylex.keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

const styles = stylex.create({
  contained: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  root: {
    alignItems: 'center',
    blockSize: '48px',
    borderRadius: radii.circle,
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexShrink: 0,
    inlineSize: '48px',
    justifyContent: 'center',
  },
  // The morph and the quarter turns, on the shape itself. The shape fills the
  // container and the polygons place it inside, so it turns about the
  // container's centre.
  shape: {
    animationDuration: `${MORPH_CYCLE_MS}ms, ${TURN_CYCLE_MS}ms`,
    animationIterationCount: 'infinite, infinite',
    animationName: `${morph}, ${turn}`,
    animationTimingFunction: 'linear, linear',
    backgroundColor: { default: 'currentColor', [FORCED_COLORS]: 'CanvasText' },
    blockSize: '100%',
    boxSizing: 'border-box',
    clipPath: SHAPES.softBurst,
    display: 'block',
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    inlineSize: '100%',
    [REDUCED_MOTION]: {
      animationDuration: `${MORPH_CYCLE_MS * SLOWDOWN}ms, ${TURN_CYCLE_MS * SLOWDOWN}ms`,
    },
  },
  // The constant turn underneath, on a wrapper so its transform and the
  // shape's own quarter turns do not replace each other.
  spin: {
    animationDuration: `${SPIN_MS}ms`,
    animationIterationCount: 'infinite',
    animationName: spin,
    animationTimingFunction: 'linear',
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'block',
    inlineSize: '100%',
    [REDUCED_MOTION]: {
      animationDuration: `${Math.round(SPIN_MS * SLOWDOWN)}ms`,
    },
  },
  uncontained: {
    color: colors.primary,
  },
})

type LoadingIndicatorProps = {
  /** A function may compute the class from the indicator's render state. */
  className?: RACProgressBarProps['className']
  /**
   * Draws the shape on a circular container in the primary container pair,
   * for an indicator drawn over content — a list being refreshed, an image
   * being fetched — where a bare shape would have nothing behind it to read
   * against.
   * @default false
   */
  contained?: boolean
  /** A function may compute the style from the indicator's render state. */
  style?: RACProgressBarProps['style']
} & Omit<
  RACProgressBarProps,
  | 'children'
  | 'className'
  | 'formatOptions'
  | 'isIndeterminate'
  | 'maxValue'
  | 'minValue'
  | 'style'
  | 'value'
  | 'valueLabel'
>

/**
 * A shape morphing as it turns, for a wait of a few seconds whose length is
 * not worth showing — where it would otherwise be an indeterminate ring.
 * Name it with `aria-label`, or `aria-labelledby` where something on the
 * page already says what is loading.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 */
function LoadingIndicator({
  contained = false,
  ...props
}: LoadingIndicatorProps & RefAttributes<HTMLDivElement>) {
  return (
    <ProgressBar
      {...props}
      isIndeterminate
      {...mergeStatefulStyles(
        stylex.props(
          styles.root,
          contained ? styles.contained : styles.uncontained,
        ),
        props,
      )}
    >
      <span aria-hidden="true" {...stylex.props(styles.spin)}>
        <span {...stylex.props(styles.shape)} />
      </span>
    </ProgressBar>
  )
}

export type { LoadingIndicatorProps }

export default LoadingIndicator
