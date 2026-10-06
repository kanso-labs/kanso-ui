Material Design's supporting pane layout: a main pane and a companion that
reflows underneath it when there is no room beside it.

Layout only — neither pane paints a surface or a border of its own, so what
goes in them is composed at the call site out of Cards, lists, or plain
content. `render` swaps the container's element, for a layout that should
be a `<main>` rather than a `<div>`.

The panes are written to the DOM in the order they are shown, which is what
Material Design asks of co-planar panes: focus order has to match the
arrangement on screen.
