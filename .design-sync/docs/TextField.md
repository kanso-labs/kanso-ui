A labelled single-line input. Its value is React Aria's: pass `value` with
`onChange` to control it, or `defaultValue` to let it keep its own — and
`onChange` is handed the string, not the event. The call site's
`className` and `style` land on the field as a whole, which is the element
a layout positions.

The text fields page's configurations are props: `leadingIcon` and
`trailingIcon` at the box's ends, `prefix` and `suffix` on the value's
line, and `characterCount` opposite the supporting text, counting against
`maxLength`.

The box, label, input and message are the field chrome in `src/field`,
shared with every other field; this component is what React Aria's
`TextField` puts around them.
