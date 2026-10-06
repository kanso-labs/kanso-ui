A labelled field that opens a list to choose from. Its value is React
Aria's: pass `value` with `onChange` to control it, or `defaultValue` to
let it keep its own. The value is an option's `id`, so give every option
one. React Aria's older `selectedKey` names are deprecated and are left
out of this component's props rather than passed through.

```tsx
<Select
  label="Label"
  options={
    <>
      <ListBox.Item id="first">First item</ListBox.Item>
      <ListBox.Item id="second">Second item</ListBox.Item>
    </>
  }
/>
```

The box, label, supporting line and error are the field chrome in
`src/field`, shared with every other field; the list is ListBox on the
overlay surface every anchored panel here draws.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions.
