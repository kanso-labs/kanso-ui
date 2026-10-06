How full something is, on a scale it names: disk used, storage left,
a rating out of five. Pass `value` between `minValue` and `maxValue`, and
`formatOptions` to say how the number reads. For how far along a task is,
reach for ProgressIndicator instead — a meter has no indeterminate state,
because a measurement always has a value.

The call site's `className` and `style` land on the meter as a whole,
which is the element a layout positions.
