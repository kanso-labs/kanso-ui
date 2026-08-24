import type { ButtonProps as BaseUIButtonProps } from '@base-ui/react/button'

import { Button as BaseUIButton } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { useRipple } from '../../hooks/useRipple'
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
// :hover and :active still match a disabled native <button>, and stylex's
// fixed pseudo-class ordering places both after :disabled, so without the
// :not(:disabled) guard a hovered/pressed disabled button would render with
// the interaction color instead of the disabled one.
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
    cursor: { ':disabled': 'not-allowed', default: 'pointer' },
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
  },
  filled: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      default: colors.primary,
    },
    boxShadow: {
      ':active:not(:disabled)': 'none',
      ':hover:not(:disabled)': shadows.elevation1,
      default: 'none',
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onPrimary,
    },
    paddingInline: spacing.xl,
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
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    borderColor: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
      default: colors.outline,
    },
    borderStyle: 'solid',
    borderWidth: '1px',
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.primary,
    },
    paddingInline: spacing.xl,
  },
  text: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.primary,
    },
    paddingInline: spacing.lg,
  },
  tonal: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primaryContainer})`,
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.primaryContainer})`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    boxShadow: {
      ':active:not(:disabled)': 'none',
      ':hover:not(:disabled)': shadows.elevation1,
      default: 'none',
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onPrimaryContainer,
    },
    paddingInline: spacing.xl,
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

type ButtonProps = BaseUIButtonProps & {
  /**
   * Disables the press ripple. The hover/pressed background state layer is
   * unaffected.
   * @default false
   */
  disableRipple?: boolean
  /**
   * Control height: `xs` 32px, `md` 40px, `lg` 56px, `xl` 80px. Sizes other
   * than `md` also set their own inline padding.
   * @default 'md'
   */
  size?: 'lg' | 'md' | 'xl' | 'xs'
  /** @default 'filled' */
  variant?: 'filled' | 'outlined' | 'text' | 'tonal'
}

function Button({
  children,
  disabled = false,
  disableRipple = false,
  onClick,
  onContextMenu,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  size = 'md',
  variant = 'filled',
  ...props
}: ButtonProps) {
  // `props` (className/style/render, etc.) is spread separately: `className`
  // and `style` there may be functions of render state, a Base UI extension
  // ripple's own handler-only merge doesn't need to know about. It is also
  // why the styles below merge through mergeStatefulStyles rather than the
  // plain mergeStyles.
  const ripple = useRipple<HTMLButtonElement>(!disableRipple, {
    onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })

  return (
    <BaseUIButton
      disabled={disabled}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(
        stylex.props(styles.base, styles[variant], styles[size]),
        props,
      )}
    >
      {children}
      {ripple.surface}
    </BaseUIButton>
  )
}

export type { ButtonProps }

export default Button
