A labelled text field that filters a list as it is typed. Its value is
React Aria's: pass `value` with `onChange` to control which option is
chosen, `inputValue` with `onInputChange` to control the text, or the
`default` forms of either to let it keep its own. React Aria's older
`selectedKey` names are deprecated and are left out of this component's
props rather than passed through.

```tsx
<ComboBox
  label="Label"
  options={
    <>
      <ListBox.Item id="first">First item</ListBox.Item>
      <ListBox.Item id="second">Second item</ListBox.Item>
    </>
  }
/>
```

Filtering is React Aria's: `defaultFilter` takes a predicate, `useFilter`
is re-exported for a locale-aware one, and `items` with `useAsyncList`
feeds a list that is fetched rather than listed. `allowsCustomValue` lets
the field keep text that matches nothing.

The box, label, input, supporting line and error are the field chrome in
`src/field`, shared with every other field; the list is ListBox on the
overlay surface every anchored panel here draws.

The call site's `className` and `style` land on the field as a whole,
which is the element a layout positions.
