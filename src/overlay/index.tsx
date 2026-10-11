import type { ReactNode } from 'react'

import { SeparatorContext } from 'react-aria-components'

// React context crosses the portal an overlay renders through, so what a
// component around the trigger sets for its own children reaches into the
// overlay as well. `Toolbar` sets the one that matters: it turns a
// `Separator` across the bar, and a horizontal rule in a popover opened from
// the bar took that orientation and drew as a vertical rule 0px long, told
// to assistive technology as vertical too. An overlay is a surface of its
// own, so its content starts from none of it, and a `Separator` there falls
// back to its own horizontal default — as one inside React Aria's `Menu`
// already did, since `Menu` provides a separator context of its own.
//
// Empty rather than null, so the separator reads no props from it rather
// than finding no context and looking further out; a module constant, so the
// value is the same object on every render.
const NO_SEPARATOR = {}

/** Clears, for an overlay's content, the contexts that reach it from outside. */
function OverlayScope({ children }: { children: ReactNode }) {
  return <SeparatorContext value={NO_SEPARATOR}>{children}</SeparatorContext>
}

export { OverlayScope }
