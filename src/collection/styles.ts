import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { hasContent } from '../render/content'
import { rowStyles } from '../row/styles'
import {
  colors,
  sizing,
  spacing,
  stateLayerOpacity,
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
// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

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
  // A collection a drop would land on as a whole — an empty one, or one
  // that takes a drop anywhere in it. The drop target a row draws, over the
  // whole box: the drop indicator's 2dp primary as an outline inside it, on
  // a primary layer at the hover opacity.
  dropTarget: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
    outlineColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: '-2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  // The row a collection shows when nothing is left in it. The row's own box
  // and headline, from `src/row`, in the muted role, since it is not one of
  // the items and nothing in it responds to a press.
  empty: {
    color: colors.onSurfaceVariant,
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
  // The status that announces an empty collection — see `CollectionStatus`.
  // Clipped to a 1px box rather than `display: none`, which would take it
  // out of the accessibility tree along with what it says, and positioned
  // out of the flow so it takes no place in the layout round it.
  status: {
    blockSize: '1px',
    boxSizing: 'border-box',
    clipPath: 'inset(50%)',
    inlineSize: '1px',
    overflow: 'hidden',
    position: 'absolute',
    whiteSpace: 'nowrap',
  },
})

/**
 * The render state every collection item this covers reports. Each of React
 * Aria's own is wider than this, and this is the part the three share.
 */
type CollectionItemState = {
  isDisabled: boolean
  /** Reported only where the collection drags; see `dragging` in `src/row`. */
  isDragging?: boolean
  /** Reported only where the collection takes drops onto its items. */
  isDropTarget?: boolean
  isFocusVisible: boolean
  isHovered: boolean
  isPressed: boolean
  isSelected: boolean
}

/**
 * A collection's own box, as the function React Aria's `className` prop
 * wants: the container, and the drop target while a drop would land on the
 * collection as a whole. List, ListBox and Tree each draw it.
 */
function containerClasses(state: { isDropTarget: boolean }) {
  return stylex.props(
    collectionStyles.container,
    state.isDropTarget && collectionStyles.dropTarget,
  )
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
    (hasContent(overline) ? 1 : 0) + (hasContent(supporting) ? 1 : 0)

  return (state: CollectionItemState) =>
    stylex.props(
      rowStyles.base,
      rowStyles.list,
      extra,
      lines === 1 && rowStyles.twoLine,
      lines === 2 && rowStyles.threeLine,
      state.isDragging === true && rowStyles.dragging,
      state.isSelected && rowStyles.selectedList,
      state.isHovered && rowStyles.hovered,
      state.isFocusVisible && rowStyles.focusVisible,
      state.isPressed && rowStyles.pressed,
      state.isDropTarget === true && rowStyles.dropTarget,
      state.isDisabled && rowStyles.disabled,
    )
}

export type { CollectionItemState }
export { collectionStyles, containerClasses, rowItemStyles }
