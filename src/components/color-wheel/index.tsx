import type { ColorWheelProps as RACColorWheelProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  ColorThumb as RACColorThumb,
  ColorWheel as RACColorWheel,
  ColorWheelTrack as RACColorWheelTrack,
} from 'react-aria-components'

import { thumbClassName } from '../../styles/color'
import { mergeStyles } from '../../styles/merge'
import { stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// Hue as a ring. React Aria paints the conic gradient on the track's own
// inline `background` and sizes it from `outerRadius`, so what is here is
// the hole in the middle and the handle `ColorSlider` already draws, from
// `src/styles/color.ts`.
//
// The design carries no page for this. Three things follow, each a choice
// rather than a reading.
//
// **The ring's thickness is the sliders page's 16dp track.** A hue wheel and
// a hue slider are the same control in two shapes, so the band a reader
// drags along is the same width in both.
//
// **The thickness is a prop and the inner radius is not.** React Aria takes
// both radii and would accept an inner one larger than the outer, which
// draws nothing at all; deriving it is what stops the two disagreeing.
//
// **The hole is cut with a mask, not drawn with a disc on top.** A disc in
// the wheel's own surface colour would be opaque, so anything the wheel is
// placed over — a card, a photograph, another control — would be hidden by
// a circle nothing explains. The mask leaves the middle genuinely empty,
// which is also what lets a swatch or an area sit inside one.

const DEFAULT_OUTER_RADIUS = 100
// The sliders page's track, which is what a hue slider draws.
const DEFAULT_THICKNESS = 16

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'inline-block',
    lineHeight: 0,
  },
  rootDisabled: {
    opacity: stateLayerOpacity.disabledContent,
  },
  track: {
    cursor: 'pointer',
  },
  trackDisabled: {
    cursor: 'not-allowed',
  },
  // The hole. A hard stop at the inner radius would alias into a stepped
  // edge, so the two stops sit half a pixel either side of it — the same
  // trick a circle drawn with a gradient needs anywhere.
  //
  // The inner stop is clamped at zero as well as the radius itself. A
  // negative length in a gradient is invalid CSS, so the browser drops the
  // whole declaration rather than the one stop — a band wider than the
  // wheel would take the mask with it and the hole would come back.
  trackRing: (inner: number) => ({
    maskImage: `radial-gradient(circle at center, transparent ${Math.max(0, inner - 0.5)}px, #000 ${inner + 0.5}px)`,
  }),
})

type ColorWheelProps = Omit<
  RACColorWheelProps,
  'children' | 'className' | 'innerRadius' | 'outerRadius' | 'style'
> & {
  /** A function may compute the class from the wheel's render state. */
  className?: string
  /**
   * How far the ring reaches from the centre, in pixels. The wheel is twice
   * this across.
   * @default 100
   */
  outerRadius?: number
  /** Lands on the wheel, as `className` does. */
  style?: React.CSSProperties
  /**
   * How wide the band is, in pixels. The inner radius is this in from
   * `outerRadius`, so the two cannot disagree.
   * @default 16
   */
  thickness?: number
}

/**
 * Hue as a ring, with a handle on it. The value is React Aria's: pass
 * `value` with `onChange` to control it, or `defaultValue`, as a CSS colour
 * string or a `Color` from `parseColor`, which this package re-exports.
 *
 * ```tsx
 * <ColorWheel defaultValue="hsl(200, 100%, 50%)" />
 * ```
 *
 * A wheel slides hue and nothing else, so unlike `ColorSlider` and
 * `ColorArea` it names no channel and there is no space for one to be
 * missing from — a hex value works here.
 *
 * The middle is genuinely empty rather than filled, so a `ColorArea` or a
 * `ColorSwatch` can sit inside one. React Aria names the handle "Hue" and
 * announces the value; pass `aria-label` to say something else.
 *
 * The call site's `className` and `style` land on the wheel, which is the
 * element a layout positions. Its size comes from `outerRadius`.
 */
function ColorWheel({
  className,
  isDisabled = false,
  outerRadius = DEFAULT_OUTER_RADIUS,
  style,
  thickness = DEFAULT_THICKNESS,
  ...props
}: ColorWheelProps) {
  const innerRadius = Math.max(0, outerRadius - thickness)

  return (
    <RACColorWheel
      innerRadius={innerRadius}
      isDisabled={isDisabled}
      outerRadius={outerRadius}
      {...props}
      {...mergeStyles(
        stylex.props(styles.root, isDisabled && styles.rootDisabled),
        { className, style },
      )}
    >
      <RACColorWheelTrack
        {...stylex.props(
          styles.track,
          styles.trackRing(innerRadius),
          isDisabled && styles.trackDisabled,
        )}
      />
      <RACColorThumb className={thumbClassName} />
    </RACColorWheel>
  )
}

export type { ColorWheelProps }

export default ColorWheel
