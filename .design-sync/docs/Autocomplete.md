A search input that filters the collection under it. Its value is React
Aria's: pass `inputValue` with `onInputChange` to control what has been
typed, or `defaultInputValue` to let it keep its own.

```tsx
<Autocomplete>
  <SearchField label="Search" placeholder="Search" />
  <ListBox aria-label="Results">
    <ListBox.Item id="first">First item</ListBox.Item>
  </ListBox>
</Autocomplete>
```

It renders no element of its own, so the input and the collection sit
wherever the page puts them — side by side in a panel, in a `Menu.Content`,
or in a `Dialog` as a command palette. That is also why it takes no
`className` or `style`: there is nothing for them to land on.

Keyboard focus stays in the input while the arrow keys move through the
collection, which is React Aria's virtual focus. `disableVirtualFocus`
turns that off and makes the collection tabbable instead.
