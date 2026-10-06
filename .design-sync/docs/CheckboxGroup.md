A labelled set of checkboxes with one value between them. The value is
React Aria's: pass `value` with `onChange` to control it, or
`defaultValue` to let the group keep its own, and each `Checkbox` inside
names the entry it stands for with `value`. Disabled, read-only and the
error state reach every checkbox from here.

The call site's `className` and `style` land on the group as a whole,
which is the element a layout positions.
