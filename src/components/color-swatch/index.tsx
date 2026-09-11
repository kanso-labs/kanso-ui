import type { CSSProperties } from 'react'
import type { ColorSwatchProps as RACColorSwatchProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { ColorSwatch as RACColorSwatch } from 'react-aria-components'

import { mergeStyles } from '../../styles/merge'
import { colors, radii } from '../../tokens/design.tokens.stylex'

// A single colour, drawn as a square. The design carries no page for this —
// its colour guidance is about the roles a component takes, not about
// showing a colour as a value — so the shape here is the library's own,
// built from what the rest of it already uses.
//
// Three things follow from that, and each is a choice rather than a reading.
//
// **A swatch is outlined.** Its own colour is the content, so it cannot
// carry a contrasting one — and a white swatch on a light surface, or a
// near-black one in dark mode, would otherwise have no edge at all. The
// outline is the same hairline a field's box takes.
//
// **Transparency is drawn against a chequer rather than against the page.**
// A half-transparent red over a white surface and an opaque pink are the
// same pixels; the chequer is what tells them apart. It is built from two
// surface tokens, so it follows the theme rather than being a fixed grey.
//
// **The chequer is a layer behind the swatch, not a background on it.**
// React Aria sets the colour through the element's own inline
// `background-color`, and CSS paints a background image over a background
// colour rather than under it — so a chequer on the same element would
// cover the colour it is there to reveal.

const SQUARE = '40px'
// 8px squares, which reads as a chequer at a swatch's size without turning
// into a texture. Four gradients draw the two dark squares of a tile, and
// each has to be offset by *half* a tile — at a whole tile the four line up
// and the chequer comes out as diamonds, which is a pattern rather than the
// absence of one.
const TILE = '16px'
const HALF = '8px'
const CHEQUER = `linear-gradient(45deg, ${colors.surfaceContainerHighest} 25%, transparent 25%),
linear-gradient(-45deg, ${colors.surfaceContainerHighest} 25%, transparent 25%),
linear-gradient(45deg, transparent 75%, ${colors.surfaceContainerHighest} 75%),
linear-gradient(-45deg, transparent 75%, ${colors.surfaceContainerHighest} 75%)`

const styles = stylex.create({
  // The layer the chequer is painted on. The swatch sits on top of it, so a
  // colour with alpha shows it through and an opaque one hides it.
  ground: {
    backgroundColor: colors.surfaceContainerLowest,
    backgroundImage: CHEQUER,
    backgroundPosition: `0 0, 0 ${HALF}, ${HALF} -${HALF}, -${HALF} 0`,
    backgroundSize: `${TILE} ${TILE}`,
    blockSize: SQUARE,
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    display: 'inline-block',
    inlineSize: SQUARE,
    overflow: 'hidden',
  },
  // The colour itself. React Aria writes `background-color` inline, so
  // everything here is about the box rather than the fill.
  swatch: {
    blockSize: '100%',
    borderRadius: radii.xs,
    boxShadow: `inset 0 0 0 1px ${colors.outlineVariant}`,
    boxSizing: 'border-box',
    display: 'block',
    inlineSize: '100%',
  },
})

type ColorSwatchProps = Omit<RACColorSwatchProps, 'className' | 'style'> & {
  /**
   * Lands on the square around the swatch, which is the element a layout
   * positions and the one that carries its size.
   */
  className?: string
  /** Lands on the square around the swatch, as `className` does. */
  style?: CSSProperties
}

/**
 * A colour shown as a value: a square of it, with a chequer behind so
 * transparency reads as transparency. The colour is React Aria's — a CSS
 * string, or a `Color` from `parseColor`, which this package re-exports.
 *
 * ```tsx
 * import { parseColor } from '@kanso-labs/kanso-ui'
 *
 * <ColorSwatch color={parseColor('hsla(200, 100%, 50%, 0.4)')} />
 * ```
 *
 * React Aria names it from the colour itself — "light vibrant cyan blue, 60%
 * transparent" — so it needs no label. Pass `colorName` to say something
 * else instead.
 *
 * The call site's `className` and `style` land on the square around the
 * swatch rather than on the swatch itself, which is what makes setting a
 * size from outside work — the colour fills whatever square it is given.
 * React Aria's function forms are not taken here, since a swatch has no
 * interactive state for one to read.
 */
function ColorSwatch({ className, style, ...props }: ColorSwatchProps) {
  return (
    <span {...mergeStyles(stylex.props(styles.ground), { className, style })}>
      <RACColorSwatch {...props} {...stylex.props(styles.swatch)} />
    </span>
  )
}

export type { ColorSwatchProps }

export default ColorSwatch
