A search bar: a keyword typed into a pill, submitted with Enter and
cleared with Escape or its button. Its value is React Aria's: pass
`value` with `onChange` to control it, or `defaultValue` to let it keep
its own; `onSubmit` is handed the value on Enter and `onClear` is called
when it is emptied.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions. The input and the message are
the field chrome in `src/field`, shared with every other field; the bar
around them is the search page's rather than the box the other fields
share.
