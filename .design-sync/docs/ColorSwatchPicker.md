A row of colours to choose one from, drawn as swatches. The value is React
Aria's — pass `value` with `onChange` to control it, or `defaultValue` —
as a CSS colour string or a `Color` from `parseColor`, which this package
re-exports.

```tsx
<ColorSwatchPicker defaultValue="#6750A4">
  <ColorSwatchPicker.Item color="#6750A4" />
  <ColorSwatchPicker.Item color="#625B71" />
</ColorSwatchPicker>
```

It is a listbox, so arrow keys move between colours and the chosen one
carries a ring. Name it with `aria-label` or `aria-labelledby`; React Aria
calls it "Color swatches" otherwise.

The call site's `className` and `style` land on the picker, which is the
element a layout positions.
