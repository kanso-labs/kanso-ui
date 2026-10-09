import * as stylex from '@stylexjs/stylex'

import {
  colors,
  media,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The destinations NavigationBar and NavigationRail both draw, in the three
// forms the two pages give them. Apart from either component so the two
// cannot drift, and outside `src/components` for the reason src/row gives.
//
// A vertical destination puts its icon in the page's 56dp by 32dp active
// indicator with the label 4dp under it, in label medium: the navigation bar
// below the medium breakpoint, and the collapsed rail. A horizontal one is a
// pill holding the icon and the label side by side, 16dp in at either end:
// the bar at and above the medium breakpoint at 40dp with 4dp between the
// two, and the expanded rail at 56dp with 8dp between them, in label large.
//
// The current destination's pill is the secondary container, with its icon
// in on secondary container and, under the pill, its label in secondary;
// every other is on surface variant. A label set inside the pill, as a
// horizontal destination sets it, takes on secondary container instead — the
// library's own call. Secondary over secondary container is not a pair a
// scheme is held to, and the Poster scheme's came to 4:1, short of the 4.5:1
// text needs; on secondary container is the pair every scheme guarantees.
//
// The hover, focus and pressed layers are the on secondary container role
// over whatever the pill is, at the pages' 8%, 10% and 10%, drawn on the
// pill — the indicator in a vertical destination, the whole destination in a
// horizontal one. They are applied in that order, so where two hold the
// later wins, as the pages draw one layer at a time. A focused destination's
// ring goes around the same pill; ./index.tsx says whose ring it is.
//
// Under forced colours the mode paints the secondary container over in its
// background, which left the current destination looking like every other.
// The pill takes a 2px border in `Highlight` there, which the mode keeps.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// The pill's ground and the layers over it, written out whole for each
// ground, since StyleX replaces a property whole.
const HOVERED_OVER_NOTHING = `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), transparent)`
const FOCUSED_OVER_NOTHING = `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), transparent)`
const PRESSED_OVER_NOTHING = `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), transparent)`
const HOVERED_OVER_CURRENT = `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`
const FOCUSED_OVER_CURRENT = `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`
const PRESSED_OVER_CURRENT = `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`

// What every destination draws whatever its form.
const navigationItemStyles = stylex.create({
  // An icon at the pages' 24dp. An icon drawn in `em` takes its size from
  // here.
  icon: {
    alignItems: 'center',
    display: 'flex',
    fontSize: '24px',
    justifyContent: 'center',
  },
  // A destination React Aria disables: the 38% every disabled control takes,
  // icon and label alike, and no layer.
  // `GrayText` under forced colours, where an enabled destination is
  // `LinkText`: without it a disabled one was `CanvasText`, told apart by hue
  // alone.
  itemDisabled: {
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
      [FORCED_COLORS]: 'GrayText',
    },
    cursor: 'default',
  },
  // The label never wraps: a destination's name is a word or two, and one
  // broken over two lines pushed its neighbours apart.
  label: {
    color: colors.onSurfaceVariant,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  link: {
    alignItems: 'center',
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    outlineStyle: 'none',
    position: 'relative',
    textDecorationLine: 'none',
  },
  // The pill's own colours, which carry the icon's.
  pill: {
    backgroundColor: 'transparent',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
  },
})

// The navigation bar's destination: vertical below the medium breakpoint and
// horizontal at it and above, so every value that differs is a pair.
const barItemStyles = stylex.create({
  indicator: {
    alignItems: 'center',
    blockSize: { default: '32px', [media.medium]: 'auto' },
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    inlineSize: { default: '56px', [media.medium]: 'auto' },
    justifyContent: 'center',
  },
  indicatorCurrent: {
    backgroundColor: {
      default: colors.secondaryContainer,
      [media.medium]: 'transparent',
    },
    borderColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderStyle: {
      default: null,
      [FORCED_COLORS]: { default: 'solid', [media.medium]: 'none' },
    },
    borderWidth: { default: null, [FORCED_COLORS]: '2px' },
    color: colors.onSecondaryContainer,
  },
  indicatorFocused: {
    backgroundColor: {
      default: FOCUSED_OVER_NOTHING,
      [media.medium]: 'transparent',
    },
  },
  indicatorFocusedCurrent: {
    backgroundColor: {
      default: FOCUSED_OVER_CURRENT,
      [media.medium]: 'transparent',
    },
  },
  indicatorHovered: {
    backgroundColor: {
      default: HOVERED_OVER_NOTHING,
      [media.medium]: 'transparent',
    },
  },
  indicatorHoveredCurrent: {
    backgroundColor: {
      default: HOVERED_OVER_CURRENT,
      [media.medium]: 'transparent',
    },
  },
  indicatorPressed: {
    backgroundColor: {
      default: PRESSED_OVER_NOTHING,
      [media.medium]: 'transparent',
    },
  },
  indicatorPressedCurrent: {
    backgroundColor: {
      default: PRESSED_OVER_CURRENT,
      [media.medium]: 'transparent',
    },
  },
  // The ring around the indicator, which is the pill only below the medium
  // breakpoint. The library's shared ring is solid wherever it is applied,
  // and this one has to give way at a width, so it is spelled out here.
  indicatorRing: {
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { default: 'solid', [media.medium]: 'none' },
    outlineWidth: '2px',
  },
  // Each vertical destination shares the bar's width with the others; a
  // horizontal one is as wide as its pill, the group centred in the bar.
  item: {
    blockSize: { default: '100%', [media.medium]: '40px' },
    borderRadius: radii.pill,
    flexBasis: { default: 0, [media.medium]: 'auto' },
    flexDirection: { default: 'column', [media.medium]: 'row' },
    flexGrow: { default: 1, [media.medium]: 0 },
    gap: spacing.xs,
    justifyContent: 'center',
    minInlineSize: 0,
    paddingBlock: { default: '6px', [media.medium]: 0 },
    paddingInline: { default: 0, [media.medium]: spacing.lg },
  },
  itemCurrent: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: colors.secondaryContainer,
    },
    borderColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderStyle: {
      default: null,
      [FORCED_COLORS]: { default: 'none', [media.medium]: 'solid' },
    },
    borderWidth: { default: null, [FORCED_COLORS]: '2px' },
  },
  itemFocused: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: FOCUSED_OVER_NOTHING,
    },
  },
  itemFocusedCurrent: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: FOCUSED_OVER_CURRENT,
    },
  },
  itemHovered: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: HOVERED_OVER_NOTHING,
    },
  },
  itemHoveredCurrent: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: HOVERED_OVER_CURRENT,
    },
  },
  itemPressed: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: PRESSED_OVER_NOTHING,
    },
  },
  itemPressedCurrent: {
    backgroundColor: {
      default: 'transparent',
      [media.medium]: PRESSED_OVER_CURRENT,
    },
  },
  // The ring around the whole destination, the pill at the medium breakpoint
  // and above.
  itemRing: {
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { default: 'none', [media.medium]: 'solid' },
    outlineWidth: '2px',
  },
  label: {
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
    maxInlineSize: '100%',
  },
  labelCurrent: {
    color: {
      default: colors.secondary,
      [media.medium]: colors.onSecondaryContainer,
    },
  },
})

// The collapsed rail's destination: always vertical, the pitch from one to
// the next the rail's 4dp gap.
const collapsedItemStyles = stylex.create({
  indicator: {
    alignItems: 'center',
    blockSize: '32px',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    inlineSize: '56px',
    justifyContent: 'center',
  },
  indicatorCurrent: {
    backgroundColor: colors.secondaryContainer,
    borderColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '2px' },
    color: colors.onSecondaryContainer,
  },
  indicatorFocused: {
    backgroundColor: FOCUSED_OVER_NOTHING,
  },
  indicatorFocusedCurrent: {
    backgroundColor: FOCUSED_OVER_CURRENT,
  },
  indicatorHovered: {
    backgroundColor: HOVERED_OVER_NOTHING,
  },
  indicatorHoveredCurrent: {
    backgroundColor: HOVERED_OVER_CURRENT,
  },
  indicatorPressed: {
    backgroundColor: PRESSED_OVER_NOTHING,
  },
  indicatorPressedCurrent: {
    backgroundColor: PRESSED_OVER_CURRENT,
  },
  // The page's 64dp destination: 6dp above the indicator and below the
  // label, which falls between two steps of the spacing scale and so is
  // written out. 4dp in from either edge of the rail, which leaves a label
  // 88dp of its 96. At the 16dp a horizontal destination is set in by, a
  // two-word label was cut short in a rail that had room for it.
  item: {
    flexDirection: 'column',
    gap: spacing.xs,
    inlineSize: '100%',
    justifyContent: 'center',
    paddingBlock: '6px',
    paddingInline: spacing.xs,
  },
  itemCurrent: {},
  itemFocused: {},
  itemFocusedCurrent: {},
  itemHovered: {},
  itemHoveredCurrent: {},
  itemPressed: {},
  itemPressedCurrent: {},
  label: {
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
    maxInlineSize: '100%',
  },
  labelCurrent: {
    color: colors.secondary,
  },
})

// The expanded rail's destination: always horizontal, a 56dp pill as wide as
// what it holds.
const expandedItemStyles = stylex.create({
  indicator: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  indicatorCurrent: {
    color: colors.onSecondaryContainer,
  },
  indicatorFocused: {},
  indicatorFocusedCurrent: {},
  indicatorHovered: {},
  indicatorHoveredCurrent: {},
  indicatorPressed: {},
  indicatorPressedCurrent: {},
  item: {
    alignSelf: 'flex-start',
    blockSize: '56px',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    maxInlineSize: '100%',
    paddingInline: spacing.lg,
  },
  itemCurrent: {
    backgroundColor: colors.secondaryContainer,
    borderColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '2px' },
  },
  itemFocused: {
    backgroundColor: FOCUSED_OVER_NOTHING,
  },
  itemFocusedCurrent: {
    backgroundColor: FOCUSED_OVER_CURRENT,
  },
  itemHovered: {
    backgroundColor: HOVERED_OVER_NOTHING,
  },
  itemHoveredCurrent: {
    backgroundColor: HOVERED_OVER_CURRENT,
  },
  itemPressed: {
    backgroundColor: PRESSED_OVER_NOTHING,
  },
  itemPressedCurrent: {
    backgroundColor: PRESSED_OVER_CURRENT,
  },
  label: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  labelCurrent: {
    color: colors.onSecondaryContainer,
  },
})

export {
  barItemStyles,
  collapsedItemStyles,
  expandedItemStyles,
  navigationItemStyles,
}
