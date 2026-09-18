import type {
  SliderProps as RACSliderProps,
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

// The sliders page, at the size its tokens call extra-small: a 16dp track
// with an 8dp corner, the active part in primary and the inactive part in
// secondary container, a 4dp stop in on secondary container 6dp from the
// inactive end, and a handle 4dp wide and 44dp tall in primary that narrows
// to 2dp while pressed or focused. The track parts on each side of the
// handle, with 6dp of space between them and it, and their corners
// against the handle are 2dp where their outer ends are full. Disabled, the
// active part and the handle are on surface at the disabled content opacity
// and the inactive part at the disabled container opacity.
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
// The sliders page's own measurements, which are constants of the component
// rather than steps of the consumer's spacing scale. `clearOf` below read the
// gap off `spacing.sm` — true at its default 8, since 6 plus half the handle
// comes to the same — so a theme moving that step opened the gap beside the
// handle while the stop, written as the literal it is, stayed where the page
// puts it.
const HANDLE_GAP = '6px'
const HANDLE_WIDTH = '4px'

const styles = stylex.create({
  active: {
    backgroundColor: colors.primary,
  },
  activeDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
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
    transform: 'translateX(-50%)',
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
  // One part of the track: the 16dp strip, centred in the 44dp the handle
  // takes, placed by the insets each part is given.
  segment: {
    backgroundColor: colors.secondaryContainer,
    blockSize: '16px',
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    insetBlockStart: '14px',
    position: 'absolute',
  },
  segmentVertical: {
    blockSize: 'auto',
    inlineSize: '16px',
    insetBlockStart: 'auto',
    insetInlineStart: '14px',
  },
  // The stop at the inactive end: 4dp, the page's gap in from that end and
  // centred across the strip, which is that same gap on both axes. Its own
  // 4dp is the dot's size rather than the handle's width, which happens to
  // match.
  stop: {
    backgroundColor: colors.onSecondaryContainer,
    blockSize: '4px',
    borderRadius: radii.circle,
    inlineSize: '4px',
    insetBlockStart: HANDLE_GAP,
    insetInlineEnd: HANDLE_GAP,
    position: 'absolute',
  },
  stopDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  stopVertical: {
    insetBlockStart: HANDLE_GAP,
    insetInlineEnd: 'auto',
    insetInlineStart: HANDLE_GAP,
  },
  // The handle. React Aria places it by percent along the track and centres
  // it on that point; the 50% across the track is this side's, since React
  // Aria only sets the axis the handle moves along. The size and the colour
  // are the page's.
  thumb: {
    backgroundColor: colors.primary,
    blockSize: '44px',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    cursor: 'grab',
    inlineSize: HANDLE_WIDTH,
    insetBlockStart: '50%',
    outlineColor: colors.primary,
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
    inlineSize: '44px',
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
    blockSize: '4px',
    inlineSize: '44px',
    insetBlockStart: 'auto',
    insetInlineStart: '50%',
  },
  // The strip the handles are placed along: as tall as the handle, so a
  // press anywhere on it lands on the slider.
  track: {
    blockSize: '44px',
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
    inlineSize: '44px',
    minBlockSize: 0,
  },
})

// Where each part of the track starts and ends, as insets from the track's
// two ends: a percent of the way along, plus the 6dp of space and half the
// handle's 4dp that keep it clear of the handle. Dynamic styles, since the
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
})

type SliderProps = Omit<RACSliderProps, 'children' | 'orientation'> & {
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
   * A name for each handle of a range slider, in order, since two handles
   * named by the same label cannot be told apart.
   */
  thumbLabels?: string[]
}

// The inset of a part's end from the track's end, clear of the handle at
// `percent` of the way along. The percentage lands on the handle's centre,
// so half the handle's width joins the page's gap to reach its edge.
function clearOf(percent: number, fromEnd: boolean) {
  const along = fromEnd ? 100 - percent : percent
  return `calc(${along}% + ${HANDLE_GAP} + ${HANDLE_WIDTH} / 2)`
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
  label,
  orientation = 'horizontal',
  thumbLabels,
  ...props
}: SliderProps) {
  const vertical = orientation === 'vertical'

  return (
    <RACSlider
      orientation={orientation}
      {...props}
      {...mergeStatefulStyles(
        stylex.props(
          groupStyles.root,
          styles.root,
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
        {trackContent(vertical, thumbLabels)}
      </SliderTrack>
    </RACSlider>
  )
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
function trackContent(vertical: boolean, thumbLabels: string[] | undefined) {
  return ({ isDisabled, state }: SliderTrackRenderProps) => {
    const percents = state.values.map(
      (_, index) => state.getThumbPercent(index) * 100,
    )
    const first = percents[0] ?? 0
    const last = percents.at(-1) ?? 0
    const range = percents.length > 1
    const place = vertical ? placements.block : placements.inline
    const innerStart = vertical
      ? styles.innerBlockStart
      : styles.innerInlineStart
    const innerEnd = vertical ? styles.innerBlockEnd : styles.innerInlineEnd

    return (
      <>
        {range ? (
          <span
            {...stylex.props(
              styles.segment,
              vertical && styles.segmentVertical,
              isDisabled && styles.inactiveDisabled,
              innerEnd,
              place('0px', clearOf(first, true)),
            )}
          />
        ) : null}
        <span
          {...stylex.props(
            styles.segment,
            vertical && styles.segmentVertical,
            styles.active,
            isDisabled && styles.activeDisabled,
            range && innerStart,
            innerEnd,
            place(range ? clearOf(first, false) : '0px', clearOf(last, true)),
          )}
        />
        <span
          {...stylex.props(
            styles.segment,
            vertical && styles.segmentVertical,
            isDisabled && styles.inactiveDisabled,
            innerStart,
            place(clearOf(last, false), '0px'),
          )}
        >
          <span
            {...stylex.props(
              styles.stop,
              vertical && styles.stopVertical,
              isDisabled && styles.stopDisabled,
            )}
          />
        </span>
        {percents.map((_, index) => (
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

export type { SliderProps }

export default Slider
