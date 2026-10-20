'use client'

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { container, spacing } from '../../tokens/design.tokens.stylex'

// Material Design's recommended snap widths for a fixed pane. The list is the
// fixed one here — Material Design points a fixed pane at "lists with light
// information density" — and the detail pane is the flexible one that absorbs
// whatever is left, which satisfies the spec's rule that every layout carry at
// least one flexible pane.
const LIST_PANE = '360px'
const LIST_PANE_EXTRA_LARGE = '412px'

// One of Material Design's canonical layouts, and the fixed-and-flexible shape
// of its two-pane layouts. Unlike SupportingPane, the detail pane here stands
// on its own: a message, a product, a file. That is what makes showing it
// *instead of* the list a coherent thing to do when only one pane fits, and
// why this layout has to be told which pane is showing while SupportingPane
// does not.
//
// Material Design puts the second pane on screen from expanded up. Below that
// the spec shows one pane at a time, with selecting an item swapping to the
// detail and back returning to the list — app navigation rather than layout,
// which is why `showing` is controlled rather than held here.
//
// **The breakpoints are the layout's own width, not the window's.** The root
// is a query container, and both panes ask it through `container` rather than
// `media`: a list-detail beside a navigation drawer, or inside a sheet, has
// less room than the window, and laying two panes out by the window's width
// squeezed the detail to a sliver. The thresholds are still Material Design's
// window size classes, compared against the room the layout is given.
//
// That is also why the root is a flex row rather than a grid. A container
// query reaches the container's descendants and never the container itself,
// so the root cannot change its own tracks by its width; the panes size
// themselves instead.
const styles = stylex.create({
  // The fixed pane, at Material Design's snap widths from expanded up, and
  // the whole row below that, where it is the only pane on screen.
  //
  // The rules overlap — a 1700px layout matches `expanded` as well as
  // `extraLarge` — so which one wins comes down to the order they are emitted
  // in rather than to anything visible here. StyleX settles it, sorting
  // min-width queries ascending however they are written, and the
  // perfectionist lint rule reorders this object independently of that.
  // Neither is worth reading the source to confirm, which is why
  // index.test.tsx measures the panes at every breakpoint.
  fixed: {
    flexBasis: {
      [container.expanded]: LIST_PANE,
      [container.extraLarge]: LIST_PANE_EXTRA_LARGE,
      default: 0,
    },
    flexGrow: { [container.expanded]: 0, default: 1 },
    flexShrink: { [container.expanded]: 0, default: 1 },
  },
  // The flexible pane, which absorbs whatever the fixed one leaves. A zero
  // basis with a zero minimum rather than an automatic one: a flex item's
  // automatic minimum is its content, so one long unbroken string in the
  // detail pane would widen it past its share and push the layout sideways.
  flexible: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  // Removed rather than visually hidden: `display: none` takes the pane out
  // of the accessibility tree along with the layout, which is what stops a
  // screen reader walking into a pane there is no room to show.
  //
  // It takes focus with it. The pane stays in the document, but a focused
  // element inside one that has just been hidden is blurred, and focus is on
  // the body by the next frame — so the Tab after a swap starts from the top
  // of the page. Moving it belongs to whoever flipped `showing`; see the
  // prop.
  hiddenUntilExpanded: {
    display: { [container.expanded]: 'block', default: 'none' },
  },
  pane: {
    boxSizing: 'border-box',
    minInlineSize: 0,
  },
  // `inline-size` containment, so the root's width comes from its parent and
  // never from the panes: a container sized by what it holds could not then
  // size what it holds by itself.
  root: {
    boxSizing: 'border-box',
    containerType: 'inline-size',
    display: 'flex',
    gap: spacing.xl,
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
   * Which pane to show while only one fits, while the layout is narrower than
   * the expanded breakpoint. Both are shown once it is that wide, where this
   * is ignored. The width is the layout's own rather than the window's.
   *
   * Controlled, with no uncontrolled fallback: the layout cannot know that an
   * item was selected or that the reader went back, so holding that state
   * here would only ever be wrong.
   *
   * **Moving focus into the revealed pane comes with flipping this.** The
   * pane being left is hidden outright, so a keyboard or screen reader inside
   * it lands on the body and the next Tab starts from the top of the page.
   * The same reason this prop is controlled is why the move is not made here:
   * only the call site knows whether a key, a pointer or the history put it
   * in that state, and what inside the pane to send focus to. Both panes hold
   * nodes it supplied, so it has something to aim at — a heading given
   * `tabIndex={-1}`, or a ref it already holds.
   * @default 'list'
   */
  showing?: 'detail' | 'list'
} & Omit<RenderComponentProps<'div'>, 'children'>

/**
 * Material Design's list-detail layout: a fixed list pane beside a flexible
 * detail pane, collapsing to one pane at a time below the expanded breakpoint.
 *
 * The breakpoints are compared against the layout's own width, not the
 * window's, so a list-detail beside a navigation drawer or inside a sheet
 * shows one pane until it has the room for two. It takes that width from
 * its parent and none from its panes, so in a parent that shrinks to fit
 * what it holds — an inline-flex row, a float, a flex item with no basis —
 * give it a width of its own.
 *
 * Layout only — neither pane paints a surface of its own, so what goes inside
 * them is composed at the call site. `render` swaps the container's element,
 * for a layout that should be a `<main>` rather than a `<div>`.
 *
 * The panes are written to the DOM in the order they are shown, which is what
 * Material Design asks of co-planar panes: focus order has to match the
 * arrangement on screen.
 *
 * While only one pane fits, the pane that is not showing is hidden
 * outright, so focus inside it is dropped when `showing` changes. The call
 * site that changed it is what puts focus in the pane it revealed — see the
 * prop.
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
              styles.fixed,
              showing === 'detail' && styles.hiddenUntilExpanded,
            )}
          >
            {list}
          </div>
          <div
            {...stylex.props(
              styles.pane,
              styles.flexible,
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
