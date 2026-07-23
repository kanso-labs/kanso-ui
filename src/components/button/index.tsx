import type { ButtonProps as BaseUIButtonProps } from '@base-ui/react/button'

import { Button as BaseUIButton } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { useRipple } from '../../hooks/useRipple'
import {
  colors,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// A filled button composites an 'on-color' over its container at the
// interaction state's opacity, rather than swapping in a separate
// hover/pressed color. calc(<opacity> * 100%) turns the token's unitless
// 0-1 ratio into the percentage color-mix() takes. Inlined rather than
// factored into a helper: @stylexjs/babel-plugin only statically recognizes
// expressions written directly as property values, and a call to an
// externally-defined function isn't one of them.
//
// :hover and :active still match a disabled native <button>, and stylex's
// fixed pseudo-class ordering places both after :disabled, so without the
// :not(:disabled) guard a hovered/pressed disabled button would render with
// the interaction color instead of the disabled one.
const styles = stylex.create({
  base: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.focus} * 100%), ${colors.primary})`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      default: colors.primary,
    },
    borderRadius: radii.full,
    borderWidth: 0,
    boxShadow: {
      ':active:not(:disabled)': 'none',
      ':hover:not(:disabled)': shadows.elevation1,
      default: 'none',
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onPrimary,
    },
    cursor: { ':disabled': 'not-allowed', default: 'pointer' },
    display: 'inline-block',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: spacing.md,
    paddingInline: spacing.xl,
    position: 'relative',
  },
})

type ButtonProps = BaseUIButtonProps & {
  /**
   * Disables the press ripple. The hover/pressed background state layer is
   * unaffected.
   * @default false
   */
  disableRipple?: boolean
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
  ...props
}: ButtonProps) {
  // `props` (className/style/render, etc.) is spread separately: `className`
  // and `style` there may be functions of render state, a Base UI extension
  // ripple's own handler-only merge doesn't need to know about.
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
      {...stylex.props(styles.base)}
    >
      {children}
      {ripple.surface}
    </BaseUIButton>
  )
}

export type { ButtonProps }

export default Button
