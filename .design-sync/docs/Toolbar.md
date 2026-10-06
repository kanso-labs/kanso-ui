A container for a set of controls, announced as a toolbar so a screen
reader reads them as one group, with the arrow keys moving between them.
Tab still steps through each control: React Aria's toolbar adds the arrows
rather than replacing what Tab does.

```tsx
<Toolbar aria-label="Label">
  <IconButton aria-label="First item">
    <FirstIcon />
  </IconButton>
  <Separator />
  <IconButton aria-label="Second item">
    <SecondIcon />
  </IconButton>
</Toolbar>
```

Name it with `aria-label` or `aria-labelledby` — nothing here labels it for
you, and a toolbar with no name is a group a screen reader cannot announce.

`orientation` is React Aria's, and it decides both which arrows move and
which way the bar runs. A `Separator` inside draws across that direction
without being told.

The call site's `className` and `style` land on the container, which is
the element a layout positions.
