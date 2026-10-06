A form: the fields inside it and what they are told about validation. Pass
`validationErrors`, an object keyed by field `name`, to show what a server
sent back under each field, and `validationBehavior="native"` to let the
browser's own constraint validation block submission. `onSubmit` is handed
the submit event; call `preventDefault` on it to handle the submission
yourself, and read the values from `new FormData(event.currentTarget)`.

Handing `validationErrors` back from a submission is where a reader has to
be told something arrived: see `validationBehavior` for what the form does
and what it leaves to the call site.

A form also reserves each field's message line. A field on its own draws
that line only once it has something to say, so an error arriving after a
submit or an async check makes the field taller and moves everything below
it down the page. Inside a form the line is there from the start, empty,
and nothing moves when it fills — which is the whole reason a form is where
a message arrives after the fact.

The call site's `className` and `style` land on the form element, which is
the element a layout positions.
