A labelled number input with steppers. Its value is React Aria's: pass
`value` with `onChange` to control it, or `defaultValue` to let it keep
its own — and `onChange` is handed the number, `NaN` while the field is
empty. `minValue`, `maxValue` and `step` shape it, and `formatOptions`
says how it reads, in the locale the page is in: a currency, a percentage,
a unit. Arrow keys step the value, and Page Up and Page Down by ten steps.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions. The box, label, input and message
are the field chrome in `src/field`, shared with every other field.
