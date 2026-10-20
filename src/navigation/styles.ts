import * as stylex from '@stylexjs/stylex'

import {
  colors,
  media,
  motion,
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
// A change from one of those states to another fades, over the pages' short
// duration on the standard curve, rather than landing in one frame. A press
// also draws the library's ripple over the pressed layer, clipped to the
// pill: inside the indicator in a vertical destination, which positions it,
// and across the whole destination in a horizontal one, whose indicator is
// left unpositioned so the ripple fills the link and takes the indicator's
// pill corner.
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
  // The pill's ground and the colours of the icon and the label, faded from
  // one state to the next, and at once for a reader who asked for less
  // motion. On the link, the indicator and the label alike: the pill is the
  // link or the indicator by form, and each of the three sets its own
  // colour.
  fade: {
    transitionDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationShort2,
    },
    transitionProperty: 'background-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
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
  // broken over two lines pushed its neighbours apart. One cut short shows
  // its full text on hover instead — see `NavigationLabel` in ./index.tsx.
  //
  // It is clipped across and never down. `hidden` clipped both ways, and
  // also let a flex column squeeze the label below its own line: under a
  // reader's wider text spacing the bottom of every label was cut off. A
  // `clip` across leaves the line its height and the ellipsis where it was,
  // and the label's width is still measurable, which the bar and the
  // tooltip both read.
  label: {
    color: colors.onSurfaceVariant,
    overflowX: 'clip',
    overflowY: 'visible',
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

// The list a bar or a rail holds its destinations in, and the item each
// destination sits in — see `NavigationList` in ./index.tsx. The list clears
// the margin, padding and markers a `<ul>` comes with, and each form gives
// the space between its destinations as its `list`. The item takes the
// destination's place in the bar's row or the rail's column, which each form
// gives as its `listItem`, and the link fills it.
const navigationListStyles = stylex.create({
  item: {
    boxSizing: 'border-box',
    display: 'flex',
  },
  list: {
    boxSizing: 'border-box',
    listStyleType: 'none',
    margin: 0,
    padding: 0,
  },
})

// The pages' least touch target, which a horizontal bar destination's 40dp
// pill falls short of.
const TARGET_SIZE = '48px'

// The navigation bar page's 64dp row, and the 40dp pill a horizontal
// destination draws inside it.
const BAR_ROW = '64px'
const PILL = '40px'

// The navigation bar's destination: vertical below the medium breakpoint and
// horizontal at it and above, so every value that differs is a pair.
const barItemStyles = stylex.create({
  // A count badge's mark, placed by the badge itself against the icon's
  // top trailing corner. Beside the label, at the medium breakpoint and
  // above, it overhangs the icon on the label's side by 4dp at one digit
  // and 22dp at "999+", against the 4dp between icon and label: a count of
  // 99 covered the label's first letter. There the mark joins the flow
  // instead, 12dp back over the icon and 2dp above it, which is where the
  // badge's own placement puts it, so the label starts after it. Below the
  // breakpoint the label is under the icon and the badge places itself.
  badgeMark: {
    alignSelf: { default: null, [media.medium]: 'flex-start' },
    insetInlineStart: { default: 'calc(100% - 12px)', [media.medium]: 0 },
    marginInlineStart: { default: null, [media.medium]: '-12px' },
    position: { default: 'absolute', [media.medium]: 'relative' },
  },
  // The pill below the medium breakpoint, which places the ripple. Above it
  // the pill is the whole destination, and the ripple is placed against
  // that.
  indicator: {
    alignItems: 'center',
    blockSize: { default: '32px', [media.medium]: 'auto' },
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    inlineSize: { default: '56px', [media.medium]: 'auto' },
    justifyContent: 'center',
    position: { default: 'relative', [media.medium]: 'static' },
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
  //
  // Each draws the bar's 64dp row itself rather than filling the bar: a
  // vertical destination is at least the row, and taller where its label's
  // line is, under a reader's wider text spacing; a horizontal one is the
  // pill with half of what the row has over it above and below. The bar is
  // then as tall as its destinations and whatever padding the call site
  // gives it. Sized as a share of the bar instead, a destination was what
  // that padding left of 64dp: 34dp under the bar for a phone's home
  // indicator brought it to 30, with its indicator pushed out of the top.
  //
  // The horizontal pill is the page's 40dp, and the press reaches past it to
  // the pages' 48dp target through a box drawn above and below it: a box
  // taking the press because a pseudo-element is part of the element it
  // belongs to, and moving nothing because it is out of flow. The vertical
  // destination is the row's full height already, so it draws none.
  item: {
    '::after': {
      content: { default: null, [media.medium]: '""' },
      insetBlock: `min(0px, calc((100% - ${TARGET_SIZE}) / 2))`,
      insetInline: 0,
      position: 'absolute',
    },
    blockSize: { default: null, [media.medium]: PILL },
    borderRadius: radii.pill,
    flexBasis: { default: 0, [media.medium]: 'auto' },
    flexDirection: { default: 'column', [media.medium]: 'row' },
    flexGrow: { default: 1, [media.medium]: 0 },
    gap: spacing.xs,
    justifyContent: 'center',
    marginBlock: {
      default: 0,
      [media.medium]: `calc((${BAR_ROW} - ${PILL}) / 2)`,
    },
    minBlockSize: { default: BAR_ROW, [media.medium]: 0 },
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
  // Vertical destinations meet, and horizontal ones are 8dp apart — see
  // NavigationBar.
  list: {
    gap: { default: 0, [media.medium]: spacing.sm },
  },
  // A vertical destination's equal share of the bar, and a horizontal one's
  // pill. Either may shrink below what it holds, which is what cuts a label
  // short for the bar to measure — see NavigationBar.
  listItem: {
    flexBasis: { default: 0, [media.medium]: 'auto' },
    flexGrow: { default: 1, [media.medium]: 0 },
    minInlineSize: 0,
  },
})

// The collapsed rail's destination: always vertical, the pitch from one to
// the next the rail's 4dp gap.
const collapsedItemStyles = stylex.create({
  // The label is under the icon, so the badge places its own mark.
  badgeMark: {},
  // The pill, which places the ripple.
  indicator: {
    alignItems: 'center',
    blockSize: '32px',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    inlineSize: '56px',
    justifyContent: 'center',
    position: 'relative',
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
  //
  // It keeps its height in a rail too short for every destination, which
  // scrolls them instead — see NavigationRail.
  item: {
    flexDirection: 'column',
    flexShrink: 0,
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
  list: {
    gap: spacing.xs,
  },
  // The rail's width, and its height kept in a rail too short for every
  // destination.
  listItem: {
    flexShrink: 0,
    inlineSize: '100%',
  },
})

// The expanded rail's destination: always horizontal, a 56dp pill as wide as
// what it holds.
const expandedItemStyles = stylex.create({
  // A count badge's mark in the flow beside the icon, for the reason the
  // bar's horizontal form gives: it overhangs the icon on the label's side by
  // up to 22dp, against the 8dp between the two here.
  badgeMark: {
    alignSelf: 'flex-start',
    insetInlineStart: 0,
    marginInlineStart: '-12px',
    position: 'relative',
  },
  // Just the icon's box. The pill is the whole destination, which places the
  // ripple.
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
  // The page's 56dp whatever the rail's height: a rail too short for every
  // destination scrolls them rather than squashing each below the 48dp
  // target — see NavigationRail.
  item: {
    alignSelf: 'flex-start',
    blockSize: '56px',
    borderRadius: radii.pill,
    flexDirection: 'row',
    flexShrink: 0,
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
  // The pills meet, as the page draws them.
  list: {},
  // As wide as the pill, from the leading edge, and its height kept in a
  // rail too short for every destination.
  listItem: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxInlineSize: '100%',
  },
})

// The bar's destination when the bar is too narrow for its horizontal form
// at a width that would otherwise draw it — see NavigationBar. Vertical at
// every width: the bar's own vertical item, with the collapsed rail's
// indicator, label and badge placement, which are the bar's vertical ones.
const crampedBarItemStyles = stylex.create({
  item: {
    blockSize: '100%',
    borderRadius: radii.pill,
    flexBasis: 0,
    flexDirection: 'column',
    flexGrow: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minInlineSize: 0,
    paddingBlock: '6px',
    paddingInline: 0,
  },
  list: {
    gap: 0,
  },
  listItem: {
    flexBasis: 0,
    flexGrow: 1,
    minInlineSize: 0,
  },
})

export {
  barItemStyles,
  collapsedItemStyles,
  crampedBarItemStyles,
  expandedItemStyles,
  navigationItemStyles,
  navigationListStyles,
}
