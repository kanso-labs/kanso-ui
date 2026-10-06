A grid of rows and columns. Sorting and selection are React Aria's: pass
`sortDescriptor` with `onSortChange` and mark the sortable columns
`allowsSorting`, and set `selectionMode` to `single` or `multiple` with
`selectedKeys` and `onSelectionChange`, or `defaultSelectedKeys`.

```tsx
<Table aria-label="Label" selectionMode="multiple">
  <Table.Header>
    <Table.Column selection />
    <Table.Column id="name" isRowHeader>Label</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row id="first">
      <Table.Cell selection />
      <Table.Cell>First item</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

Composed from parts, since a cell takes arbitrary content: `Table.Header`,
`Table.Column`, `Table.Body`, `Table.Row`, `Table.Cell` and
`Table.Footer`. Name the table with `aria-label` or `aria-labelledby`, and
mark one column `isRowHeader` so a screen reader has something to read a
row by.

The call site's `className` and `style` land on the table, which is the
element a layout positions.

## Parts

### `Table.Cell`

One cell. `selection` draws this row's checkbox in place of whatever else
the cell would hold.

Props (`TableCellProps`):

- `children`: What the cell holds.
- `className`: A function may compute the class from the cell's render state.
- `selection`: Draws this row's selection checkbox instead of `children`. The row's own text is what names the row; the box inside it takes the table's `selectLabel`.
- `style`: A function may compute the style from the cell's render state.
- everything in `Omit<CellProps, 'children' | 'className' | 'style'>`

### `Table.Column`

One column. `allowsSorting` is React Aria's and makes the header cell
itself the control that sorts; the arrow appears on the column the
`sortDescriptor` names. `isRowHeader` marks the column a screen reader
reads a row by.

Its `id` shares a namespace with the rows', so give the two sets values
that cannot collide — a column and a row with one id between them leaves
the table with no columns at all.

Props (`TableColumnProps`):

- `children`: The column's name.
- `className`: A function may compute the class from the column's render state.
- `resizable`: Draws a handle at the column's trailing edge that drags its width. Needs the table's own `resizable` as well — React Aria keeps the resize state on a container around the table, and without it there is nothing for a handle to change. `defaultWidth`, `minWidth` and `maxWidth` are React Aria's and apply only inside that container.
- `selection`: Draws the select-all checkbox instead of `children`, for the column the rows put their own checkboxes in.
- `style`: A function may compute the style from the column's render state.
- everything in `Omit<ColumnProps, 'children' | 'className' | 'style'>`

### `Table.LoadMore`

The row the table shows while it is fetching more. React Aria calls
`onLoadMore` when this comes into view, and draws it only while
`isLoading`. It goes inside `Table.Body`, after the rows.

Props (`TableLoadMoreProps`):

- `label`: What the row says while it is loading. Read by a screen reader; the ring itself carries no text.
- everything in `Omit<TableLoadMoreItemProps, 'children'>`

### `Table.Row`

One row. Give every row an `id` — that is the key selection is reported
by, and it has to differ from every column's. `onAction` runs when the
row is pressed.
