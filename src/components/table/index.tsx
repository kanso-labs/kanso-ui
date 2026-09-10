import type { ReactNode } from 'react'
import type {
  ColumnRenderProps,
  CellProps as RACCellProps,
  ColumnProps as RACColumnProps,
  RowProps as RACRowProps,
  TableBodyProps as RACTableBodyProps,
  TableFooterProps as RACTableFooterProps,
  TableHeaderProps as RACTableHeaderProps,
  TableProps as RACTableProps,
  RowRenderProps,
  TableBodyRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  Cell as RACCell,
  Column as RACColumn,
  Row as RACRow,
  Table as RACTable,
  TableBody as RACTableBody,
  TableFooter as RACTableFooter,
  TableHeader as RACTableHeader,
} from 'react-aria-components'

import { ArrowDownwardGlyph, ArrowUpwardGlyph } from '../../glyphs'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import {
  colors,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import Checkbox from '../checkbox'

// A grid of rows and columns, with sorting and selection. The design system
// carries no data table page — it was dropped after Material Design 2 — so
// the geometry comes from the archived one at
// <https://m2.material.io/components/data-tables>, which is the page this
// component is drawn from: a 56dp header row, 52dp body rows, 16dp of
// padding on each side of a cell, a medium-weight header to set it apart
// from the rows, and an arrow beside the name of the column being sorted.
//
// Its colour roles are the current system's rather than that page's, since
// a table sits beside lists, cards and menus that all draw from the tokens
// here. That means the row's state layers are the ones `src/row` uses — the
// same hover, pressed and selected treatment a list row takes — so a
// selected table row and a selected list row on one page cannot disagree.
//
// The row is not `src/row`, and that is the one place this departs from the
// library's other collections. That module's row is a headline with a
// supporting line and a slot at each end; a table row is a run of cells with
// no such shape, and forcing one into the other would give every cell the
// row's 56dp floor and body-large headline. The state layers are shared by
// being written from the same tokens rather than by sharing the module.
//
// Four things are this component's own.
//
// **The rule between rows is drawn on the row, not on its cells.** A cell
// cannot see whether its row is the first one, so a rule per cell either
// doubles under the header or needs the row's position passed down. The
// table collapses its borders, which is what lets a `<tr>` carry one.
//
// **A selecting table draws its checkbox where the call site puts it.**
// `selection` on a column and on a cell renders the library's Checkbox in
// React Aria's selection slot — the column's is select-all, the cell's is
// that row's. It is a prop rather than an injected column because the header
// and every row have to agree on how many columns there are, and only the
// call site can keep that true.
//
// **A sortable column is the press target itself.** React Aria puts no
// button inside the header cell; it makes the cell pressable and sets
// `aria-sort` on it. So the arrow is content next to the name, and the
// hover and pressed layers belong to the cell.
//
// **The header sticks only when asked.** A sticky header needs an opaque
// background to scroll rows under, and that colour is only right when the
// table is in something that scrolls. `stickyHeader` is what says so.
//
// One thing about React Aria's collection is worth knowing before writing a
// call site. **A column's `id` and a row's `id` share one namespace**, and a
// value used by both silently drops every column — the table then throws
// "Cell count must match column count", naming the cells rather than the
// duplicate key that caused it. Nothing here can catch it, since both ids
// are the call site's to choose; the docstrings below say to keep them
// apart, and the stories and tests use `col`-prefixed column ids so the two
// sets cannot meet.

// What the selection checkboxes are called. A context rather than a prop on
// every column and cell, since it is the table's decision and repeating it
// per row is how the two drift.
const SelectAllLabelContext = createContext('Select all')
const SelectLabelContext = createContext('Select')

const styles = stylex.create({
  // The cell every column and row draws: the page's 16dp on each side, which
  // is also what puts its 32dp between two adjacent columns.
  cell: {
    boxSizing: 'border-box',
    paddingInline: spacing.lg,
    textAlign: 'start',
    verticalAlign: 'middle',
  },
  // What the body shows in place of rows. React Aria puts it in a cell of its
  // own spanning every column, and that cell is not this component's — so the
  // padding and the centring are on the box drawn inside it, which has to be
  // a block for either to mean anything.
  empty: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'block',
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    paddingBlock: spacing.xxl,
    paddingInline: spacing.lg,
    textAlign: 'center',
  },
  // Drawn inside the cell's edges, so a focused header or row shows its
  // whole ring rather than having the outer half clipped by the table.
  focus: {
    outlineColor: colors.primary,
    outlineOffset: '-2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  // The footer's own rule, above it. On `<tfoot>` rather than on its cells
  // because its first row drops the row rule with every other first row.
  footer: {
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  // The page's 56dp header, in a medium weight against the rows' regular
  // one.
  header: {
    blockSize: '56px',
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  // The name and its arrow, on one line, with the arrow after the name as
  // the page puts it.
  headerContent: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.sm,
  },
  // The rule under the header, on the group rather than on each cell so it
  // is one declaration rather than one per column — the same placement the
  // footer's own rule takes.
  headerGroup: {
    borderBlockEndColor: colors.outlineVariant,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
  },
  // A sortable header is pressable, so it takes the same layers a row does.
  headerSortable: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    cursor: 'pointer',
  },
  // The page's 52dp row, and the rule above it — dropped on the first row of
  // a group, where the header's own rule or the table's edge already is.
  row: {
    blockSize: '52px',
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: { ':first-child': 0, default: '1px' },
  },
  // Applied from render state rather than `:disabled`, since a row is a
  // `<tr>` React Aria marks with aria-disabled. Last of the three so it wins
  // over the interactive and selected branches, and StyleX replaces a
  // property whole, so it takes their hover states with it.
  rowDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  // The row's layers composite over `transparent` rather than a container
  // colour, so the row tints whatever the table is sitting on. The selected
  // state is the one that brings a container of its own.
  rowInteractive: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    cursor: 'pointer',
  },
  rowSelected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    color: colors.onPrimaryContainer,
  },
  // Wide enough for the checkbox and its 16dp on each side, and no wider —
  // a selection column holds one control and should not take the room a
  // column of data would.
  selection: {
    inlineSize: '1%',
    whiteSpace: 'nowrap',
  },
  // The arrow beside a sorted column's name, at the 18dp the checkbox page
  // draws its own glyph at, since there is no data table page here to take
  // one from.
  sortArrow: {
    blockSize: '18px',
    flexShrink: 0,
    inlineSize: '18px',
  },
  // Held above the rows it scrolls under, on the surface an outlined Card and
  // the page both draw. It carries the rule under the header itself, since
  // `position: sticky` lifts the cells out of the row group's box and the
  // group's own border stays behind with the scrolled-away `<thead>` — which
  // takes the line away at the moment it is doing the most work, with rows
  // passing directly beneath it.
  //
  // Drawn as an inset shadow rather than a border, and that is what makes it
  // appear at all: under `border-collapse: collapse` the table paints the
  // cell borders, and it paints a sticky cell's at the place the cell has
  // scrolled away from. A shadow is painted by the element, so it travels.
  sticky: {
    backgroundColor: colors.surface,
    boxShadow: `inset 0 -1px 0 ${colors.outlineVariant}`,
    insetBlockStart: 0,
    position: 'sticky',
    zIndex: 1,
  },
  table: {
    // A table's own borders are what the row and header rules collapse into
    // a single line rather than two abutting ones.
    borderCollapse: 'collapse',
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    inlineSize: '100%',
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    // React Aria moves focus to a row or a cell rather than to the table,
    // and each draws its own ring inside its edges.
    outlineStyle: 'none',
  },
})

type TableBodyProps<T extends object = object> = Omit<
  RACTableBodyProps<T>,
  'className' | 'renderEmptyState' | 'style'
> & {
  /** A function may compute the class from the body's render state. */
  className?: RACTableBodyProps<T>['className']
  /**
   * What the table shows in place of rows when it has none. Drawn in a row
   * of its own spanning every column.
   */
  emptyState?: ReactNode
  /** A function may compute the style from the body's render state. */
  style?: RACTableBodyProps<T>['style']
}

type TableCellProps = Omit<RACCellProps, 'children' | 'className' | 'style'> & {
  /** What the cell holds. */
  children?: ReactNode
  /** A function may compute the class from the cell's render state. */
  className?: RACCellProps['className']
  /**
   * Draws this row's selection checkbox instead of `children`. The row's own
   * text is what names the row; the box inside it takes the table's
   * `selectLabel`.
   */
  selection?: boolean
  /** A function may compute the style from the cell's render state. */
  style?: RACCellProps['style']
}

type TableColumnProps = Omit<
  RACColumnProps,
  'children' | 'className' | 'style'
> & {
  /** The column's name. */
  children?: ReactNode
  /** A function may compute the class from the column's render state. */
  className?: RACColumnProps['className']
  /**
   * Draws the select-all checkbox instead of `children`, for the column the
   * rows put their own checkboxes in.
   */
  selection?: boolean
  /** A function may compute the style from the column's render state. */
  style?: RACColumnProps['style']
}

type TableFooterProps<T extends object = object> = RACTableFooterProps<T>

type TableHeaderProps<T extends object = object> = RACTableHeaderProps<T>

type TableProps = Omit<RACTableProps, 'className' | 'style'> & {
  /** A function may compute the class from the table's render state. */
  className?: RACTableProps['className']
  /**
   * What the select-all checkbox is called, for a screen reader.
   * @default 'Select all'
   */
  selectAllLabel?: string
  /**
   * What each row's selection checkbox is called, for a screen reader. The
   * row's own text is what names the row; this names the box inside it.
   * @default 'Select'
   */
  selectLabel?: string
  /**
   * Holds the header row in place while the rows scroll under it. Needs the
   * table inside something that scrolls; on a table that does not, it draws
   * the same as without it.
   */
  stickyHeader?: boolean
  /** A function may compute the style from the table's render state. */
  style?: RACTableProps['style']
}

type TableRowProps<T extends object = object> = Omit<
  RACRowProps<T>,
  'className' | 'style'
> & {
  /** A function may compute the class from the row's render state. */
  className?: RACRowProps<T>['className']
  /** A function may compute the style from the row's render state. */
  style?: RACRowProps<T>['style']
}

// Whether the header sticks, so a column reaches it without every call site
// repeating the table's own decision on each one.
const StickyHeaderContext = createContext(false)

// What a body cell draws, and the classes it draws with. Written as calls
// rather than inline at the props, which is what react-perf's
// no-new-function-as-prop and jsx-no-jsx-as-prop are after; the React
// Compiler memoises the results on their inputs.
// The return type is written out rather than inferred, here and in the two
// below: `ReactNode` is a union that includes a promise, and a function
// inferred as returning one has to be `async`.
function cellContent(
  children: ReactNode,
  selection: boolean,
  label: string,
): ReactNode {
  if (!selection) {
    return children
  }
  return <Checkbox aria-label={label} slot="selection" />
}

function cellStyles(selection: boolean) {
  return stylex.props(styles.cell, styles.focus, selection && styles.selection)
}

function columnContent(children: ReactNode, selection: boolean, label: string) {
  if (selection) {
    return <Checkbox aria-label={label} slot="selection" />
  }
  return (state: ColumnRenderProps) => (
    <span {...stylex.props(styles.headerContent)}>
      {children}
      {sortArrowFor(state.sortDirection)}
    </span>
  )
}

function columnStyles(selection: boolean, sticky: boolean) {
  return (state: ColumnRenderProps) =>
    stylex.props(
      styles.cell,
      styles.header,
      styles.focus,
      sticky && styles.sticky,
      selection && styles.selection,
      state.allowsSorting && styles.headerSortable,
    )
}

// What the body draws in place of rows. A call rather than a function
// written at the prop, for the same reason the others are.
function emptyContent(emptyState: ReactNode) {
  // The return type is written out rather than inferred: `ReactNode` is a
  // union that includes a promise, and a function inferred as returning one
  // has to be `async`.
  return (_state: TableBodyRenderProps): ReactNode => (
    <span {...stylex.props(styles.empty)}>{emptyState}</span>
  )
}

function rowStyles(state: RowRenderProps) {
  return stylex.props(
    styles.row,
    // A row is interactive when the table does something with a press —
    // selecting it, or running its `onAction`. React Aria reports the first
    // through the selection mode; the second is what `isPressed` can only
    // become through.
    state.selectionMode !== 'none' && styles.rowInteractive,
    state.isSelected && styles.rowSelected,
    state.isDisabled && styles.rowDisabled,
  )
}

// The arrow beside a sorted column's name. Nothing is drawn on a column that
// is sortable but not currently sorted: the page puts the arrow next to the
// column being sorted, and an arrow on every sortable column would say every
// one of them was.
function sortArrowFor(direction: 'ascending' | 'descending' | undefined) {
  if (direction === undefined) {
    return null
  }
  return direction === 'ascending' ? (
    <ArrowUpwardGlyph {...stylex.props(styles.sortArrow)} />
  ) : (
    <ArrowDownwardGlyph {...stylex.props(styles.sortArrow)} />
  )
}

/**
 * A grid of rows and columns. Sorting and selection are React Aria's: pass
 * `sortDescriptor` with `onSortChange` and mark the sortable columns
 * `allowsSorting`, and set `selectionMode` to `single` or `multiple` with
 * `selectedKeys` and `onSelectionChange`, or `defaultSelectedKeys`.
 *
 * ```tsx
 * <Table aria-label="Label" selectionMode="multiple">
 *   <Table.Header>
 *     <Table.Column selection />
 *     <Table.Column id="name" isRowHeader>Label</Table.Column>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row id="first">
 *       <Table.Cell selection />
 *       <Table.Cell>First item</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 *
 * Composed from parts, since a cell takes arbitrary content: `Table.Header`,
 * `Table.Column`, `Table.Body`, `Table.Row`, `Table.Cell` and
 * `Table.Footer`. Name the table with `aria-label` or `aria-labelledby`, and
 * mark one column `isRowHeader` so a screen reader has something to read a
 * row by.
 *
 * The call site's `className` and `style` land on the table, which is the
 * element a layout positions.
 */
function Table({
  selectAllLabel = 'Select all',
  selectLabel = 'Select',
  stickyHeader = false,
  ...props
}: TableProps) {
  return (
    <SelectAllLabelContext value={selectAllLabel}>
      <SelectLabelContext value={selectLabel}>
        <StickyHeaderContext value={stickyHeader}>
          <RACTable
            {...props}
            {...mergeStatefulStyles(stylex.props(styles.table), props)}
          />
        </StickyHeaderContext>
      </SelectLabelContext>
    </SelectAllLabelContext>
  )
}

/**
 * The rows. `emptyState` is what it shows when there are none — a table with
 * no rows and nothing to say in their place is a blank area with a header
 * over it.
 *
 * It carries no styles of its own, since every rule a body needs is drawn by
 * the rows inside it, so a `className` here lands on the `<tbody>` through
 * React Aria rather than through a merge.
 */
function TableBody<T extends object = object>({
  emptyState,
  ...props
}: TableBodyProps<T>) {
  return (
    <RACTableBody<T>
      {...props}
      renderEmptyState={
        emptyState === undefined ? undefined : emptyContent(emptyState)
      }
    />
  )
}

/**
 * One cell. `selection` draws this row's checkbox in place of whatever else
 * the cell would hold.
 */
function TableCell({ children, selection = false, ...props }: TableCellProps) {
  const label = useContext(SelectLabelContext)

  return (
    <RACCell {...props} {...mergeStatefulStyles(cellStyles(selection), props)}>
      {cellContent(children, selection, label)}
    </RACCell>
  )
}

/**
 * One column. `allowsSorting` is React Aria's and makes the header cell
 * itself the control that sorts; the arrow appears on the column the
 * `sortDescriptor` names. `isRowHeader` marks the column a screen reader
 * reads a row by.
 *
 * Its `id` shares a namespace with the rows', so give the two sets values
 * that cannot collide — a column and a row with one id between them leaves
 * the table with no columns at all.
 */
function TableColumn({
  children,
  selection = false,
  ...props
}: TableColumnProps) {
  const label = useContext(SelectAllLabelContext)
  const sticky = useContext(StickyHeaderContext)

  return (
    <RACColumn
      {...props}
      {...mergeStatefulStyles(columnStyles(selection, sticky), props)}
    >
      {columnContent(children, selection, label)}
    </RACColumn>
  )
}

/**
 * A row under the body, for totals and the like. It is not part of the
 * selection or the keyboard navigation — React Aria keeps it out of both.
 */
function TableFooter<T extends object = object>(props: TableFooterProps<T>) {
  return (
    <RACTableFooter<T>
      {...props}
      {...mergeStyles(stylex.props(styles.footer), props)}
    />
  )
}

/**
 * The header row, holding the columns, and the rule drawn under it — which
 * moves to the cells when the header sticks, since a row group's border does
 * not travel with cells `position: sticky` has lifted out of it.
 */
function TableHeader<T extends object = object>(props: TableHeaderProps<T>) {
  const sticky = useContext(StickyHeaderContext)

  return (
    <RACTableHeader<T>
      {...props}
      {...mergeStatefulStyles(
        stylex.props(sticky ? undefined : styles.headerGroup),
        props,
      )}
    />
  )
}

/**
 * One row. Give every row an `id` — that is the key selection is reported
 * by, and it has to differ from every column's. `onAction` runs when the
 * row is pressed.
 */
function TableRow<T extends object = object>(props: TableRowProps<T>) {
  return <RACRow<T> {...props} {...mergeStatefulStyles(rowStyles, props)} />
}

Table.Body = TableBody
Table.Cell = TableCell
Table.Column = TableColumn
Table.Footer = TableFooter
Table.Header = TableHeader
Table.Row = TableRow

export type {
  TableBodyProps,
  TableCellProps,
  TableColumnProps,
  TableFooterProps,
  TableHeaderProps,
  TableProps,
  TableRowProps,
}

export default Table
