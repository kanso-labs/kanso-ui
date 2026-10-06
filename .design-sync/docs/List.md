A list of rows one or more of which can be selected. Selection is React
Aria's: set `selectionMode` to `single` or `multiple`, and pass
`selectedKeys` with `onSelectionChange` to control it or
`defaultSelectedKeys` to let it keep its own. A list that only responds to
a press takes `onAction` on the row instead.

ListItem is the static row — one row, presenting, on its own. This is the
collection that draws the same row and adds selection, keyboard navigation
between rows, sections and a load-more sentinel.

Composed from parts, since a row's slots take arbitrary content:
`List.Item`, `List.Section` and `List.LoadMore`. Name the list with
`aria-label` or `aria-labelledby` — nothing here labels it for you.

The call site's `className` and `style` land on the container, which is
the element a layout positions.

## Parts

### `List.Item`

One row. Its slots are the row's: `leading`, the headline as children,
`supporting` under it, and `trailing`. Give every row an `id` — that is
the key selection is reported by.

A list that selects with checkboxes draws one before whatever `leading`
holds, from the state React Aria reports rather than from a prop here.

### `List.LoadMore`

The row the list shows while it is fetching more. React Aria calls
`onLoadMore` when this comes into view, and draws it only while
`isLoading`.

Props (`ListLoadMoreProps`):

- `label`: What the row says while it is loading. Read by a screen reader; the ring itself carries no text.
- everything in `Omit<GridListLoadMoreItemProps, 'children'>`

### `List.Section`

A named group of rows. `header` names it, and is what a screen reader
reads before the rows inside.
