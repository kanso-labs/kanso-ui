'use client'

import type { ReactNode, RefAttributes } from 'react'
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
import { colors, motion, radii } from '../../tokens/design.tokens.stylex'

// The progress indicators page's indicator, as a line or a ring, in either
// of the page's two shapes, flat and wavy. Both carry the three parts the
// page's anatomy names — the active indicator in primary, the track in
// secondary container, and, on the line, the stop indicator in primary at
// the end — at the page's 4dp thickness, with the 4dp gap its measurements
// give either side of the track. The flat ring is the page's default 40dp of
// the four sizes it draws, and the wavy ring the 48dp its wave needs room
// for.
//
// The determinate line is a row of those parts: the active indicator takes
// the value's share of what the gaps and the stop leave, and the track takes
// the rest — see `activeAt` in src/indicator/styles.ts. The
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
// The wavy shape draws the active indicator as a wave and leaves the track
// and the stop flat, as the page does. Its numbers are Material's own, from
// its Compose and Android components: on the line a 3dp amplitude, a 40dp
// wavelength and a 10dp row, with a 20dp wavelength while indeterminate; on
// the ring a 1.6dp amplitude and a 15dp wavelength, rounded to a whole
// number of waves so the wave closes on itself. A determinate wave lies flat
// up to a tenth of the way and from 95% on, which is Material's rule too: a
// wave too short to hold a crest reads as a wobble, and one about to finish
// settles into the line it ends as.
//
// The wave is drawn over the flat drawing rather than in place of it, and
// the two are crossfaded as the value crosses those bounds. The flat drawing
// is also what a reader who has asked for reduced motion sees, since a wave
// is motion even standing still, and what a line wider than `WAVE_REACH` is
// drawn as. The line's wave is a path of that fixed length, cut to the value
// by a dash written against the row's own width in container query units,
// `100cqi`, so nothing has to measure the row before the wave can be drawn.
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
// The same value as a length, hoisted rather than built at the parameter.
// The compiler has no safe reordering for a template literal, so one written
// as a default parameter skips the whole component around it — which the
// panic threshold this lands beside turns into a build failure.
const CIRCULAR_SIZE_PX = `${CIRCULAR_SIZE}px`
const THICKNESS = 4
const GAP = 4
const RADIUS = (CIRCULAR_SIZE - THICKNESS) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

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

// The wavy line: the wave's amplitude either side of the middle, its two
// wavelengths, and the row it is drawn in, which is the amplitude either side
// plus the stroke. `WAVE_REACH` is how far the wave runs, and a row wider
// than that draws flat. The easing is the shared line's, written again for
// the reason the thickness is.
const WAVE_AMPLITUDE = 3
const WAVE_WAVELENGTH = 40
const INDETERMINATE_WAVELENGTH = 20
const WAVE_HEIGHT = WAVE_AMPLITUDE * 2 + THICKNESS
const WAVE_REACH = 2048
const DETERMINATE_EASING = 'cubic-bezier(0.4, 0, 0.6, 1)'

// Where a determinate wave stands up and where it lies down again, as
// percentages of the way.
const WAVE_FROM = 10
const WAVE_UNTIL = 95

// The wavy ring: the 48dp box, the amplitude, and the circle the wave runs
// round, pulled in by the amplitude so its crests stay inside the box. The
// wave count is the wavelength's share of that circle, rounded — nine.
const WAVY_SIZE = 48
const WAVY_SIZE_PX = `${WAVY_SIZE}px`
const RING_AMPLITUDE = 1.6
const RING_WAVELENGTH = 15
const WAVY_RADIUS = (WAVY_SIZE - THICKNESS) / 2 - RING_AMPLITUDE
const WAVY_CIRCUMFERENCE = 2 * Math.PI * WAVY_RADIUS
const RING_WAVES = Math.round(WAVY_CIRCUMFERENCE / RING_WAVELENGTH)

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)'
const TOO_WIDE = `@container (inline-size > ${WAVE_REACH}px)`

// The paths the waves are drawn along, built once.
const DETERMINATE_WAVE = linearWave(WAVE_WAVELENGTH)
const INDETERMINATE_WAVE = linearWave(INDETERMINATE_WAVELENGTH)
const RING_WAVE = ringWave()

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

// The indeterminate line's two bars, as dashes along the wave. A bar's
// translation is where its dash starts, so it moves the dash's offset, and
// its scale is how long the dash is, so it moves the dash's length; both are
// the bar keyframes above, at their times and on their curves, turned from
// shares of the row into lengths of it. The offset is the bar's distance
// before the row's start, which is where its keyframes put it: the primary
// bar sits 145.167% back and travels 200.611% of the row, the secondary
// 54.8889% back and travels 160.278%. The gap after the dash is four rows
// long, so the dash after it never reaches the row.
const primaryWaveOffset = stylex.keyframes({
  '0%': { strokeDashoffset: '145.167cqi' },
  '20%': {
    animationTimingFunction: 'cubic-bezier(0.5, 0, 0.701732, 0.495819)',
    strokeDashoffset: '145.167cqi',
  },
  '59.15%': {
    animationTimingFunction: 'cubic-bezier(0.302435, 0.381352, 0.55, 0.956352)',
    strokeDashoffset: '61.4956cqi',
  },
  '100%': { strokeDashoffset: '-55.444cqi' },
})

const primaryWaveLength = stylex.keyframes({
  '0%': { strokeDasharray: '8cqi 400cqi' },
  '36.65%': {
    animationTimingFunction: 'cubic-bezier(0.334731, 0.12482, 0.785844, 1)',
    strokeDasharray: '8cqi 400cqi',
  },
  '69.15%': {
    animationTimingFunction: 'cubic-bezier(0.06, 0.11, 0.6, 1)',
    strokeDasharray: '66.1479cqi 400cqi',
  },
  '100%': { strokeDasharray: '8cqi 400cqi' },
})

const secondaryWaveOffset = stylex.keyframes({
  '0%': {
    animationTimingFunction: 'cubic-bezier(0.15, 0, 0.515058, 0.409685)',
    strokeDashoffset: '54.8889cqi',
  },
  '25%': {
    animationTimingFunction: 'cubic-bezier(0.31033, 0.284058, 0.8, 0.733712)',
    strokeDashoffset: '17.237cqi',
  },
  '48.35%': {
    animationTimingFunction: 'cubic-bezier(0.4, 0.627035, 0.6, 0.902026)',
    strokeDashoffset: '-29.4973cqi',
  },
  '100%': { strokeDashoffset: '-105.389cqi' },
})

const secondaryWaveLength = stylex.keyframes({
  '0%': {
    animationTimingFunction:
      'cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971)',
    strokeDasharray: '8cqi 400cqi',
  },
  '19.15%': {
    animationTimingFunction:
      'cubic-bezier(0.152313, 0.196432, 0.648374, 1.00432)',
    strokeDasharray: '45.7104cqi 400cqi',
  },
  '44.15%': {
    animationTimingFunction:
      'cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179)',
    strokeDasharray: '72.796cqi 400cqi',
  },
  '100%': { strokeDasharray: '8cqi 400cqi' },
})

const styles = stylex.create({
  // The flat line's active indicator, likewise, and the same out of sight
  // under a standing wave as `flatUnderLineWave` is.
  activeFade: {
    transitionProperty: 'inline-size, opacity',
  },
  activeUnderWave: {
    opacity: { default: 0, [REDUCED_MOTION]: 1, [TOO_WIDE]: 1 },
    transitionProperty: 'inline-size, opacity',
  },
  arcActive: {
    stroke: colors.primary,
  },
  // The flat ring's active arc moves its opacity as well as its dashes when
  // a wave is drawn over it, so the two crossfade in step.
  arcFade: {
    transitionProperty: 'stroke-dasharray, stroke-dashoffset, opacity',
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
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    transitionDuration: motion.durationLong2,
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
  //
  // Under forced colours the buffer draws nothing, the dots and the solid
  // part before them alike, since both are the track's own colour and the
  // mode draws the track as its edge alone. What the line keeps there is the
  // value, in `Highlight`, which is the one thing a reader has to have.
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
  // The dots under `inherit`, in the quarter of the surrounding colour that
  // `indicatorStyles.inheritTrack` gives the rest of the track. Written out
  // rather than drawn from that style, since the colour here sits inside a
  // gradient; the buffer's test holds the two to the same colour.
  dotsInherit: {
    backgroundImage: `radial-gradient(circle at ${THICKNESS / 2}px 50%, color-mix(in srgb, currentColor 25%, transparent) ${THICKNESS / 2}px, transparent ${THICKNESS / 2}px)`,
  },
  // The same on the line, which also draws flat once it is wider than the
  // wave reaches.
  flatUnderLineWave: {
    opacity: { default: 0, [REDUCED_MOTION]: 1, [TOO_WIDE]: 1 },
  },
  // The flat drawing a wave is drawn over: out of sight while the wave
  // stands, and the drawing itself under reduced motion.
  flatUnderWave: {
    opacity: { default: 0, [REDUCED_MOTION]: 1 },
  },
  // The bars of the indeterminate line: full width, scaled and translated
  // from the left edge, and started off it.
  //
  // Physical rather than logical, deliberately. The keyframes are Material's
  // own percentages and they translate one way only, so a logical inset
  // would start the bar at the right edge under a right-to-left writing
  // mode while the sweep kept pushing it further right — off the row it is
  // meant to cross. The direction is handled once, by mirroring the row; see
  // `indeterminateRow`.
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
  //
  // Under forced colours the bars are `Highlight` and the track keeps an
  // edge, as the determinate line's parts do — see src/indicator/styles.ts.
  indeterminateBarInner: {
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    inset: 0,
    position: 'absolute',
  },
  // The row the bars run inside, which clips them at both ends.
  //
  // The whole row is mirrored under a right-to-left writing mode, which is
  // what makes the sweep travel in the reading direction. The bars inside it
  // are positioned and translated in physical terms on purpose — see
  // `indeterminateBar` — so mirroring them one by one would mean mirroring
  // Material's tuned keyframes too. Flipping the row instead turns the whole
  // coordinate system over at once, and everything drawn in it is
  // symmetric: the track, and two bars whose corners are the same pill at
  // both ends.
  indeterminateRow: {
    blockSize: `${THICKNESS}px`,
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    inlineSize: '100%',
    overflow: 'hidden',
    position: 'relative',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  // The pill is the row's clip as well, and is repeated here only so the
  // forced-colours edge follows it rather than being cut at the corners.
  indeterminateTrack: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radii.pill,
    inset: 0,
    outlineColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    outlineOffset: { default: null, [FORCED_COLORS]: '-1px' },
    outlineStyle: { default: null, [FORCED_COLORS]: 'solid' },
    outlineWidth: { default: null, [FORCED_COLORS]: '1px' },
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
    left: '-145.167%',
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
  // The indeterminate line's waves, one per bar. Hidden rather than slowed
  // under reduced motion, which draws the flat bars instead.
  primaryWave: {
    animationDuration: `${INDETERMINATE_MS}ms, ${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite, infinite',
    animationName: `${primaryWaveOffset}, ${primaryWaveLength}`,
    animationTimingFunction: 'linear, linear',
    stroke: colors.primary,
  },
  // The ring's wave, hidden under reduced motion, where the flat arc
  // beneath it is drawn instead.
  ringWave: {
    display: { default: null, [REDUCED_MOTION]: 'none' },
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
    left: '-54.8889%',
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
  secondaryWave: {
    animationDuration: `${INDETERMINATE_MS}ms, ${INDETERMINATE_MS}ms`,
    animationIterationCount: 'infinite, infinite',
    animationName: `${secondaryWaveOffset}, ${secondaryWaveLength}`,
    animationTimingFunction: 'linear, linear',
    stroke: colors.primary,
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
  // The determinate line's wave, cut to the active indicator's length by its
  // dash: the value's share of the row less the two gaps and the stop, as
  // `activeAt` gives the flat one, less the half stroke each round cap adds
  // at either end. The path is measured in its own horizontal extent, so a
  // length along it is a width across the row.
  waveAt: (percentage: number) => ({
    strokeDasharray: `max(0px, (100cqi - ${GAP * 2 + THICKNESS}px) * ${percentage / 100} - ${THICKNESS}px) ${WAVE_REACH * 2}px`,
  }),
  // A wave lying down, at either end of a determinate value.
  waveFlat: {
    opacity: 0,
  },
  // The wave over the line: the row's whole box, mirrored under a
  // right-to-left writing mode so it starts at the inline start, and gone
  // under reduced motion or once the row is wider than the wave reaches.
  waveLine: {
    blockSize: '100%',
    boxSizing: 'border-box',
    display: { default: 'block', [REDUCED_MOTION]: 'none', [TOO_WIDE]: 'none' },
    inlineSize: '100%',
    insetBlockStart: 0,
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  // The determinate wave's motion: its length in step with the flat active
  // indicator's width, and its opacity in step with the flat one's.
  waveMotion: {
    [REDUCED_MOTION]: { transitionDuration: '0s' },
    stroke: colors.primary,
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'stroke-dasharray, opacity',
    transitionTimingFunction: DETERMINATE_EASING,
  },
  // The wavy line's row: the wave's 10dp, with the flat line through its
  // middle, and the container the wave's dash is measured against.
  wavyRow: {
    alignItems: 'center',
    blockSize: `${WAVE_HEIGHT}px`,
    boxSizing: 'border-box',
    containerType: 'inline-size',
    display: 'flex',
    inlineSize: '100%',
    position: 'relative',
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
   * How wide the ring is drawn, as a CSS length. Everything inside scales
   * with it, so `1em` gives a ring the size of the type around it. Ignored
   * by the line, which fills the width it is given.
   *
   * A length rather than a step of the size scale: a ring sized to the type
   * around it is what the prop is for, and no fixed scale gives that.
   * @default '40px', or '48px' for the wavy ring
   */
  diameter?: string
  /**
   * What the work is, shown above the indicator. A screen reader reads it as
   * the indicator's name; an indicator whose surroundings name it takes
   * `aria-label` instead and leaves this out.
   */
  label?: ReactNode
  /**
   * The page's two shapes. `wavy` draws the active indicator as a wave,
   * which lies flat near either end of a determinate value, and leaves the
   * track and the stop flat; the wavy ring is 48dp across rather than 40.
   * Under `prefers-reduced-motion` a wavy indicator is drawn flat.
   * @default 'flat'
   */
  shape?: ProgressIndicatorShape
  /**
   * Whether the value is shown beside the label. Ignored while the indicator
   * is indeterminate, which has no value to show.
   * @default false
   */
  showValue?: boolean
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

type ProgressIndicatorShape = 'flat' | 'wavy'

// The two of the shared line's four tones an indicator draws. The other two
// say how a measurement reads, which is a meter's business rather than a
// running task's.
type ProgressIndicatorTone = Extract<IndicatorTone, 'inherit' | 'primary'>

type ProgressIndicatorVariant = 'circular' | 'linear'

// The dashes that cut the two arcs out of one circle. The active arc runs
// from the top for its share of the circumference; the track picks up 4dp
// after it and stops 4dp before it comes back round, which is the page's gap
// measured along the curve.
function arcsFor(percentage: number | undefined, circumference: number) {
  const active = ((percentage ?? 0) / 100) * circumference
  const track = Math.max(0, circumference - active - 2 * GAP)

  return {
    active: {
      strokeDasharray: `${active} ${circumference}`,
      strokeDashoffset: 0,
    },
    track: {
      strokeDasharray: `${track} ${circumference}`,
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
  diameter,
  isIndeterminate,
  percentage,
  shape,
  tone,
}: {
  diameter: string
  isIndeterminate: boolean
  percentage: number | undefined
  shape: ProgressIndicatorShape
  tone: ProgressIndicatorTone
}) {
  const inherit = tone === 'inherit'
  const wavy = shape === 'wavy'
  const size = wavy ? WAVY_SIZE : CIRCULAR_SIZE
  const radius = wavy ? WAVY_RADIUS : RADIUS
  const circumference = wavy ? WAVY_CIRCUMFERENCE : CIRCUMFERENCE
  const arcs = arcsFor(percentage, circumference)
  const waving = wavy && (isIndeterminate || isWaving(percentage))

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${size} ${size}`}
      {...stylex.props(
        styles.circular,
        styles.circularSize(diameter),
        isIndeterminate && styles.circularIndeterminate,
      )}
    >
      {isIndeterminate ? null : (
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
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
        cx={size / 2}
        cy={size / 2}
        fill="none"
        pathLength={isIndeterminate ? 100 : undefined}
        r={radius}
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
          wavy && !isIndeterminate && styles.arcFade,
          waving && styles.flatUnderWave,
        )}
      />
      {wavy ? (
        // The wave, over the flat arc and cut by the same dashes. Measured
        // as the circle it runs round, so a length along it is a share of
        // the way round.
        <path
          d={RING_WAVE}
          fill="none"
          pathLength={isIndeterminate ? 100 : circumference}
          strokeDasharray={
            isIndeterminate ? undefined : arcs.active.strokeDasharray
          }
          strokeLinecap="round"
          strokeWidth={THICKNESS}
          {...stylex.props(
            isIndeterminate ? styles.arcIndeterminate : styles.arcMotion,
            isIndeterminate ? null : [styles.arcActive, styles.arcFade],
            inherit && indicatorStyles.inheritActive,
            styles.ringWave,
            !waving && styles.waveFlat,
          )}
        />
      ) : null}
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
  diameter: string,
  shape: ProgressIndicatorShape,
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
          diameter={diameter}
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
          shape={shape}
          tone={tone}
        />
      ) : (
        <LinearTrack
          buffer={bufferShare(buffer, state.percentage, minValue, maxValue)}
          isIndeterminate={state.isIndeterminate}
          percentage={state.percentage}
          shape={shape}
          tone={tone}
        />
      )}
    </>
  )
}

// Whether a determinate wave stands at this value — see `WAVE_FROM`.
function isWaving(percentage: number | undefined) {
  const value = percentage ?? 0
  return value > WAVE_FROM && value < WAVE_UNTIL
}

function LinearTrack({
  buffer,
  isIndeterminate,
  percentage,
  shape,
  tone,
}: {
  buffer: number | undefined
  isIndeterminate: boolean
  percentage: number | undefined
  shape: ProgressIndicatorShape
  tone: ProgressIndicatorTone
}) {
  const inherit = tone === 'inherit'
  const wavy = shape === 'wavy'

  if (isIndeterminate) {
    const bars = (
      <div {...stylex.props(styles.indeterminateRow)}>
        <span
          {...stylex.props(
            styles.indeterminateTrack,
            inherit && indicatorStyles.inheritTrack,
          )}
        />
        <span
          {...stylex.props(
            styles.indeterminateBar,
            styles.primaryBar,
            wavy && styles.flatUnderLineWave,
          )}
        >
          <span
            {...stylex.props(
              styles.indeterminateBarInner,
              styles.primaryBarInner,
              inherit && indicatorStyles.inheritActive,
            )}
          />
        </span>
        <span
          {...stylex.props(
            styles.indeterminateBar,
            styles.secondaryBar,
            wavy && styles.flatUnderLineWave,
          )}
        >
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
    if (!wavy) {
      return bars
    }
    return (
      <div {...stylex.props(styles.wavyRow)}>
        {bars}
        <svg aria-hidden="true" {...stylex.props(styles.waveLine)}>
          <path
            d={INDETERMINATE_WAVE.path}
            fill="none"
            pathLength={INDETERMINATE_WAVE.extent}
            strokeLinecap="round"
            strokeWidth={THICKNESS}
            {...stylex.props(
              styles.primaryWave,
              inherit && indicatorStyles.inheritActive,
            )}
          />
          <path
            d={INDETERMINATE_WAVE.path}
            fill="none"
            pathLength={INDETERMINATE_WAVE.extent}
            strokeLinecap="round"
            strokeWidth={THICKNESS}
            {...stylex.props(
              styles.secondaryWave,
              inherit && indicatorStyles.inheritActive,
            )}
          />
        </svg>
      </div>
    )
  }

  const waving = wavy && isWaving(percentage)
  const line = (
    <IndicatorLine
      activeStyle={
        waving ? styles.activeUnderWave : wavy ? styles.activeFade : null
      }
      percentage={percentage ?? 0}
      tone={tone}
    >
      {buffer === undefined ? undefined : (
        <>
          <span
            {...stylex.props(
              styles.trackBuffered,
              styles.trackBufferedAt(buffer),
              inherit && indicatorStyles.inheritTrack,
            )}
          />
          <span {...stylex.props(styles.dots, inherit && styles.dotsInherit)} />
        </>
      )}
    </IndicatorLine>
  )
  if (!wavy) {
    return line
  }

  return (
    <div {...stylex.props(styles.wavyRow)}>
      {line}
      <svg aria-hidden="true" {...stylex.props(styles.waveLine)}>
        <path
          d={DETERMINATE_WAVE.path}
          fill="none"
          pathLength={DETERMINATE_WAVE.extent}
          strokeLinecap="round"
          strokeWidth={THICKNESS}
          {...stylex.props(
            styles.waveMotion,
            styles.waveAt(percentage ?? 0),
            !waving && styles.waveFlat,
            inherit && indicatorStyles.inheritActive,
          )}
        />
      </svg>
    </div>
  )
}

// A wave along the line, `wavelength` apart and `WAVE_AMPLITUDE` either side
// of the middle of its row, from the half stroke a round cap needs at the
// start to past `WAVE_REACH`. Each half wave is one cubic whose control
// points sit 4/(3π) of the way in from either end at 4/3 of the amplitude,
// which crests at the amplitude and leaves the middle at a sine's own slope;
// `s` mirrors the last control point, so every half wave after the first is
// the same short command with its sign flipped. `extent` is how far it runs
// across, which the path is measured in.
function linearWave(wavelength: number) {
  const half = wavelength / 2
  const inset = round((4 / (3 * Math.PI)) * half)
  const lift = round((4 / 3) * WAVE_AMPLITUDE)
  const halves = Math.ceil(WAVE_REACH / half) + 1
  let path = `M${THICKNESS / 2} ${WAVE_HEIGHT / 2}c${inset} ${-lift} ${round(half - inset)} ${-lift} ${half} 0`
  for (let index = 1; index < halves; index++) {
    path += `s${round(half - inset)} ${index % 2 === 0 ? -lift : lift} ${half} 0`
  }
  return { extent: halves * half, path }
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
  diameter,
  label,
  maxValue = 100,
  minValue = 0,
  shape = 'flat',
  showValue = false,
  tone = 'primary',
  variant = 'linear',
  ...props
}: ProgressIndicatorProps & RefAttributes<HTMLDivElement>) {
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
        diameter ?? (shape === 'wavy' ? WAVY_SIZE_PX : CIRCULAR_SIZE_PX),
        shape,
        tone,
      )}
    </ProgressBar>
  )
}

// The wavy ring's path: `RING_WAVES` crests round the circle the wave runs
// round, as 20 points to a wave, starting at three o'clock and running
// clockwise as the circle's own dashes do.
function ringWave() {
  const points = RING_WAVES * 20
  const centre = WAVY_SIZE / 2
  let path = ''
  for (let index = 0; index < points; index++) {
    const angle = (index / points) * 2 * Math.PI
    const radius = WAVY_RADIUS + RING_AMPLITUDE * Math.sin(RING_WAVES * angle)
    path += `${index === 0 ? 'M' : 'L'}${round(centre + radius * Math.cos(angle))} ${round(centre + radius * Math.sin(angle))}`
  }
  return `${path}Z`
}

// Three decimal places, which keeps the paths short without moving a point
// by anything a screen could show.
function round(value: number) {
  return Math.round(value * 1000) / 1000
}

export type {
  ProgressIndicatorProps,
  ProgressIndicatorShape,
  ProgressIndicatorTone,
  ProgressIndicatorVariant,
}

export default ProgressIndicator
