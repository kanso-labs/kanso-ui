Material Design's list-detail layout: a fixed list pane beside a flexible
detail pane, collapsing to one pane at a time below the expanded breakpoint.

Layout only — neither pane paints a surface of its own, so what goes inside
them is composed at the call site. `render` swaps the container's element,
for a layout that should be a `<main>` rather than a `<div>`.

The panes are written to the DOM in the order they are shown, which is what
Material Design asks of co-planar panes: focus order has to match the
arrangement on screen.

Below the expanded breakpoint the pane that is not showing is hidden
outright, so focus inside it is dropped when `showing` changes. The call
site that changed it is what puts focus in the pane it revealed — see the
prop.
