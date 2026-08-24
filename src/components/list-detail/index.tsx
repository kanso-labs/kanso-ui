import type { ReactNode } from 'react'

import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { media, spacing } from '../../tokens/design.tokens.stylex'

// Material 3's recommended snap widths for a fixed pane. The list is the
// fixed one here — M3 points a fixed pane at "lists with light information
// density" — and the detail pane is the flexible one that absorbs whatever is
// left, which satisfies the spec's rule that every layout carry at least one
// flexible pane.
const LIST_PANE = '360px'
const LIST_PANE_EXTRA_LARGE = '412px'

// One of Material 3's canonical layouts, and the fixed-and-flexible shape of
// its two-pane layouts. Unlike SupportingPane, the detail pane here stands on
// its own: a message, a product, a file. That is what makes showing it
// *instead of* the list a coherent thing to do when only one pane fits, and
// why this layout has to be told which pane is showing while SupportingPane
// does not.
//
// M3 puts the second pane on screen from expanded up. Below that the spec
// shows one pane at a time, with selecting an item swapping to the detail and
// back returning to the list — app navigation rather than layout, which is
// why `showing` is controlled rather than held here.
const styles = stylex.create({
  // Removed rather than visually hidden: `display: none` takes the pane out
  // of the accessibility tree along with the layout, which is what stops a
  // screen reader walking into a pane the window has no room to show.
  hiddenUntilExpanded: {
    display: { default: 'none', [media.expanded]: 'block' },
  },
  pane: {
    boxSizing: 'border-box',
    minInlineSize: 0,
  },
  // minmax(0, 1fr) rather than a bare 1fr: a bare fr track takes an automatic
  // minimum of its content, so one long unbroken string in the detail pane
  // widens the track past its share and pushes the layout sideways.
  //
  // The rules overlap — a 1700px window matches `expanded` as well as
  // `extraLarge` — so which one wins comes down to the
  // order they are emitted in rather than to anything visible here. StyleX
  // settles it, sorting min-width queries ascending however they are written,
  // and the perfectionist lint rule reorders this object independently of
  // that. Neither is worth reading the source to confirm, which is why
  // index.test.tsx measures the resolved columns at every breakpoint.
  root: {
    boxSizing: 'border-box',
    display: 'grid',
    gap: spacing.xl,
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [media.expanded]: `${LIST_PANE} minmax(0, 1fr)`,
      [media.extraLarge]: `${LIST_PANE_EXTRA_LARGE} minmax(0, 1fr)`,
    },
  },
})

type ListDetailProps = {
  /**
   * The selected item's content. Stands on its own, and takes the flexible
   * pane.
   */
  detail?: ReactNode
  /**
   * The items to choose between. Takes the fixed pane — 360px wide, 412px at
   * extra-large.
   */
  list?: ReactNode
  /**
   * Which pane to show while only one fits, below the expanded breakpoint.
   * Both are shown from expanded up, where this is ignored.
   *
   * Controlled, with no uncontrolled fallback: the layout cannot know that an
   * item was selected or that the reader went back, so holding that state
   * here would only ever be wrong.
   * @default 'list'
   */
  showing?: 'detail' | 'list'
} & Omit<useRender.ComponentProps<'div'>, 'children'>

/**
 * Material 3's list-detail layout: a fixed list pane beside a flexible detail
 * pane, collapsing to one pane at a time below the expanded breakpoint.
 *
 * Layout only — neither pane paints a surface of its own, so what goes inside
 * them is composed at the call site. `render` swaps the container's element,
 * for a layout that should be a `<main>` rather than a `<div>`.
 *
 * The panes are written to the DOM in the order they are shown, which is what
 * M3 asks of co-planar panes: focus order has to match the arrangement on
 * screen.
 */
function ListDetail({
  detail,
  list,
  render,
  showing = 'list',
  ...props
}: ListDetailProps) {
  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      children: (
        <>
          <div
            {...stylex.props(
              styles.pane,
              showing === 'detail' && styles.hiddenUntilExpanded,
            )}
          >
            {list}
          </div>
          <div
            {...stylex.props(
              styles.pane,
              showing === 'list' && styles.hiddenUntilExpanded,
            )}
          >
            {detail}
          </div>
        </>
      ),
      ...mergeStyles(stylex.props(styles.root), props),
    },
    render,
  })
}

export type { ListDetailProps }

export default ListDetail
