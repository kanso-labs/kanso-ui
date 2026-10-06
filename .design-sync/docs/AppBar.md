Material Design's app bar: the container at the top of a page carrying its
title, one or two actions, and the way back out.

Three sizes. `small` is a fixed 64px bar for a page whose title is a label;
`medium` and `large` are the flexible bars, which give the headline a larger
type role and grow to fit a subtitle or a headline that wraps.

It paints its own surface, unlike the layout components, because separating
itself from the content beneath is the job — which is also why `scrolled`
and `collapsed` exist. Neither watches the page: only the app knows which
element scrolls, so both are set from its own scroll handler.
