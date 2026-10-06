A static row: the row every list draws, on its own, as the lists spec page
gives it — a 56px one-line container, a body-large headline and a
body-medium supporting line. A second line takes it to the page's 72px
two-line container; an `overline` puts that second line above the headline
instead of below it, and an overline with a supporting line makes the
page's three-line item, an 88px container with the leading and trailing
slots held at the top rather than centred. The layout and the states are
the row module's in `src/row`, shared with every collection item; what is
here is the element around them — a `<div>` that presents, or a `<button>`
that ripples — and the props that fill the slots.
