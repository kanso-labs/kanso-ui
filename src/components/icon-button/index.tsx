import type { ReactNode } from 'react'
import type {
  ButtonRenderProps,
  ClassNameOrFunction,
  FocusableElement,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  ButtonContext,
  Button as RACButton,
  Link as RACLink,
  useSlottedContext,
} from 'react-aria-components'

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
// The corner softens from a circle to a rounded square while pressed, which
// is the shape morph the icon buttons spec page gives this control, at the
// pressed corner its size token set names: 8 for the two small sizes, 12 at
// medium, 16 at the two large. Each size carries its own pressed radius, since
// StyleX replaces the property whole. The two transitioned properties take
// different curves — the colour change is linear-ish and the shape change is
// emphasized — so the timing functions are a matching comma list rather than
// one value.
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
  /**
   * The name of the ring shown while the button is pending, for a screen
   * reader. The label it replaces is hidden while it shows.
   * @default 'Loading'
   */
  pendingLabel?: string
  /** The link's `rel`, when `href` is set. */
  rel?: string
  /**
   * Control size: `xs` 32px, `md` 40px, `lg` 56px, `xl` 96px, `xxl` 136px —
   * the icon buttons spec page's XS to XL, and the same heights `Button`
   * uses, so the two line up beside each other in a row. The icon is 20px,
   * 24px, 24px, 32px and 40px in turn.
   * @default 'md'
   */
  size?: 'lg' | 'md' | 'xl' | 'xs' | 'xxl'
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
 */
function IconButton({
  children,
  disableRipple = false,
  href,
  isDisabled,
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

export type { IconButtonProps }

export default IconButton
