import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The pill the chips page draws, shared by the three components that draw
// one: Chip, which is a toggle on its own or one of the page's two action
// chips; ChipGroup's chip, which is one of a set that can also be removed;
// and TokenField's token, which takes `base` and `unselected` alone — a token
// is not selectable, so it reaches for neither the selected container nor
// the check below. The measurements and roles are the page's filter chip — a
// 32dp container with an 8dp corner and 16dp of inline padding, an outline
// variant border while unselected, the secondary container pair once
// selected.
//
// The assist and suggestion chips are that unselected pill, never selected.
// The page's only difference between them is the label: on surface on an
// assist chip, on surface variant on a suggestion chip as on a filter one.
//
// **An elevated chip trades the outline for a container**, surface container
// low at the page's elevation 1, raised to 2 under a hovering pointer. A
// selected one keeps the secondary container and takes the shadow with it.
// Its 1px border stays, transparent, as every chip's does: a forced-colours
// mode paints a transparent border in its text colour and drops the shadow
// and the fill, so the border is the boundary left there.
//
// **A label with no room on one line is cut short, never wrapped.** The
// container is a fixed 32dp, so a second line has nowhere to go but out of
// the pill: a chip or a token in a room narrower than its label drew the
// rest below its own edge, and a chip in a group's row ran past the row's
// end instead. The pill is held to the room it is in, and the label sits in
// a span of its own that ends in an ellipsis where the pill does — a span,
// because a flex container ignores `text-overflow`, which is also why
// Material's own chips carry one. The whole label stays in the DOM, so a
// screen reader still reads all of it.
//
// Each state composites an on-colour over its own container at the
// interaction state's opacity rather than swapping in a separate hover
// colour. `calc(<opacity> * 100%)` turns the token's unitless 0-1 ratio into
// the percentage `color-mix()` takes, and it is inlined at each property
// because @stylexjs/babel-plugin only statically recognises expressions
// written directly as property values.
//
// The selected chip drops its border rather than recolouring it: it has a
// container of its own to define its edge, and a border on top of that reads
// as a second, competing outline.
//
// Disabled is applied from render state rather than from `:disabled`. Chip is
// a button and would match the pseudo-class; a chip in a group is React
// Aria's `Tag`, which is a div and never will. One mechanism serves both, and
// StyleX replaces a property whole, so the disabled styles take the hover and
// pressed branches of whichever state they are applied over.
//
// A selected chip carries the page's check before its label, which is what
// makes the selection legible without colour. The two containers differ in
// colour alone, and under a scheme whose secondary container sits close to
// the surface — or for a reader who does not see colour — that is no
// difference at all.
//
// The chip widens when the check appears, and that is the page's behaviour
// rather than a cost of drawing it: a chip is flow content, laid out in a
// row that wraps, so nothing around it has a width to hold. A segmented
// button's segments are equal columns of one track, which is a different
// geometry answering a different question, and the two should not be read
// across. A chip given an icon does not widen, since the check takes the
// icon's place in the same slot.
//
// Apart from any component so a chip in a group and a chip on its own cannot
// drift; see `src/row` for the same arrangement around a list's row.

// The press area the chips page requires around its 32dp chip. A literal for
// the reason IconButton's `TARGET_SIZE` gives.
const TARGET_SIZE = '48px'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const chipStyles = stylex.create({
  // An assist chip's label, the one role the page draws it in that a
  // suggestion chip does not.
  assist: {
    color: colors.onSurface,
  },
  base: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    blockSize: sizing.controlXs,
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    // Never wider than the room it is in, which is what leaves the label a
    // width to be cut short at. See the header.
    maxInlineSize: '100%',
    paddingBlock: 0,
    paddingInline: spacing.lg,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, border-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The content role at 38%, which every disabled chip takes whichever
  // container it is on. `GrayText` under forced colours: a chip is an
  // aria-disabled element rather than a native control, which the mode
  // leaves in `CanvasText` like an enabled one.
  disabled: {
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
    cursor: 'not-allowed',
  },
  // The two containers a disabled chip can be on: the selected one flattens
  // to the surface at 12%, the unselected one keeps its outline at the same.
  disabledSelected: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
  },
  disabledUnselected: {
    backgroundColor: 'transparent',
    borderColor: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // An unselected elevated chip's container, in place of the outline.
  elevated: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'transparent',
  },
  // A disabled elevated chip comes down to the page, on the surface at 12%.
  elevatedDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: 'transparent',
    boxShadow: 'none',
  },
  // The check a selected chip carries, or the icon an unselected one does:
  // the page's 18dp icon, before the label, in a slot of its own so the SVG
  // has a box to fill. `fontSize` as well as the box, so a glyph drawn in
  // `em` or an icon font lands at the size an SVG does — the same slot a
  // segmented button's segments draw their check in.
  glyph: {
    alignItems: 'center',
    blockSize: '18px',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '18px',
    inlineSize: '18px',
    justifyContent: 'center',
    // The page's 8dp between the check and the label is the chip's own gap;
    // what is trimmed here is the chip's inline padding, which the page
    // draws at 8 on the side an icon is on rather than 16. `remove` trims
    // the other end the same way, for the same line of the same table.
    marginInlineStart: `calc(-1 * ${spacing.sm})`,
  },
  glyphSvg: {
    blockSize: '100%',
    inlineSize: '100%',
  },
  // An unselected chip's own icon, in the primary role the page gives a
  // filter chip's leading icon at rest, hovered, focused and pressed alike.
  // Left off a disabled chip, whose icon fades with the label in the chip's
  // own content colour; a selected chip draws the check in its place, in
  // that colour too.
  icon: {
    color: colors.primary,
  },
  // The label, on one line and ending in an ellipsis where the pill does.
  // `overflow: hidden` does two jobs: `text-overflow` draws nothing without
  // it, and a flex item that clips may narrow below the text it holds, where
  // one that does not is held at that text's width.
  label: {
    boxSizing: 'border-box',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // An elevated chip's shadow: the page's elevation 1 at rest, focused and
  // pressed, and 2 under a hovering pointer. The transition takes the shadow
  // as well as the colours `base` names.
  raised: {
    boxShadow: shadows.elevation1,
    transitionProperty: 'background-color, border-color, box-shadow, color',
  },
  raisedHovered: {
    boxShadow: shadows.elevation2,
  },
  // The trailing close target the page draws on an input chip: an 18dp glyph
  // in the content role, in a target of its own so a press on it removes the
  // chip rather than toggling it.
  remove: {
    // WCAG's 24px minimum, reached by a transparent box 3px past each edge of
    // the 18dp glyph. The chip around it is a press target of its own when
    // the group selects, so it is no spacing to lean on: the close target has
    // to meet the minimum by itself.
    '::before': {
      content: '""',
      inset: '-3px',
      position: 'absolute',
    },
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '18px',
    borderRadius: radii.pill,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: 'inherit',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    inlineSize: '18px',
    justifyContent: 'center',
    // The page's 8dp between the label and the close target is the chip's own
    // gap; what is trimmed here is the chip's inline padding, which the page
    // draws at 8 on the side the close target is on rather than 16.
    marginInlineEnd: `calc(-1 * ${spacing.sm})`,
    // The chip around it already shows a ring, and a second one inside it
    // would be two focus treatments for one focus.
    outlineColor: 'currentColor',
    outlineOffset: '1px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
    position: 'relative',
  },
  removeGlyph: {
    blockSize: '18px',
    inlineSize: '18px',
  },
  selected: {
    backgroundColor: colors.secondaryContainer,
    borderColor: 'transparent',
    color: colors.onSecondaryContainer,
  },
  // The chips page's 48dp target around the 32dp chip: a transparent box
  // reaching 8dp past the top and bottom, taking the press because a
  // pseudo-element is part of the element it belongs to, and moving nothing
  // because it is out of flow. Across, the label's padding already clears
  // the target. A chip applies this beside `base`; a token in a field does
  // not, since a reach above or below a token would take the press meant to
  // put the caret on the line next to it.
  //
  // The insets are a pixel longer than the arithmetic, because an absolute
  // box is placed from inside its parent's border, and the chip's is 1px.
  target: {
    '::before': {
      content: '""',
      insetBlock: `calc((${sizing.controlXs} - ${TARGET_SIZE}) / 2 - 1px)`,
      insetInline: 0,
      position: 'absolute',
    },
    position: 'relative',
  },
  // A chip in a group, whose rows wrap `spacing.sm` apart. A full target on
  // each chip would lay one row's reach over the next one's, so a press
  // between them would go to whichever was drawn later rather than to the
  // nearer. Each reaches halfway across the gap instead, and the two meet.
  targetInGroup: {
    '::before': {
      insetBlock: `calc(-1 * ${spacing.sm} / 2 - 1px)`,
    },
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: colors.outlineVariant,
    color: colors.onSurfaceVariant,
  },
})

// The hover and pressed layers, applied from React Aria's render state rather
// than from `:hover` and `:active`, for Button's reasons — see its header: a
// hover layer stayed on after a tap, and no pressed layer showed for a press
// made from the keyboard. One pair per container, the pressed after the
// hovered so a press wins, and one for the close target, whose own render
// state is its button's. A token in a TokenField draws none of them: React
// Aria reports neither state for one, since it is text the caret moves
// through rather than a control a press acts on.
const chipLayers = stylex.create({
  // An unselected elevated chip's, over its own container.
  elevatedFocused: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.focus} * 100%), ${colors.surfaceContainerLow})`,
  },
  elevatedHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerLow})`,
  },
  elevatedPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
  },
  removeHovered: {
    backgroundColor: `color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  removePressed: {
    backgroundColor: `color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  selectedFocused: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
  },
  selectedHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
  },
  selectedPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
  },
  unselectedFocused: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  unselectedHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  unselectedPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
})

export { chipLayers, chipStyles }
