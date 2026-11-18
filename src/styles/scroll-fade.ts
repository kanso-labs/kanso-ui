import * as stylex from '@stylexjs/stylex'

import { spacing } from '../tokens/design.tokens.stylex'

// The fade on the edge of something that scrolls sideways, while there is
// more of it past that edge. A bar or a table cut off at its edge leaves the
// cut-off part looking like the whole: a tab clipped to "…d item", a column
// that is simply not there until the reader happens to scroll. Fading the
// edge is what says there is more.
//
// A mask rather than a gradient laid over the content, so it fades whatever
// is underneath to whatever is behind it — a tab's label and its state
// layer, a table's cells and their rules — without knowing either colour.
// Only an edge that has something past it fades, so a box scrolled to its
// start keeps a hard start edge, and one whose content fits keeps both: the
// edges come from `useScrollEdges` in src/hooks, measured from the scroll
// position.
//
// Material Design gives a scrolling bar no such treatment, so the length is
// the library's own: 32dp, the spacing scale's step wide enough to take the
// last letters of a label down to nothing while the rest of it still reads.
//
// A gradient's direction is physical, so each one is written for both
// writing directions, `:dir(rtl)` turning the start fade from the left edge
// to the right one.
const LENGTH = spacing.xxl

// Opaque from the fade's length in: the mask keeps what lies under black and
// drops what lies under transparent. Spelled out per direction, since the
// StyleX compiler evaluates a template but not a call.
const FROM_LEFT = `linear-gradient(to right, transparent, #000 ${LENGTH})`
const FROM_RIGHT = `linear-gradient(to left, transparent, #000 ${LENGTH})`
const BOTH = `linear-gradient(to right, transparent, #000 ${LENGTH}, #000 calc(100% - ${LENGTH}), transparent)`

const scrollFade = stylex.create({
  both: {
    maskImage: BOTH,
  },
  end: {
    maskImage: { ':dir(rtl)': FROM_LEFT, default: FROM_RIGHT },
  },
  start: {
    maskImage: { ':dir(rtl)': FROM_RIGHT, default: FROM_LEFT },
  },
})

/**
 * The fade for a box with something past its start edge, its end edge, or
 * both, as `useScrollEdges` reports them: `false` where neither has.
 */
function scrollFadeOf(edges: { end: boolean; start: boolean }) {
  if (edges.start && edges.end) {
    return scrollFade.both
  }
  if (edges.start) {
    return scrollFade.start
  }
  if (edges.end) {
    return scrollFade.end
  }
  return false
}

export { scrollFade, scrollFadeOf }
