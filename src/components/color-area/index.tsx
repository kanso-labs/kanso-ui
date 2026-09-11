import type { CSSProperties } from 'react'
import type { ColorAreaProps as RACColorAreaProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  ColorArea as RACColorArea,
  ColorThumb as RACColorThumb,
} from 'react-aria-components'

import { thumbClassName } from '../../styles/color'
import { mergeStyles } from '../../styles/merge'
import { radii, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// Two channels of a colour at once, as a plane: one runs along the inline
// axis and one along the block axis, and the handle sits where they meet.
// React Aria paints both gradients on the plane's own inline `background`
// and moves the handle in two axes, so what is here is the plane's shape and
// the handle `ColorSlider` already draws, from `src/styles/color.ts`.
//
// The design carries no page for this, so the two choices below are the
// library's own.
//
// **It is square, and takes the width it is given.** A plane has no natural
// size, and a box that was not square would give its two channels unequal
// travel — the same drag would move one further than the other, which is a
// difference a reader cannot see and would feel as the control being wrong.
//
// **It carries no chequer, unlike a swatch or a colour slider's alpha
// track.** Those two show the surface behind them where a colour thins out,
// and a plane does not: React Aria stacks its gradients so the topmost is
// opaque across the whole box, so nothing laid behind the plane is ever
// seen. A chequer here was written first and then taken out, because it
// could not be made to show under any pairing tried — including the RGB
// alpha pairing whose gradient really does carry a `rgba(0, 0, 0, 0)` stop.
//
// **Alpha is a channel here only in RGB, and even there it does not thin
// the plane.** Asked for it in HSL, React Aria draws the saturation and
// lightness plane instead and says nothing — the gradients come out
// identical to the pair it would have drawn anyway. It does not throw the
// way an unknown channel does, so the only sign is a plane that will not
// change, which is why it is written down here.

const styles = stylex.create({
  // The plane React Aria paints the two channels across, filling the square
  // around it.
  area: {
    blockSize: '100%',
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    cursor: 'crosshair',
    inlineSize: '100%',
    touchAction: 'none',
  },
  areaDisabled: {
    cursor: 'not-allowed',
  },
  // The square the plane fills. It is a wrapper rather than the plane
  // itself so the call site has an element to size that React Aria is not
  // also writing a `background` onto.
  ground: {
    aspectRatio: '1',
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    inlineSize: '100%',
  },
  groundDisabled: {
    opacity: stateLayerOpacity.disabledContent,
  },
})

type ColorAreaProps = Omit<
  RACColorAreaProps,
  'children' | 'className' | 'style'
> & {
  /**
   * Lands on the square around the plane, which is the element a layout
   * positions and the one that carries its size.
   */
  className?: string
  /** Lands on the square around the plane, as `className` does. */
  style?: CSSProperties
}

/**
 * Two channels of a colour as a plane, with a handle where they meet. The
 * value is React Aria's: pass `value` with `onChange` to control it, or
 * `defaultValue`, as a CSS colour string or a `Color` from `parseColor`,
 * which this package re-exports.
 *
 * ```tsx
 * <ColorArea
 *   defaultValue="hsl(200, 100%, 50%)"
 *   xChannel="saturation"
 *   yChannel="lightness"
 * />
 * ```
 *
 * **`xChannel` and `yChannel` have to name channels the value's own space
 * has.** A hex or `rgb()` value parses as RGB, which has no saturation, so
 * naming one against it throws rather than converting — pass `colorSpace` to
 * convert it, or give the value in the space you mean to work in. The same
 * trap `ColorSlider` documents.
 *
 * **`alpha` is a channel here only in RGB.** Asked for it in HSL, React Aria
 * quietly draws the saturation and lightness plane instead, so a plane that
 * will not fade is the only sign anything was ignored.
 *
 * React Aria names the handle "Color picker" and announces both channels;
 * pass `aria-label` to say what the plane is for instead.
 *
 * The call site's `className` and `style` land on the square around the
 * plane rather than on the plane itself, so setting an `inlineSize` is what
 * resizes one — and it stays square, since two channels sharing a box want
 * equal travel. React Aria's function forms are not taken here for the same
 * reason `ColorSwatch` does not take them: the element they would read
 * state for is not the one a layout reaches.
 */
function ColorArea({
  className,
  isDisabled = false,
  style,
  ...props
}: ColorAreaProps) {
  return (
    <div
      {...mergeStyles(
        stylex.props(styles.ground, isDisabled && styles.groundDisabled),
        { className, style },
      )}
    >
      <RACColorArea
        isDisabled={isDisabled}
        {...props}
        {...stylex.props(styles.area, isDisabled && styles.areaDisabled)}
      >
        <RACColorThumb className={thumbClassName} />
      </RACColorArea>
    </div>
  )
}

export type { ColorAreaProps }

export default ColorArea
