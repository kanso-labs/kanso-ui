import type { ReactNode } from 'react'
import type {
  ButtonRenderProps,
  ClassNameOrFunction,
  DOMRenderFunction,
  FocusableElement,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  ButtonContext,
  Button as RACButton,
  Link as RACLink,
  ToggleButton as RACToggleButton,
  useSlottedContext,
} from 'react-aria-components'

import type { ButtonDOMProps, ButtonState } from '../button'

import { useRipple } from '../../hooks/useRipple'
import {
  ariaAttributesOf,
  buttonRenderer,
  linkRenderer,
  toggleButtonRenderer,
} from '../../render/aria'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'
import ProgressIndicator from '../progress-indicator'

// Each variant composites an 'on-color' over its own container at the
// interaction state's opacity, rather than swapping in a separate hover
// color. The pairs are the icon buttons spec page's: filled on primary,
// tonal on secondary container, standard on surface variant over nothing. calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
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
// **A toggle is the same button reporting a state.** Given `isSelected`,
// `defaultSelected` or `onChange` it is React Aria's `ToggleButton` instead
// of its `Button`, which announces the state through `aria-pressed` rather
// than a role of its own — every variant and size still applies. The page
// gives each style a second pair of colour roles for it, and they are not
// the plain button's: a filled toggle rests on surface container with an
// on-surface-variant icon and takes primary once chosen, a tonal one rests
// on secondary container and takes secondary, and a standard one is
// transparent throughout with the icon going from on-surface-variant to
// primary. So a chosen filled toggle looks like a plain filled button, and
// an unchosen one does not.
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
type Ripple = ReturnType<typeof useRipple<FocusableElement>>

const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
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
    borderRadius: radii.full,
    cursor: 'not-allowed',
  },
  filled: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      default: colors.primary,
    },
    color: colors.onPrimary,
  },
  filledDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // The filled toggle's unchosen container, which is not the plain filled
  // button's: the page rests it on surface container with the muted icon and
  // gives it primary only once it is chosen.
  filledToggle: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainer})`,
      default: colors.surfaceContainer,
    },
    color: colors.onSurfaceVariant,
  },
  // While pending, the label stays in the flow so the button keeps its
  // width, and is hidden — `display: contents` leaves the layout exactly as
  // it was, and `visibility` is inherited, so the label's own parts go with
  // it.
  label: {
    display: 'contents',
  },
  labelPending: {
    visibility: 'hidden',
  },
  // Square, so one number sets both edges. The five sizes are the icon
  // buttons spec page's, XS to XL, from its size token sets: the container,
  // the icon it holds and the corner it presses to. The font size is the
  // icon's size, since an icon drawn in `em` follows it: 20, 24, 24, 32 and
  // 40, which is why the two middle sizes share one icon and the container
  // alone grows between them.
  lg: {
    blockSize: '56px',
    borderRadius: { ':active': radii.md, default: radii.full },
    fontSize: '24px',
    inlineSize: '56px',
  },
  md: {
    blockSize: '40px',
    borderRadius: { ':active': radii.sm, default: radii.full },
    fontSize: '24px',
    inlineSize: '40px',
  },
  // The ring sits over the hidden label, centred in the button.
  pending: {
    alignItems: 'center',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'absolute',
  },
  // Transparent, so it tints whatever it is sitting on rather than carrying a
  // container of its own — the same treatment ListItem's rows get.
  standard: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.onSurfaceVariant,
  },
  standardDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // A standard toggle keeps no container either way; what changes is the
  // icon, which the page moves from the muted role to primary once chosen.
  standardToggleSelected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.primary,
  },
  tonal: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
    },
    color: colors.onSecondaryContainer,
  },
  tonalDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // The tonal toggle's chosen container: the page moves it from the
  // secondary container pair to secondary itself, which is the one place a
  // toggle's chosen state is darker than the plain button's.
  tonalToggleSelected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondary})`,
      ':hover': `color-mix(in srgb, ${colors.onSecondary} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondary})`,
      default: colors.secondary,
    },
    color: colors.onSecondary,
  },
  xl: {
    blockSize: '96px',
    borderRadius: { ':active': radii.lg, default: radii.full },
    fontSize: '32px',
    inlineSize: '96px',
  },
  xs: {
    blockSize: '32px',
    borderRadius: { ':active': radii.sm, default: radii.full },
    fontSize: '20px',
    inlineSize: '32px',
  },
  xxl: {
    blockSize: '136px',
    borderRadius: { ':active': radii.lg, default: radii.full },
    fontSize: '40px',
    inlineSize: '136px',
  },
})

// A chosen toggle rests at the corner its size presses to, which is the
// page's round-to-square morph. A style per size rather than a value inside
// each size style, since StyleX replaces the property whole and this one has
// to beat both the size's `:active` branch and the disabled style's circle.
const selectedShapes = stylex.create({
  lg: { borderRadius: radii.md },
  md: { borderRadius: radii.sm },
  xl: { borderRadius: radii.lg },
  xs: { borderRadius: radii.sm },
  xxl: { borderRadius: radii.lg },
})

// Which container a toggle draws, chosen and not. Three of the six are the
// plain button's own styles: a chosen filled toggle is the filled button, and
// an unchosen tonal or standard one is the tonal or standard button.
const toggleStyles = {
  filled: { selected: styles.filled, unselected: styles.filledToggle },
  standard: {
    selected: styles.standardToggleSelected,
    unselected: styles.standard,
  },
  tonal: { selected: styles.tonalToggleSelected, unselected: styles.tonal },
}

const disabledStyles = {
  filled: styles.filledDisabled,
  standard: styles.standardDisabled,
  tonal: styles.tonalDisabled,
}

type IconButtonProps = {
  /**
   * What the button does, in words. Required rather than optional: an icon
   * on its own has no accessible name, so without this the control announces
   * nothing at all.
   */
  'aria-label': string
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
   * reader. The label it replaces is hidden while it shows.
   * @default 'Loading'
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
   * `standard` is transparent and tints what it sits on; `filled` and `tonal`
   * carry a container of their own.
   * @default 'standard'
   */
  variant?: IconButtonVariant
} & Omit<ButtonDOMProps, 'render'>

type IconButtonSize = 'lg' | 'md' | 'xl' | 'xs' | 'xxl'

// The render state a call site's `className`, `style` or `render` function is
// handed. `isSelected` is optional because only the toggle form has one, and
// one function has to be accepted by both: React Aria hands the plain button
// a state without it and the toggle a state with it, and a parameter type
// this wide accepts either.
type IconButtonState = ButtonState & { isSelected?: boolean }

type IconButtonVariant = 'filled' | 'standard' | 'tonal'

// What the button draws: its label, hidden while the button is pending, with
// the ring over it. The ring takes the button's own content colour rather
// than the progress page's primary, which on a filled button is the fill
// itself and so invisible. The label stays in the flow so the button keeps its
// width, which is what stops a form jumping the moment it is submitted.
// React Aria wants the progress bar in the accessibility tree as soon as the
// button goes pending, so it is rendered from the render state rather than
// after a delay.
//
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler
// memoises the result on its inputs.
function buttonContent(
  children: ReactNode,
  pendingLabel: string,
  ripple: Ripple,
) {
  return (state: ButtonRenderProps) => (
    <>
      <span
        {...stylex.props(styles.label, state.isPending && styles.labelPending)}
      >
        {children}
      </span>
      {state.isPending ? (
        <span {...stylex.props(styles.pending)}>
          <ProgressIndicator
            aria-label={pendingLabel}
            isIndeterminate
            size="1em"
            tone="inherit"
            variant="circular"
          />
        </span>
      ) : null}
      {ripple.surface}
    </>
  )
}
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
  children,
  defaultSelected,
  disableRipple = false,
  href,
  isDisabled,
  isSelected,
  onChange,
  onClick,
  onContextMenu,
  onKeyDown,
  onKeyUp,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  pendingLabel = 'Loading',
  rel,
  render,
  size = 'md',
  target,
  variant = 'standard',
  ...props
}: IconButtonProps) {
  // A field's context may disable the button — a number field's stepper at
  // the end of its range, a search field's clear button with the field — and
  // React Aria takes a prop over its context, so a default of `false` here
  // would keep every one of them enabled. The call site's own prop still
  // wins where it is given; the context is read for the ripple, which has
  // to know before the render state does.
  const context = useSlottedContext(ButtonContext, props.slot)
  const disabled = isDisabled ?? context?.isDisabled ?? false

  // `props` (className/style, etc.) is spread separately: `className` and
  // `style` there may be functions of render state, which ripple's own
  // handler-only merge doesn't need to know about. It is also why the styles
  // below merge through mergeStatefulStyles rather than the plain
  // mergeStyles. The ripple is off while disabled, as in Button.
  const ripple = useRipple<FocusableElement>(!disableRipple && !disabled, {
    onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })

  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }

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
      <RACToggleButton
        defaultSelected={defaultSelected}
        isDisabled={disabled}
        isSelected={isSelected}
        onChange={onChange}
        render={toggleButtonRenderer(element, render)}
        {...ripple.handlers}
        {...props}
        {...mergeStatefulStyles(toggleStyleProps(size, variant), props)}
      >
        {toggleContent(children, ripple)}
      </RACToggleButton>
    )
  }

  const styleProps = mergeStatefulStyles(
    (state: ButtonState) =>
      stylex.props(
        styles.base,
        styles[variant],
        styles[size],
        state.isDisabled && styles.disabled,
        state.isDisabled && disabledStyles[variant],
      ),
    props,
  )

  if (href !== undefined) {
    return (
      <RACLink
        href={href}
        isDisabled={disabled}
        rel={rel}
        render={linkRenderer(element)}
        target={target}
        {...ripple.handlers}
        {...props}
        {...styleProps}
      >
        {children}
        {ripple.surface}
      </RACLink>
    )
  }

  return (
    <RACButton
      isDisabled={disabled}
      render={buttonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...styleProps}
    >
      {buttonContent(children, pendingLabel, ripple)}
    </RACButton>
  )
}

// What a toggle draws: its icon and the ripple. No pending ring — React
// Aria's toggle button has no pending state, and a control reporting which of
// two states it is in has nothing to be pending about.
//
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs.
function toggleContent(children: ReactNode, ripple: Ripple) {
  return () => (
    <>
      {children}
      {ripple.surface}
    </>
  )
}

// A toggle's styles, from React Aria's render state. The chosen shape is
// applied after the disabled styles so it survives them: which of the two
// states a disabled toggle is in should still be readable, and the disabled
// style otherwise forces the circle back.
function toggleStyleProps(size: IconButtonSize, variant: IconButtonVariant) {
  return (state: IconButtonState) =>
    stylex.props(
      styles.base,
      state.isSelected === true
        ? toggleStyles[variant].selected
        : toggleStyles[variant].unselected,
      styles[size],
      state.isDisabled && styles.disabled,
      state.isDisabled && disabledStyles[variant],
      state.isSelected === true && selectedShapes[size],
    )
}

export type {
  IconButtonProps,
  IconButtonSize,
  IconButtonState,
  IconButtonVariant,
}

export default IconButton
