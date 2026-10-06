import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  sizing,
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
// Three variants, because three spec pages draw three rows. The lists page
// gives a list item a 56dp floor, a body-large headline and a body-medium
// supporting line, and primary container when selected. The menus page gives
// a menu item 48dp, a label-large label, and tertiary container when
// selected. The navigation drawer page gives its row 56dp too, with a
// label-large label like a menu's, and marks the current one with a
// secondary-container pill held 12dp off each edge — 336dp of indicator in a
// 360dp container, which is what that inset comes to. The layout, the
// padding, the state layers and the disabled treatment are one row; `list`,
// `menu` and `drawer` carry only what the three pages disagree on, and a
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

// A pointer that can hover, for `interactiveLayers` — a plain element with no
// render state, so its hover layer is a pseudo-class, and Chromium leaves
// `:hover` on whatever a touch last tapped. Inside this query a touch screen
// draws no hover at all; a touchscreen laptop still matches it for its
// trackpad.
const HOVER_CAPABLE = '@media (hover: hover)'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

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
  // a property whole, so it takes `interactiveLayers`' hover branch with it.
  //
  // Under forced colours it hands the row back to the mode, which a selected
  // row opts out of, so a disabled row is the mode's to colour whatever it
  // was.
  disabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'auto' },
  },
  // The navigation drawer page's row: the lists page's floor, a menu's label,
  // and a pill rather than a rectangle, since what marks the current row
  // there is a shape as much as a colour.
  drawer: {
    borderRadius: radii.pill,
    // `auto` replaces the `100%` in `base`: a margin sits outside the box, so
    // a full-width row with one overflows its container by exactly the inset
    // — the same trap Separator's own insets document.
    inlineSize: 'auto',
    marginInline: spacing.md,
    minBlockSize: sizing.rowSm,
  },
  // The state layers and the focus ring of a row React Aria renders as a
  // collection item — every list, menu, tree and table row — applied from its
  // render state rather than from pseudo-classes.
  //
  // Three things make the render state the right source. Under virtual focus
  // — a ComboBox's options, a ListBox or Menu inside Autocomplete — DOM focus
  // stays in the input, so no pseudo-class ever matches the option the
  // keyboard is on, while React Aria still reports it `isFocusVisible`. React
  // Aria reports `isHovered` only for a row a press acts on — one it selects,
  // runs an action for, or drags — so an inert row takes no tint and no
  // pointer. And `isPressed` covers a keyboard press as well as a pointer's.
  //
  // Each layer is a background image over whatever the row rests on, in the
  // row's own colour: on surface over the surface, and the container's own
  // on-colour over a selected row's container — the pairing the pages give
  // each ground — so one style serves a row selected or not. Where two apply
  // the later wins, as the pages draw one layer at a time: focus over hover,
  // and a press over both.
  focusVisible: {
    backgroundImage: `linear-gradient(color-mix(in srgb, currentColor calc(${stateLayerOpacity.focus} * 100%), transparent), color-mix(in srgb, currentColor calc(${stateLayerOpacity.focus} * 100%), transparent))`,
    // The row's own text colour under forced colours, as the layers above
    // are: `HighlightText` on a selected row, which opts out of the mode, and
    // whatever the mode gives the text on any other.
    outlineColor: { default: colors.primary, [FORCED_COLORS]: 'currentColor' },
    // Inside the row, as `interactive`'s is, so a focused row keeps its whole
    // ring inside a container that clips.
    outlineOffset: '-2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  // A headline drawn heavier than its variant's own, for a row marked
  // without the container a selected one takes. It sets the weight alone, so
  // the rest of the type role still comes from the variant's headline style
  // beside it — and it has to sit on the headline itself, since that style
  // states a weight and an inherited one never reaches an element declaring
  // its own.
  headlineEmphasis: {
    fontWeight: typography.weightBold,
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
  // A state layer from render state — see `focusVisible`.
  hovered: {
    backgroundImage: `linear-gradient(color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent), color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent))`,
    cursor: 'pointer',
  },
  // A row that is a control of its own rather than a React Aria item:
  // ListItem's button and Disclosure's header. Each takes real focus, so
  // `:focus-visible` matches it, and each is interactive by being rendered
  // at all. Disclosure's header is React Aria's `Button`, so it draws
  // `hovered` and `pressed` from that button's render state;
  // `interactiveLayers` is the same pair for ListItem's, which is a plain
  // element with no render state to read.
  interactive: {
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
  // The hover and pressed layers from pseudo-classes — see `interactive`,
  // and `HOVER_CAPABLE` for the query the hover waits on. `:active` is written
  // twice, bare for a touch and again inside the query: StyleX orders a rule
  // by the sum of its conditions, so a hover inside the query would
  // otherwise come after a bare press and win while both held.
  interactiveLayers: {
    backgroundColor: {
      ':active': {
        default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      },
      ':hover': {
        default: null,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      },
      default: 'transparent',
    },
  },
  // The lists page's one-line container height. A row whose headline wraps
  // grows past it; nothing truncates.
  list: {
    minBlockSize: sizing.rowSm,
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
    minBlockSize: sizing.rowXs,
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
  // A state layer from render state — see `focusVisible`.
  pressed: {
    backgroundImage: `linear-gradient(color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent), color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent))`,
  },
  // The drawer page's active row. Secondary container rather than the lists
  // page's primary one, which is what keeps a drawer's current row distinct
  // from a selected row in the list beside it.
  //
  // Under forced colours, which paint every background in `Canvas`, a
  // selected row is drawn as the platform draws a selected option:
  // `Highlight` under `HighlightText`. A fill was all that marked it, so
  // the chosen option in a list, the current page in a drawer and the
  // chosen menu item looked exactly like the rows around them. The row opts
  // out of the mode's adjusting, as the calendar's chosen dates do, since
  // the `Canvas` backplate the mode lays behind text would leave
  // `HighlightText` on `Canvas` — black on black in High Contrast Black. A
  // child that names a colour of its own names a system one too — see the
  // supporting styles below — and `disabled` hands the row back.
  selectedDrawer: {
    backgroundColor: {
      default: colors.secondaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    color: {
      default: colors.onSecondaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
  },
  selectedList: {
    backgroundColor: {
      default: colors.primaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    color: {
      default: colors.onPrimaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
  },
  selectedMenu: {
    backgroundColor: {
      default: colors.tertiaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    color: {
      default: colors.onTertiaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
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
  // `HighlightText` under forced colours, with the selected row it sits in.
  supportingSelectedDrawer: {
    color: {
      default: colors.onSecondaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  supportingSelectedList: {
    color: {
      default: colors.onPrimaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  supportingSelectedMenu: {
    color: {
      default: colors.onTertiaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  // The lists page's three-line container height, with the leading and
  // trailing slots held at the top rather than centred. Three lines of text
  // beside a centred avatar reads as though the avatar has drifted, which is
  // why the page moves it — the row's `alignItems` is what does both slots
  // at once.
  threeLine: {
    alignItems: 'flex-start',
    minBlockSize: sizing.rowLg,
  },
  // The lists page's two-line container height, for a row drawing two of its
  // three lines: a headline with a supporting line, or with an overline.
  //
  // Stated as a floor, which is what the other two heights are as well. The
  // page names 56, 72 and 88 as container heights rather than deriving them,
  // and only the three-line one happens to equal what the row's own box adds
  // up to — 16 + 24 + 20 of line height, two `main` gaps and the block
  // padding come to exactly 88. The same arithmetic leaves a headline and a
  // supporting line at 70, and a headline under an overline at 66, so the
  // page's middle height is the one a row reaches only by being told it.
  //
  // No padding or gap closes that on its own: holding 88 while lifting 70 to
  // 72 needs the gap at 0 and the block padding at 14, and 14 is not on the
  // spacing scale. The floor keeps the page's number where the page puts it,
  // next to the other two, and leaves the row centring its lines inside it.
  twoLine: {
    minBlockSize: sizing.rowMd,
  },
})

export { rowStyles }
