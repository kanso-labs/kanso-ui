'use client'

import type { DOMAttributes, ReactNode, RefAttributes } from 'react'
import type {
  ButtonRenderProps,
  ClassNameOrFunction,
  FocusableElement,
  ButtonProps as RACButtonProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Button as RACButton, Link as RACLink } from 'react-aria-components'

import { useRipple } from '../../hooks/useRipple'
import { useMessages } from '../../i18n'
import {
  ariaAttributesOf,
  buttonRenderer,
  linkRenderer,
} from '../../render/aria'
import { refCallback } from '../../render/ref'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import ProgressIndicator from '../progress-indicator'

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
type Ripple = ReturnType<typeof useRipple<FocusableElement>>

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
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    position: 'relative',
    // `href` makes a button an <a>, and an <a> arrives underlined. Reset
    // here rather than per variant, since every variant sets a colour of
    // its own but none of them touches the rule. Card does the same for the
    // same reason; without it the two disagreed about what a
    // link-as-control looks like.
    textDecoration: 'none',
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
  // The five sizes are the buttons spec page's, XS to XL, from its size token
  // sets: the container height, the inline padding, the gap before an icon,
  // and the type role — label-large for the two small sizes, then
  // title-medium, headline-small and headline-large, each taken whole, face
  // and weight included, since the role is what the page names. The two
  // largest paddings are literals: 48 and 64 are not steps of the spacing
  // scale, and the scale should not grow to fit one component. `md` is the
  // page's S, which it calls the default.
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
  md: {
    '::before': {
      content: '""',
      insetBlock: `calc((${sizing.controlSm} - ${TARGET_SIZE}) / 2)`,
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
  // The ring sits over the hidden label, centred in the button.
  pending: {
    alignItems: 'center',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'absolute',
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
  // reaches 8dp past each edge. See `md`.
  xs: {
    '::before': {
      content: '""',
      insetBlock: `calc((${sizing.controlXs} - ${TARGET_SIZE}) / 2)`,
      insetInline: 0,
      position: 'absolute',
    },
    minBlockSize: sizing.controlXs,
    paddingBlock: spacing.xs,
    paddingInline: spacing.lg,
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
const outlineWidths = stylex.create({
  lg: { borderWidth: '1px' },
  md: { borderWidth: '1px' },
  xl: { borderWidth: '2px' },
  xs: { borderWidth: '1px' },
  xxl: { borderWidth: '3px' },
})

// The interaction state layers, one style per variant for each state, applied
// from React Aria's render state — see the header for why that and not the
// pseudo-classes. In the order they are applied, so where two hold the later
// wins, as the page draws one layer at a time: focus over hover, and a press
// over both. Hover lifts filled and tonal off the page and raises elevated a
// level, and a press brings each back to where it rests.
const hovered = stylex.create({
  elevated: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerLow})`,
    boxShadow: shadows.elevation2,
  },
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
    boxShadow: shadows.elevation1,
  },
  outlined: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  text: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
    boxShadow: shadows.elevation1,
  },
})

const focused = stylex.create({
  elevated: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), ${colors.surfaceContainerLow})`,
  },
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
  },
  outlined: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  text: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
  },
})

const pressed = stylex.create({
  elevated: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
    boxShadow: shadows.elevation1,
  },
  filled: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
    boxShadow: 'none',
  },
  outlined: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  text: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  tonal: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
    boxShadow: 'none',
  },
})

const disabledStyles = {
  elevated: styles.elevatedDisabled,
  filled: styles.filledDisabled,
  outlined: styles.outlinedDisabled,
  text: styles.textDisabled,
  tonal: styles.tonalDisabled,
}

type ButtonDOMProps = Omit<
  RACButtonProps,
  'children' | 'className' | 'style' | GlobalEventKey
> &
  Pick<DOMAttributes<HTMLElement>, GlobalEventKey>

type ButtonProps = {
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
   * Where the button leads. Given one, the button is rendered as a link —
   * an `<a>`, announced as the link it is — with the same styles and ripple.
   * `render`, `type`, and the form and pending props apply to the button
   * form only.
   */
  href?: string
  /**
   * The name of the ring shown while the button is pending, for a screen
   * reader. The label it replaces is hidden while it shows. Left out, it is
   * the word for it in the I18nProvider's locale — "Loading" in English.
   */
  pendingLabel?: string
  /** The link's `rel`, when `href` is set. */
  rel?: string
  /**
   * Control height: `xs` 32px, `md` 40px, `lg` 56px, `xl` 96px, `xxl` 136px —
   * the buttons spec page's XS, S, M, L and XL, each with its own inline
   * padding and type role. `md` is the page's default.
   * @default 'md'
   */
  size?: ButtonSize
  /** A function may compute the style from the button's render state. */
  style?: StyleOrFunction<ButtonState>
  /** The link's `target`, when `href` is set. */
  target?: string
  /**
   * How much weight the button pulls. `filled` and `tonal` carry a container
   * of their own; `outlined` and `text` sit on the page; `elevated` sits on
   * a low surface and lifts off it with a shadow, for a button that has to
   * separate from a busy background rather than from the page.
   * @default 'filled'
   */
  variant?: ButtonVariant
} & ButtonDOMProps

type ButtonSize = 'lg' | 'md' | 'xl' | 'xs' | 'xxl'

// The render state both of React Aria's elements share. A className or
// style function written against it serves the button and the link alike;
// `isPending` belongs to the button alone, and `isCurrent` to the link, so
// neither is here: a `className` written against this state serves both
// elements. What the button draws while pending is decided in
// `buttonContent`, which sees React Aria's own state rather than this one.
type ButtonState = Pick<
  ButtonRenderProps,
  'isDisabled' | 'isFocused' | 'isFocusVisible' | 'isHovered' | 'isPressed'
>

type ButtonVariant = 'elevated' | 'filled' | 'outlined' | 'text' | 'tonal'

// React Aria types the global DOM events — pointer, mouse, touch, wheel and
// the rest — against the element each component renders, and a handler
// written for a <button> does not type-check against an <a>. The keys are
// retyped against HTMLElement here so one set of props serves both forms;
// the events React Aria defines itself (press, focus, keyboard) keep its
// types, since it hands those its own event objects.
type GlobalEventKey = Exclude<
  keyof DOMAttributes<HTMLElement> & keyof RACButtonProps,
  'onBlur' | 'onClick' | 'onFocus'
>

/**
 * The design's button, at five emphasis levels and five control heights.
 * Given `href` it is a link with the same appearance. Every `aria-*` prop is
 * forwarded to the element; React Aria alone would keep only the labelling
 * ones.
 */
function Button({
  children,
  disableRipple = false,
  href,
  isDisabled = false,
  isPending = false,
  onClick,
  onContextMenu,
  onKeyDown,
  onKeyUp,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  pendingLabel,
  ref,
  rel,
  render,
  size = 'md',
  target,
  variant = 'filled',
  ...props
}: ButtonProps & RefAttributes<HTMLAnchorElement | HTMLButtonElement>) {
  const messages = useMessages()

  // `props` (className/style, etc.) is spread separately: `className` and
  // `style` there may be functions of render state, which ripple's own
  // handler-only merge doesn't need to know about. It is also why the styles
  // below merge through mergeStatefulStyles rather than the plain
  // mergeStyles. The ripple is off while disabled: React Aria still forwards
  // pointer events to a disabled element, and a press that changes nothing
  // should not look like one.
  //
  // Off while pending for the same reason, and for a second one. React Aria
  // nulls out the handlers it derived itself while pending — the click among
  // them — but not the separate copy of the global pointer events that
  // carries ours, so a press still reached the ripple and started it while
  // the click that would have ended it never arrived. The ripple stayed at
  // its pressed opacity until some later press completed a cycle of its own.
  const ripple = useRipple<FocusableElement>(
    !disableRipple && !isDisabled && !isPending,
    {
      onClick,
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    },
  )

  const styleProps = mergeStatefulStyles(
    (state: ButtonState) =>
      stylex.props(
        styles.base,
        focus.ring,
        styles[variant],
        styles[size],
        variant === 'outlined' && outlineWidths[size],
        state.isHovered && hovered[variant],
        state.isFocusVisible && focused[variant],
        state.isPressed && pressed[variant],
        state.isDisabled && styles.disabled,
        state.isDisabled && disabledStyles[variant],
      ),
    props,
  )

  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }
  // The element is a link or a button, so the ref is typed as either, and is
  // handed to each as the callback both accept — see src/render/ref.ts.
  const forwarded = refCallback(ref)

  if (href !== undefined) {
    return (
      <RACLink
        href={href}
        isDisabled={isDisabled}
        ref={forwarded}
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
      isDisabled={isDisabled}
      isPending={isPending}
      ref={forwarded}
      render={buttonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...styleProps}
    >
      {buttonContent(children, pendingLabel ?? messages.loading, ripple)}
    </RACButton>
  )
}
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

export type {
  ButtonDOMProps,
  ButtonProps,
  ButtonSize,
  ButtonState,
  ButtonVariant,
}

export default Button
