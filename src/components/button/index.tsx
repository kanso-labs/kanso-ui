import type { ButtonProps as BaseUIButtonProps } from '@base-ui/react/button'

import { Button as BaseUIButton } from '@base-ui/react/button'
import { CircleNotch } from '@phosphor-icons/react'
import * as stylex from '@stylexjs/stylex'

import { colors } from '../../tokens/colors.stylex'
import { radii } from '../../tokens/radii.stylex'
import { spacing } from '../../tokens/spacing.stylex'
import { typography } from '../../tokens/typography.stylex'

const spin = stylex.keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 0,
    cursor: { ':disabled': 'not-allowed', default: 'pointer' },
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontWeight: typography.weightBold,
    gap: spacing.sm,
    justifyContent: 'center',
    lineHeight: typography.leadingTight,
    opacity: { ':disabled': 0.6, default: 1 },
    outlineColor: colors.focusRing,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  spinner: {
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    animationName: spin,
    animationTimingFunction: 'linear',
  },
})

const sizeStyles = stylex.create({
  lg: {
    fontSize: typography.sizeMd,
    paddingBlock: spacing.lg,
    paddingInline: spacing.xxl,
  },
  md: {
    fontSize: typography.sizeSm,
    paddingBlock: spacing.md,
    paddingInline: spacing.xl,
  },
  sm: {
    fontSize: typography.sizeXs,
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
})

const variantStyles = stylex.create({
  danger: {
    backgroundColor: { ':hover': colors.dangerHover, default: colors.danger },
    color: colors.textOnDanger,
  },
  ghost: {
    backgroundColor: {
      ':hover': colors.surfaceHover,
      default: 'transparent',
    },
    color: colors.brand,
  },
  primary: {
    backgroundColor: { ':hover': colors.brandHover, default: colors.brand },
    color: colors.textOnBrand,
  },
  secondary: {
    backgroundColor: {
      ':hover': colors.surfaceHover,
      default: 'transparent',
    },
    borderColor: colors.borderStrong,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.textPrimary,
  },
})

type ButtonProps = BaseUIButtonProps & {
  loading?: boolean
  size?: keyof typeof sizeStyles
  variant?: keyof typeof variantStyles
}

function Button({
  children,
  disabled = false,
  loading = false,
  size = 'md',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <BaseUIButton
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
      {...stylex.props(styles.base, variantStyles[variant], sizeStyles[size])}
    >
      {loading ? (
        <CircleNotch aria-hidden size="1em" {...stylex.props(styles.spinner)} />
      ) : null}
      {children}
    </BaseUIButton>
  )
}

export type { ButtonProps }

export default Button
