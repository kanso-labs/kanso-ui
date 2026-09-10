import * as stylex from '@stylexjs/stylex'

import {
  colors,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The row every list draws: ListItem's, and from here on the item of every
// collection the coverage plan adds — ListBox, Menu, List, Tree, the options
// of Select and ComboBox. Apart from the RowContent component in ./index.tsx
// so that file exports components alone, which is what keeps fast refresh
// working for it.
//
// Two variants, because two spec pages draw two rows. The lists page gives a
// list item a 56dp floor, a body-large headline and a body-medium supporting
// line, and primary container when selected. The menus page gives a menu
// item 48dp, a label-large label, and tertiary container when selected. The
// layout, the padding, the state layers and the disabled treatment are one
// row; `list` and `menu` carry only what the two pages disagree on, and a
// consumer applies one of them beside `base`.
//
// Laid out with flex rather than the grid the design draws. The design's
// three columns are `auto 1fr auto`, which is what flex does natively — and
// unlike a fixed three-column grid it stays correct when a row has no leading
// or no trailing content, where the remaining children would otherwise slide
// into the wrong columns.
//
// Rows align with each other through their leading content being the same
// size, not through a fixed column width: a list of Avatars all at one size
// lines up, and that is the same thing the design's 40px column achieves.
//
// The state layer composites over `transparent` rather than over a container
// colour, because a row's own background is transparent and it therefore
// tints whatever it happens to be sitting on — a card, a menu, or the page.
// The two selected states are the ones that bring a container of their own.
const rowStyles = stylex.create({
  base: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'flex',
    gap: spacing.lg,
    inlineSize: '100%',
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    position: 'relative',
    textAlign: 'start',
  },
  // Applied from render state rather than `:disabled`, since a collection
  // item is a div React Aria marks with aria-disabled. Listed after the
  // interactive and selected styles so it wins over both, and StyleX replaces
  // a property whole, so it takes their hover branches with it.
  disabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  headlineList: {
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
  },
  headlineMenu: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  interactive: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    cursor: 'pointer',
    font: 'inherit',
    outlineColor: colors.primary,
    // Drawn inside the row rather than around it, so a focused row inside a
    // list container shows its full ring instead of having the half that
    // falls outside clipped by the container's edge.
    outlineOffset: '-2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  // The lists page's one-line floor. A row with a supporting line grows past
  // it to the page's 72, and one that wraps grows further; nothing truncates.
  list: {
    minBlockSize: '56px',
  },
  // Prose wraps, so this column's min-content width is usually one word and
  // it shrinks happily. min-width: 0 is for the case that cannot wrap — a
  // long unbroken string, a URL, an email — where a flex item otherwise
  // refuses to go below its content's width and shoves the trailing slot off
  // the end of the row.
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: spacing.xxs,
    minInlineSize: 0,
  },
  // The menus page's item height.
  menu: {
    minBlockSize: '48px',
  },
  // A line above the headline, in the page's label-small and the same muted
  // role the supporting line takes. Its colour follows the supporting line's
  // rules exactly — inherit while disabled, the container's own on-colour
  // while selected — so the three `supporting*` styles below serve both.
  overline: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelSmallFont,
    fontSize: typography.labelSmallSize,
    fontWeight: typography.labelSmallWeight,
    letterSpacing: typography.labelSmallTracking,
    lineHeight: typography.labelSmallLineHeight,
  },
  selectedList: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    color: colors.onPrimaryContainer,
  },
  selectedMenu: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onTertiaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.tertiaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onTertiaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.tertiaryContainer})`,
      default: colors.tertiaryContainer,
    },
    color: colors.onTertiaryContainer,
  },
  slot: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  supporting: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
  },
  // A supporting line takes on surface variant only while the row is drawn
  // on the surface. The page's muted role is a second colour family over a
  // selected row's own container, and the pair is not guaranteed to be
  // readable — it fails AA outright on the Terminal scheme, where the
  // primary container is a strong green. On a disabled row it is worse than
  // unreadable: the muted role is at full strength while the headline above
  // it has faded, so the line the row is least about is the one that stands
  // out. Both cases take the row's own colour instead.
  supportingInherit: {
    color: 'inherit',
  },
  supportingSelectedList: {
    color: colors.onPrimaryContainer,
  },
  supportingSelectedMenu: {
    color: colors.onTertiaryContainer,
  },
  // The lists page's three-line item: an 88dp floor, with the leading and
  // trailing slots held at the top rather than centred. Three lines of text
  // beside a centred avatar reads as though the avatar has drifted, which is
  // why the page moves it — the row's `alignItems` is what does both slots
  // at once.
  threeLine: {
    alignItems: 'flex-start',
    minBlockSize: '88px',
  },
})

export { rowStyles }
