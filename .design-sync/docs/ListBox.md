A list of options one or more of which can be selected. Selection is React
Aria's: set `selectionMode` to `single` or `multiple`, and pass
`selectedKeys` with `onSelectionChange` to control it or
`defaultSelectedKeys` to let it keep its own. A list that only responds to
a press takes `onAction` on the option instead.

Composed from parts, since an option's slots take arbitrary content:
`ListBox.Item`, `ListBox.Section` and `ListBox.LoadMore`. Name the list
with `aria-label` or `aria-labelledby` — nothing here labels it for you.

The call site's `className` and `style` land on the container, which is
the element a layout positions.

## Parts

### `ListBox.LoadMore`

The row the list shows while it is fetching more. React Aria calls
`onLoadMore` when this comes into view, and draws it only while
`isLoading` — so a list that pages as it scrolls needs nothing else.

Props (`ListBoxLoadMoreProps`):

- `label`: What the row says while it is loading. Read by a screen reader; the ring itself carries no text.
- everything in `Omit<ListBoxLoadMoreItemProps, 'children'>`
