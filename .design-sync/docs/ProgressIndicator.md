Progress through a task, as a line or a ring. Its value is React Aria's:
pass `value` between `minValue` and `maxValue`, or leave `value` out and
set `isIndeterminate` for work whose length is not known. `formatOptions`
says how the value reads, in the locale the page is in, and `buffer` marks
how far the work is loaded ahead of it.

The call site's `className` and `style` land on the indicator as a whole,
which is the element a layout positions.
