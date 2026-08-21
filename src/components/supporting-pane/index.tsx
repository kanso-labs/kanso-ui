import type { ReactNode } from 'react'

import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { media, spacing } from '../../tokens/design.tokens.stylex'

// One of Material 3's canonical layouts. The supporting pane holds content
// that only means anything next to the main pane — reviewer comments, related
// items, a tool panel — which is what separates it from list-detail, where
// the second pane stands on its own.
//
// M3 gives this layout three shapes across the breakpoints, and all three are
// reachable in CSS because none of them depends on what the reader selected:
// stacked at compact, an even split at medium, two thirds to one third from
// expanded up. Stacking is M3's "reflow" strategy, where the supporting pane
// moves under the main one rather than being dismissed. The spec's other
// compact option is a bottom sheet, which is a different component's job —
// reach for Sheet at the call site when the supporting content should be
// summoned rather than scrolled to.
//
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
    minInlineSize: 0,
  },
  // minmax(0, Nfr) rather than a bare Nfr: a bare fr track takes an automatic
  // minimum of its content, so one long unbroken string inside a pane widens
  // the track past its share and pushes the layout sideways.
  // The rules overlap — a 900px window matches `medium` as well as `expanded` — so which one wins comes down to the
  // order they are emitted in rather than to anything visible here. StyleX
  // settles it, sorting min-width queries ascending however they are written,
  // and the perfectionist lint rule reorders this object independently of
  // that. Neither is worth reading the source to confirm, which is why
  // index.test.tsx measures the resolved columns at every breakpoint.
  root: {
    display: 'grid',
    gap: spacing.xl,
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [media.expanded]: 'minmax(0, 2fr) minmax(0, 1fr)',
      [media.medium]: 'minmax(0, 1fr) minmax(0, 1fr)',
    },
  },
})

type SupportingPaneProps = Omit<useRender.ComponentProps<'div'>, 'children'> & {
  /** The primary content. Takes two thirds of the width from expanded up. */
  main?: ReactNode
  /**
   * Content that only means something beside `main`. Sits below it at compact,
   * and beside it from medium up.
   */
  supporting?: ReactNode
}

/**
 * Material 3's supporting pane layout: a main pane and a companion that
 * reflows underneath it when there is no room beside it.
 *
 * Layout only — neither pane paints a surface or a border of its own, so what
 * goes in them is composed at the call site out of Cards, lists, or plain
 * content. `render` swaps the container's element, for a layout that should
 * be a `<main>` rather than a `<div>`.
 *
 * The panes are written to the DOM in the order they are shown, which is what
 * M3 asks of co-planar panes: focus order has to match the arrangement on
 * screen.
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
      ...stylex.props(styles.root),
    },
    render,
  })
}

export type { SupportingPaneProps }

export default SupportingPane
