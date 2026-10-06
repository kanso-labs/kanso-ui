A switch that turns a setting on or off, with its label and optionally a
description or an error under it. Its state is React Aria's: pass
`isSelected` with `onChange` to control it, or `defaultSelected` to let it
keep its own. A switch takes effect as it is flipped, which is what sets
it apart from a checkbox in a form.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions.
