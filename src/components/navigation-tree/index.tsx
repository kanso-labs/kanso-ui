import type { ReactNode } from 'react'
import type {
  NavigationTreeItemRenderProps,
  NavigationTreeItemProps as RACNavigationTreeItemProps,
  NavigationTreeProps as RACNavigationTreeProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  NavigationTree as RACNavigationTree,
  NavigationTreeHeader as RACNavigationTreeHeader,
  NavigationTreeItem as RACNavigationTreeItem,
  NavigationTreeItemContent as RACNavigationTreeItemContent,
  NavigationTreeSection as RACNavigationTreeSection,
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

// The navigation drawer page's contents: a nested set of links with the
// current one marked. Each row is the row every list here draws — `src/row`,
// shared with ListItem, ListBox, List, Tree and Disclosure — under that
// module's `drawer` variant, which is the page's own 56dp row with a
// label-large label and a secondary-container pill on the current one.
//
// This is Tree's shape over React Aria's navigation primitive, and the
// difference is what the two are for. A tree selects: rows are chosen and
// the choice is reported. A navigation tree navigates: each row is a link,
// and which one is current is decided by matching the route rather than by
// anything the reader selected. So this takes `selectedRoute` where Tree
// takes `selectedKeys`, and has no selection at all — React Aria omits every
// selection prop from it.
//
// Three things are this component's own.
//
// **A level indents by one caret's width**, exactly as Tree does and for the
// same reason: React Aria writes the depth on each row as a custom property,
// and 24dp is the size the drawer page gives its icon, so a level of nesting
// is as wide as the glyph beside it.
//
// **An ancestor of the current row is marked too, and softly.** React Aria
// reports it, and a drawer whose current row is collapsed out of sight would
// otherwise show nothing at all. It takes the label's weight rather than the
// pill, so the trail reads as a trail rather than as a second current row.
//
// **The pill's shape is the library's own.** The page gives the active
// indicator's colour, height and width but keeps its shape behind a token
// set that does not open to a script — the same gap recorded on the buttons
// and lists pages. It is drawn as a full pill, which is what the page's own
// images show and what 56dp of height comes to.

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
    color: 'inherit',
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
  // its own so the same drawer draws correctly on a page and on a surface.
  container: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    // React Aria moves focus to the row rather than the container, and the
    // row draws its own ring inside its edges.
    outlineStyle: 'none',
    paddingBlock: spacing.sm,
  },
  // The row on the way to the current one. The page gives the current row a
  // weight of its own, and this is the lighter half of that pair — enough to
  // say the trail passes through here without claiming to be the end of it.
  currentAncestor: {
    fontWeight: typography.weightMedium,
  },
  // A section's heading. The page's own headline role, which comes to the
  // same values as its label — so the heading is set apart by colour and by
  // the room around it rather than by size.
  header: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    paddingBlockEnd: spacing.xxs,
    paddingBlockStart: spacing.lg,
    // The rows are held 12dp off each edge by their own pill, so the heading
    // lines up with their text rather than with the container.
    paddingInline: `calc(${spacing.lg} + ${spacing.md})`,
  },
  // The depth, as an inset on top of the row's own leading padding. React
  // Aria writes `--tree-item-level` on every row, which is what lets one
  // declaration cover every level rather than a style per depth.
  indent: {
    paddingInlineStart: `calc(${spacing.lg} + (var(--tree-item-level, 1) - 1) * ${spacing.xl})`,
  },
  section: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  // Where a caret would be on a row that has none, so a leaf's label lines
  // up with the label of a row that opens rather than sliding left.
  spacer: {
    blockSize: '24px',
    flexShrink: 0,
    inlineSize: '24px',
  },
})

type NavigationTreeHeaderProps = {
  /** The section's heading. */
  children?: ReactNode
}

type NavigationTreeItemProps<T extends object = object> =
  NavigationTreeItemText &
    Omit<
      RACNavigationTreeItemProps<T>,
      'children' | 'className' | 'style' | 'textValue'
    > & {
      /** The rows nested under this one, as further `NavigationTree.Item` entries. */
      children?: ReactNode
      /** A function may compute the class from the row's render state. */
      className?: RACNavigationTreeItemProps<T>['className']
      /** Content before the label: an icon. */
      leading?: ReactNode
      /** A function may compute the style from the row's render state. */
      style?: RACNavigationTreeItemProps<T>['style']
      /** A second line under the label, in the muted role. */
      supporting?: ReactNode
      /** Content after the label, such as a count. */
      trailing?: ReactNode
    }

// What the row is worth as text, which React Aria requires: a row here wraps
// its label in elements, so it cannot read one off the children the way a
// plain-string child would give it. A string label is taken as the value,
// which is the common case; anything else has to say what it is worth, and
// this is what makes the compiler ask rather than leaving a row unnamed.
type NavigationTreeItemText =
  | {
      /** The row's label — where it goes. */
      label: string
      /** What typeahead matches the row on. Defaults to the label. */
      textValue?: string
    }
  | {
      /** The row's label, as something other than a plain string. */
      label?: ReactNode
      /** What typeahead matches the row on, and what names it. */
      textValue: string
    }

type NavigationTreeProps<T extends object> = Omit<
  RACNavigationTreeProps<T>,
  'className' | 'style'
> & {
  /** A function may compute the class from the tree's render state. */
  className?: RACNavigationTreeProps<T>['className']
  /** A function may compute the style from the tree's render state. */
  style?: RACNavigationTreeProps<T>['style']
}

type NavigationTreeSectionProps<T extends object = object> = Omit<
  Parameters<typeof RACNavigationTreeSection<T>>[0],
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
// A leaf gets the space rather than nothing, so its label lines up with the
// label of a sibling that opens.
function chevronFor(state: NavigationTreeItemRenderProps): ReactNode {
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
// then whatever the row was given — one order, always, which is what keeps a
// column of rows reading down.
function itemContent(
  label: ReactNode,
  leading: ReactNode,
  supporting: ReactNode,
  trailing: ReactNode,
) {
  return (state: NavigationTreeItemRenderProps): ReactNode => (
    <RowContent
      isDisabled={state.isDisabled}
      isSelected={state.isCurrent}
      leading={leadingFor(state, leading)}
      supporting={supporting}
      trailing={trailing}
      variant="drawer"
    >
      {label}
    </RowContent>
  )
}

// StyleX cannot target `[data-current]` on the element it is styling, so a
// row's state comes from the render state React Aria hands its className.
// The order matters: `disabled` is applied last so it wins over both the
// interactive and the current branches, and StyleX replaces a property
// whole, so it takes their hover states with it.
function itemStyles(state: NavigationTreeItemRenderProps) {
  return stylex.props(
    rowStyles.base,
    rowStyles.drawer,
    rowStyles.interactive,
    styles.indent,
    state.isCurrentAncestor && styles.currentAncestor,
    state.isCurrent && rowStyles.selectedDrawer,
    state.isDisabled && rowStyles.disabled,
  )
}

/**
 * The caret, then whatever the row was given. Its return type is written out
 * rather than inferred: `ReactNode` is a union that includes a promise, and
 * a function inferred as returning one has to be `async`.
 */
function leadingFor(
  state: NavigationTreeItemRenderProps,
  leading: ReactNode,
): ReactNode {
  return (
    <>
      {chevronFor(state)}
      {leading}
    </>
  )
}

/**
 * A nested set of links, with the current one marked. Which row is current
 * is React Aria's: give the tree a `selectedRoute` and each row an `href`,
 * and the row whose `href` matches is the current one — its ancestors are
 * marked too, so a collapsed trail still shows where you are.
 *
 * ```tsx
 * <NavigationTree aria-label="Label" selectedRoute="#second">
 *   <NavigationTree.Item href="#first" id="first" label="First item">
 *     <NavigationTree.Item href="#second" id="second" label="Second item" />
 *   </NavigationTree.Item>
 * </NavigationTree>
 * ```
 *
 * There is no selection here, and that is React Aria's design rather than an
 * omission: a navigation tree navigates, so what is current comes from the
 * route rather than from anything the reader picked. `Tree` is the one that
 * selects.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 */
function NavigationTree<T extends object>(props: NavigationTreeProps<T>) {
  return (
    <RACNavigationTree<T>
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.container), props)}
    />
  )
}

/**
 * A named group of rows. `header` names it, and is what a screen reader
 * reads before the rows inside.
 */
function NavigationTreeHeader({ children }: NavigationTreeHeaderProps) {
  return (
    <RACNavigationTreeHeader {...stylex.props(styles.header)}>
      {children}
    </RACNavigationTreeHeader>
  )
}

/**
 * One row, and the rows under it. Give it an `href` — that is what
 * `selectedRoute` is matched against — and an `id`, which is the key
 * expansion is reported by.
 *
 * Rows nested as `children` are what make it a branch; a row with none is a
 * leaf and draws no caret.
 */
function NavigationTreeItem<T extends object = object>({
  children,
  label,
  leading,
  supporting,
  textValue,
  trailing,
  ...props
}: NavigationTreeItemProps<T>) {
  return (
    <RACNavigationTreeItem<T>
      textValue={textValueFor(textValue, label)}
      {...props}
      {...mergeStatefulStyles(itemStyles, props)}
    >
      <RACNavigationTreeItemContent>
        {itemContent(label, leading, supporting, trailing)}
      </RACNavigationTreeItemContent>
      {children}
    </RACNavigationTreeItem>
  )
}

/**
 * A named group of rows, with its heading above them.
 */
function NavigationTreeSection<T extends object = object>({
  children,
  header,
  ...props
}: NavigationTreeSectionProps<T>) {
  return (
    <RACNavigationTreeSection<T>
      {...props}
      {...mergeStyles(stylex.props(styles.section), props)}
    >
      {header === undefined ? null : (
        <NavigationTreeHeader>{header}</NavigationTreeHeader>
      )}
      {children}
    </RACNavigationTreeSection>
  )
}

// What React Aria matches typeahead on, and what names the row.
// `NavigationTreeItemText` makes one of the two a string, so the last branch
// is unreachable through the public type — it is there because destructuring
// the two apart is what loses the narrowing, not because a row can arrive
// without either.
function textValueFor(textValue: string | undefined, label: ReactNode) {
  if (textValue !== undefined) {
    return textValue
  }
  return typeof label === 'string' ? label : ''
}

NavigationTree.Item = NavigationTreeItem
NavigationTree.Section = NavigationTreeSection

export type {
  NavigationTreeHeaderProps,
  NavigationTreeItemProps,
  NavigationTreeProps,
  NavigationTreeSectionProps,
}

export default NavigationTree
