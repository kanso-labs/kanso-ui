A colour typed into a field. The value is React Aria's — pass `value` with
`onChange` to control it, or `defaultValue` — as a CSS colour string or a
`Color` from `parseColor`, which this package re-exports.

```tsx
<ColorField defaultValue="#6750A4" label="Label" />
```

Without `channel` the field holds the whole colour and parses what is
typed; with one it holds that channel alone as a number. `colorSpace`
decides which space a channel belongs to, the same as on `ColorSlider`.

The box, label and message are the field chrome in `src/field`, shared
with every other field. The call site's `className` and `style` land on
the field as a whole, which is the element a layout positions.
