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

// Each variant composites an 'on-color' (filled) or the brand color itself
// (outlined/text, over a transparent container) at the interaction state's
// opacity, rather than swapping in a separate hover/pressed color.
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
    paddingInline: spacing.xl,
  },
  filledDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    boxShadow: 'none',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // Control heights and their inline padding are written as literals, not
  // drawn from the spacing scale: they are the design's fixed control
  // metrics, and the component scale has no 48px step to hang the largest
  // one on anyway. Each size takes only the size and line-height of a scale
  // style and never its font or weight — labelLarge's sans at 500 holds
  // across all four, so an xl button still reads as a button rather than
  // picking up the serif face titleLarge carries in this token set.
  lg: {
    blockSize: '56px',
    fontSize: typography.bodyLargeSize,
    lineHeight: typography.bodyLargeLineHeight,
    paddingInline: spacing.xxl,
  },
  md: {
    blockSize: '40px',
  },
  outlined: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    borderColor: colors.outline,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.primary,
    paddingInline: spacing.xl,
  },
  outlinedDisabled: {
    backgroundColor: 'transparent',
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  text: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.primary,
    paddingInline: spacing.lg,
  },
  textDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  tonal: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primaryContainer})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.primaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    boxShadow: {
      ':active': 'none',
      ':hover': shadows.elevation1,
      default: 'none',
    },
    color: colors.onPrimaryContainer,
    paddingInline: spacing.xl,
  },
  tonalDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    boxShadow: 'none',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  xl: {
    blockSize: '80px',
    fontSize: typography.titleLargeSize,
    lineHeight: typography.titleLargeLineHeight,
    paddingInline: '48px',
  },
  xs: {
    blockSize: '32px',
    fontSize: typography.labelMediumSize,
    lineHeight: typography.labelMediumLineHeight,
    paddingInline: spacing.lg,
  },
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
  /** The link's `rel`, when `href` is set. */
  rel?: string
  /**
   * Control height: `xs` 32px, `md` 40px, `lg` 56px, `xl` 80px. Sizes other
   * than `md` also set their own inline padding.
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

type ButtonSize = 'lg' | 'md' | 'xl' | 'xs'

// The render state both of React Aria's elements share. A className or
// style function written against it serves the button and the link alike;
// `isPending` belongs to the button alone, and `isCurrent` to the link.
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
 * The design's button, at four emphasis levels and four control heights.
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
      {children}
      {ripple.surface}
    </RACButton>
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
