import type { StyleXStyles } from '@stylexjs/stylex'

import { createContext } from 'react'

// What a component drawing a colour swatch can say about the square it draws.
// Apart from the swatch itself for the reason src/badge gives: a module of its
// own rather than a part of the one place that uses it, since the swatch
// imports it and that place imports the swatch.

/**
 * A style laid over a swatch's square by what the swatch is drawn in, after
 * the square's own, so it can size the square. A colour picker's trigger draws
 * its swatch at the 24dp of the label's line rather than the 40dp a swatch
 * takes on its own.
 *
 * A context rather than the swatch's `className`, which is the call site's:
 * a class from inside the library is a second StyleX call, and which of two
 * calls setting the same property wins depends on where their rules land in
 * the stylesheet rather than on the order the classes are written in. The
 * trigger's 24px lost to the swatch's 40px that way. Laid over inside the
 * swatch's own `stylex.props`, the later style wins by StyleX's own rule.
 */
const SwatchSquareContext = createContext<null | StyleXStyles>(null)

export { SwatchSquareContext }
