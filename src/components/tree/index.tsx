import type { ReactNode } from 'react'
import type {
  TreeItemProps as RACTreeItemProps,
  TreeLoadMoreItemProps as RACTreeLoadMoreItemProps,
  TreeProps as RACTreeProps,
  TreeItemRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  Button as RACButton,
  Tree as RACTree,
  TreeHeader as RACTreeHeader,
  TreeItem as RACTreeItem,
  TreeItemContent as RACTreeItemContent,
  TreeLoadMoreItem as RACTreeLoadMoreItem,
  TreeSection as RACTreeSection,
} from 'react-aria-components'

import { ChevronEndGlyph } from '../../glyphs'
import { RowContent } from '../../row'
import { rowStyles } from '../../row/styles'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import Checkbox from '../checkbox'
import ProgressIndicator from '../progress-indicator'

// A list whose rows nest. Each row is the row every list here draws —
// `src/row`, shared with ListItem, ListBox, List and Disclosure — so its
// 56dp floor, body-large headline, body-medium supporting line, state layers
// and disabled treatment are that module's, and a tree beside a list cannot
// drift from it.
//
// The lists page gives no nesting: it draws one flat list. So the two things
// a tree adds beyond that row are the library's own, and both are written
// here with their reasons. The rest — the row, the selection colours, the
// checkbox — is the page's, through the shared module.
//
// Four things are this component's own.
//
// **A level indents by one chevron's width.** React Aria puts the depth on
// each row as a custom property, so the inset is one `calc` against the
// row's own inline padding rather than a style per level. 24dp is the size
// the menus page gives that glyph, which makes a level of nesting exactly as
// wide as the caret that opens it.
//
// **The caret is a button, and React Aria names it.** A `slot="chevron"`
// button is what expands and collapses; React Aria labels it Expand or
// Collapse and composes that with the row, so nothing here names it. It is
// drawn only on a row that has children, since a caret on a leaf says the
// row opens when it does not.
//
// **A selecting tree draws a checkbox, before whatever the row was given.**
// Same rule as List: React Aria reports the mode on each row, so a tree that
// toggles draws one without the call site repeating it, and it always sits
// in the same place so a column of rows reads down.
//
// **`TreeItemContent` has no class to style.** React Aria renders it as a
// `display: contents` gridcell with nothing on it, so the row's own layout
// is drawn by what goes inside rather than by that wrapper.

// `TreeSection`'s props are not re-exported from the package index, only its
// component is — so the type is taken off the component rather than imported
// by a name that is not there to import.
type RACTreeSectionProps<T> = Parameters<typeof RACTreeSection<T>>[0]

// What each row's selection checkbox is called. A context rather than a prop
// on the row, since it is the tree's decision and repeating it per row is
// how the two drift.
const SelectLabelContext = createContext('Select')

const styles = stylex.create({
  // The caret that opens a row. A bare button: the row around it already
  // carries the state layers, and a second set inside them would read as a
  // control sitting on a control.
  chevron: {
    alignItems: 'center',
    // The longhand, not `background: none`: StyleX drops a shorthand it will
    // not compile, and a `<button>` left with its own background shows the
    // browser's grey chrome behind the glyph.
    backgroundColor: 'transparent',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
  },
  chevronExpanded: {
    transform: { ':dir(rtl)': 'rotate(-90deg)', default: 'rotate(90deg)' },
  },
  // Points at what the row opens, so it turns a quarter once it is open. It
  // mirrors under a right-to-left writing mode, as every chevron here does.
  chevronGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
    transitionDuration: motion.durationShort3,
    transitionProperty: 'transform',
    transitionTimingFunction: motion.easingStandard,
  },
  // The container: the page's 8dp above and below the rows, and no colour of
  // its own so the same tree draws correctly on a page and on a surface.
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
  // The depth, as an inset on top of the row's own leading padding. React
  // Aria writes `--tree-item-level` on every row, which is what lets one
  // declaration cover every level rather than a style per depth.
  indent: {
    paddingInlineStart: `calc(${spacing.lg} + (var(--tree-item-level, 1) - 1) * ${spacing.xl})`,
  },
  // The row the tree shows while it is fetching more: the ring on its own,
  // centred, in a row the height of an item.
  loading: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    minBlockSize: '56px',
  },
  // A section, which lays its header and rows out in a column of their own.
  section: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  // Where a caret would be on a row that has none, so a leaf's headline
  // lines up with the headline of a row that opens rather than sliding left.
  spacer: {
    blockSize: '24px',
    flexShrink: 0,
    inlineSize: '24px',
  },
})

type TreeHeaderProps = {
  /** The section's heading. */
  children?: ReactNode
}

type TreeItemProps<T extends object = object> = Omit<
  RACTreeItemProps<T>,
  'children' | 'className' | 'style' | 'textValue'
> &
  TreeItemText & {
    /** The rows nested under this one, as further `Tree.Item` entries. */
    children?: ReactNode
    /** A function may compute the class from the row's render state. */
    className?: RACTreeItemProps<T>['className']
    /** Content before the headline: an avatar, an icon. */
    leading?: ReactNode
    /** A function may compute the style from the row's render state. */
    style?: RACTreeItemProps<T>['style']
    /** A second line under the headline, in the muted role. */
    supporting?: ReactNode
    /** Content after the headline, such as a count or a control. */
    trailing?: ReactNode
  }

// What the row is worth as text, which React Aria requires: a tree row wraps
// its headline in elements, so it cannot read one off the children the way a
// plain-string child would give it. A string headline is taken as the value,
// which is the common case; anything else has to say what it is worth, and
// this is what makes the compiler ask rather than leaving a row unnamed.
type TreeItemText =
  | {
      /** The row's headline — the one thing it is mostly about. */
      headline: string
      /** What typeahead matches the row on. Defaults to the headline. */
      textValue?: string
    }
  | {
      /** The row's headline, as something other than a plain string. */
      headline?: ReactNode
      /** What typeahead matches the row on, and what names it. */
      textValue: string
    }

type TreeLoadMoreProps = Omit<RACTreeLoadMoreItemProps, 'children'> & {
  /**
   * What the row says while it is loading. Read by a screen reader; the ring
   * itself carries no text.
   * @default 'Loading more'
   */
  label?: string
}

type TreeProps<T extends object> = Omit<
  RACTreeProps<T>,
  'className' | 'style'
> & {
  /** A function may compute the class from the tree's render state. */
  className?: RACTreeProps<T>['className']
  /**
   * What each row's selection checkbox is called, for a screen reader. The
   * row's own text is what names the row; this names the box inside it.
   * @default 'Select'
   */
  selectLabel?: string
  /** A function may compute the style from the tree's render state. */
  style?: RACTreeProps<T>['style']
}

type TreeSectionProps<T extends object = object> = Omit<
  RACTreeSectionProps<T>,
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

// The button itself never turns — the glyph inside it does, so the press
// target stays a square whichever way the row is pointing.
function chevronClassName() {
  return stylex.props(styles.chevron).className ?? ''
}

// The caret, or the space it would have taken. Written as a call rather than
// inline at the prop, which is what react-perf's no-new-function-as-prop and
// jsx-no-jsx-as-prop are after; the React Compiler memoises the result on
// its inputs.
//
// A leaf gets the space rather than nothing, so its headline lines up with
// the headline of a sibling that opens.
function chevronFor(state: TreeItemRenderProps): ReactNode {
  if (!state.hasChildItems) {
    return <span {...stylex.props(styles.spacer)} />
  }
  return (
    <RACButton className={chevronClassName} slot="chevron">
      <ChevronEndGlyph
        {...stylex.props(
          styles.chevronGlyph,
          state.isExpanded && styles.chevronExpanded,
        )}
      />
    </RACButton>
  )
}

// What a row draws, from React Aria's render state. The caret comes first,
// then the selection checkbox, then whatever the row was given — one order,
// always, which is what keeps a column of rows reading down.
function itemContent(
  headline: ReactNode,
  leading: ReactNode,
  supporting: ReactNode,
  trailing: ReactNode,
  selectLabel: string,
) {
  return (state: TreeItemRenderProps): ReactNode => (
    <RowContent
      isDisabled={state.isDisabled}
      isSelected={state.isSelected}
      leading={leadingFor(state, leading, selectLabel)}
      supporting={supporting}
      trailing={trailing}
    >
      {headline}
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
  return (state: TreeItemRenderProps) =>
    stylex.props(
      rowStyles.base,
      rowStyles.list,
      rowStyles.interactive,
      styles.indent,
      supporting !== undefined && rowStyles.twoLine,
      state.isSelected && rowStyles.selectedList,
      state.isDisabled && rowStyles.disabled,
    )
}

/**
 * The caret, the selection checkbox, then whatever the row was given. Its
 * return type is written out rather than inferred: `ReactNode` is a union
 * that includes a promise, and a function inferred as returning one has to
 * be `async`.
 */
function leadingFor(
  state: TreeItemRenderProps,
  leading: ReactNode,
  selectLabel: string,
): ReactNode {
  const selects =
    state.selectionBehavior === 'toggle' && state.selectionMode !== 'none'

  return (
    <>
      {chevronFor(state)}
      {selects ? <Checkbox aria-label={selectLabel} slot="selection" /> : null}
      {leading}
    </>
  )
}

// What React Aria matches typeahead on, and what names the row. `TreeItemText`
// makes one of the two a string, so the last branch is unreachable through the
// public type — it is there because destructuring the two apart is what loses
// the narrowing, not because a row can arrive without either.
function textValueFor(textValue: string | undefined, headline: ReactNode) {
  if (textValue !== undefined) {
    return textValue
  }
  return typeof headline === 'string' ? headline : ''
}

/**
 * A list whose rows nest. Which rows are open is React Aria's: pass
 * `expandedKeys` with `onExpandedChange` to control it, or
 * `defaultExpandedKeys` to let it keep its own. Selection is React Aria's
 * too — set `selectionMode` to `single` or `multiple`.
 *
 * ```tsx
 * <Tree aria-label="Label">
 *   <Tree.Item headline="First item" id="first">
 *     <Tree.Item headline="Second item" id="second" />
 *   </Tree.Item>
 * </Tree>
 * ```
 *
 * Each row is the row every list here draws, indented by its depth, with a
 * caret on the rows that have children. Name the tree with `aria-label` or
 * `aria-labelledby` — nothing here labels it for you.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 */
function Tree<T extends object>({
  selectLabel = 'Select',
  ...props
}: TreeProps<T>) {
  return (
    <SelectLabelContext value={selectLabel}>
      <RACTree<T>
        {...props}
        {...mergeStatefulStyles(stylex.props(styles.container), props)}
      />
    </SelectLabelContext>
  )
}

/**
 * A named group of rows. `header` names it, and is what a screen reader
 * reads before the rows inside.
 */
function TreeHeader({ children }: TreeHeaderProps) {
  return (
    <RACTreeHeader {...stylex.props(styles.header)}>{children}</RACTreeHeader>
  )
}

/**
 * One row, and the rows under it. Its slots are the row's: `leading`, the
 * `headline`, `supporting` under it, and `trailing`. Give every row an `id`
 * — that is the key selection and expansion are reported by.
 *
 * Rows nested as `children` are what make it a branch; a row with none is a
 * leaf and draws no caret. `textValue` is what typeahead matches on, and is
 * taken from a plain-string headline when it is not given.
 */
function TreeItem<T extends object = object>({
  children,
  headline,
  leading,
  supporting,
  textValue,
  trailing,
  ...props
}: TreeItemProps<T>) {
  const selectLabel = useContext(SelectLabelContext)

  return (
    <RACTreeItem<T>
      textValue={textValueFor(textValue, headline)}
      {...props}
      {...mergeStatefulStyles(itemStyles(supporting), props)}
    >
      <RACTreeItemContent>
        {itemContent(headline, leading, supporting, trailing, selectLabel)}
      </RACTreeItemContent>
      {children}
    </RACTreeItem>
  )
}

/**
 * The row the tree shows while it is fetching more. React Aria calls
 * `onLoadMore` when this comes into view, and draws it only while
 * `isLoading`.
 */
function TreeLoadMore({ label = 'Loading more', ...props }: TreeLoadMoreProps) {
  return (
    <RACTreeLoadMoreItem
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.loading), props)}
    >
      <ProgressIndicator
        aria-label={label}
        isIndeterminate
        size="24px"
        variant="circular"
      />
    </RACTreeLoadMoreItem>
  )
}

/**
 * A named group of rows, with its heading above them.
 */
function TreeSection<T extends object = object>({
  children,
  header,
  ...props
}: TreeSectionProps<T>) {
  return (
    <RACTreeSection<T>
      {...props}
      {...mergeStyles(stylex.props(styles.section), props)}
    >
      {header === undefined ? null : <TreeHeader>{header}</TreeHeader>}
      {children}
    </RACTreeSection>
  )
}

Tree.Item = TreeItem
Tree.LoadMore = TreeLoadMore
Tree.Section = TreeSection

export type {
  TreeHeaderProps,
  TreeItemProps,
  TreeLoadMoreProps,
  TreeProps,
  TreeSectionProps,
}

export default Tree
