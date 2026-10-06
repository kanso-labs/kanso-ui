'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ColumnRenderProps,
  ColumnResizerRenderProps,
  CellProps as RACCellProps,
  ColumnProps as RACColumnProps,
  RowProps as RACRowProps,
  TableBodyProps as RACTableBodyProps,
  TableFooterProps as RACTableFooterProps,
  TableHeaderProps as RACTableHeaderProps,
  TableLoadMoreItemProps as RACTableLoadMoreItemProps,
  TableProps as RACTableProps,
  ResizableTableContainerProps,
  RowRenderProps,
  TableBodyRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  Cell as RACCell,
  Column as RACColumn,
  ColumnResizer as RACColumnResizer,
  ResizableTableContainer as RACResizableTableContainer,
  Row as RACRow,
  Table as RACTable,
  TableBody as RACTableBody,
  TableFooter as RACTableFooter,
  TableHeader as RACTableHeader,
  TableLoadMoreItem as RACTableLoadMoreItem,
} from 'react-aria-components'

import { CollectionLoadMore } from '../../collection'
import { ArrowDownwardGlyph, ArrowUpwardGlyph } from '../../glyphs'
import { rowStyles as rowLayers } from '../../row/styles'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import {
  colors,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import Checkbox from '../checkbox'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

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
// **Resizing is asked for twice, and both are needed.** React Aria puts the
// resize state on a container around the table and the handle inside a
// column, so `resizable` on the table is what brings the container and
// `resizable` on a column is what draws its handle. The archived page has no
// resizer to take a treatment from — it predates the feature — so the handle
// draws the divider's own rule, thickening and taking the primary role while
// it is dragged, over a target far wider than the rule.
//
// **A resizable table stops filling its width.** The container sets
// `table-layout: fixed` and `width: min-content` on the table as inline
// styles, which no rule here can outrank; the container fills the width
// instead and scrolls when the columns together are wider than it.
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
// per row is how the two drift. Undefined unless the table is given one,
// which leaves the names React Aria gives in the reader's locale.
const SelectAllLabelContext = createContext<string | undefined>(undefined)
const SelectLabelContext = createContext<string | undefined>(undefined)

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
  //
  // In the text's own colour under forced colours, as a row's is — see
  // `focusVisible` in src/row/styles.ts.
  focus: {
    outlineColor: { default: colors.primary, [FORCED_COLORS]: 'currentColor' },
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
    blockSize: sizing.rowSm,
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    // The last column's resize handle reaches half its target past the
    // table's edge, where it would only widen the container's scroll by
    // 12px. Clipped there, the half inside the column is its whole target.
    // A cell's own ring is not clipped by its own overflow.
    overflow: { ':last-child': 'clip', default: null },
    // The resize handle is positioned against this cell's trailing edge.
    position: 'relative',
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
  // From React Aria's render state rather than `:hover` and `:active`, for Button's
  // reasons — see its header: a hover layer stayed on after a tap, and no
  // pressed layer showed for a press made from the keyboard.
  headerHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  headerPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  headerSortable: {
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  // The ring shown while more rows are being fetched, centred across the
  // width. React Aria's cell carries no padding of its own, so the box drawn
  // inside it is what does the centring — the same reason the empty state's
  // is a block rather than an inline span.
  loading: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
  },
  // The row that ring sits in, at a body row's own height so the list does
  // not jump as the fetched rows replace it.
  loadingRow: {
    blockSize: '52px',
  },
  // The container React Aria needs around a resizable table. It fills the
  // width the table has given up and scrolls when the columns outgrow it,
  // which is also what a sticky header inside it sticks to.
  resizableContainer: {
    boxSizing: 'border-box',
    inlineSize: '100%',
    overflowX: 'auto',
  },
  // The handle at a column's trailing edge: a target 24px wide, centred on
  // the boundary, that draws nothing itself. A 1px rule was the whole target
  // before, which a mouse could barely find and a finger could not, and 24px
  // is WCAG's minimum target size — no spacing exception applies, since the
  // handle meets the header cell, which is a target of its own when it
  // sorts. It is positioned against the header cell, which is why that cell
  // is relative, and lifted over the next column's cell, which would
  // otherwise take the half of the target that reaches into it.
  resizer: {
    blockSize: '100%',
    boxSizing: 'border-box',
    cursor: 'col-resize',
    inlineSize: '24px',
    insetBlockStart: 0,
    insetInlineEnd: '-12px',
    position: 'absolute',
    touchAction: 'none',
    zIndex: 1,
  },
  // The divider's own rule, drawn inside the handle on the inner side of the
  // boundary, so a column boundary is one line whether or not it can be
  // dragged. Under forced colours, which paint a background in `Canvas`, the
  // rule is a `CanvasText` border instead, and its colour is named rather
  // than forced so the active state's `Highlight` survives — it is the
  // handle's only focus indicator.
  resizerRule: {
    backgroundColor: colors.outlineVariant,
    blockSize: '100%',
    borderInlineEndColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderInlineEndStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderInlineEndWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    inlineSize: '1px',
    insetBlockStart: 0,
    insetInlineEnd: '12px',
    pointerEvents: 'none',
    position: 'absolute',
  },
  // Thickened and in the primary role while it is being dragged or focused,
  // so the boundary being moved is the one that stands out — inward, into
  // the column being sized.
  resizerRuleActive: {
    backgroundColor: colors.primary,
    borderInlineEndColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderInlineEndWidth: { default: null, [FORCED_COLORS]: '2px' },
    inlineSize: '2px',
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
  // `<tr>` React Aria marks with aria-disabled. Last, so its ground and colour
  // win over the selected row's; React Aria reports no hover or press on a
  // disabled row, so the state layers never meet it.
  rowDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
    // Back to the mode, which a selected row opts out of.
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'auto' },
  },
  // The row's layers composite over `transparent` rather than a container
  // colour, so the row tints whatever the table is sitting on. The selected
  // state is the one that brings a container of its own, and under forced
  // colours it is `Highlight` under `HighlightText`, out of the mode's
  // adjusting, for the reasons `selectedList` in src/row/styles.ts gives.
  rowSelected: {
    backgroundColor: {
      default: colors.primaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    color: {
      default: colors.onPrimaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
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
   * What the table shows in place of rows when it has none: React Aria's own
   * render function, under React Aria's own name, as List, ListBox, Tree and
   * ChipGroup take it. What it returns is drawn in a row of its own spanning
   * every column, inside the muted, padded box the table draws there.
   */
  renderEmptyState?: RACTableBodyProps<T>['renderEmptyState']
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

type TableColumnProps = {
  /** The column's name. */
  children?: ReactNode
  /** A function may compute the class from the column's render state. */
  className?: RACColumnProps['className']
  /**
   * Draws a handle at the column's trailing edge that drags its width. Needs
   * the table's own `resizable` as well — React Aria keeps the resize state
   * on a container around the table, and without it there is nothing for a
   * handle to change. `defaultWidth`, `minWidth` and `maxWidth` are React
   * Aria's and apply only inside that container.
   */
  resizable?: boolean
  /**
   * Draws the select-all checkbox instead of `children`, for the column the
   * rows put their own checkboxes in.
   */
  selection?: boolean
  /** A function may compute the style from the column's render state. */
  style?: RACColumnProps['style']
} & Omit<RACColumnProps, 'children' | 'className' | 'style'>

type TableFooterProps<T extends object = object> = RACTableFooterProps<T>

type TableHeaderProps<T extends object = object> = RACTableHeaderProps<T>

type TableLoadMoreProps = Omit<RACTableLoadMoreItemProps, 'children'> & {
  /**
   * What the row says while it is loading. Read by a screen reader; the ring
   * itself carries no text.
   * Left out, it is the word for it in the I18nProvider's locale — "Loading
   * more" in English.
   */
  label?: string
}

type TableProps = {
  /** A function may compute the class from the table's render state. */
  className?: RACTableProps['className']
  /** Called as a column is dragged, with every column's width. */
  onResize?: ResizableTableContainerProps['onResize']
  /** Called once a drag ends, with every column's width. */
  onResizeEnd?: ResizableTableContainerProps['onResizeEnd']
  /**
   * Lets columns marked `resizable` be dragged, by putting the table in the
   * container React Aria keeps the resize state on. A resizable table sizes
   * to its columns rather than to its parent, and that container is what
   * fills the width and scrolls instead.
   */
  resizable?: boolean
  /**
   * What the resize handle is called, for a screen reader. React Aria
   * composes it with the column's own name. Left out, React Aria names it in
   * the reader's locale — "Resizer" in English.
   */
  resizeLabel?: string
  /**
   * What the select-all checkbox is called, for a screen reader. Left out,
   * React Aria names it in the reader's locale — "Select All" in English.
   */
  selectAllLabel?: string
  /**
   * What each row's selection checkbox is called, for a screen reader. The
   * row's own text is what names the row; this names the box inside it.
   * Left out, React Aria names it in the reader's locale — "Select" in
   * English.
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
} & Omit<RACTableProps, 'className' | 'style'>

type TableRowProps<T extends object = object> = Omit<
  RACRowProps<T>,
  'className' | 'style'
> & {
  /** A function may compute the class from the row's render state. */
  className?: RACRowProps<T>['className']
  /** A function may compute the style from the row's render state. */
  style?: RACRowProps<T>['style']
}

// What the resize handles are called, for the same reason the selection
// labels travel this way: it is the table's decision, and repeating it per
// column is how the two drift. Undefined by default, as they are.
const ResizeLabelContext = createContext<string | undefined>(undefined)

// Whether the table brought the container. React Aria's resizer throws
// outright without one — "Wrap your <Table> in a <ResizableTableContainer>",
// naming a component a consumer of this library never writes — so a column
// asking to resize inside a table that does not would take the whole page
// down. It draws no handle instead.
const ResizableContext = createContext(false)

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
  label: string | undefined,
): ReactNode {
  if (!selection) {
    return children
  }
  return <Checkbox aria-label={label} slot="selection" />
}

function cellStyles(selection: boolean) {
  return stylex.props(styles.cell, styles.focus, selection && styles.selection)
}

function columnContent(
  children: ReactNode,
  selection: boolean,
  label: string | undefined,
  resizable: boolean,
  resizeLabel: string | undefined,
): RACColumnProps['children'] {
  if (selection) {
    return <Checkbox aria-label={label} slot="selection" />
  }
  // The handle is a sibling of the name rather than part of it: React Aria
  // renders it as its own element, positioned against the cell's trailing
  // edge, which the name's own box does not reach.
  return (state: ColumnRenderProps): ReactNode => (
    <>
      <span {...stylex.props(styles.headerContent)}>
        {children}
        {sortArrowFor(state.sortDirection)}
      </span>
      {resizable ? (
        <RACColumnResizer
          aria-label={resizeLabel}
          {...stylex.props(styles.resizer)}
        >
          {resizerRule}
        </RACColumnResizer>
      ) : null}
    </>
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
      state.allowsSorting && state.isHovered && styles.headerHovered,
      state.allowsSorting && state.isPressed && styles.headerPressed,
    )
}

// React Aria puts `aria-level` on the load-more row, and `aria-level` is only
// valid on a row inside a `treegrid` — a grid's rows have no level. axe flags
// it as `aria-conditional-attr`, and this library's stories run axe as an
// error, so a table with a load-more row would fail on an attribute nothing
// here asks for.
//
// It cannot be turned off through props: React Aria writes it after spreading
// what the call site passed, so `aria-level={undefined}` is overwritten. The
// attribute is taken off the element instead. React writes an attribute only
// when its prop changes between renders, and this one is always 1, so the
// removal holds rather than being undone by the next render. `load more` in
// index.test.tsx pins that it is gone, which is what would notice if React
// Aria stopped setting it or started varying it.
function dropAriaLevel(node: HTMLTableRowElement | null) {
  node?.removeAttribute('aria-level')
}

// What the body draws in place of rows: whatever the call site's function
// returns, inside the box that pads and centres it. A call rather than a
// function written at the prop, for the same reason the others are.
//
// The box is the one thing this adds to React Aria's prop, and the one way
// the table differs from its siblings, which pass theirs straight through and
// draw nothing around it. A table's empty state goes in a spanning cell that
// is not this component's and carries no padding, so without the box the
// content would sit against the table's edge with no room around it.
function emptyContent(
  renderEmptyState: (state: TableBodyRenderProps) => ReactNode,
) {
  // The return type is written out rather than inferred: `ReactNode` is a
  // union that includes a promise, and a function inferred as returning one
  // has to be `async`.
  return (state: TableBodyRenderProps): ReactNode => (
    <span {...stylex.props(styles.empty)}>{renderEmptyState(state)}</span>
  )
}

// The container's class. React Aria takes a plain string here rather than a
// function of render state, since the container reports none — so this is a
// call rather than the function form the other parts pass.
function resizableContainerClassName() {
  return stylex.props(styles.resizableContainer).className ?? ''
}

// The rule a handle draws, from React Aria's own render state — it reports
// the drag and the keyboard focus separately, and the two get one treatment.
function resizerRule(state: ColumnResizerRenderProps): ReactNode {
  return (
    <span
      {...stylex.props(
        styles.resizerRule,
        (state.isResizing || state.isFocusVisible) && styles.resizerRuleActive,
      )}
    />
  )
}

function rowStyles(state: RowRenderProps) {
  return stylex.props(
    styles.row,
    // The same ring a cell and a column header draw, and for the same
    // reason: React Aria moves focus to the row itself, so the row is where
    // it has to show. Unconditional, as it is on those two — `focus` carries
    // its own `:focus-visible`, and the browser's default ring is what shows
    // through without it: a colour and an offset the rest of the table does
    // not use, and one no forced-colours mode is obliged to keep.
    styles.focus,
    state.isSelected && styles.rowSelected,
    // The state layers come from the render state, which is what makes a
    // row that only runs an action — `onRowAction`, a row's `onAction` or
    // `href` — take them as a selectable one does: React Aria reports a row
    // hovered or pressed only when a press does something to it, whether
    // that is selecting it, running its action or dragging it.
    state.isHovered && rowLayers.hovered,
    state.isPressed && rowLayers.pressed,
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
  onResize,
  onResizeEnd,
  resizable = false,
  resizeLabel,
  selectAllLabel,
  selectLabel,
  stickyHeader = false,
  ...props
}: RefAttributes<HTMLTableElement> & TableProps) {
  const table = (
    <RACTable
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.table), props)}
    />
  )

  return (
    <SelectAllLabelContext value={selectAllLabel}>
      <SelectLabelContext value={selectLabel}>
        <ResizeLabelContext value={resizeLabel}>
          <ResizableContext value={resizable}>
            <StickyHeaderContext value={stickyHeader}>
              {resizable ? (
                <RACResizableTableContainer
                  className={resizableContainerClassName()}
                  onResize={onResize}
                  onResizeEnd={onResizeEnd}
                >
                  {table}
                </RACResizableTableContainer>
              ) : (
                table
              )}
            </StickyHeaderContext>
          </ResizableContext>
        </ResizeLabelContext>
      </SelectLabelContext>
    </SelectAllLabelContext>
  )
}

/**
 * The rows. `renderEmptyState` is what it shows when there are none — a table
 * with no rows and nothing to say in their place is a blank area with a
 * header over it.
 *
 * It carries no styles of its own, since every rule a body needs is drawn by
 * the rows inside it, so a `className` here lands on the `<tbody>` through
 * React Aria rather than through a merge.
 */
function TableBody<T extends object = object>({
  renderEmptyState,
  ...props
}: TableBodyProps<T>) {
  return (
    <RACTableBody<T>
      {...props}
      renderEmptyState={
        renderEmptyState === undefined
          ? undefined
          : emptyContent(renderEmptyState)
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
  resizable = false,
  selection = false,
  ...props
}: TableColumnProps) {
  const label = useContext(SelectAllLabelContext)
  const resizeLabel = useContext(ResizeLabelContext)
  const resizableTable = useContext(ResizableContext)
  const sticky = useContext(StickyHeaderContext)

  return (
    <RACColumn
      {...props}
      {...mergeStatefulStyles(columnStyles(selection, sticky), props)}
    >
      {columnContent(
        children,
        selection,
        label,
        resizable && resizableTable,
        resizeLabel,
      )}
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
 * The row the table shows while it is fetching more. React Aria calls
 * `onLoadMore` when this comes into view, and draws it only while
 * `isLoading`. It goes inside `Table.Body`, after the rows.
 */
function TableLoadMore({ label, ...props }: TableLoadMoreProps) {
  return (
    <RACTableLoadMoreItem
      {...props}
      {...mergeStyles(stylex.props(styles.loadingRow), props)}
      ref={dropAriaLevel}
    >
      <span {...stylex.props(styles.loading)}>
        <CollectionLoadMore label={label} size="24px" />
      </span>
    </RACTableLoadMoreItem>
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
Table.LoadMore = TableLoadMore
Table.Row = TableRow

export type {
  TableBodyProps,
  TableCellProps,
  TableColumnProps,
  TableFooterProps,
  TableHeaderProps,
  TableLoadMoreProps,
  TableProps,
  TableRowProps,
}

export {
  TableBody,
  TableCell,
  TableColumn,
  TableFooter,
  TableHeader,
  TableLoadMore,
  TableRow,
}

export default Table
