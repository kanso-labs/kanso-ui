import type { ReactNode } from 'react'
import type {
  ClassNameOrFunction,
  FocusableElement,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Button as RACButton, Link as RACLink } from 'react-aria-components'

import type { ButtonDOMProps, ButtonState } from '../button'

import { useRipple } from '../../hooks/useRipple'
import {
  ariaAttributesOf,
  buttonRenderer,
  linkRenderer,
} from '../../render/aria'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// Each variant composites an 'on-color' over its own container at the
// interaction state's opacity, rather than swapping in a separate hover
// color. calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
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
// The corner softens from a circle to a rounded square while pressed, which
// is the shape morph the source design gives this control. The two
// transitioned properties take different curves — the colour change is
// linear-ish and the shape change is emphasized — so the timing functions are
// a matching comma list rather than one value.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: {
      ':active': radii.md,
      default: radii.full,
    },
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
  // Square, so one number sets both edges. The font size is the icon's size:
  // it scales a font-driven glyph, and an SVG drawn in `em` follows it, which
  // is what lets one icon serve all three buttons. An SVG given its own fixed
  // dimensions ignores it, which is the call site's choice to make.
  //
  // These are control metrics rather than type, so they are literals like the
  // heights beside them — the type scale has no 20px step, and taking its
  // nearest sizes instead produced an icon that barely grew while the button
  // went from 32px to 56px.
  lg: {
    blockSize: '56px',
    fontSize: '32px',
    inlineSize: '56px',
  },
  md: {
    blockSize: '40px',
    fontSize: '24px',
    inlineSize: '40px',
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
  tonal: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    color: colors.onPrimaryContainer,
  },
  tonalDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  xs: {
    blockSize: '32px',
    fontSize: '20px',
    inlineSize: '32px',
  },
})

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
  className?: ClassNameOrFunction<ButtonState>
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
   * form only.
   */
  href?: string
  /** The link's `rel`, when `href` is set. */
  rel?: string
  /**
   * Control size: `xs` 32px, `md` 40px, `lg` 56px — the same heights `Button`
   * uses, so the two line up beside each other in a row.
   * @default 'md'
   */
  size?: 'lg' | 'md' | 'xs'
  /** A function may compute the style from the button's render state. */
  style?: StyleOrFunction<ButtonState>
  /** The link's `target`, when `href` is set. */
  target?: string
  /**
   * `standard` is transparent and tints what it sits on; `filled` and `tonal`
   * carry a container of their own.
   * @default 'standard'
   */
  variant?: 'filled' | 'standard' | 'tonal'
} & ButtonDOMProps

/**
 * A button that is an icon, at three control heights. Given `href` it is a
 * link with the same appearance. Every `aria-*` prop is forwarded to the
 * element; React Aria alone would keep only the labelling ones.
 */
function IconButton({
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
  variant = 'standard',
  ...props
}: IconButtonProps) {
  // `props` (className/style, etc.) is spread separately: `className` and
  // `style` there may be functions of render state, which ripple's own
  // handler-only merge doesn't need to know about. It is also why the styles
  // below merge through mergeStatefulStyles rather than the plain
  // mergeStyles. The ripple is off while disabled, as in Button.
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

export type { IconButtonProps }

export default IconButton
