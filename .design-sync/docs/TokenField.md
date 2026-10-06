A labelled field whose value is text with inline tokens — a tag input, a
mention field, a structured search box. Its value is React Aria's
`TokenFieldValue`: pass `value` with `onChange` to control it, or
`defaultValue` to let it keep its own.

```tsx
const [value, setValue] = useState(new TokenFieldValue([]))

<TokenField label="Label" onChange={setValue} value={value} />
```

What counts as a token is the call site's: subclass `TokenFieldValue` and
override `tokenize`, which the package re-exports for that. `renderToken`
decides what each pill holds; without it, the segment's own text.

The box, label, supporting line and error are the field chrome in
`src/field`, and the pill is the chip module's, shared with Chip and
ChipGroup.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions.
