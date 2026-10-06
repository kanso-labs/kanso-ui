A nested set of links, with the current one marked. Which row is current
is React Aria's: give the tree a `selectedRoute` and each row an `href`,
and the row whose `href` matches is the current one — its ancestors are
marked too, so a collapsed trail still shows where you are.

```tsx
<NavigationTree aria-label="Label" selectedRoute="#second">
  <NavigationTree.Item href="#first" id="first" label="First item">
    <NavigationTree.Item href="#second" id="second" label="Second item" />
  </NavigationTree.Item>
</NavigationTree>
```

There is no selection here, and that is React Aria's design rather than an
omission: a navigation tree navigates, so what is current comes from the
route rather than from anything the reader picked. `Tree` is the one that
selects.

The call site's `className` and `style` land on the container, which is
the element a layout positions.
