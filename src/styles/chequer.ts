import * as stylex from '@stylexjs/stylex'

import { colors } from '../tokens/design.tokens.stylex'

// The chequer a transparent colour is drawn against. A half-transparent red
// over a light surface and an opaque pink are the same pixels; this is what
// tells them apart, behind a swatch and behind a colour slider's alpha
// track.
//
// In `src/styles` rather than either component, since both draw it and a
// second copy would be a second density to keep in step.
//
// Two things about the recipe are worth knowing before touching it.
//
// **The offsets are half a tile, not a whole one.** Four gradients draw the
// two dark squares of a tile, and at a whole tile all four line up — the
// pattern comes out as diamonds, which reads as a texture rather than as
// the absence of a colour.
//
// **It is a layer behind, never a background on the coloured element.**
// React Aria writes a swatch's colour to its own inline `background-color`
// and a colour track's gradient to its inline `background`, and CSS paints a
// background image over a background colour rather than under it — so a
// chequer on that element would cover what it is there to reveal.

// 8px squares, which reads as a chequer at a swatch's size without turning
// into a texture.
const TILE = '16px'
const HALF = '8px'
const GRADIENTS = `linear-gradient(45deg, ${colors.surfaceContainerHighest} 25%, transparent 25%),
linear-gradient(-45deg, ${colors.surfaceContainerHighest} 25%, transparent 25%),
linear-gradient(45deg, transparent 75%, ${colors.surfaceContainerHighest} 75%),
linear-gradient(-45deg, transparent 75%, ${colors.surfaceContainerHighest} 75%)`

const chequer = stylex.create({
  ground: {
    backgroundColor: colors.surfaceContainerLowest,
    backgroundImage: GRADIENTS,
    backgroundPosition: `0 0, 0 ${HALF}, ${HALF} -${HALF}, -${HALF} 0`,
    backgroundSize: `${TILE} ${TILE}`,
  },
})

export { chequer }
