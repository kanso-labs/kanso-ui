A place to drop files. What is dropped is React Aria's: `onDrop` is handed
the items, and `isFileDropItem`, `isDirectoryDropItem`, `isTextDropItem`
and `DIRECTORY_DRAG_TYPE` are exported from the package for reading them.

```tsx
<DropZone label="Drop here" onDrop={handleDrop}>
  <FileTrigger onSelect={handleSelect}>
    <Button variant="outlined">Label</Button>
  </FileTrigger>
</DropZone>
```

It is drawn from the outlined card, with a dashed rule rather than a solid
one, and fills with the primary container while something is over it.
`label` both draws the words and names the target; `aria-label` names it
without drawing anything, for a page that already says what it takes.

The call site's `className` and `style` land on the target itself, which
is the element a layout positions.
