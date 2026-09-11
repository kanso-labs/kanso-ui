import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { media, spacing } from '../../tokens/design.tokens.stylex'

// One of Material Design's canonical layouts. The supporting pane holds
// content that only means anything next to the main pane — reviewer comments,
// related items, a tool panel — which is what separates it from list-detail,
// where the second pane stands on its own.
//
// The canonical layout page gives this layout two shapes across the
// breakpoints, and both are reachable in CSS because neither depends on what
// the reader selected: stacked at compact and medium, and from expanded up the
// supporting pane beside the main one at a fixed 360, with the main pane
// taking the rest. Stacking is Material Design's "reflow" strategy, where the
// supporting pane moves under the main one rather than being dismissed. The
// page's other compact option is a bottom sheet, which is a different
// component's job — reach for Sheet at the call site when the supporting
// content should be summoned rather than scrolled to.
//
// **Which side the supporting pane takes is an expanded-window choice, and
// only that.** The page gives two rules: below the focus pane in medium
// windows and under, and "on the leading or trailing side of the focus pane"
// from expanded up. So `placement` moves the pane beside the main one and
// leaves the stacked shape alone — stacked, the supporting pane is under the
// main one either way.
//
// **A leading pane is placed with grid columns rather than by reordering the
// DOM, and that is a departure worth naming.** The page also asks that focus
// order match the arrangement on screen for co-planar panes, and no single
// DOM order satisfies both of its rules: a supporting pane written first
// reads left of the main one at expanded, as leading should, but then sits
// above it when the layout stacks — which is the one thing the page says it
// should not do. Whichever way it is written, one breakpoint has focus order
// crossing the visual order.
//
// The main pane stays first in the DOM, so the break lands at expanded and
// not on a phone. Side by side, a keyboard reaches the main pane before the
// supporting one that is drawn to its left, which is an odd half-second with
// both panes in view; stacked the other way round, a reader meets content
// that "only means anything next to the main pane" before reaching the pane
// it is talking about. The second is worse, and it is the case the page
// rules on explicitly.
const styles = stylex.create({
  // Each pane is wrapped rather than dropped straight into the grid. Handed
  // bare content, the grid makes anonymous items out of whatever it finds, so
  // a pane holding a fragment of a heading and a paragraph would become two
  // tracks instead of one and the proportions below would silently stop
  // meaning anything.
  //
  // minInlineSize: 0 lets a pane shrink under its content, which is the same
  // reason the tracks are minmax(0, Nfr) rather than a bare Nfr.
  pane: {
    boxSizing: 'border-box',
    minInlineSize: 0,
  },
  paneLeadingSupporting: {
    gridColumn: { default: 'auto', [media.expanded]: 1 },
    gridRow: { default: 'auto', [media.expanded]: 1 },
  },
  // minmax(0, 1fr) rather than a bare 1fr: a bare fr track takes an automatic
  // minimum of its content, so one long unbroken string inside the main pane
  // widens the track past its share and pushes the supporting pane off the
  // edge. The supporting pane's 360 is the page's, fixed rather than a share,
  // so it is the main pane that gives when the window narrows.
  root: {
    boxSizing: 'border-box',
    display: 'grid',
    gap: spacing.xl,
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [media.expanded]: 'minmax(0, 1fr) 360px',
    },
  },
  // Leading: the fixed track comes first, and the supporting pane alone is
  // placed, since the DOM order is the trailing one. Placing it pulls the
  // main pane into the only cell left, so the main pane needs nothing.
  //
  // The row is pinned as well as the column. Given only a column, grid's
  // auto-placement puts the pane on a row of its own — the cursor has
  // already passed row one by the time it reaches the second item.
  rootLeading: {
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [media.expanded]: '360px minmax(0, 1fr)',
    },
  },
})

type SupportingPaneProps = Omit<RenderComponentProps<'div'>, 'children'> & {
  /**
   * The primary content. Takes whatever width the supporting pane leaves from
   * expanded up.
   */
  main?: ReactNode
  /**
   * Which side of the main pane the supporting one takes from expanded up.
   * Below the medium breakpoint the layout stacks either way, with the
   * supporting pane under the main one.
   * @default 'trailing'
   */
  placement?: 'leading' | 'trailing'
  /**
   * Content that only means something beside `main`. Sits below it at compact
   * and medium, and beside it at a fixed 360px from expanded up.
   */
  supporting?: ReactNode
}

/**
 * Material Design's supporting pane layout: a main pane and a companion that
 * reflows underneath it when there is no room beside it.
 *
 * Layout only — neither pane paints a surface or a border of its own, so what
 * goes in them is composed at the call site out of Cards, lists, or plain
 * content. `render` swaps the container's element, for a layout that should
 * be a `<main>` rather than a `<div>`.
 *
 * The panes are written to the DOM in the order they are shown, which is what
 * Material Design asks of co-planar panes: focus order has to match the
 * arrangement on screen.
 */
function SupportingPane({
  main,
  placement = 'trailing',
  render,
  supporting,
  ...props
}: SupportingPaneProps) {
  const leading = placement === 'leading'

  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      children: (
        <>
          <div {...stylex.props(styles.pane)}>{main}</div>
          <div
            {...stylex.props(
              styles.pane,
              leading && styles.paneLeadingSupporting,
            )}
          >
            {supporting}
          </div>
        </>
      ),
      ...mergeStyles(
        stylex.props(styles.root, leading && styles.rootLeading),
        props,
      ),
    },
    render,
  })
}

export type { SupportingPaneProps }

export default SupportingPane
