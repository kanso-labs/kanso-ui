'use client'

import type {
  PointerEvent,
  PointerEventHandler,
  ReactNode,
  RefAttributes,
} from 'react'
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

import { CollectionLoadMore } from '../../collection'
import {
  collectionStyles,
  containerClasses,
  rowItemStyles,
} from '../../collection/styles'
import { textOf } from '../../collection/text'
import { useRipple } from '../../hooks/useRipple'
import { RowContent } from '../../row'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import Checkbox from '../checkbox'

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
// is how the two drift. Undefined unless the list is given one, which
// leaves the name React Aria gives in the reader's locale.
const SelectLabelContext = createContext<string | undefined>(undefined)

// Whether the list makes every row act on a press: it selects, it has an
// `onAction` of its own, or its rows drag. A row given an `onAction` or an
// `href` acts whatever this says. A context for the reason SelectLabelContext
// is one: it is the list's to decide, and a row reads it rather than taking
// it again as a prop.
const RowsActContext = createContext(false)

// What a press inside a row leaves to the element it lands on: a control of
// the row's own content, which answers the press itself. A label is in the
// list because a native checkbox or radio is pressed through the label
// around it. React Aria's own controls, this library's Switch and Checkbox
// among them, stop the pointerdown of a press they take, so the row never
// hears one.
const NESTED_CONTROL =
  'a[href], button, input, label, select, textarea, [role="button"], [role="checkbox"], [role="link"], [role="switch"]'

type ListLoadMoreProps = Omit<RACGridListLoadMoreItemProps, 'children'> & {
  /**
   * What the row says while it is loading. Read by a screen reader; the ring
   * itself carries no text.
   * Left out, it is the word for it in the I18nProvider's locale — "Loading
   * more" in English.
   */
  label?: string
}

type ListProps<T extends object = object> = {
  /** A function may compute the class from the list's render state. */
  className?: RACGridListProps<T>['className']
  /**
   * How a press selects. `toggle` draws a checkbox on every row, and a press
   * adds that row to the selection or takes it out. `replace` draws none, a
   * press makes that row the selection, and the arrow keys carry the
   * selection with the focus; where rows also take an action, a click
   * selects and a double click acts. Left out, a `single` list replaces and
   * any other toggles, since a single choice drawn as checkboxes unticks one
   * box whenever another is ticked.
   */
  selectionBehavior?: RACGridListProps<T>['selectionBehavior']
  /**
   * What each row's selection checkbox is called, for a screen reader. The
   * row's own text is what names the row; this names the box inside it.
   * Left out, React Aria names it in the reader's locale — "Select" in
   * English.
   */
  selectLabel?: string
  /** A function may compute the style from the list's render state. */
  style?: RACGridListProps<T>['style']
} & Omit<RACGridListProps<T>, 'className' | 'selectionBehavior' | 'style'>

// `Row` rather than `Item`, though the component is `List.Item`, because
// `ListItemProps` is the standalone `ListItem` component's and both are
// exported from the package. The two overlap on four props, so a call site
// reaching for the obvious name got something that typechecked until it
// passed `textValue`, and an error pointing at `onClick` rather than at the
// name. `row` is what this file and `src/row` call the thing anyway.
type ListRowProps<T extends object = object> = {
  /** The row's headline — the one thing it is mostly about. */
  children?: ReactNode
  /** A function may compute the class from the row's render state. */
  className?: RACGridListItemProps<T>['className']
  /** Content before the headline: an avatar, an icon. */
  leading?: ReactNode
  /**
   * A line above the headline, in the page's label-small and the same muted
   * role the supporting line takes — a category, a date, a status. Given
   * alongside `supporting` it makes the row the page's three-line item.
   */
  overline?: ReactNode
  /** A function may compute the style from the row's render state. */
  style?: RACGridListItemProps<T>['style']
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
} & Omit<RACGridListItemProps<T>, 'children' | 'className' | 'style'>

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
  overline: ReactNode,
  supporting: ReactNode,
  trailing: ReactNode,
  selectLabel: string | undefined,
  ripple: ReactNode,
) {
  return (state: GridListItemRenderProps) => (
    <>
      <RowContent
        isDisabled={state.isDisabled}
        isSelected={state.isSelected}
        leading={leading}
        overline={overline}
        selection={selectionFor(state, selectLabel)}
        supporting={supporting}
        trailing={trailing}
      >
        {children}
      </RowContent>
      {state.isDisabled ? null : ripple}
    </>
  )
}

// Whether a press on the row began on a control inside it rather than on the
// row itself. `contains` answers false for no control at all, and true for
// the row itself, which the second half rules out.
function landsOnControl(event: PointerEvent<HTMLDivElement>) {
  const control =
    event.target instanceof Element
      ? event.target.closest(NESTED_CONTROL)
      : null
  return (
    event.currentTarget.contains(control) && control !== event.currentTarget
  )
}

/**
 * A list of rows one or more of which can be selected. Selection is React
 * Aria's: set `selectionMode` to `single` or `multiple`, and pass
 * `selectedKeys` with `onSelectionChange` to control it or
 * `defaultSelectedKeys` to let it keep its own. A list that only responds to
 * a press takes `onAction` on the row instead.
 *
 * A `multiple` list draws a checkbox on every row. A `single` one draws none
 * and marks the chosen row alone, since a checkbox promises a choice that
 * leaves the others standing; `selectionBehavior` overrides either.
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
  selectionBehavior,
  selectLabel,
  ...props
}: ListProps<T> & RefAttributes<HTMLDivElement>) {
  // React Aria's own reading of a draggable collection: hooks that can build
  // the drag state.
  const rowsAct =
    (props.selectionMode ?? 'none') !== 'none' ||
    props.onAction !== undefined ||
    props.dragAndDropHooks?.useDraggableCollectionState !== undefined

  return (
    <SelectLabelContext value={selectLabel}>
      <RowsActContext value={rowsAct}>
        <RACGridList
          {...props}
          {...mergeStatefulStyles(containerClasses, props)}
          // React Aria's own default is `toggle` in every mode. Read with `??`
          // rather than placed before the spread, so a wrapper forwarding an
          // unset prop still gets the default.
          selectionBehavior={
            selectionBehavior ??
            (props.selectionMode === 'single' ? 'replace' : 'toggle')
          }
        />
      </RowsActContext>
    </SelectLabelContext>
  )
}

/**
 * The row the list shows while it is fetching more. React Aria calls
 * `onLoadMore` when this comes into view, and draws it only while
 * `isLoading`.
 */
function ListLoadMore({
  label,
  ...props
}: ListLoadMoreProps & RefAttributes<HTMLDivElement>) {
  return (
    <RACGridListLoadMoreItem
      {...props}
      {...mergeStyles(stylex.props(collectionStyles.loading), props)}
    >
      <CollectionLoadMore diameter="24px" label={label} />
    </RACGridListLoadMoreItem>
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
function ListRow<T extends object = object>({
  children,
  leading,
  onContextMenu,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  overline,
  supporting,
  textValue,
  trailing,
  ...props
}: ListRowProps<T> & RefAttributes<HTMLDivElement>) {
  const selectLabel = useContext(SelectLabelContext)
  const acts =
    useContext(RowsActContext) ||
    props.onAction !== undefined ||
    props.href !== undefined
  // The press ripple ListItem draws, so a row looks the same pressed in a
  // list as on its own, and only on a row a press acts on, as ListItem draws
  // it only on an interactive one: a row that does nothing on a press should
  // not look as though it did. The call site's pointer handlers are handed to
  // the hook to merge, for the reason ListItem gives, apart from the press
  // itself, which `startsRipple` hands on. React Aria keeps a row's clicks
  // for its own press handling, so the press ends on the release.
  const ripple = useRipple<HTMLDivElement>(
    acts,
    {
      onContextMenu,
      onPointerCancel,
      onPointerLeave,
      onPointerUp,
    },
    true,
  )

  return (
    <RACGridListItem
      textValue={textValue ?? textOf(children)}
      {...ripple.handlers}
      onPointerDown={startsRipple(ripple.handlers.onPointerDown, onPointerDown)}
      {...props}
      {...mergeStatefulStyles(rowItemStyles(supporting, overline), props)}
    >
      {itemContent(
        children,
        leading,
        overline,
        supporting,
        trailing,
        selectLabel,
        ripple.surface,
      )}
    </RACGridListItem>
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
}: ListSectionProps<T> & RefAttributes<HTMLDivElement>) {
  return (
    <RACGridListSection
      {...props}
      {...mergeStyles(stylex.props(collectionStyles.section), props)}
    >
      {header === undefined ? null : (
        <RACGridListHeader {...stylex.props(collectionStyles.header)}>
          {header}
        </RACGridListHeader>
      )}
      {children}
    </RACGridListSection>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so a
// row's state comes from the render state React Aria hands its className.
// The order matters: `disabled` is applied last so its ground and colour
// win over the selected container's. The state layers come from the render
// state as well — see `focusVisible` in src/row/styles.ts — and React Aria
// reports none of them on a disabled row, so nothing has to outrank them.
//
// A supporting line moves the row from the page's one-line container height
// to its two-line one, which is a floor rather than something the row's own
// box arrives at — see `twoLine` in `src/row/styles.ts`. Taken as an
// argument rather than read from the render state, since React Aria reports
// what a row is doing and not what it holds; the row is built by a call for
// the same reason `itemContent` is.
/**
 * The selection checkbox, while the list toggles. The row draws it ahead of
 * whatever `leading` holds.
 */
function selectionFor(
  state: GridListItemRenderProps,
  selectLabel: string | undefined,
) {
  if (state.selectionBehavior !== 'toggle' || state.selectionMode === 'none') {
    return null
  }
  return <Checkbox aria-label={selectLabel} slot="selection" />
}

// The row's press: the ripple's, unless it lands on a control inside the
// row, which answers it itself — a trailing button pressed spread the row's
// ripple across the whole row. The call site's own handler runs either way,
// after the ripple's, as the hook orders the two. Built by a call rather than
// written at the prop, for the reason `itemContent` gives.
function startsRipple(
  ripple: PointerEventHandler<HTMLDivElement> | undefined,
  own: PointerEventHandler<HTMLDivElement> | undefined,
) {
  return (event: PointerEvent<HTMLDivElement>) => {
    if (!landsOnControl(event)) {
      ripple?.(event)
    }
    own?.(event)
  }
}

List.Item = ListRow
List.LoadMore = ListLoadMore
List.Section = ListSection

export type { ListLoadMoreProps, ListProps, ListRowProps, ListSectionProps }

export { ListLoadMore, ListRow, ListSection }

export default List
