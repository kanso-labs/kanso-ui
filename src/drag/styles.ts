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

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const dragStyles = stylex.create({
  // The line between two items. It takes no room in the collection's flow
  // while it is not the target, so a list does not shift as a drag passes
  // over it — the height arrives with the state.
  indicator: {
    backgroundColor: 'transparent',
    blockSize: '2px',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    marginBlock: '-1px',
    outlineStyle: 'none',
    // Lifted out of the flow so the rows on either side stay where they are
    // while a drag passes between them.
    position: 'relative',
    zIndex: 1,
  },
  // Under forced colours, which paint the fill in `Canvas`, a `Highlight`
  // border filling the line's 2dp instead, so a drag still shows where it
  // will land.
  indicatorActive: {
    backgroundColor: colors.primary,
    borderBlockStartColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderBlockStartStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderBlockStartWidth: { default: null, [FORCED_COLORS]: '2px' },
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
