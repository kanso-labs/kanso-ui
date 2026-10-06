A slider for one value, or for a range when the value is a pair. The value
is React Aria's: pass `value` with `onChange` to control it, or
`defaultValue` to let it keep its own, with `minValue`, `maxValue` and
`step` to shape it and `formatOptions` to say how it reads. Arrow keys
move a handle by a step, Page Up and Page Down by ten, Home and End to
the ends.

The call site's `className` and `style` land on the slider as a whole,
which is the element a layout positions and the one that gives a vertical
slider its height.
