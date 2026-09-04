import type { TextFieldProps as RACTextFieldProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'
import {
  Input,
  Label,
  TextField as RACTextField,
  Text,
} from 'react-aria-components'

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
//
// The label's colour follows the input's focus, which no selector on the
// label alone can express — the label is the input's sibling, not its
// ancestor. The box tracks whether focus is within it, through the focus
// events React bubbles, and the label takes `labelFocused` from that state.
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
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
} & Omit<RACTextFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

/**
 * A labelled single-line input. Its value is React Aria's: pass `value` with
 * `onChange` to control it, or `defaultValue` to let it keep its own — and
 * `onChange` is handed the string, not the event. The call site's
 * `className` and `style` land on the field as a whole, which is the element
 * a layout positions.
 */
function TextField({
  description,
  error,
  isDisabled = false,
  label,
  numeric = false,
  ...props
}: TextFieldProps) {
  const invalid = error !== undefined

  // Focus events bubble in React, so the box hears its input gain and lose
  // focus without the input being told anything.
  const [focused, setFocused] = useState(false)
  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [])
  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

  return (
    <RACTextField
      isDisabled={isDisabled}
      isInvalid={invalid}
      // The message is this component's to show, so validation only marks
      // the control rather than surfacing the browser's own constraint UI.
      validationBehavior="aria"
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.root), props)}
    >
      <div
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...stylex.props(
          styles.box,
          invalid && styles.boxError,
          isDisabled && styles.boxDisabled,
        )}
      >
        <Label
          {...stylex.props(
            styles.label,
            isDisabled && styles.labelDisabled,
            invalid && styles.labelError,
            !isDisabled && !invalid && focused && styles.labelFocused,
          )}
        >
          {label}
        </Label>
        <Input
          {...stylex.props(
            styles.input,
            numeric && styles.numeric,
            isDisabled && styles.inputDisabled,
          )}
        />
      </div>
      {invalid ? (
        <Text
          slot="errorMessage"
          {...stylex.props(styles.message, styles.messageError)}
        >
          {error}
        </Text>
      ) : description === undefined ? null : (
        <Text slot="description" {...stylex.props(styles.message)}>
          {description}
        </Text>
      )}
    </RACTextField>
  )
}

export type { TextFieldProps }

export default TextField
