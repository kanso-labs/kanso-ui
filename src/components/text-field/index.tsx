import type { FieldControlProps as BaseUIFieldControlProps } from '@base-ui/react/field'

import { Field as BaseUIField } from '@base-ui/react/field'
import * as stylex from '@stylexjs/stylex'

import { colors } from '../../tokens/colors.stylex'
import { radii } from '../../tokens/radii.stylex'
import { spacing } from '../../tokens/spacing.stylex'
import { typography } from '../../tokens/typography.stylex'

const styles = stylex.create({
  control: {
    backgroundColor: colors.surface,
    borderColor: { ':focus': colors.brand, default: colors.border },
    borderRadius: radii.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: {
      '::placeholder': colors.textMuted,
      default: colors.textPrimary,
    },
    fontFamily: typography.fontFamily,
    fontSize: typography.sizeMd,
    lineHeight: typography.leadingNormal,
    outlineStyle: 'none',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    width: '100%',
  },
  controlError: {
    borderColor: colors.danger,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizeSm,
    margin: 0,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizeSm,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    width: '100%',
  },
})

interface TextFieldProps {
  defaultValue?: BaseUIFieldControlProps['defaultValue']
  description?: string
  disabled?: boolean
  error?: string
  label: string
  name?: string
  onValueChange?: BaseUIFieldControlProps['onValueChange']
  placeholder?: string
  required?: boolean
  type?: 'email' | 'password' | 'search' | 'tel' | 'text' | 'url'
  value?: string
}

function TextField({
  defaultValue,
  description,
  disabled = false,
  error,
  label,
  name,
  onValueChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}: TextFieldProps) {
  return (
    <BaseUIField.Root
      disabled={disabled}
      name={name}
      {...stylex.props(styles.root)}
    >
      <BaseUIField.Label {...stylex.props(styles.label)}>
        {label}
      </BaseUIField.Label>

      <BaseUIField.Control
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
        {...stylex.props(styles.control, error != null && styles.controlError)}
      />

      {description != null && (
        <BaseUIField.Description {...stylex.props(styles.description)}>
          {description}
        </BaseUIField.Description>
      )}

      {error != null && (
        <BaseUIField.Error match {...stylex.props(styles.error)}>
          {error}
        </BaseUIField.Error>
      )}
    </BaseUIField.Root>
  )
}

export type { TextFieldProps }

export default TextField
