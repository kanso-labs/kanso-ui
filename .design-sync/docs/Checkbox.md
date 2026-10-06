A checkbox with its label, and optionally a description or an error under
it. Its state is React Aria's: pass `isSelected` with `onChange` to
control it, or `defaultSelected` to let it keep its own; `isIndeterminate`
draws the dash for a box that stands for a partly selected set. Inside a
`CheckboxGroup` it takes its `value` and the group's selection instead.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions.
