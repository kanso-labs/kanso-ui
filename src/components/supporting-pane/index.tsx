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
})

type SupportingPaneProps = Omit<RenderComponentProps<'div'>, 'children'> & {
  /**
   * The primary content. Takes whatever width the supporting pane leaves from
   * expanded up.
   */
  main?: ReactNode
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
  render,
  supporting,
  ...props
}: SupportingPaneProps) {
  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      children: (
        <>
          <div {...stylex.props(styles.pane)}>{main}</div>
          <div {...stylex.props(styles.pane)}>{supporting}</div>
        </>
      ),
      ...mergeStyles(stylex.props(styles.root), props),
    },
    render,
  })
}

export type { SupportingPaneProps }

export default SupportingPane
