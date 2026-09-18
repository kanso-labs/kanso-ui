import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { rowStyles } from '../row/styles'
import {
  colors,
  sizing,
  spacing,
  typography,
} from '../tokens/design.tokens.stylex'

// The chrome around the row. `src/row` was extracted so a list, menu, tree and
// drawer draw the same row; everything wrapped around it stayed behind in each
// component, so a change to the subhead over a list was three edits with
// nothing failing if one were missed.
//
// Two of these are shared by four components and two by three, and the split
// is the Material Design spec pages rather than convenience:
//
// - `container` and `section` are the box and the grouping, which List,
//   ListBox, Tree and NavigationTree all draw the same way.
// - `header` and `loading` are the lists page's, so they are shared by the
//   three components that follow it. Menu and NavigationTree keep their own,
//   because the menus page and the navigation drawer page give different
//   values — a subhead tighter to the items above it, a label role rather
//   than a title role, and an inset that lines up with pill-shaped rows.
//   Those are the specs disagreeing rather than the code drifting, so each
//   stays where its comment explaining it is.
const collectionStyles = stylex.create({
  container: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    // React Aria moves focus to the item rather than the container, and the
    // row draws its own ring inside its edges.
    outlineStyle: 'none',
    paddingBlock: spacing.sm,
  },
  // The lists page's subhead. Menu's and NavigationTree's are their own.
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
  // A row's worth of height while more items are on the way, so the list does
  // not jump when they land. Menu's is shorter, matching its own row.
  loading: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    minBlockSize: sizing.rowSm,
  },
  section: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
})

/**
 * The render state every collection item this covers reports. Each of React
 * Aria's own is wider than this, and this is the part the three share.
 */
type CollectionItemState = {
  isDisabled: boolean
  isSelected: boolean
}

/**
 * The styles a selectable row in a list takes, as the function React Aria's
 * `className` prop wants.
 *
 * Which of the lists page's three items the row is, read from the content
 * rather than taken as a prop: a row holding all three lines already says it
 * is three lines, and a word for it would be a second place to get it wrong.
 * `ListItem` does the same arithmetic for the static row, and this is where
 * the collection forms share it.
 *
 * The three-line item is the only row whose slots move, which is why it alone
 * carries an alignment as well as a height.
 *
 * `extra` is the one difference between the three callers — Tree passes its
 * indent, which is why it sits where Tree already had it rather than at the
 * end. NavigationTree is not a caller: it draws the drawer variant, branches
 * on an ancestor being current, and reads `isCurrent` where these read
 * `isSelected`.
 */
function rowItemStyles(
  supporting: ReactNode,
  overline: ReactNode,
  extra?: stylex.StyleXStyles,
) {
  const lines =
    (overline === undefined ? 0 : 1) + (supporting === undefined ? 0 : 1)

  return (state: CollectionItemState) =>
    stylex.props(
      rowStyles.base,
      rowStyles.list,
      rowStyles.interactive,
      extra,
      lines === 1 && rowStyles.twoLine,
      lines === 2 && rowStyles.threeLine,
      state.isSelected && rowStyles.selectedList,
      state.isDisabled && rowStyles.disabled,
    )
}

export type { CollectionItemState }
export { collectionStyles, rowItemStyles }
