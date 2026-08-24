import type {
  FieldControlProps as BaseUIFieldControlProps,
  FieldLabelState as BaseUIFieldLabelState,
} from '@base-ui/react/field'

import { Field as BaseUIField } from '@base-ui/react/field'
import * as stylex from '@stylexjs/stylex'
import { useCallback } from 'react'

import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The focus indicator is an inset box-shadow on the bottom edge rather than a
// border that thickens. A real border going 1px -> 2px on focus grows the
// box, which pushes every sibling below it down by a pixel — so a form
// twitches each time focus moves between its fields. A shadow is drawn inside
// the box and changes nothing about its size.
//
// The label sits at a fixed size at the top rather than floating up out of
// the input on focus: the design draws it small and in place at all times, so
// there is no transition between two positions to get right.
const styles = stylex.create({
  box: {
    backgroundColor: colors.surfaceContainerHighest,
    blockSize: '56px',
    // Square at the bottom, where the focus indicator is drawn — a rounded
    // corner there would cut the ends off the underline.
    borderEndEndRadius: 0,
    borderEndStartRadius: 0,
    borderStartEndRadius: radii.xs,
    borderStartStartRadius: radii.xs,
    boxShadow: {
      ':focus-within': `inset 0 -2px 0 0 ${colors.primary}`,
      default: `inset 0 -1px 0 0 ${colors.outline}`,
    },
    paddingBlockEnd: 0,
    paddingBlockStart: spacing.sm,
    paddingInline: spacing.lg,
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'box-shadow',
    transitionTimingFunction: motion.easingStandard,
  },
  boxDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    boxShadow: `inset 0 -1px 0 0 color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  boxError: {
    boxShadow: {
      ':focus-within': `inset 0 -2px 0 0 ${colors.error}`,
      default: `inset 0 -1px 0 0 ${colors.error}`,
    },
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: colors.onSurface,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    inlineSize: '100%',
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    // Clears the label above it. A literal because it is the offset between
    // two fixed type sizes inside a fixed-height box, not a step of the
    // spacing scale.
    marginBlockStart: '14px',
    // The box already draws the focus indicator, so a second ring around the
    // input inside it would be two focus treatments for one focus.
    outlineStyle: 'none',
    padding: 0,
  },
  inputDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  label: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    insetBlockStart: spacing.sm,
    insetInlineStart: spacing.lg,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
    position: 'absolute',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
  },
  labelDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  labelError: {
    color: colors.error,
  },
  labelFocused: {
    color: colors.primary,
  },
  message: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
    marginBlock: 0,
    marginBlockStart: spacing.xs,
    // Indented to the box's own inline padding, so the message starts where
    // the value above it does rather than at the box's edge.
    marginInline: spacing.lg,
  },
  messageError: {
    color: colors.error,
  },
  numeric: {
    fontFamily: typography.fontFamilyMono,
    // Amounts are read in columns and compared against each other, so the
    // digits have to be one width.
    fontVariantNumeric: 'tabular-nums',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
})

type TextFieldProps = {
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message, the red underline, and
   * `aria-invalid` all follow from it.
   */
  error?: string
  /**
   * What the field is for. Required rather than optional: a text field with
   * no label is a box a screen reader cannot name.
   */
  label: string
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column.
   * @default false
   */
  numeric?: boolean
} & Omit<BaseUIFieldControlProps, 'render'>

function TextField({
  description,
  disabled = false,
  error,
  label,
  numeric = false,
  ...props
}: TextFieldProps) {
  const invalid = error !== undefined

  // The label's colour follows the field's focus, which is a state only Base
  // UI knows — StyleX cannot express `.box:focus-within .label`, because the
  // label is the input's sibling rather than its ancestor. useCallback keeps
  // it one reference between renders, which is what react-perf is after.
  const labelClassName = useCallback(
    (state: BaseUIFieldLabelState) =>
      stylex.props(
        styles.label,
        disabled && styles.labelDisabled,
        invalid && styles.labelError,
        !disabled && !invalid && state.focused && styles.labelFocused,
      ).className,
    [disabled, invalid],
  )

  return (
    <BaseUIField.Root
      disabled={disabled}
      invalid={invalid}
      {...stylex.props(styles.root)}
    >
      <div
        {...stylex.props(
          styles.box,
          invalid && styles.boxError,
          disabled && styles.boxDisabled,
        )}
      >
        <BaseUIField.Label className={labelClassName}>
          {label}
        </BaseUIField.Label>
        {/* `props` is the control's, which is what TextFieldProps extends,
            so a className or style from the call site lands on the <input>
            rather than on the wrapper around it. */}
        <BaseUIField.Control
          {...props}
          {...mergeStatefulStyles(
            stylex.props(
              styles.input,
              numeric && styles.numeric,
              disabled && styles.inputDisabled,
            ),
            props,
          )}
        />
      </div>
      {invalid ? (
        <BaseUIField.Error
          match
          {...stylex.props(styles.message, styles.messageError)}
        >
          {error}
        </BaseUIField.Error>
      ) : description === undefined ? null : (
        <BaseUIField.Description {...stylex.props(styles.message)}>
          {description}
        </BaseUIField.Description>
      )}
    </BaseUIField.Root>
  )
}

export type { TextFieldProps }

export default TextField
