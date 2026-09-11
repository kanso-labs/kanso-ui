import type { ColorSliderProps as RACColorSliderProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  ColorSlider as RACColorSlider,
  ColorThumb as RACColorThumb,
  SliderOutput as RACSliderOutput,
  SliderTrack as RACSliderTrack,
} from 'react-aria-components'

import { FieldLabel } from '../../field'
import { chequer } from '../../styles/chequer'
import { thumbClassName } from '../../styles/color'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The sliders page's track, carrying one channel of a colour instead of an
// active and an inactive part: the page's 16dp strip with its 8dp corner,
// centred in the 44dp a handle takes, and the same label-large label above
// it. React Aria paints the gradient itself, on the track's own inline
// `background`, so what runs along the strip is the channel rather than
// anything chosen here.
//
// Three things depart from the page, each because a colour slider shows a
// value the page's slider does not have.
//
// **The handle is a circle carrying the colour, not the page's 4dp bar.**
// The page's handle is a mark on a track whose colour it already knows; this
// one has to show the value it sits on, and 4dp of a colour is not a colour
// anyone can read. It keeps the page's 44dp of height as the target it is
// centred in.
//
// **The handle is ringed rather than filled with primary.** Its fill is the
// value, so the ring is what has to read against it — and against every
// other colour the track runs through. It is a surface-coloured ring with a
// hairline outside it, which reads on a light track and a dark one alike.
//
// **There is no stop at the inactive end.** The page puts one 6dp from the
// end of the inactive part; a channel has no inactive part, so there is no
// end for it to mark.
//
// The alpha channel is the one that needs a chequer, for the reason
// `src/styles/chequer.ts` gives: a track fading to transparent over a light
// surface and one fading to white are the same pixels without it.

const styles = stylex.create({
  label: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  // The value React Aria announces, shown. Body-small in the muted role, so
  // it reads as a readout beside the label rather than as a second label.
  output: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
    marginInlineStart: 'auto',
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    inlineSize: '100%',
  },
  // The label and the readout on one line, which is what puts the value at
  // the far end of the row rather than under it.
  row: {
    alignItems: 'baseline',
    display: 'flex',
    gap: spacing.sm,
  },
  // The strip React Aria paints the channel across, filling the shape
  // around it. The `::before` is what keeps the page's 44dp press target
  // while the strip itself stays the page's 16dp: a transparent box reaching
  // 14dp above and below, which takes the press because a pseudo-element is
  // part of the element it belongs to.
  track: {
    '::before': {
      content: '""',
      insetBlock: '-14px',
      insetInline: 0,
      position: 'absolute',
    },
    blockSize: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    inlineSize: '100%',
    position: 'relative',
  },
  trackDisabled: {
    cursor: 'not-allowed',
  },
  trackGround: {
    blockSize: '16px',
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    inlineSize: '100%',
    marginBlock: '14px',
  },
  // The 16dp strip's shape, and the chequer the alpha channel is read
  // against. The track sits inside it rather than over a chequer of its own,
  // since React Aria paints the gradient on the track's inline `background`
  // and anything drawn on the track would cover it.
  // Disabled, the strip alone fades. The label and the readout keep their
  // colour: dropping a whole slider's opacity takes the text down with it,
  // and 12% of a label is 1.2:1 against the surface — which axe fails, and
  // rightly, since a disabled control still has to be readable.
  trackGroundDisabled: {
    opacity: stateLayerOpacity.disabledContent,
  },
})

type ColorSliderProps = Omit<
  RACColorSliderProps,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the slider's render state. */
  className?: RACColorSliderProps['className']
  /** What the slider is for. Always rendered; React Aria names the channel otherwise. */
  label?: string
  /**
   * Whether the value React Aria announces is also shown, at the end of the
   * label's line.
   * @default true
   */
  showValue?: boolean
  /** A function may compute the style from the slider's render state. */
  style?: RACColorSliderProps['style']
}

/**
 * A slider over one channel of a colour — hue, saturation, lightness, alpha
 * and the rest. The value is React Aria's: pass `value` with `onChange` to
 * control it, or `defaultValue`, as a CSS colour string or a `Color` from
 * `parseColor`, which this package re-exports.
 *
 * ```tsx
 * <ColorSlider channel="hue" defaultValue="hsl(200, 100%, 50%)" label="Label" />
 * ```
 *
 * **`channel` has to name a channel the value's own space has.** A hex or
 * `rgb()` value parses as RGB, which has no hue, so `channel="hue"` against
 * one throws rather than converting — pass `colorSpace="hsl"` to convert it,
 * or give the value in the space you mean to slide.
 *
 * React Aria paints the gradient and names the value — "200°, cyan blue" —
 * so the readout beside the label is what it announces.
 *
 * The call site's `className` and `style` land on the slider as a whole,
 * which is the element a layout positions.
 */
function ColorSlider({
  isDisabled = false,
  label,
  showValue = true,
  ...props
}: ColorSliderProps) {
  return (
    <RACColorSlider
      isDisabled={isDisabled}
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.root), props)}
    >
      <div {...stylex.props(styles.row)}>
        {label === undefined ? null : (
          <FieldLabel {...stylex.props(styles.label)}>{label}</FieldLabel>
        )}
        {showValue ? (
          <RACSliderOutput {...stylex.props(styles.output)} />
        ) : null}
      </div>
      <div
        {...stylex.props(
          chequer.ground,
          styles.trackGround,
          isDisabled && styles.trackGroundDisabled,
        )}
      >
        <RACSliderTrack
          {...stylex.props(styles.track, isDisabled && styles.trackDisabled)}
        >
          <RACColorThumb className={thumbClassName} />
        </RACSliderTrack>
      </div>
    </RACColorSlider>
  )
}

export type { ColorSliderProps }

export default ColorSlider
