A list whose rows nest. Which rows are open is React Aria's: pass
`expandedKeys` with `onExpandedChange` to control it, or
`defaultExpandedKeys` to let it keep its own. Selection is React Aria's
too — set `selectionMode` to `single` or `multiple`.

```tsx
<Tree aria-label="Label">
  <Tree.Item headline="First item" id="first">
    <Tree.Item headline="Second item" id="second" />
  </Tree.Item>
</Tree>
```

Each row is the row every list here draws, indented by its depth, with a
caret on the rows that have children. Name the tree with `aria-label` or
`aria-labelledby` — nothing here labels it for you.

The call site's `className` and `style` land on the container, which is
the element a layout positions.

## Parts

### `Tree.LoadMore`

The row the tree shows while it is fetching more. React Aria calls
`onLoadMore` when this comes into view, and draws it only while
`isLoading`.

Props (`TreeLoadMoreProps`):

- `label`: What the row says while it is loading. Read by a screen reader; the ring itself carries no text.
- everything in `Omit<TreeLoadMoreItemProps, 'children'>`
