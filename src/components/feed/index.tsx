import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { spacing } from '../../tokens/design.tokens.stylex'

// Material 3's example minimum for an adaptive grid cell, and the only number
// the spec puts on one. It is a floor rather than a recommendation: how narrow
// a card can get before its contents stop making sense is a property of the
// contents, which is why M3 leaves it a parameter rather than fixing it. Most
// feeds should say what theirs is instead of taking this.
const DEFAULT_MIN_ITEM_WIDTH = '180px'

// The third of Material 3's canonical layouts, after list-detail and
// supporting pane. Where those two divide a page into panes, this arranges one
// pane into a grid of comparable things — the spec's own examples are news and
// social feeds, and a catalogue of cards is the same shape.
//
// M3 describes the grid by its cell rather than by its columns: Compose spells
// it `GridCells.Adaptive(minSize)`, meaning every column is at least that wide
// and the grid fits as many as it can. `repeat(auto-fill, minmax(…, 1fr))` is
// the same sentence in CSS.
//
// So there are no breakpoints here, and that is the point rather than an
// omission. The layout answers to the room it is given instead of to the width
// of the window, which is what lets a feed inside a pane reflow with the pane.
// It also means none of the query emission-order care that ListDetail and
// SupportingPane both have to document applies.
//
// A function style rather than a static one, because the cell minimum comes
// from the call site and StyleX compiles its classes ahead of time. StyleX
// resolves that by writing the value to a custom property inline, which is the
// same mechanism the token gallery's `durationBar` uses.
const styles = stylex.create({
  root: (minItemWidth: string) => ({
    display: 'grid',
    gap: spacing.xl,
    // auto-fill rather than auto-fit, which is what matches M3's own
    // behaviour: Compose lays items into a fixed number of equal columns, so a
    // row holding fewer items than it has room for leaves the remainder empty.
    // auto-fit collapses those empty tracks and stretches what is left, which
    // turns a feed of two into two enormous cards.
    gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
  }),
})

type FeedProps = useRender.ComponentProps<'div'> & {
  /**
   * How narrow a cell may get before the grid drops a column. Every column is
   * at least this wide and the grid fits as many as the space allows, which is
   * how M3 describes an adaptive grid — by its cell rather than by a column
   * count per breakpoint.
   *
   * Worth setting. The default is the figure M3's own example uses, and it is
   * a floor rather than advice: only the contents know how narrow they can go.
   * @default '180px'
   */
  minItemWidth?: string
}

/**
 * Material 3's feed layout: a grid of comparable items that fits as many
 * columns as the space allows, down to a single column when it allows only
 * one.
 *
 * Layout only — it paints no surface, and it gives its children no container
 * of their own, so each child is a grid cell exactly as it was written. That
 * is the difference from ListDetail and SupportingPane, which do wrap: those
 * two divide a page into named regions, where this one lays out however many
 * things it is handed.
 *
 * It reads the space it is in rather than the width of the window, so a feed
 * inside a pane reflows with the pane rather than with the browser.
 */
function Feed({
  minItemWidth = DEFAULT_MIN_ITEM_WIDTH,
  render,
  ...props
}: FeedProps) {
  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      // The dynamic style carries the cell minimum as a custom property in
      // `style` rather than as a class, which is why the merge has to reach
      // `style` as well as `className` — see src/styles/merge.ts.
      ...mergeStyles(stylex.props(styles.root(minItemWidth)), props),
    },
    render,
  })
}

export type { FeedProps }

export default Feed
