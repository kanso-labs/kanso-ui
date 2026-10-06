Material Design's feed layout: a grid of comparable items that fits as many
columns as the space allows, down to a single column when it allows only
one.

Layout only — it paints no surface, and it gives its children no container
of their own, so each child is a grid cell exactly as it was written. That
is the difference from ListDetail and SupportingPane, which do wrap: those
two divide a page into named regions, where this one lays out however many
things it is handed.

It reads the space it is in rather than the width of the window, so a feed
inside a pane reflows with the pane rather than with the browser.
