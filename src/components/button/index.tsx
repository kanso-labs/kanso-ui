'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ClassNameOrFunction,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import { ToggleGroupStateContext } from 'react-aria-components'

import type {
  ButtonDOMProps,
  ButtonLinkForm,
  ButtonPressForm,
  ButtonState,
  ButtonToggleForm,
} from '../../button'
import type { ButtonGroupItem } from '../../button/context'

import { ButtonBase, ToggleButtonBase } from '../../button'
import { ButtonGroupItemContext } from '../../button/context'
import { groupPressHandlers } from '../../button/group'
import { useSelection } from '../../button/hooks'
import { pressThen } from '../../button/toggle'
import { focus } from '../../styles/focus'
import {
  colors,
  motion,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// Each variant composites its label colour over its container at the
// interaction state's opacity, rather than swapping in a separate
// hover/pressed color: filled and tonal paint the 'on-color' over the
// container, outlined, text and elevated paint the label colour over their
// own. The pairs are the buttons spec page's newer values: tonal on
// secondary container, outlined with an outline variant border and an
// on-surface-variant label, text on primary, elevated on surface container
// low with a primary label.
//
// **Elevated is the one variant whose shadow is part of its identity.** The
// page rests it at elevation 1 rather than flat, raises it on hover and
// returns it to 1 while pressed — where filled and tonal rest flat and lift
// only on hover. Disabled drops it to none, since a shadow says a control is
// available to press.
// calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
// percentage color-mix() takes. Inlined rather than factored into a helper:
// @stylexjs/babel-plugin only statically recognizes expressions written
// directly as property values, and a call to an externally-defined function
// isn't one of them.
//
// The hover, focus and pressed layers come from React Aria's render state,
// `isHovered`, `isFocusVisible` and `isPressed`, rather than from `:hover`,
// `:focus-visible` and `:active`. On a touch screen Chromium leaves `:hover`
// on the last element tapped, so the layer and its lifted shadow stayed on a
// button after the tap had ended, where React Aria ignores the emulated mouse
// events that follow a touch. And React Aria prevents the default of the
// keydown that presses a button with Space or Enter, so `:active` never
// matched a keyboard press, which `isPressed` reports like any other.
//
// Disabled is a style of its own per variant rather than a `:disabled`
// branch inside each property: a button given `href` renders as a link,
// which React Aria turns into a <span> while disabled, and neither matches
// the pseudo-class. The disabled styles are applied last from the render
// state's `isDisabled`, and StyleX replaces a property whole, so they win
// over any state layer applied before them.
//
// **Under forced colours a container is drawn as a rule.** That mode drops
// the shadow and paints author backgrounds in a system colour, which left a
// filled, tonal or elevated button as a label with nothing round it. `base`
// draws a 1px `ButtonText` border there instead. Outlined keeps its own rule,
// and text stays without one, as the page draws it. The mode repaints a
// disabled button's fade at full strength as well. Chromium greys a disabled
// `<button>` there by itself, but not the `<span>` React Aria renders for a
// disabled link, so the disabled styles name `GrayText` for the label and
// the edge rather than leave it to the browser.
//
// Two independent axes, applied base -> variant -> size. The variant carries
// colour and the size carries geometry, so the two never argue: inline
// padding belongs to the size alone, and every size declares its own.
//
// That is deliberate rather than incidental. The buttons page gives padding
// per size — its Small button padding is 16dp, the 24dp beside it being the
// older value the page marks as not recommended — and gives the five colour
// styles no padding of their own. A text button is therefore as wide as a
// filled one at the same size, which is what the code draws.
//
// This did once read the other way, with `md` declaring no padding so a
// medium button fell through to its variant's. `fix(button)!: the spec's
// five sizes` replaced that when the component took the page's sizes, since
// a per-variant padding had nowhere to sit once every size carried one. The
// comment describing the old cascade outlived it by some months, which is
// how it came to say `text` keeps a tighter padding it has never had — back
// then `text` declared 16dp while a filled `md` declared none at all, so the
// text button was the wider of the two.
//
// **A toggle is the same button reporting a state.** Given `isSelected`,
// `defaultSelected` or `onChange` it is React Aria's `ToggleButton`, which
// announces the state through `aria-pressed`, as IconButton's toggle does.
// The page gives four of the five styles a second pair of colour roles for
// it: a filled toggle rests on surface container with an on-surface-variant
// label and takes primary once selected, a tonal one moves from the
// secondary container pair to secondary, an elevated one keeps its low
// surface until it takes primary, and an outlined one swaps its rule for the
// inverse surface pair. Under forced colours a selected toggle of any style
// is filled `Highlight`, as IconButton's is. The page gives text no pair, so
// a text button given those props stays a plain one.
//
// **The corner is a shape the button morphs between**, from the page's size
// token sets. `round` rests as the pill and `square` at the size's square
// corner: 12dp up to the page's S, 16dp at M and 28dp above. A press tightens
// either to the size's pressed corner, 8dp, 12dp or 16dp, and a toggle
// trades its shape for the other once selected — a round one for the square
// corner, a square one for the pill. The corner eases over the motion
// tokens' short duration, and moves at once for a reader who asks for
// reduced motion.
//
// What every button does past its own styles — the ripple, the link and
// toggle forms, the pending ring, a parent's disabled state — is
// `src/button`'s, shared with IconButton.

/**
 * The press area the buttons page requires, which its two smallest sizes are
 * drawn under. A literal rather than `sizing.controlMd`, which holds the same
 * number, for the reason IconButton's `TARGET_SIZE` gives: a consumer
 * resizing their medium controls should not shrink a target the page states
 * as a floor.
 */
const TARGET_SIZE = '48px'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  base: {
    alignItems: 'center',
    // The container's rule under forced colours — see the header.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: radii.pill,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: 0, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    // The label in the middle of a button wider than it — one stretched by a
    // column, or given a width — as the spec draws every button. The label
    // span is `display: contents`, so its text is a flex item of the button
    // and would otherwise pack at the start.
    justifyContent: 'center',
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    // Never wider than its container, and a label with a word wider than
    // that breaks inside it: the label wraps between words already, and a
    // single long compound otherwise held the button at its own width.
    maxInlineSize: '100%',
    overflowWrap: 'anywhere',
    position: 'relative',
    // A wrapped label's lines centred too. A <button> gets this from the
    // user agent and an <a> does not, so without it the `href` form wrapped
    // its lines at the start while the button form centred them.
    textAlign: 'center',
    // `href` makes a button an <a>, and an <a> arrives underlined. Reset
    // here rather than per variant, since every variant sets a colour of
    // its own but none of them touches the rule. Card does the same for the
    // same reason; without it the two disagreed about what a
    // link-as-control looks like.
    textDecoration: 'none',
    // The shape morph — see the header.
    transitionDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationShort2,
    },
    transitionProperty: 'border-radius, padding',
    transitionTimingFunction: motion.easingEmphasized,
  },
  disabled: {
    cursor: 'not-allowed',
  },
  elevated: {
    backgroundColor: colors.surfaceContainerLow,
    boxShadow: shadows.elevation1,
    color: colors.primary,
  },
  elevatedDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    boxShadow: 'none',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // A selected elevated toggle takes primary, keeping its shadow.
  elevatedToggleSelected: {
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    color: { default: colors.onPrimary, [FORCED_COLORS]: 'HighlightText' },
  },
  filled: {
    backgroundColor: colors.primary,
    boxShadow: 'none',
    color: colors.onPrimary,
  },
  filledDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    boxShadow: 'none',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // The filled toggle's unselected container, which is not the plain filled
  // button's: the page rests it on surface container with the muted label
  // and gives it primary only once it is selected.
  filledToggle: {
    backgroundColor: colors.surfaceContainer,
    color: colors.onSurfaceVariant,
  },
  // The filled toggle once selected: the plain filled button's colours, and a
  // style of its own only for the forced-colours pair, which the plain button
  // must not take.
  filledToggleSelected: {
    backgroundColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    color: { default: colors.onPrimary, [FORCED_COLORS]: 'HighlightText' },
  },
  // The slot an icon is drawn in, before the label. Its size is the font
  // size `iconSizes` sets, which an icon drawn in `em` follows, as it does in
  // IconButton and a field's icon slot.
  icon: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
  },
  // The five sizes are the buttons spec page's, XS to XL, from its size token
  // sets: the container height, the inline padding, the gap before an icon,
  // and the type role — label-large for the two small sizes, then
  // title-medium, headline-small and headline-large, each taken whole, face
  // and weight included, since the role is what the page names. The two
  // largest paddings are literals: 48 and 64 are not steps of the spacing
  // scale, and the scale should not grow to fit one component. `md` is the
  // page's S, which it calls the default. `xs` pads 12 a side, the
  // `md.comp.button.xsmall` token set's leading and trailing space, which
  // Compose's extra-small button pads by too.
  //
  // The height is a floor rather than a fixed size, so a label too long for
  // its row — a translation at a phone's width, say — wraps and grows the
  // container instead of running out of it, where a filled button draws the
  // extra lines in on primary over the page. The block padding is what keeps
  // a wrapped label off the pill's edge: a step of the spacing scale at
  // least a pixel short of a single line's own inset, so a label on one line
  // still draws exactly the page's height, an outlined button's border
  // included. `md`'s 8 is Compose's own vertical padding for its button.
  lg: {
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    minBlockSize: sizing.controlLg,
    paddingBlock: spacing.md,
    paddingInline: spacing.xl,
  },
  // The page requires a 48dp target of the two smallest sizes, and both are
  // drawn under it: a transparent box reaches past the top and bottom edges,
  // taking the press because a pseudo-element is part of the element it
  // belongs to, and moving nothing because it is out of flow. Across, the
  // label's padding already clears the target, so the box stops at the sides.
  //
  // The reach is half of what the button lacks of the target, read off the
  // percentage rather than the container token: an absolutely positioned box
  // is placed against the padding box, inside any border, so a reach worked
  // out from the token lost the outlined button's rule twice over and left
  // its target 46 tall. A label that wraps the button past the target leaves
  // nothing to make up, and the box stays inside.
  md: {
    '::before': {
      content: '""',
      insetBlock: `min(0px, calc((100% - ${TARGET_SIZE}) / 2))`,
      insetInline: 0,
      position: 'absolute',
    },
    minBlockSize: sizing.controlSm,
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.outlineVariant,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.onSurfaceVariant,
  },
  outlinedDisabled: {
    backgroundColor: 'transparent',
    borderColor: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
      [FORCED_COLORS]: 'GrayText',
    },
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // A selected outlined toggle swaps its rule for the inverse surface pair.
  // The rule keeps its width, drawn transparent, so a toggle does not change
  // size as it is selected.
  outlinedToggleSelected: {
    backgroundColor: {
      default: colors.inverseSurface,
      [FORCED_COLORS]: 'Highlight',
    },
    borderColor: { default: 'transparent', [FORCED_COLORS]: 'Highlight' },
    color: {
      default: colors.inverseOnSurface,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  // The pill, for a square toggle once selected.
  round: {
    borderRadius: radii.pill,
  },
  text: {
    backgroundColor: 'transparent',
    // No rule under forced colours either, which replaces `base`'s whole.
    borderWidth: 0,
    color: colors.primary,
  },
  textDisabled: {
    backgroundColor: 'transparent',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  tonal: {
    backgroundColor: colors.secondaryContainer,
    boxShadow: 'none',
    color: colors.onSecondaryContainer,
  },
  tonalDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    boxShadow: 'none',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // A selected tonal toggle moves from the secondary container pair to
  // secondary itself.
  tonalToggleSelected: {
    backgroundColor: {
      default: colors.secondary,
      [FORCED_COLORS]: 'Highlight',
    },
    color: { default: colors.onSecondary, [FORCED_COLORS]: 'HighlightText' },
  },
  xl: {
    fontFamily: typography.headlineSmallFont,
    fontSize: typography.headlineSmallSize,
    fontWeight: typography.headlineSmallWeight,
    gap: spacing.md,
    letterSpacing: typography.headlineSmallTracking,
    lineHeight: typography.headlineSmallLineHeight,
    minBlockSize: sizing.controlXl,
    paddingBlock: spacing.xl,
    paddingInline: '48px',
  },
  // The smaller of the two the page requires a 48dp target of, so its box
  // reaches 8dp past each edge. See `md`. Across, its 12dp a side clears the
  // target only for a label at least 24dp wide, so for a narrower button the
  // box reaches past the sides as well, by half of what it lacks, and a
  // wider one keeps it at its sides as `md` does. Both percentages are of the
  // button's padding box, the box's containing block.
  xs: {
    '::before': {
      content: '""',
      insetBlock: `min(0px, calc((100% - ${TARGET_SIZE}) / 2))`,
      insetInline: `min(0px, calc((100% - ${TARGET_SIZE}) / 2))`,
      position: 'absolute',
    },
    minBlockSize: sizing.controlXs,
    paddingBlock: spacing.xs,
    paddingInline: spacing.md,
  },
  xxl: {
    fontFamily: typography.headlineLargeFont,
    fontSize: typography.headlineLargeSize,
    fontWeight: typography.headlineLargeWeight,
    gap: spacing.lg,
    letterSpacing: typography.headlineLargeTracking,
    lineHeight: typography.headlineLargeLineHeight,
    minBlockSize: sizing.controlXxl,
    paddingBlock: spacing.xxl,
    paddingInline: '64px',
  },
})

// The outlined button's border thickens with the size, as the page's size
// tokens have it: 1dp up to M, 2dp at L, 3dp at XL. A style per size rather
// than a value in the size style, since a border on a filled button would
// draw in the label colour.
const OUTLINE_WIDTHS = {
  lg: '1px',
  md: '1px',
  xl: '2px',
  xs: '1px',
  xxl: '3px',
} as const

// The outlined button draws its rule inside the width the other variants
// take, as the page's buttons do: the padding gives up what the border takes,
// so an outlined and a filled button with one label are one width, and a
// group mixing them lines up. The height needs nothing, since it is a floor
// the border already counts towards.
const outlinedSizes = stylex.create({
  lg: {
    borderWidth: OUTLINE_WIDTHS.lg,
    paddingInline: `calc(${spacing.xl} - ${OUTLINE_WIDTHS.lg})`,
  },
  md: {
    borderWidth: OUTLINE_WIDTHS.md,
    paddingInline: `calc(${spacing.lg} - ${OUTLINE_WIDTHS.md})`,
  },
  xl: {
    borderWidth: OUTLINE_WIDTHS.xl,
    paddingInline: `calc(48px - ${OUTLINE_WIDTHS.xl})`,
  },
  xs: {
    borderWidth: OUTLINE_WIDTHS.xs,
    paddingInline: `calc(${spacing.md} - ${OUTLINE_WIDTHS.xs})`,
  },
  xxl: {
    borderWidth: OUTLINE_WIDTHS.xxl,
    paddingInline: `calc(64px - ${OUTLINE_WIDTHS.xxl})`,
  },
})

// The icon each size draws, from the page's size token sets: 20dp for the
// two small sizes, then 24, 32 and 40. The gap before it is the size's own,
// which `base`, `xl` and `xxl` already set as the page gives them.
const iconSizes = stylex.create({
  lg: { fontSize: '24px' },
  md: { fontSize: '20px' },
  xl: { fontSize: '32px' },
  xs: { fontSize: '20px' },
  xxl: { fontSize: '40px' },
})

// Each size's inline padding again, for the one place it is read at runtime:
// a standard ButtonGroup widening a pressed button by adding to it. The size
// styles above write the same values, and an outlined button's border comes
// off them here as it does in `outlinedSizes`.
const PADDINGS = {
  lg: spacing.xl,
  md: spacing.lg,
  xl: '48px',
  xs: spacing.md,
  xxl: '64px',
}

// The padding a standard group sets while it widens or narrows the button.
const shifted = stylex.create({
  padding: (value: string) => ({ paddingInline: value }),
})

// The square corner each size rests at, and a round toggle once selected.
const squareShapes = stylex.create({
  lg: { borderRadius: radii.lg },
  md: { borderRadius: radii.md },
  xl: { borderRadius: radii.xl },
  xs: { borderRadius: radii.md },
  xxl: { borderRadius: radii.xl },
})

// The corner each size presses to, whatever its shape. Applied after the
// resting and selected shapes, so a press is felt whichever the button rests
// at.
const pressedShapes = stylex.create({
  lg: { borderRadius: radii.md },
  md: { borderRadius: radii.sm },
  xl: { borderRadius: radii.lg },
  xs: { borderRadius: radii.sm },
  xxl: { borderRadius: radii.lg },
})

// The interaction state layers, one style per variant for each state, applied
// from React Aria's render state — see the header for why that and not the
// pseudo-classes. In the order they are applied, so where two hold the later
// wins, as the page draws one layer at a time: focus over hover, and a press
// over both. Hover lifts filled and tonal off the page and raises elevated a
// level, and a press brings each back to where it rests.
//
// A toggle's containers carry a layer of their own, each the label colour
// over that container, applied after the variant's so the variant still
// decides the shadow. A selected toggle's keeps its forced-colours
// `Highlight`, since a later style replaces the property whole.
const hovered = stylex.create({
  elevated: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerLow})`,
    boxShadow: shadows.elevation2,
  },
  elevatedToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
    boxShadow: shadows.elevation1,
  },
  filledToggle: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainer})`,
  },
  filledToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  outlined: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  outlinedToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.inverseOnSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.inverseSurface})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  text: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
    boxShadow: shadows.elevation1,
  },
  tonalToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
})

const focused = stylex.create({
  elevated: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), ${colors.surfaceContainerLow})`,
  },
  elevatedToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
  },
  filledToggle: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.focus} * 100%), ${colors.surfaceContainer})`,
  },
  filledToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  outlined: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  outlinedToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.inverseOnSurface} calc(${stateLayerOpacity.focus} * 100%), ${colors.inverseSurface})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  text: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
  },
  tonalToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
})

const pressed = stylex.create({
  elevated: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
    boxShadow: shadows.elevation1,
  },
  elevatedToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
    boxShadow: 'none',
  },
  filledToggle: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainer})`,
  },
  filledToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  outlined: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  outlinedToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.inverseOnSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.inverseSurface})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  text: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
    boxShadow: 'none',
  },
  tonalToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
})

const disabledStyles = {
  elevated: styles.elevatedDisabled,
  filled: styles.filledDisabled,
  outlined: styles.outlinedDisabled,
  text: styles.textDisabled,
  tonal: styles.tonalDisabled,
}

// Which container a toggle draws, selected and not, by its name in the
// tables above. Three of the eight are the plain button's own: an unselected
// tonal, elevated or outlined toggle is the tonal, elevated or outlined
// button.
const toggleContainers = {
  elevated: { selected: 'elevatedToggleSelected', unselected: 'elevated' },
  filled: { selected: 'filledToggleSelected', unselected: 'filledToggle' },
  outlined: { selected: 'outlinedToggleSelected', unselected: 'outlined' },
  tonal: { selected: 'tonalToggleSelected', unselected: 'tonal' },
} as const

type ButtonProps = ButtonDOMProps &
  (
    | ButtonLinkForm
    | ButtonPressForm
    | (ButtonToggleForm & {
        /**
         * A toggle takes any variant but `text`, which the page gives no
         * selected colours.
         */
        variant?: Exclude<ButtonVariant, 'text'>
      })
  ) & {
    children?: ReactNode
    /** A function may compute the class from the button's render state. */
    className?: ClassNameOrFunction<ButtonState>
    /**
     * Disables the press ripple. The hover/pressed background state layer is
     * unaffected.
     * @default false
     */
    disableRipple?: boolean
    /**
     * An icon before the label, at the page's icon size for the button's size:
     * 20px at `xs` and `md`, 24px at `lg`, 32px at `xl` and 40px at `xxl`. Draw
     * it `1em` square in `currentColor`, as every icon here is, and it follows.
     * Hidden with the label while the button is pending.
     */
    icon?: ReactNode
    /**
     * The name of the ring shown while the button is pending, for a screen
     * reader. The label it replaces is hidden while it shows. Left out, it is
     * the word for it in the I18nProvider's locale — "Loading" in English.
     */
    pendingLabel?: string
    /**
     * The corner the button rests at: `round` is the pill, `square` the
     * page's rounded rectangle, 12px up to `md`, 16px at `lg` and 28px above.
     * Either tightens while pressed, and a toggle trades one for the other
     * once selected.
     * @default 'round'
     */
    shape?: ButtonShape
    /**
     * Control height: `xs` 32px, `md` 40px, `lg` 56px, `xl` 96px, `xxl` 136px —
     * the buttons spec page's XS, S, M, L and XL, each with its own inline
     * padding and type role. `md` is the page's default.
     * @default 'md'
     */
    size?: ButtonSize
    /** A function may compute the style from the button's render state. */
    style?: StyleOrFunction<ButtonState>
    /**
     * How much weight the button pulls. `filled` and `tonal` carry a container
     * of their own; `outlined` and `text` sit on the page; `elevated` sits on
     * a low surface and lifts off it with a shadow, for a button that has to
     * separate from a busy background rather than from the page.
     * @default 'filled'
     */
    variant?: ButtonVariant
  }

type ButtonShape = 'round' | 'square'

type ButtonSize = 'lg' | 'md' | 'xl' | 'xs' | 'xxl'

type ButtonVariant = 'elevated' | 'filled' | 'outlined' | 'text' | 'tonal'

// The four styles the page gives a toggle's colour pairs; see the header.
type ToggleVariant = keyof typeof toggleContainers

/**
 * The design's button, at five emphasis levels and five control heights,
 * round or square. Given `href` it is a link with the same appearance. Every
 * `aria-*` prop is forwarded to the element; React Aria alone would keep only
 * the labelling ones.
 *
 * Given `isSelected`, `defaultSelected` or `onChange` it is a toggle, which
 * reports its state through `aria-pressed` and draws the page's second pair
 * of colour roles for its variant. The three forms are exclusive, so a toggle
 * given `href` does not compile, and nor does a `text` toggle, which the page
 * gives no selected colours — a `text` button in a selecting `ButtonGroup`
 * is the one that toggles, for the group's sake. A toggle may be pending,
 * for a state saved somewhere slow: the ring replaces its label and a press
 * changes nothing until it clears.
 *
 * ```tsx
 * <Button defaultSelected variant="tonal">
 *   Label
 * </Button>
 * ```
 */
function Button({
  children,
  defaultSelected,
  href,
  icon,
  isPending,
  isSelected,
  onChange,
  pendingLabel,
  rel,
  shape = 'round',
  size: ownSize,
  target,
  variant = 'filled',
  ...props
}: ButtonProps & RefAttributes<HTMLAnchorElement | HTMLButtonElement>) {
  // A ButtonGroup or a SplitButton around the button hands it a size, its
  // shape at the group's inner edges and the press interaction; see
  // src/button/context.ts. A size named here still wins.
  const group = useContext(ButtonGroupItemContext)
  const size = ownSize ?? group?.size ?? 'md'
  // A group that selects is React Aria's ToggleButtonGroup, whose buttons
  // have to be toggles to take part in its selection.
  const inSelectingGroup = useContext(ToggleGroupStateContext) !== null
  const press = groupPressHandlers(group, props.onPressStart, props.onPressEnd)
  const selection = useSelection({ defaultSelected, isSelected, onChange })

  // The icon goes in with the label, inside what ButtonBase hides while the
  // button is pending, so the ring takes the place of both.
  const content =
    icon === undefined ? (
      children
    ) : (
      <>
        <span {...stylex.props(styles.icon, iconSizes[size])}>{icon}</span>
        {children}
      </>
    )

  // A selecting ButtonGroup around it makes it React Aria's ToggleButton, to
  // take part in the group's selection — a text button too, which draws its
  // selection by nothing but the group's shape. Whether a button sits in one
  // does not change from one render to the next.
  if (inSelectingGroup) {
    return (
      <ToggleButtonBase
        {...props}
        {...press}
        classes={
          variant === 'text'
            ? buttonClasses(shape, size, variant, group)
            : toggleClasses(shape, size, variant, group)
        }
        isPending={isPending}
      >
        {content}
      </ToggleButtonBase>
    )
  }

  // The three props that make this a toggle on its own, read as IconButton
  // reads them, and on the same component as the plain button so a toggle
  // whose `isSelected` is still loading stays one element when it arrives.
  // The types keep them off a `text` button; the check here keeps a call
  // site that slipped past them a plain button, as it always was.
  const isToggle =
    variant !== 'text' &&
    (defaultSelected !== undefined ||
      isSelected !== undefined ||
      onChange !== undefined)

  return (
    <ButtonBase
      {...props}
      {...press}
      classes={
        isToggle
          ? toggleClasses(shape, size, variant, group)
          : buttonClasses(shape, size, variant, group)
      }
      href={href}
      isPending={isPending}
      isSelected={isToggle ? selection.selected : undefined}
      onPress={
        isToggle ? pressThen(props.onPress, selection.toggle) : props.onPress
      }
      pendingLabel={pendingLabel}
      rel={rel}
      target={target}
    >
      {content}
    </ButtonBase>
  )
}

// The button's own classes, from React Aria's render state — see the header
// for why that and not the pseudo-classes. Built by a call rather than
// written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
function buttonClasses(
  shape: ButtonShape,
  size: ButtonSize,
  variant: ButtonVariant,
  group: ButtonGroupItem | null,
) {
  return (state: ButtonState) =>
    stylex.props(
      styles.base,
      focus.ring,
      styles[variant],
      styles[size],
      shape === 'square' && squareShapes[size],
      variant === 'outlined' && outlinedSizes[size],
      state.isHovered && hovered[variant],
      state.isFocusVisible && focused[variant],
      state.isPressed && pressed[variant],
      state.isPressed && pressedShapes[size],
      groupStyles(group, size, variant, state),
      state.isDisabled && styles.disabled,
      state.isDisabled && disabledStyles[variant],
    )
}

// What a group lays over the button: its own styles for the button's state,
// and the standard group's widening or narrowing as extra inline padding,
// half of the shift on either side.
function groupStyles(
  group: ButtonGroupItem | null,
  size: ButtonSize,
  variant: ButtonVariant,
  state: ButtonState,
) {
  if (group === null) {
    return null
  }
  const border = variant === 'outlined' ? OUTLINE_WIDTHS[size] : '0px'
  return [
    group.styles?.(state),
    group.shift !== 0 &&
      shifted.padding(
        `calc(${PADDINGS[size]} - ${border} + ${group.shift / 2}px)`,
      ),
  ]
}

// A toggle's classes: the plain button's, with the container and its layers
// swapped for the toggle's pair, and the selected shape between the resting
// and the pressed one. The variant's own style and layers still go first, for
// the shadow and the rule they carry. Built by a call for the reason
// `buttonClasses` is.
function toggleClasses(
  shape: ButtonShape,
  size: ButtonSize,
  variant: ToggleVariant,
  group: ButtonGroupItem | null,
) {
  return (state: ButtonState) => {
    const isSelected = state.isSelected === true
    const container =
      toggleContainers[variant][isSelected ? 'selected' : 'unselected']
    return stylex.props(
      styles.base,
      focus.ring,
      styles[variant],
      styles[container],
      styles[size],
      shape === 'square' && squareShapes[size],
      isSelected && (shape === 'square' ? styles.round : squareShapes[size]),
      variant === 'outlined' && outlinedSizes[size],
      state.isHovered && hovered[variant],
      state.isHovered && hovered[container],
      state.isFocusVisible && focused[variant],
      state.isFocusVisible && focused[container],
      state.isPressed && pressed[variant],
      state.isPressed && pressed[container],
      state.isPressed && pressedShapes[size],
      groupStyles(group, size, variant, state),
      state.isDisabled && styles.disabled,
      state.isDisabled && disabledStyles[variant],
    )
  }
}

export type {
  ButtonDOMProps,
  ButtonProps,
  ButtonShape,
  ButtonSize,
  ButtonState,
  ButtonVariant,
}

export default Button
