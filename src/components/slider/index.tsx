'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  SliderProps as RACSliderProps,
  SliderState,
  SliderThumbRenderProps,
  SliderTrackRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Slider as RACSlider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from 'react-aria-components'

import { FieldLabel } from '../../field'
import { groupStyles } from '../../field/styles'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The sliders page. At the size its tokens call extra-small, the default: a
// 16dp track with an 8dp corner, the active part in primary and the inactive
// part in secondary container, a 4dp stop in on secondary container 6dp from
// the inactive end, and a handle 4dp wide and 44dp tall in primary that
// narrows to 2dp while pressed or focused. The track parts on each side of
// the handle, with 6dp of space between them and it, and their corners
// against the handle are 2dp where their outer ends are full. Disabled, the
// active part and the handle are on surface at the disabled content opacity
// and the inactive part at the disabled container opacity.
//
// `size` takes the page's four larger sizes, which thicken the track and
// round its ends more, and lengthen the handle from M up:
//
// | Size | Track | Corner | Handle | Inset icon |
// | ---- | ----- | ------ | ------ | ---------- |
// | xs   | 16dp  | 8dp    | 44dp   |            |
// | sm   | 24dp  | 8dp    | 44dp   |            |
// | md   | 40dp  | 12dp   | 52dp   | 24dp       |
// | lg   | 56dp  | 16dp   | 68dp   | 24dp       |
// | xl   | 96dp  | 28dp   | 108dp  | 32dp       |
//
// The handle stays 4dp wide, the corners against it 2dp and the space beside
// it 6dp at every size.
//
// `showStops` is the page's stops configuration, which it used to call the
// discrete slider: a 4dp stop at every step, in on primary on the active part
// and on secondary container on the inactive one, so the reader can see
// where the handle can land. The stops at the two ends sit 6dp in from them,
// as the single stop does. A part clips what it holds, which is what hides
// the stops beside the handle: the part ends 6dp short of it.
//
// `icon` is the page's inset icon, at the start of the active part in on
// primary, from M up: the page gives it a size at M, L and XL alone. It is
// 10dp in from the part's start, which is MDC-Android's padding, since the
// page gives none, and like MDC-Android it is drawn only while the part has
// room for it and that padding on both sides, and for a single handle.
//
// The value indicator is the page's label: inverse surface under label-large
// in inverse on surface, 44dp tall and at least 48dp wide, 12dp above the
// handle. It shows while the handle is dragged or has keyboard focus, and it
// is React Aria's `SliderOutput`, so what it shows is what the slider
// announces.
//
// React Aria's `Slider` is the root, `SliderTrack` the strip the handles are
// placed along by percent, and `SliderThumb` each handle around a visually
// hidden range input. The track's parts are drawn here from those percents
// rather than with `SliderFill`, since the page's parts stop short of the
// handle on both sides and the fill runs up to it. A range slider is the
// same track with two handles and the active part between them.
//
// Vertical, the same parts run along the block axis, with the active part
// rising from the bottom and the indicator to the start side of the handle.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// The sliders page's own measurements, which are constants of the component
// rather than steps of the consumer's spacing scale. The clearance used to be
// read off `spacing.sm` — true at its default 8, since 6 plus half the
// handle comes to the same — so a theme moving that step opened the gap
// beside the handle while the stop, written as the literal it is, stayed
// where the page puts it.
const GAP = 6
const HANDLE_WIDTH = 4
/** How far a part stops short of a handle's centre. */
const CLEAR = GAP + HANDLE_WIDTH / 2
/** A stop's size. */
const STOP = 4
/** MDC-Android's padding either side of the inset icon. */
const ICON_PADDING = 10

type SliderSize = 'lg' | 'md' | 'sm' | 'xl' | 'xs'

// The sizes, as the custom properties every part reads: the track's
// thickness, its outer corner and the handle's length, which the track
// strip takes as its own thickness too.
const sizes = stylex.create({
  lg: {
    '--slider-corner': radii.lg,
    '--slider-handle': '68px',
    '--slider-icon': '24px',
    '--slider-track': '56px',
  },
  md: {
    '--slider-corner': radii.md,
    '--slider-handle': '52px',
    '--slider-icon': '24px',
    '--slider-track': '40px',
  },
  sm: {
    '--slider-corner': radii.sm,
    '--slider-handle': '44px',
    '--slider-track': '24px',
  },
  xl: {
    '--slider-corner': radii.xl,
    '--slider-handle': '108px',
    '--slider-icon': '32px',
    '--slider-track': '96px',
  },
  xs: {
    '--slider-corner': radii.sm,
    '--slider-handle': '44px',
    '--slider-track': '16px',
  },
})

const styles = stylex.create({
  // The filled part of the track. `Highlight` under forced colours is what
  // keeps it apart from the empty part beside it: that mode paints author
  // backgrounds in a system colour, so both segments would otherwise flatten
  // to the same one and the slider would say nothing about its value. A
  // system keyword is kept rather than repainted, which is what makes this
  // the one place a background is still the right property to reach for.
  active: {
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
  },
  activeDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  // The active part holding the inset icon, which asks of it how much room
  // it has.
  activeHoldingIcon: {
    containerType: 'size',
  },
  // The inset icon: centred across the part, drawn at its size in `em` as
  // every icon here is, in the colour on the part.
  icon: {
    alignItems: 'center',
    blockSize: 'var(--slider-icon)',
    color: { default: colors.onPrimary, [FORCED_COLORS]: 'HighlightText' },
    display: 'flex',
    fontSize: 'var(--slider-icon)',
    inlineSize: 'var(--slider-icon)',
    insetBlockStart: 'calc(50% - var(--slider-icon) / 2)',
    insetInlineStart: `${ICON_PADDING}px`,
    justifyContent: 'center',
    position: 'absolute',
  },
  iconDisabled: {
    color: colors.inverseOnSurface,
  },
  // Gone while the part is shorter than the icon and its padding on both
  // sides, which is 44dp at M and L and 52dp at XL. A container query takes
  // a number rather than a custom property, hence one style per length.
  iconRoomBlock: {
    display: { '@container (block-size < 44px)': 'none', default: 'flex' },
  },
  iconRoomBlockXl: {
    display: { '@container (block-size < 52px)': 'none', default: 'flex' },
  },
  iconRoomInline: {
    display: { '@container (inline-size < 44px)': 'none', default: 'flex' },
  },
  iconRoomInlineXl: {
    display: { '@container (inline-size < 52px)': 'none', default: 'flex' },
  },
  // Vertical, the part rises from the bottom, so the icon sits at its foot.
  iconVertical: {
    insetBlockEnd: `${ICON_PADDING}px`,
    insetBlockStart: 'auto',
    insetInlineStart: 'calc(50% - var(--slider-icon) / 2)',
  },
  inactiveDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  indicator: {
    alignItems: 'center',
    backgroundColor: colors.inverseSurface,
    blockSize: '44px',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    color: colors.inverseOnSurface,
    display: 'flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    insetBlockEnd: `calc(100% + ${spacing.md})`,
    insetInlineStart: '50%',
    justifyContent: 'center',
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    minInlineSize: '48px',
    paddingInline: spacing.md,
    position: 'absolute',
    // Back by half its own width, to centre it on the handle. The inset that
    // puts its start edge at the handle's centre is logical and the
    // translate is physical, so under right-to-left, where that start edge is
    // the right one, it moves the other way: a single physical translate put
    // the indicator a whole width to the left of the handle there.
    transform: { ':dir(rtl)': 'translateX(50%)', default: 'translateX(-50%)' },
    whiteSpace: 'nowrap',
  },
  indicatorVertical: {
    insetBlockEnd: 'auto',
    insetBlockStart: '50%',
    insetInlineEnd: `calc(100% + ${spacing.md})`,
    insetInlineStart: 'auto',
    transform: 'translateY(-50%)',
  },
  // The corners a part turns to the handle, 2dp against the full ones at
  // its outer end. Which end is which depends on the part and the axis.
  innerBlockEnd: {
    borderEndEndRadius: '2px',
    borderEndStartRadius: '2px',
  },
  innerBlockStart: {
    borderStartEndRadius: '2px',
    borderStartStartRadius: '2px',
  },
  innerInlineEnd: {
    borderEndEndRadius: '2px',
    borderStartEndRadius: '2px',
  },
  innerInlineStart: {
    borderEndStartRadius: '2px',
    borderStartStartRadius: '2px',
  },
  root: {
    inlineSize: '100%',
  },
  // A vertical slider needs a height to run along; this is the one a call
  // site gets without asking, and `style` on the root sets another.
  rootVertical: {
    alignItems: 'flex-start',
    blockSize: '240px',
    inlineSize: 'auto',
  },
  // One part of the track: the strip, centred in the length the handle
  // takes, placed by the insets each part is given. It clips what it holds,
  // which is what keeps a stop beside the handle from showing.
  segment: {
    backgroundColor: {
      default: colors.secondaryContainer,
      [FORCED_COLORS]: 'Canvas',
    },
    blockSize: 'var(--slider-track)',
    // The strip's own edge under forced colours, so the track is still a
    // shape rather than a run of page background. `Canvas` above empties it
    // deliberately: the empty part reads as the outline alone, and `active`
    // fills its share with `Highlight` over the top.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: 'var(--slider-corner)',
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    insetBlockStart: 'calc((var(--slider-handle) - var(--slider-track)) / 2)',
    overflow: 'hidden',
    position: 'absolute',
  },
  segmentVertical: {
    blockSize: 'auto',
    inlineSize: 'var(--slider-track)',
    insetBlockStart: 'auto',
    insetInlineStart: 'calc((var(--slider-handle) - var(--slider-track)) / 2)',
  },
  // A stop: 4dp, centred across the strip, in on secondary container on the
  // inactive part. Its own 4dp is the dot's size rather than the handle's
  // width, which happens to match.
  stop: {
    backgroundColor: {
      default: colors.onSecondaryContainer,
      [FORCED_COLORS]: 'ButtonText',
    },
    blockSize: `${STOP}px`,
    borderRadius: radii.circle,
    inlineSize: `${STOP}px`,
    insetBlockStart: `calc(50% - ${STOP / 2}px)`,
    position: 'absolute',
  },
  // A stop on the active part.
  stopActive: {
    backgroundColor: {
      default: colors.onPrimary,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  stopActiveDisabled: {
    backgroundColor: colors.inverseOnSurface,
  },
  stopDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  // The stops at the track's two ends, the page's gap in from each.
  stopEnd: {
    insetInlineEnd: `${GAP}px`,
  },
  stopEndVertical: {
    insetBlockStart: `${GAP}px`,
    insetInlineEnd: 'auto',
  },
  stopStart: {
    insetInlineStart: `${GAP}px`,
  },
  stopStartVertical: {
    insetBlockEnd: `${GAP}px`,
    insetBlockStart: 'auto',
    insetInlineStart: 'auto',
  },
  stopVertical: {
    insetBlockStart: 'auto',
    insetInlineStart: `calc(50% - ${STOP / 2}px)`,
  },
  // The handle. React Aria places it by percent along the track and centres
  // it on that point; the 50% across the track is this side's, since React
  // Aria only sets the axis the handle moves along. The size and the colour
  // are the page's.
  thumb: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    blockSize: 'var(--slider-handle)',
    // The handle's own edge under forced colours. It is 4dp wide and sits on
    // a filled track, so `Highlight` alone would lose it against the filled
    // part it marks the end of; `ButtonText` around it is what keeps the two
    // apart.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: radii.pill,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    cursor: 'grab',
    inlineSize: `${HANDLE_WIDTH}px`,
    insetBlockStart: '50%',
    outlineColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: '2px',
    outlineStyle: 'none',
    outlineWidth: '2px',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'inline-size, block-size',
    transitionTimingFunction: motion.easingStandard,
  },
  thumbActive: {
    inlineSize: '2px',
  },
  thumbActiveVertical: {
    blockSize: '2px',
    inlineSize: 'var(--slider-handle)',
  },
  thumbDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
    cursor: 'not-allowed',
  },
  thumbDragging: {
    cursor: 'grabbing',
  },
  thumbFocused: {
    outlineStyle: 'solid',
  },
  thumbVertical: {
    blockSize: `${HANDLE_WIDTH}px`,
    inlineSize: 'var(--slider-handle)',
    insetBlockStart: 'auto',
    insetInlineStart: '50%',
  },
  // The strip the handles are placed along: as long across as the handle,
  // so a press anywhere on it lands on the slider.
  track: {
    blockSize: 'var(--slider-handle)',
    boxSizing: 'border-box',
    cursor: 'pointer',
    inlineSize: '100%',
    position: 'relative',
  },
  trackDisabled: {
    cursor: 'not-allowed',
  },
  trackVertical: {
    blockSize: '100%',
    flexGrow: 1,
    inlineSize: 'var(--slider-handle)',
    minBlockSize: 0,
  },
})

// Where each part of the track starts and ends, as insets from the track's
// two ends, and where a stop sits inside a part. Dynamic styles, since the
// percents come from the value at render time and StyleX compiles its
// classes ahead of time; each writes its insets to custom properties inline.
const placements = stylex.create({
  block: (start: string, end: string) => ({
    insetBlockEnd: start,
    insetBlockStart: end,
  }),
  inline: (start: string, end: string) => ({
    insetInlineEnd: end,
    insetInlineStart: start,
  }),
  stopBlock: (offset: string) => ({
    insetBlockEnd: offset,
  }),
  stopInline: (offset: string) => ({
    insetInlineStart: offset,
  }),
})

/** What a track draws besides its parts and handles. */
type Extras = {
  icon: ReactNode
  showStops: boolean
  size: SliderSize
  vertical: boolean
}

/** One end of a part: a fraction of the track's length, and pixels on top. */
type Inset = { fraction: number; px: number }

/**
 * A part of the track, by the insets of its two ends from the track's, and
 * which of the three it is: the inactive part before a range's first handle,
 * the active part, or the inactive part after the last handle.
 */
type Part = {
  active: boolean
  end: Inset
  name: 'active' | 'after' | 'before'
  start: Inset
}

type SliderProps = Omit<RACSliderProps, 'children' | 'orientation'> & {
  /**
   * The page's inset icon, at the start of the active part, from `md` up:
   * the page gives it a size at M, L and XL alone. Drawn for a single
   * handle, and only while the active part has room for it.
   */
  icon?: ReactNode
  /**
   * What the slider sets. A slider that a row labels some other way leaves
   * it out and passes `aria-label` instead.
   */
  label?: string
  /**
   * Along which axis the handle moves. A vertical slider is 240px tall until
   * `style` on the root says otherwise.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * A stop at every step, the page's stops configuration, so the reader can
   * see where the handle can land. Meant for a slider with a handful of
   * steps: each stop is a 4dp dot, and a fine step draws a crowd of them.
   * @default false
   */
  showStops?: boolean
  /**
   * The page's sizes, by the track's thickness: 16dp at `xs`, 24dp at `sm`,
   * 40dp at `md`, 56dp at `lg` and 96dp at `xl`, with the handle 44dp long
   * up to `sm` and 52dp, 68dp and 108dp past it.
   * @default 'xs'
   */
  size?: SliderSize
  /**
   * A name for each handle of a range slider, in order, since two handles
   * named by the same label cannot be told apart.
   */
  thumbLabels?: string[]
}

const AT_END: Inset = { fraction: 0, px: 0 }

// A part's start inset, clear of a handle at `fraction` of the way along. The
// fraction lands on the handle's centre, so half the handle's width joins the
// page's gap to reach its edge.
function after(fraction: number): Inset {
  return { fraction, px: CLEAR }
}

// A part's end inset, clear of a handle at `fraction` of the way along.
function before(fraction: number): Inset {
  return { fraction: 1 - fraction, px: CLEAR }
}

// The container query that hides the inset icon for want of room: the part's
// length along the track, against the icon and its padding at this size.
function iconRoom(size: SliderSize, vertical: boolean) {
  if (vertical) {
    return size === 'xl' ? styles.iconRoomBlockXl : styles.iconRoomBlock
  }
  return size === 'xl' ? styles.iconRoomInlineXl : styles.iconRoomInline
}

// The inset icon, at the foot of the active part, while the part has room.
function insetIcon(
  { icon, size, vertical }: Extras,
  isDisabled: boolean,
): ReactNode {
  const room = iconRoom(size, vertical)
  return (
    <span
      {...stylex.props(
        styles.icon,
        vertical && styles.iconVertical,
        room,
        isDisabled && styles.iconDisabled,
      )}
    >
      {icon}
    </span>
  )
}

function insetOf({ fraction, px }: Inset) {
  return `calc(${fraction * 100}% + ${px}px)`
}

// Where a stop at `fraction` of the way along the track starts inside a part.
// The part's own length is the `100%` the expression has to work from, and
// the track's is that plus both insets, so a fraction of the track is a
// share of the part's length plus their pixels.
function offsetIn({ end, start }: Part, fraction: number) {
  const share = 1 - start.fraction - end.fraction
  const scale = (fraction - start.fraction) / share
  return `calc(${scale} * (100% + ${start.px + end.px}px) - ${start.px + STOP / 2}px)`
}

// What a part holds: a stop at each step inside it, the end stops where it
// reaches the track's ends, and the inset icon.
function partContent(
  part: Part,
  extras: Extras,
  isDisabled: boolean,
  steps: number[],
  hasIcon: boolean,
) {
  const { showStops, vertical } = extras
  const stop = [
    styles.stop,
    vertical && styles.stopVertical,
    part.active && styles.stopActive,
    isDisabled &&
      (part.active ? styles.stopActiveDisabled : styles.stopDisabled),
  ]
  const from = part.start.fraction
  const to = 1 - part.end.fraction
  const length = 1 - part.start.fraction - part.end.fraction
  const inside =
    showStops && length > 0
      ? steps.filter((fraction) => fraction >= from && fraction <= to)
      : []
  const place = vertical ? placements.stopBlock : placements.stopInline
  const atStart = part.start.fraction === 0 && part.start.px === 0
  // The single stop at the inactive end is drawn with or without the stops
  // configuration; the one at the start is the configuration's own.
  const atEnd = part.end.fraction === 0 && part.end.px === 0 && !part.active

  return (
    <>
      {hasIcon ? insetIcon(extras, isDisabled) : null}
      {showStops && atStart ? (
        <span
          {...stylex.props(
            ...stop,
            vertical ? styles.stopStartVertical : styles.stopStart,
          )}
        />
      ) : null}
      {inside.map((fraction) => (
        <span
          key={fraction}
          {...stylex.props(...stop, place(offsetIn(part, fraction)))}
        />
      ))}
      {atEnd ? (
        <span
          {...stylex.props(
            ...stop,
            vertical ? styles.stopEndVertical : styles.stopEnd,
          )}
        />
      ) : null}
    </>
  )
}

/**
 * A slider for one value, or for a range when the value is a pair. The value
 * is React Aria's: pass `value` with `onChange` to control it, or
 * `defaultValue` to let it keep its own, with `minValue`, `maxValue` and
 * `step` to shape it and `formatOptions` to say how it reads. Arrow keys
 * move a handle by a step, Page Up and Page Down by ten, Home and End to
 * the ends.
 *
 * The call site's `className` and `style` land on the slider as a whole,
 * which is the element a layout positions and the one that gives a vertical
 * slider its height.
 */
function Slider({
  icon,
  label,
  orientation = 'horizontal',
  showStops = false,
  size = 'xs',
  thumbLabels,
  ...props
}: RefAttributes<HTMLDivElement> & SliderProps) {
  const vertical = orientation === 'vertical'

  return (
    <RACSlider
      orientation={orientation}
      {...props}
      {...mergeStatefulStyles(
        stylex.props(
          groupStyles.root,
          styles.root,
          sizes[size],
          vertical && styles.rootVertical,
        ),
        props,
      )}
    >
      {label === undefined ? null : (
        <FieldLabel variant="group">{label}</FieldLabel>
      )}
      <SliderTrack
        {...mergeStatefulStyles(
          (state: SliderTrackRenderProps) =>
            stylex.props(
              styles.track,
              vertical && styles.trackVertical,
              state.isDisabled && styles.trackDisabled,
            ),
          {},
        )}
      >
        {trackContent({ icon, showStops, size, vertical }, thumbLabels)}
      </SliderTrack>
    </RACSlider>
  )
}

// The fractions of the way along the track that a step lands on, ends left
// out: those are drawn as the end stops, the page's gap in from each end.
function stepsOf(state: SliderState) {
  const min = state.getThumbMinValue(0)
  const max = state.getThumbMaxValue(state.values.length - 1)
  const fractions: number[] = []
  if (state.step <= 0) {
    return fractions
  }
  for (let index = 1; min + index * state.step < max; index++) {
    fractions.push(state.getValuePercent(min + index * state.step))
  }
  return fractions
}

// What a handle draws: its value while it is dragged or has keyboard focus.
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs.
function thumbContent(index: number, vertical: boolean) {
  return (state: SliderThumbRenderProps) =>
    state.isDragging || state.isFocusVisible ? (
      <SliderOutput
        {...stylex.props(
          styles.indicator,
          vertical && styles.indicatorVertical,
        )}
      >
        {state.state.getThumbValueLabel(index)}
      </SliderOutput>
    ) : null
}

function thumbStyles(vertical: boolean) {
  return (state: SliderThumbRenderProps) =>
    stylex.props(
      styles.thumb,
      vertical && styles.thumbVertical,
      (state.isDragging || state.isFocusVisible) &&
        (vertical ? styles.thumbActiveVertical : styles.thumbActive),
      state.isDragging && styles.thumbDragging,
      state.isFocusVisible && styles.thumbFocused,
      state.isDisabled && styles.thumbDisabled,
    )
}

// The track's parts and handles, from the slider's state: an inactive part
// before the first handle of a range, the active part up to or between the
// handles, and the inactive part after the last one carrying the stop.
function trackContent(extras: Extras, thumbLabels: string[] | undefined) {
  return ({ isDisabled, state }: SliderTrackRenderProps) => {
    const { icon, showStops, size, vertical } = extras
    const fractions = state.values.map((_, index) =>
      state.getThumbPercent(index),
    )
    const first = fractions[0] ?? 0
    const last = fractions.at(-1) ?? 0
    const range = fractions.length > 1
    const parts: Part[] = [
      ...(range
        ? [
            {
              active: false,
              end: before(first),
              name: 'before',
              start: AT_END,
            } as const,
          ]
        : []),
      {
        active: true,
        end: before(last),
        name: 'active',
        start: range ? after(first) : AT_END,
      },
      { active: false, end: AT_END, name: 'after', start: after(last) },
    ]
    const hasIcon =
      icon !== undefined &&
      icon !== null &&
      !range &&
      (size === 'md' || size === 'lg' || size === 'xl')
    const steps = showStops ? stepsOf(state) : []
    const place = vertical ? placements.block : placements.inline
    const innerStart = vertical
      ? styles.innerBlockStart
      : styles.innerInlineStart
    const innerEnd = vertical ? styles.innerBlockEnd : styles.innerInlineEnd

    return (
      <>
        {parts.map((part) => (
          <span
            key={part.name}
            {...stylex.props(
              styles.segment,
              vertical && styles.segmentVertical,
              part.active && styles.active,
              part.active && hasIcon && styles.activeHoldingIcon,
              isDisabled &&
                (part.active ? styles.activeDisabled : styles.inactiveDisabled),
              part.start !== AT_END && innerStart,
              part.end !== AT_END && innerEnd,
              place(insetOf(part.start), insetOf(part.end)),
            )}
          >
            {partContent(
              part,
              extras,
              isDisabled,
              steps,
              part.active && hasIcon,
            )}
          </span>
        ))}
        {fractions.map((_, index) => (
          <SliderThumb
            aria-label={thumbLabels?.[index]}
            index={index}
            // oxlint-disable-next-line react/no-array-index-key -- a handle's position is its identity
            key={index}
            {...mergeStatefulStyles(thumbStyles(vertical), {})}
          >
            {thumbContent(index, vertical)}
          </SliderThumb>
        ))}
      </>
    )
  }
}

export type { SliderProps, SliderSize }

export default Slider
