import type { DOMAttributes, ReactNode } from 'react'
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
import {
  ariaAttributesOf,
  buttonRenderer,
  linkRenderer,
} from '../../render/aria'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import ProgressIndicator from '../progress-indicator'

// Each variant composites its label colour over its container at the
// interaction state's opacity, rather than swapping in a separate
// hover/pressed color: filled and tonal paint the 'on-color' over the
// container, outlined and text paint the label colour over a transparent
// one. The pairs are the buttons spec page's newer values: tonal on
// secondary container, outlined with an outline variant border and an
// on-surface-variant label, text on primary.
// calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
// percentage color-mix() takes. Inlined rather than factored into a helper:
// @stylexjs/babel-plugin only statically recognizes expressions written
// directly as property values, and a call to an externally-defined function
// isn't one of them.
//
// Disabled is a style of its own per variant rather than a `:disabled`
// branch inside each property: a button given `href` renders as a link,
// which React Aria turns into a <span> while disabled, and neither matches
// the pseudo-class. The disabled styles are applied last from the render
// state's `isDisabled`, and StyleX replaces a property whole, so they also
// take the hover and pressed branches with them — which is what keeps a
// hovered disabled button from lighting up.
//
// Two independent axes, applied base -> variant -> size. The order is what
// lets `text` keep its tighter inline padding at the default size while the
// other sizes still set their own: `md` deliberately declares no
// paddingInline, so a medium button falls through to whatever its variant
// asked for, and every other size overrides it. That mirrors the source
// design's own cascade, where the size classes are declared after the
// variant ones and win on padding for exactly the same reason.
type Ripple = ReturnType<typeof useRipple<FocusableElement>>

const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
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
  filled: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      default: colors.primary,
    },
    boxShadow: {
      ':active': 'none',
      ':hover': shadows.elevation1,
      default: 'none',
    },
    color: colors.onPrimary,
  },
  filledDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    boxShadow: 'none',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
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
  lg: {
    blockSize: '56px',
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    paddingInline: spacing.xl,
  },
  md: {
    blockSize: '40px',
    paddingInline: spacing.lg,
  },
  outlined: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    borderColor: colors.outlineVariant,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.onSurfaceVariant,
  },
  outlinedDisabled: {
    backgroundColor: 'transparent',
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
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
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.primary,
  },
  textDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  tonal: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
    },
    boxShadow: {
      ':active': 'none',
      ':hover': shadows.elevation1,
      default: 'none',
    },
    color: colors.onSecondaryContainer,
  },
  tonalDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    boxShadow: 'none',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  xl: {
    blockSize: '96px',
    fontFamily: typography.headlineSmallFont,
    fontSize: typography.headlineSmallSize,
    fontWeight: typography.headlineSmallWeight,
    gap: spacing.md,
    letterSpacing: typography.headlineSmallTracking,
    lineHeight: typography.headlineSmallLineHeight,
    paddingInline: '48px',
  },
  xs: {
    blockSize: '32px',
    paddingInline: spacing.lg,
  },
  xxl: {
    blockSize: '136px',
    fontFamily: typography.headlineLargeFont,
    fontSize: typography.headlineLargeSize,
    fontWeight: typography.headlineLargeWeight,
    gap: spacing.lg,
    letterSpacing: typography.headlineLargeTracking,
    lineHeight: typography.headlineLargeLineHeight,
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

const disabledStyles = {
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
   * reader. The label it replaces is hidden while it shows.
   * @default 'Loading'
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
  /** @default 'filled' */
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

type ButtonVariant = 'filled' | 'outlined' | 'text' | 'tonal'

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
 * The design's button, at four emphasis levels and five control heights.
 * Given `href` it is a link with the same appearance. Every `aria-*` prop is
 * forwarded to the element; React Aria alone would keep only the labelling
 * ones.
 */
function Button({
  children,
  disableRipple = false,
  href,
  isDisabled = false,
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
  variant = 'filled',
  ...props
}: ButtonProps) {
  // `props` (className/style, etc.) is spread separately: `className` and
  // `style` there may be functions of render state, which ripple's own
  // handler-only merge doesn't need to know about. It is also why the styles
  // below merge through mergeStatefulStyles rather than the plain
  // mergeStyles. The ripple is off while disabled: React Aria still forwards
  // pointer events to a disabled element, and a press that changes nothing
  // should not look like one.
  const ripple = useRipple<FocusableElement>(!disableRipple && !isDisabled, {
    onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })

  const styleProps = mergeStatefulStyles(
    (state: ButtonState) =>
      stylex.props(
        styles.base,
        styles[variant],
        styles[size],
        variant === 'outlined' && outlineWidths[size],
        state.isDisabled && styles.disabled,
        state.isDisabled && disabledStyles[variant],
      ),
    props,
  )

  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }

  if (href !== undefined) {
    return (
      <RACLink
        href={href}
        isDisabled={isDisabled}
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
      render={buttonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...styleProps}
    >
      {buttonContent(children, pendingLabel, ripple)}
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
