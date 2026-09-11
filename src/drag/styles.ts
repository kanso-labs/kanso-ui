import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  spacing,
  typography,
} from '../tokens/design.tokens.stylex'

// Apart from ./index.tsx so that file exports components alone, which is what
// keeps fast refresh working for it — the same arrangement `src/row` uses.
// index.test.tsx also applies these directly: React Aria draws a drop
// indicator only while a drag is in flight, which a test cannot start.

const dragStyles = stylex.create({
  // The line between two items. It takes no room in the collection's flow
  // while it is not the target, so a list does not shift as a drag passes
  // over it — the height arrives with the state.
  indicator: {
    backgroundColor: 'transparent',
    blockSize: '2px',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    marginBlock: '-1px',
    outlineStyle: 'none',
    // Lifted out of the flow so the rows on either side stay where they are
    // while a drag passes between them.
    position: 'relative',
    zIndex: 1,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  // What is dragged, drawn as the row it came from: the same label type on a
  // surface raised enough to read as lifted off the list.
  preview: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    maxInlineSize: '320px',
    overflow: 'hidden',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

// The line's classes, from React Aria's own render state.
function indicatorClassName(state: { isDropTarget: boolean }) {
  return (
    stylex.props(
      dragStyles.indicator,
      state.isDropTarget && dragStyles.indicatorActive,
    ).className ?? ''
  )
}

export { dragStyles, indicatorClassName }
