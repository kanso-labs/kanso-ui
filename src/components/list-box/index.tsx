import type { ReactNode } from 'react'
import type {
  ListBoxItemRenderProps,
  ListBoxItemProps as RACListBoxItemProps,
  ListBoxLoadMoreItemProps as RACListBoxLoadMoreItemProps,
  ListBoxProps as RACListBoxProps,
  ListBoxSectionProps as RACListBoxSectionProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Header,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  ListBoxLoadMoreItem as RACListBoxLoadMoreItem,
  ListBoxSection as RACListBoxSection,
} from 'react-aria-components'

import { RowContent } from '../../row'
import { rowStyles } from '../../row/styles'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'
import ProgressIndicator from '../progress-indicator'

// The lists page's selectable list. Each option is the row every list here
// draws — `src/row`, shared with ListItem and with every collection the
// coverage plan adds after this one — so the 56dp floor, the body-large
// headline, the body-medium supporting line, the state layers and the
// disabled treatment are all that module's and none of them is written
// again. What is here is the container around those rows, the section and
// its header, and the row the list shows while it is fetching more.
//
// The container takes the page's 8dp above and below its rows and no
// background of its own, which is what lets the same list sit on the page
// and inside a popover without knowing which it is in. Select, ComboBox and
// Autocomplete are each a field plus one of these in an overlay, so that is
// not a detail — it is the reason the container is transparent.
//
// A selected option takes primary container and on primary container, the
// page's selected state, through the row module's `list` variant. The page
// also draws a checkbox in the trailing slot on a list that selects more
// than one; that is left to the call site rather than added by the option,
// since which of the two affordances a list wants is the list's decision and
// the slot is already there for it.
//
// Three things are worth knowing about how this maps onto React Aria.
//
// **The option's styles are a function of its render state.** StyleX cannot
// target `[data-selected]` on the element it is styling, so selection,
// disabled and the rest are read from the state React Aria hands the
// `className` function — the same mechanism Tabs and Chip use, wrapped in
// `mergeStatefulStyles` so a call site's own `className` survives.
//
// **A section's heading is React Aria's `Header`**, which is what points the
// section's `aria-labelledby` at it. The lists page names no subhead in its
// anatomy, so the type is title-small in on surface variant at the row's own
// 16dp inline padding, which is what the page's own guidance draws.
//
// **The load-more row is a sentinel, not a button.** React Aria's
// `ListBoxLoadMoreItem` calls `onLoadMore` when it comes into view and
// renders whatever it is given while `isLoading`; ours renders the ring, so
// a list that fetches as it scrolls says so with the same indicator every
// other pending state in the library uses.

const styles = stylex.create({
  // The container: the page's 8dp above and below the rows, and no colour of
  // its own so the same list draws correctly on the page and on a popover's
  // surface.
  container: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    // React Aria moves focus to the option rather than the container, and
    // the row draws its own ring inside its edges.
    outlineStyle: 'none',
    paddingBlock: spacing.sm,
  },
  // A section's heading, at the row's own inline padding so it lines up with
  // the headlines under it.
  header: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.titleSmallFont,
    fontSize: typography.titleSmallSize,
    fontWeight: typography.titleSmallWeight,
    letterSpacing: typography.titleSmallTracking,
    lineHeight: typography.titleSmallLineHeight,
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
  // The row the list shows while it is fetching more: the ring on its own,
  // centred, in a row the height of an option.
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

type ListBoxItemProps<T extends object = object> = {
  /** The option's headline — the one thing it is mostly about. */
  children?: ReactNode
  /** A function may compute the class from the option's render state. */
  className?: RACListBoxItemProps<T>['className']
  /** Content before the headline: an avatar, an icon, a checkbox. */
  leading?: ReactNode
  /** A function may compute the style from the option's render state. */
  style?: RACListBoxItemProps<T>['style']
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
} & Omit<RACListBoxItemProps<T>, 'children' | 'className' | 'style'>

type ListBoxLoadMoreProps = Omit<RACListBoxLoadMoreItemProps, 'children'> & {
  /**
   * What the row says while it is loading. Read by a screen reader; the ring
   * itself carries no text.
   * @default 'Loading more'
   */
  label?: string
}

type ListBoxProps<T extends object> = Omit<
  RACListBoxProps<T>,
  'className' | 'style'
> & {
  /** A function may compute the class from the list's render state. */
  className?: RACListBoxProps<T>['className']
  /** A function may compute the style from the list's render state. */
  style?: RACListBoxProps<T>['style']
}

type ListBoxSectionProps<T extends object = object> = Omit<
  RACListBoxSectionProps<T>,
  'children'
> & {
  /**
   * The options in the section. A section built from data puts React Aria's
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

// What the option draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
//
// It reads the render state for one thing: a selected row's supporting line
// takes the selected container's own content role, since the muted role it
// draws on the surface is a second colour family over that container and
// the pair is not guaranteed to be readable.
function itemContent(
  children: ReactNode,
  leading: ReactNode,
  supporting: ReactNode,
  trailing: ReactNode,
) {
  return (state: ListBoxItemRenderProps) => (
    <RowContent
      isSelected={state.isSelected}
      leading={leading}
      supporting={supporting}
      trailing={trailing}
    >
      {children}
    </RowContent>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so an
// option's state comes from the render state React Aria hands its className.
// The order matters: `disabled` is applied last so it wins over both the
// interactive and the selected branches, and StyleX replaces a property
// whole, so it takes their hover states with it.
function itemStyles(state: ListBoxItemRenderProps) {
  return stylex.props(
    rowStyles.base,
    rowStyles.list,
    rowStyles.interactive,
    state.isSelected && rowStyles.selectedList,
    state.isDisabled && rowStyles.disabled,
  )
}

/**
 * A list of options one or more of which can be selected. Selection is React
 * Aria's: set `selectionMode` to `single` or `multiple`, and pass
 * `selectedKeys` with `onSelectionChange` to control it or
 * `defaultSelectedKeys` to let it keep its own. A list that only responds to
 * a press takes `onAction` on the option instead.
 *
 * Composed from parts, since an option's slots take arbitrary content:
 * `ListBox.Item`, `ListBox.Section` and `ListBox.LoadMore`. Name the list
 * with `aria-label` or `aria-labelledby` — nothing here labels it for you.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 */
function ListBox<T extends object>(props: ListBoxProps<T>) {
  return (
    <RACListBox
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.container), props)}
    />
  )
}

/**
 * One option. Its slots are the row's: `leading`, the headline as children,
 * `supporting` under it, and `trailing`. Give every option an `id` — that is
 * the key selection is reported by.
 */
function ListBoxItem<T extends object = object>({
  children,
  leading,
  supporting,
  trailing,
  ...props
}: ListBoxItemProps<T>) {
  return (
    <RACListBoxItem {...props} {...mergeStatefulStyles(itemStyles, props)}>
      {itemContent(children, leading, supporting, trailing)}
    </RACListBoxItem>
  )
}

/**
 * The row the list shows while it is fetching more. React Aria calls
 * `onLoadMore` when this comes into view, and draws it only while
 * `isLoading` — so a list that pages as it scrolls needs nothing else.
 */
function ListBoxLoadMore({
  label = 'Loading more',
  ...props
}: ListBoxLoadMoreProps) {
  return (
    <RACListBoxLoadMoreItem
      {...props}
      {...mergeStyles(stylex.props(styles.loading), props)}
    >
      <ProgressIndicator
        aria-label={label}
        isIndeterminate
        size="24px"
        variant="circular"
      />
    </RACListBoxLoadMoreItem>
  )
}

/**
 * A named group of options. `header` names it, and is what a screen reader
 * reads before the options inside.
 */
function ListBoxSection<T extends object = object>({
  children,
  header,
  ...props
}: ListBoxSectionProps<T>) {
  return (
    <RACListBoxSection
      {...props}
      {...mergeStyles(stylex.props(styles.section), props)}
    >
      {header === undefined ? null : (
        <Header {...stylex.props(styles.header)}>{header}</Header>
      )}
      {children}
    </RACListBoxSection>
  )
}

ListBox.Item = ListBoxItem
ListBox.LoadMore = ListBoxLoadMore
ListBox.Section = ListBoxSection

export type {
  ListBoxItemProps,
  ListBoxLoadMoreProps,
  ListBoxProps,
  ListBoxSectionProps,
}

export default ListBox
