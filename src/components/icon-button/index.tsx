'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ClassNameOrFunction,
  DOMRenderFunction,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import type { ButtonDOMProps, ButtonState } from '../../button'

import { ButtonBase, ToggleButtonBase } from '../../button'
import { focus } from '../../styles/focus'
import {
  colors,
  motion,
  radii,
  sizing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// Each variant composites an 'on-color' over its own container at the
// interaction state's opacity, rather than swapping in a separate hover
// color. The pairs are the icon buttons spec page's: filled on primary,
// tonal on secondary container, outlined with an outline variant border and
// an on-surface-variant icon, standard on surface variant over nothing.
// calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
// percentage color-mix() takes. Inlined at each property rather than factored
// into a helper: @stylexjs/babel-plugin only statically recognizes
// expressions written directly as property values.
//
// Disabled is a style of its own per variant rather than a `:disabled`
// branch inside each property, for the reason Button's comment gives: given
// `href` this renders as a link, which React Aria turns into a <span> while
// disabled, and neither matches the pseudo-class. Applied last from the
// render state, the disabled styles replace each property whole, hover and
// pressed branches included.
//
// **The outlined border thickens with the size, and the widths are Button's
// rather than this page's.** The icon buttons page keeps them in a size token
// set its widget will not open to a script, and the two components already
// share their five heights on purpose — a 96dp icon button beside a 96dp
// outlined button with a different border weight would read as a mistake.
//
// **A toggle is the same button reporting a state.** Given `isSelected`,
// `defaultSelected` or `onChange` it is React Aria's `ToggleButton` instead
// of its `Button`, which announces the state through `aria-pressed` rather
// than a role of its own — every variant and size still applies. The page
// gives each style a second pair of colour roles for it, and they are not
// the plain button's: a filled toggle rests on surface container with an
// on-surface-variant icon and takes primary once chosen, a tonal one rests
// on secondary container and takes secondary, and a standard one is
// transparent throughout with the icon going from on-surface-variant to
// primary, and an outlined one swaps its border for the inverse surface
// pair. So a chosen filled toggle looks like a plain filled button, and an
// unchosen one does not.
//
// A toggle is never a link and never pending. React Aria's `ToggleButton`
// takes neither, and neither means anything for a control whose whole job is
// to report which of two states it is in.
//
// The corner softens from a circle to a rounded square while pressed, which
// is the shape morph the icon buttons spec page gives this control, at the
// pressed corner its size token set names: 8 for the two small sizes, 12 at
// medium, 16 at the two large. Each size carries its own pressed radius, since
// StyleX replaces the property whole. The two transitioned properties take
// different curves — the colour change is linear-ish and the shape change is
// emphasized — so the timing functions are a matching comma list rather than
// one value.
//
// A chosen toggle rests at that same pressed corner, which is the page's
// shape morph: a toggle icon button moves from round while unchosen to
// square once chosen. The square shape's own corner sits in a token set the
// page keeps behind its size menu, but the page also says both shapes press
// to the same radius — so the size's pressed corner is the value it already
// assigns to that size, used here at rest rather than invented.
//
// **Under forced colours a container is drawn as a rule, and a chosen toggle
// as the mode's own chosen pair.** That mode paints author backgrounds in a
// system colour and forces the icon's, which left a filled or tonal icon
// button as an icon with nothing round it and a chosen toggle the same as an
// unchosen one. `base` draws a 1px `ButtonText` border there, as Button's
// does. Outlined keeps its own rule, and standard stays without one, as the
// page draws it. A chosen toggle of any style is filled `Highlight` with its
// icon in `HighlightText`. A disabled button's icon and edge are `GrayText`,
// for the reason Button's comment gives: the browser greys a disabled
// `<button>` there, but not the `<span>` a disabled link is.
//
// What every button does past its own styles — the ripple, the link and
// toggle forms, the pending ring, a parent's disabled state — is
// `src/button`'s, shared with Button.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

/**
 * The press area the page requires of its two smallest sizes. A literal
 * rather than `sizing.controlMd`, which holds the same number: that is a step
 * of the control scale, and a consumer resizing their medium controls should
 * not shrink a target the page states as a floor.
 */
const TARGET_SIZE = '48px'

const styles = stylex.create({
  base: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    // The container's rule under forced colours — see the header.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: radii.pill,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: 0, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    padding: 0,
    position: 'relative',
    // `href` makes a button an <a>, and an <a> arrives underlined. Reset
    // here rather than per variant, since every variant sets a colour of
    // its own but none of them touches the rule. Card does the same for the
    // same reason; without it the two disagreed about what a
    // link-as-control looks like.
    textDecoration: 'none',
    transitionDuration: `${motion.durationShort2}, ${motion.durationShort2}`,
    transitionProperty: 'background-color, border-radius',
    transitionTimingFunction: `${motion.easingStandard}, ${motion.easingEmphasized}`,
  },
  disabled: {
    borderRadius: radii.pill,
    cursor: 'not-allowed',
  },
  filled: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
  },
  filledDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // The filled toggle's unchosen container, which is not the plain filled
  // button's: the page rests it on surface container with the muted icon and
  // gives it primary only once it is chosen.
  filledToggle: {
    backgroundColor: colors.surfaceContainer,
    color: colors.onSurfaceVariant,
  },
  // The filled toggle once chosen: the plain filled button's colours, and a
  // style of its own only for the forced-colours pair, which the plain button
  // must not take.
  filledToggleSelected: {
    backgroundColor: {
      default: colors.primary,
      [FORCED_COLORS]: 'Highlight',
    },
    color: { default: colors.onPrimary, [FORCED_COLORS]: 'HighlightText' },
  },
  // Square, so one number sets both edges. The five sizes are the icon
  // buttons spec page's, XS to XL, from its size token sets: the container,
  // the icon it holds and the corner it presses to. The font size is the
  // icon's size, since an icon drawn in `em` follows it: 20, 24, 24, 32 and
  // 40, which is why the two middle sizes share one icon and the container
  // alone grows between them.
  //
  // Two of them are drawn smaller than a press may be: the page says under
  // its measurements that the extra-small and small buttons "must have a
  // target size of 48x48dp or larger to be accessible", and this library's
  // `xs` and `md` are those two at 32 and 40. Each carries a transparent
  // `::before` out to the 48, which takes the press because a pseudo-element
  // is part of the element it belongs to, and moves nothing because the box
  // is out of flow. The larger three are already over it.
  //
  // Two of these side by side end up with targets that meet, since neither
  // container is half the target wide. The page's own answer is to space
  // them, which is a call for the layout around the button rather than for
  // the button — and an overlap is what the sizes already had, with the
  // difference that the reachable half was unreachable instead.
  lg: {
    blockSize: sizing.controlLg,
    borderRadius: radii.pill,
    fontSize: '24px',
    inlineSize: sizing.controlLg,
  },
  // The page requires a 48dp target of the two smallest sizes, and both are
  // under it: a transparent box reaches the 4dp either side. See TARGET_SIZE.
  md: {
    '::before': {
      content: '""',
      inset: `calc((${sizing.controlSm} - ${TARGET_SIZE}) / 2)`,
      position: 'absolute',
    },
    blockSize: sizing.controlSm,
    borderRadius: radii.pill,
    fontSize: '24px',
    inlineSize: sizing.controlSm,
  },
  // Transparent with a rule around it: the page's outlined icon button. The
  // border width comes from the size, since the page thickens it as the
  // control grows.
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.outlineVariant,
    borderStyle: 'solid',
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
  // A chosen outlined toggle drops its rule for a container: the page moves
  // it to the inverse surface pair, which is the one place a toggle here
  // inverts rather than tints.
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
  // Transparent, so it tints whatever it is sitting on rather than carrying a
  // container of its own, as ListItem's rows do. The tint is its icon's
  // on-surface-variant, which is this variant's state layer on the page,
  // where a row's is the on-surface its headline is drawn in.
  standard: {
    backgroundColor: 'transparent',
    // No rule under forced colours either, which replaces `base`'s whole.
    borderWidth: 0,
    color: colors.onSurfaceVariant,
  },
  standardDisabled: {
    backgroundColor: 'transparent',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // A standard toggle keeps no container either way; what changes is the
  // icon, which the page moves from the muted role to primary once chosen.
  // Under forced colours, where that colour is forced, the chosen one is
  // filled instead — see the header.
  standardToggleSelected: {
    backgroundColor: {
      default: 'transparent',
      [FORCED_COLORS]: 'Highlight',
    },
    borderWidth: 0,
    color: { default: colors.primary, [FORCED_COLORS]: 'HighlightText' },
  },
  tonal: {
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
  },
  tonalDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  // The tonal toggle's chosen container: the page moves it from the
  // secondary container pair to secondary itself, which is the one place a
  // toggle's chosen state is darker than the plain button's.
  tonalToggleSelected: {
    backgroundColor: {
      default: colors.secondary,
      [FORCED_COLORS]: 'Highlight',
    },
    color: { default: colors.onSecondary, [FORCED_COLORS]: 'HighlightText' },
  },
  xl: {
    blockSize: sizing.controlXl,
    borderRadius: radii.pill,
    fontSize: '32px',
    inlineSize: sizing.controlXl,
  },
  // The smaller of the two the page requires a 48dp target of, so its box
  // reaches 8dp either side. See TARGET_SIZE.
  xs: {
    '::before': {
      content: '""',
      inset: `calc((${sizing.controlXs} - ${TARGET_SIZE}) / 2)`,
      position: 'absolute',
    },
    blockSize: sizing.controlXs,
    borderRadius: radii.pill,
    fontSize: '20px',
    inlineSize: sizing.controlXs,
  },
  xxl: {
    blockSize: sizing.controlXxl,
    borderRadius: radii.pill,
    fontSize: '40px',
    inlineSize: sizing.controlXxl,
  },
})

// The hover and pressed layers, one style per container, applied from React
// Aria's render state rather than from `:hover` and `:active`, for Button's
// reasons — see its header: a hover layer stayed on after a tap, and no
// pressed layer or corner showed for a press made from the keyboard. A
// chosen toggle's layer keeps its forced-colours `Highlight`, since a later
// style replaces the property whole.
const hovered = stylex.create({
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
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
  standard: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  standardToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
  },
  tonalToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
})

const pressed = stylex.create({
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
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
  standard: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  standardToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
  },
  tonalToggleSelected: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondary})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
})

// The outlined border thickens with the size, as Button's does: 1dp up to M,
// 2dp at XL, 3dp at XXL. A style per size rather than a value in the size
// style, since a border on a filled button would draw in the icon's colour.
const outlineWidths = stylex.create({
  lg: { borderWidth: '1px' },
  md: { borderWidth: '1px' },
  xl: { borderWidth: '2px' },
  xs: { borderWidth: '1px' },
  xxl: { borderWidth: '3px' },
})

// The corner each size presses to, which is the page's round-to-square
// morph, and the corner a chosen toggle rests at. A style per size rather than
// a value inside each size style, since StyleX replaces the property whole:
// it comes after the size's circle while pressed, and after the disabled
// style's circle too for a chosen toggle, which keeps its corner disabled.
const selectedShapes = stylex.create({
  lg: { borderRadius: radii.md },
  md: { borderRadius: radii.sm },
  xl: { borderRadius: radii.lg },
  xs: { borderRadius: radii.sm },
  xxl: { borderRadius: radii.lg },
})

// Which container a toggle draws, chosen and not. Two of the six are the
// plain button's own styles: an unchosen tonal or standard toggle is the
// tonal or standard button. A chosen filled toggle takes the filled button's
// colours from a style of its own, which adds the forced-colours pair.
const toggleStyles = {
  filled: {
    selected: styles.filledToggleSelected,
    unselected: styles.filledToggle,
  },
  outlined: {
    selected: styles.outlinedToggleSelected,
    unselected: styles.outlined,
  },
  standard: {
    selected: styles.standardToggleSelected,
    unselected: styles.standard,
  },
  tonal: { selected: styles.tonalToggleSelected, unselected: styles.tonal },
}

// The same containers by name, for the layers above.
const toggleContainers = {
  filled: { selected: 'filledToggleSelected', unselected: 'filledToggle' },
  outlined: { selected: 'outlinedToggleSelected', unselected: 'outlined' },
  standard: { selected: 'standardToggleSelected', unselected: 'standard' },
  tonal: { selected: 'tonalToggleSelected', unselected: 'tonal' },
} as const

const disabledStyles = {
  filled: styles.filledDisabled,
  outlined: styles.outlinedDisabled,
  standard: styles.standardDisabled,
  tonal: styles.tonalDisabled,
}

type IconButtonProps = {
  /**
   * What the button does, in words. Required rather than optional: an icon
   * on its own has no accessible name, so without this the control announces
   * nothing at all.
   *
   * `undefined` is for a button inside a React Aria component that names it
   * itself — a search field's clear button, a number field's steppers. React
   * Aria takes a prop over its context, so a name written here would replace
   * the one it gives in the reader's locale, and undefined leaves that stand.
   */
  'aria-label': string | undefined
  children?: ReactNode
  /** A function may compute the class from the button's render state. */
  className?: ClassNameOrFunction<IconButtonState>
  /**
   * Whether a toggle starts chosen, when it keeps its own state. Passing
   * this, `isSelected` or `onChange` is what makes the button a toggle.
   */
  defaultSelected?: boolean
  /**
   * Disables the press ripple. The hover and pressed state layers are
   * unaffected.
   * @default false
   */
  disableRipple?: boolean
  /**
   * Where the button leads. Given one, the button is rendered as a link —
   * an `<a>`, announced as the link it is — with the same styles and ripple.
   * `render`, `type`, and the form and pending props apply to the button
   * form only, and a toggle is never a link.
   */
  href?: string
  /**
   * Whether a toggle is chosen, when the call site holds the state. Pass it
   * with `onChange`; passing this, `defaultSelected` or `onChange` is what
   * makes the button a toggle.
   */
  isSelected?: boolean
  /**
   * Called with the new state when a toggle is pressed. Passing this,
   * `isSelected` or `defaultSelected` is what makes the button a toggle.
   */
  onChange?: (isSelected: boolean) => void
  /**
   * The name of the ring shown while the button is pending, for a screen
   * reader. The label it replaces is hidden while it shows. Left out, it is
   * the word for it in the I18nProvider's locale — "Loading" in English.
   */
  pendingLabel?: string
  /** The link's `rel`, when `href` is set. */
  rel?: string
  /**
   * The element to render, given the props it would have carried. React
   * Aria's own form: it has to return the element the component would have
   * rendered itself.
   */
  render?: DOMRenderFunction<'button', IconButtonState>
  /**
   * Control size: `xs` 32px, `md` 40px, `lg` 56px, `xl` 96px, `xxl` 136px —
   * the icon buttons spec page's XS to XL, and the same heights `Button`
   * uses, so the two line up beside each other in a row. The icon is 20px,
   * 24px, 24px, 32px and 40px in turn.
   * @default 'md'
   */
  size?: IconButtonSize
  /** A function may compute the style from the button's render state. */
  style?: StyleOrFunction<IconButtonState>
  /** The link's `target`, when `href` is set. */
  target?: string
  /**
   * `standard` is transparent and tints what it sits on; `outlined` is
   * transparent with a rule around it; `filled` and `tonal` carry a container
   * of their own.
   * @default 'standard'
   */
  variant?: IconButtonVariant
} & Omit<ButtonDOMProps, 'render'>

type IconButtonSize = 'lg' | 'md' | 'xl' | 'xs' | 'xxl'

// The render state a call site's `className`, `style` or `render` function is
// handed: the one every button shares, whose `isSelected` only the toggle
// form fills in — see `ButtonState` in src/button.
type IconButtonState = ButtonState

type IconButtonVariant = 'filled' | 'outlined' | 'standard' | 'tonal'

/**
 * A button that is an icon, at five control heights. Given `href` it is a
 * link with the same appearance. Every `aria-*` prop is forwarded to the
 * element; React Aria alone would keep only the labelling ones.
 *
 * Given `isSelected`, `defaultSelected` or `onChange` it is a toggle, which
 * reports its state through `aria-pressed` and draws the page's second pair
 * of colour roles for its variant. A toggle takes neither `href` nor the
 * pending props.
 *
 * ```tsx
 * <IconButton aria-label="Label" defaultSelected variant="tonal">
 *   <StarIcon />
 * </IconButton>
 * ```
 */
function IconButton({
  defaultSelected,
  href,
  isPending,
  isSelected,
  onChange,
  pendingLabel,
  rel,
  size = 'md',
  target,
  variant = 'standard',
  ...props
}: IconButtonProps & RefAttributes<HTMLAnchorElement | HTMLButtonElement>) {
  // The three props that make this a toggle. Read together rather than behind
  // a `toggle` word of its own, the way `href` already turns the button into
  // a link: a button given none of them has no state to report, and one given
  // any of them has nothing else it could mean.
  if (
    defaultSelected !== undefined ||
    isSelected !== undefined ||
    onChange !== undefined
  ) {
    return (
      <ToggleButtonBase
        {...props}
        classes={toggleStyleProps(size, variant)}
        defaultSelected={defaultSelected}
        isPending={isPending}
        isSelected={isSelected}
        onChange={onChange}
      />
    )
  }

  return (
    <ButtonBase
      {...props}
      classes={iconButtonClasses(size, variant)}
      href={href}
      isPending={isPending}
      pendingLabel={pendingLabel}
      rel={rel}
      target={target}
    />
  )
}

// The plain button's classes, from React Aria's render state — see the hover
// and pressed layers above for why that and not the pseudo-classes. Built by
// a call rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
function iconButtonClasses(size: IconButtonSize, variant: IconButtonVariant) {
  return (state: ButtonState) =>
    stylex.props(
      styles.base,
      focus.ring,
      styles[variant],
      styles[size],
      variant === 'outlined' && outlineWidths[size],
      state.isHovered && hovered[variant],
      state.isPressed && pressed[variant],
      state.isPressed && selectedShapes[size],
      state.isDisabled && styles.disabled,
      state.isDisabled && disabledStyles[variant],
    )
}

// A toggle's styles, from React Aria's render state. The chosen shape is
// applied after the disabled styles so it survives them: which of the two
// states a disabled toggle is in should still be readable, and the disabled
// style otherwise forces the circle back.
function toggleStyleProps(size: IconButtonSize, variant: IconButtonVariant) {
  return (state: IconButtonState) => {
    const container =
      toggleContainers[variant][
        state.isSelected === true ? 'selected' : 'unselected'
      ]
    return stylex.props(
      styles.base,
      focus.ring,
      state.isSelected === true
        ? toggleStyles[variant].selected
        : toggleStyles[variant].unselected,
      styles[size],
      // A chosen outlined toggle has a container rather than a rule, so the
      // width goes on only while it is unchosen.
      variant === 'outlined' &&
        state.isSelected !== true &&
        outlineWidths[size],
      state.isHovered && hovered[container],
      state.isPressed && pressed[container],
      state.isPressed && selectedShapes[size],
      state.isDisabled && styles.disabled,
      state.isDisabled && disabledStyles[variant],
      state.isSelected === true && selectedShapes[size],
    )
  }
}

export type {
  IconButtonProps,
  IconButtonSize,
  IconButtonState,
  IconButtonVariant,
}

export default IconButton
