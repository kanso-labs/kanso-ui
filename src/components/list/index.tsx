import type { ReactNode } from 'react'
import type {
  GridListItemRenderProps,
  GridListItemProps as RACGridListItemProps,
  GridListLoadMoreItemProps as RACGridListLoadMoreItemProps,
  GridListProps as RACGridListProps,
  GridListSectionProps as RACGridListSectionProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  GridList as RACGridList,
  GridListHeader as RACGridListHeader,
  GridListItem as RACGridListItem,
  GridListLoadMoreItem as RACGridListLoadMoreItem,
  GridListSection as RACGridListSection,
} from 'react-aria-components'

import { RowContent } from '../../row'
import { rowStyles } from '../../row/styles'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'
import Checkbox from '../checkbox'
import ProgressIndicator from '../progress-indicator'

// The lists page's interactive list. Each row is the row every list here
// draws — `src/row`, shared with ListItem and ListBox — so the 56dp floor,
// the body-large headline, the body-medium supporting line, the state layers
// and the disabled treatment are all that module's.
//
// ListItem is the static row: one row, on its own, presenting. This is the
// collection that draws the same row and adds selection, keyboard navigation
// between rows, sections and a load-more sentinel. A page with one row uses
// ListItem; a page with a list of them uses this.
//
// It is ListBox's shape over a different React Aria primitive, and the
// difference is what the primitive allows inside a row. A listbox option is
// a leaf: a screen reader reads its text and nothing inside it can be
// focused, so a row with a checkbox or a button in it is not an option. A
// grid list's row is a row of cells, and its contents can be reached and
// operated. That is what a list with a checkbox on every row needs, and it
// is why this exists beside ListBox rather than instead of it.
//
// Three things are this component's own.
//
// **A selecting list draws a checkbox.** React Aria reports the selection
// mode and behaviour on each row, so a list that toggles draws one without
// the call site saying so on every item — and it is the library's Checkbox
// rather than a glyph, so it looks like every other checkbox on the page.
//
// **The checkbox is drawn first, before whatever the row was given.** The
// page draws it leading on a plain row and trailing beside an avatar; one
// place, always the same, is what keeps a column of rows reading down.
//
// **Drag and drop passes straight through.** `dragAndDropHooks` is React
// Aria's and is not wrapped, since what a list can be dropped on is the
// page's business rather than the row's.

// What each row's selection checkbox is called. A context rather than a prop
// on the row, since it is the list's decision and repeating it on every row
// is how the two drift.
const SelectLabelContext = createContext('Select')

const styles = stylex.create({
  // The container: the page's 8dp above and below the rows, and no colour of
  // its own so the same list draws correctly on a page and on a surface.
  container: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    // React Aria moves focus to the row rather than the container, and the
    // row draws its own ring inside its edges.
    outlineStyle: 'none',
    paddingBlock: spacing.sm,
  },
  // A section's heading, at the row's own inline padding so it lines up with
  // the headlines under it, with more room above than below so it reads as
  // belonging to the rows after it.
  header: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.titleSmallFont,
    fontSize: typography.titleSmallSize,
    fontWeight: typography.titleSmallWeight,
    letterSpacing: typography.titleSmallTracking,
    lineHeight: typography.titleSmallLineHeight,
    paddingBlockEnd: spacing.xxs,
    paddingBlockStart: spacing.lg,
    paddingInline: spacing.lg,
  },
  // The row the list shows while it is fetching more: the ring on its own,
  // centred, in a row the height of an item.
  loading: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    minBlockSize: '56px',
  },
  section: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
})

type ListItemProps<T extends object = object> = {
  /** The row's headline — the one thing it is mostly about. */
  children?: ReactNode
  /** A function may compute the class from the row's render state. */
  className?: RACGridListItemProps<T>['className']
  /** Content before the headline: an avatar, an icon. */
  leading?: ReactNode
  /** A function may compute the style from the row's render state. */
  style?: RACGridListItemProps<T>['style']
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
} & Omit<RACGridListItemProps<T>, 'children' | 'className' | 'style'>

type ListLoadMoreProps = Omit<RACGridListLoadMoreItemProps, 'children'> & {
  /**
   * What the row says while it is loading. Read by a screen reader; the ring
   * itself carries no text.
   * @default 'Loading more'
   */
  label?: string
}

type ListProps<T extends object> = Omit<
  RACGridListProps<T>,
  'className' | 'style'
> & {
  /** A function may compute the class from the list's render state. */
  className?: RACGridListProps<T>['className']
  /**
   * What each row's selection checkbox is called, for a screen reader. The
   * row's own text is what names the row; this names the box inside it.
   * @default 'Select'
   */
  selectLabel?: string
  /** A function may compute the style from the list's render state. */
  style?: RACGridListProps<T>['style']
}

type ListSectionProps<T extends object = object> = Omit<
  RACGridListSectionProps<T>,
  'children'
> & {
  /**
   * The rows in the section. A section built from data puts React Aria's
   * `Collection` in here rather than a render function, since the header is
   * an element beside them.
   */
  children?: ReactNode
  /**
   * The section's heading, rendered through React Aria's header so the
   * section is named by it. A section without one is a group with no name.
   */
  header?: ReactNode
}

// What the row draws, from React Aria's render state. Built by a call rather
// than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
//
// The state decides two things: whether a selection checkbox is drawn, and
// which colour the supporting line takes — the muted role holds only while
// the row is drawn on the surface.
function itemContent(
  children: ReactNode,
  leading: ReactNode,
  supporting: ReactNode,
  trailing: ReactNode,
  selectLabel: string,
) {
  return (state: GridListItemRenderProps) => (
    <RowContent
      isDisabled={state.isDisabled}
      isSelected={state.isSelected}
      leading={leadingFor(state, leading, selectLabel)}
      supporting={supporting}
      trailing={trailing}
    >
      {children}
    </RowContent>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so a
// row's state comes from the render state React Aria hands its className.
// The order matters: `disabled` is applied last so it wins over both the
// interactive and the selected branches, and StyleX replaces a property
// whole, so it takes their hover states with it.
//
// A supporting line moves the row from the page's one-line container height
// to its two-line one, which is a floor rather than something the row's own
// box arrives at — see `twoLine` in `src/row/styles.ts`. Taken as an
// argument rather than read from the render state, since React Aria reports
// what a row is doing and not what it holds; the row is built by a call for
// the same reason `itemContent` is.
function itemStyles(supporting: ReactNode) {
  return (state: GridListItemRenderProps) =>
    stylex.props(
      rowStyles.base,
      rowStyles.list,
      rowStyles.interactive,
      supporting !== undefined && rowStyles.twoLine,
      state.isSelected && rowStyles.selectedList,
      state.isDisabled && rowStyles.disabled,
    )
}

/**
 * The selection checkbox, then whatever the row was given. Its return type is
 * written out rather than inferred: `ReactNode` is a union that includes a
 * promise, and a function inferred as returning one has to be `async`.
 */
function leadingFor(
  state: GridListItemRenderProps,
  leading: ReactNode,
  selectLabel: string,
): ReactNode {
  if (state.selectionBehavior !== 'toggle' || state.selectionMode === 'none') {
    return leading
  }
  return (
    <>
      <Checkbox aria-label={selectLabel} slot="selection" />
      {leading}
    </>
  )
}

/**
 * A list of rows one or more of which can be selected. Selection is React
 * Aria's: set `selectionMode` to `single` or `multiple`, and pass
 * `selectedKeys` with `onSelectionChange` to control it or
 * `defaultSelectedKeys` to let it keep its own. A list that only responds to
 * a press takes `onAction` on the row instead.
 *
 * ListItem is the static row — one row, presenting, on its own. This is the
 * collection that draws the same row and adds selection, keyboard navigation
 * between rows, sections and a load-more sentinel.
 *
 * Composed from parts, since a row's slots take arbitrary content:
 * `List.Item`, `List.Section` and `List.LoadMore`. Name the list with
 * `aria-label` or `aria-labelledby` — nothing here labels it for you.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 */
function List<T extends object>({
  selectLabel = 'Select',
  ...props
}: ListProps<T>) {
  return (
    <SelectLabelContext value={selectLabel}>
      <RACGridList
        {...props}
        {...mergeStatefulStyles(stylex.props(styles.container), props)}
      />
    </SelectLabelContext>
  )
}

/**
 * One row. Its slots are the row's: `leading`, the headline as children,
 * `supporting` under it, and `trailing`. Give every row an `id` — that is
 * the key selection is reported by.
 *
 * A list that selects with checkboxes draws one before whatever `leading`
 * holds, from the state React Aria reports rather than from a prop here.
 */
function ListItem<T extends object = object>({
  children,
  leading,
  supporting,
  textValue,
  trailing,
  ...props
}: ListItemProps<T>) {
  const selectLabel = useContext(SelectLabelContext)

  return (
    <RACGridListItem
      textValue={textValue ?? textOf(children)}
      {...props}
      {...mergeStatefulStyles(itemStyles(supporting), props)}
    >
      {itemContent(children, leading, supporting, trailing, selectLabel)}
    </RACGridListItem>
  )
}

/**
 * The row the list shows while it is fetching more. React Aria calls
 * `onLoadMore` when this comes into view, and draws it only while
 * `isLoading`.
 */
function ListLoadMore({ label = 'Loading more', ...props }: ListLoadMoreProps) {
  return (
    <RACGridListLoadMoreItem
      {...props}
      {...mergeStyles(stylex.props(styles.loading), props)}
    >
      <ProgressIndicator
        aria-label={label}
        isIndeterminate
        size="24px"
        variant="circular"
      />
    </RACGridListLoadMoreItem>
  )
}

/**
 * A named group of rows. `header` names it, and is what a screen reader
 * reads before the rows inside.
 */
function ListSection<T extends object = object>({
  children,
  header,
  ...props
}: ListSectionProps<T>) {
  return (
    <RACGridListSection
      {...props}
      {...mergeStyles(stylex.props(styles.section), props)}
    >
      {header === undefined ? null : (
        <RACGridListHeader {...stylex.props(styles.header)}>
          {header}
        </RACGridListHeader>
      )}
      {children}
    </RACGridListSection>
  )
}

// What the row is worth as text, for the thing React Aria does with a row's
// words rather than its element: typeahead. It reads that off the children
// when they are a string and finds nothing when they are not — and a row
// here is always an element, since it wraps its headline. So a plain-string
// headline becomes the text value, and anything else has to say what it is
// worth through `textValue`.
function textOf(children: ReactNode) {
  return typeof children === 'string' ? children : undefined
}

List.Item = ListItem
List.LoadMore = ListLoadMore
List.Section = ListSection

export type { ListItemProps, ListLoadMoreProps, ListProps, ListSectionProps }

export default List
