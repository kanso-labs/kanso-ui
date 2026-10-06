A labelled set of radio buttons with one selected value between them. The
value is React Aria's: pass `value` with `onChange` to control it, or
`defaultValue` to let the group keep its own, and each `Radio` inside
names the entry it stands for. Arrow keys move the selection; disabled,
read-only and the error state reach every button from here, and
`orientation="horizontal"` lays the buttons along a line.

The call site's `className` and `style` land on the group as a whole,
which is the element a layout positions.
