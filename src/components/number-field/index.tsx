import type { ReactNode } from 'react'
import type {
  ButtonRenderProps,
  NumberFieldProps as RACNumberFieldProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  NumberField as RACNumberField,
} from 'react-aria-components'

import { FieldBox, FieldInput, FieldMessage } from '../../field'
import { FIELD_VALIDATION_BEHAVIOR, fieldStyles } from '../../field/root'
import { MinusGlyph, PlusGlyph } from '../../glyphs'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

// The text fields page's field, holding a number: the same box, floating
// label, underline and message as TextField, with the value in the mono
// face and tabular figures by default, since a number is what those are
// for, and two steppers at the trailing end.
//
// The steppers come in two layouts. Stacked, the plus over the minus, they
// are a column flush with the box's top, end and bottom, each half of the
// box's 56dp and 32dp wide, drawn here since the smallest icon button is
// 32dp and two of those do not fit; the glyph is the icon buttons page's
// 20dp for that size, and the hover, pressed, focus and disabled treatments
// are the standard icon button's. Side by side, they are extra-small icon
// buttons, the page's trailing icons in the library's own control, 12dp
// from the end where the page puts a field's icons — the box's 16dp of
// padding less the 4dp they pull back.
//
// React Aria's `NumberField` is the root and the box is its `Group`, which
// is what names the box and the two steppers as one control; the steppers
// are its increment and decrement buttons through context, disabled at the
// ends of the range and kept out of the tab order, and the formatting is its
// `formatOptions`.
const styles = stylex.create({
  // The input and the steppers on one line, the input taking the room. The
  // input keeps the 16 of margin that clears the label, so the row lines it
  // up with the top rather than centring it, and the stacked steppers fill
  // the 48 beside it.
  row: {
    alignItems: 'flex-start',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.sm,
  },
  // Side by side, the icon buttons centre on the input's line instead.
  rowInline: {
    alignItems: 'center',
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '28px',
    borderRadius: 0,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    inlineSize: '32px',
    justifyContent: 'center',
    outlineColor: colors.primary,
    outlineOffset: '-2px',
    outlineStyle: 'none',
    outlineWidth: '2px',
    padding: 0,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  stepperDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  stepperFocused: {
    outlineStyle: 'solid',
  },
  stepperGlyph: {
    blockSize: '20px',
    display: 'block',
    inlineSize: '20px',
  },
  stepperHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  stepperPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  // Stacked: the column reaches out of the box's padding to sit flush with
  // its top, end and bottom.
  steppers: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    marginBlockStart: `calc(-1 * ${spacing.sm})`,
    marginInlineEnd: `calc(-1 * ${spacing.lg})`,
  },
  // Side by side: 12dp from the end, as the page places a field's icons,
  // out of the box's 16dp of padding.
  steppersInline: {
    flexDirection: 'row',
    marginBlockStart: 0,
    marginInlineEnd: `calc(${spacing.md} - ${spacing.lg})`,
  },
  // The top stepper takes the box's own top-end corner, so the two read as
  // one edge.
  stepperTop: {
    borderStartEndRadius: radii.xs,
  },
})

type NumberFieldProps = {
  /**
   * The name of the stepper that lowers the value, for a screen reader.
   * @default 'Decrease'
   */
  decrementLabel?: string
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
   * Whether the label sits in the empty box and floats to the top once the
   * field is focused or holds a value, as the text fields page draws it.
   * `false` keeps it small at the top in every state.
   * @default true
   */
  floatingLabel?: boolean
  /**
   * The name of the stepper that raises the value, for a screen reader.
   * @default 'Increase'
   */
  incrementLabel?: string
  /**
   * What the field is for. Required rather than optional: a field with no
   * label is a box a screen reader cannot name.
   */
  label: string
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column. On by default, since a
   * number field holds nothing else.
   * @default true
   */
  numeric?: boolean
  /**
   * How the two steppers sit at the end of the box: stacked, the plus over
   * the minus, flush with the box's edge, or side by side as extra-small
   * icon buttons.
   * @default 'vertical'
   */
  steppers?: 'horizontal' | 'vertical'
} & Omit<RACNumberFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

/**
 * A labelled number input with steppers. Its value is React Aria's: pass
 * `value` with `onChange` to control it, or `defaultValue` to let it keep
 * its own — and `onChange` is handed the number, `NaN` while the field is
 * empty. `minValue`, `maxValue` and `step` shape it, and `formatOptions`
 * says how it reads, in the locale the page is in: a currency, a percentage,
 * a unit. Arrow keys step the value, and Page Up and Page Down by ten steps.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions. The box, label, input and message
 * are the field chrome in `src/field`, shared with every other field.
 */
function NumberField({
  decrementLabel = 'Decrease',
  description,
  error,
  floatingLabel = true,
  incrementLabel = 'Increase',
  isDisabled = false,
  label,
  numeric = true,
  steppers = 'vertical',
  ...props
}: NumberFieldProps) {
  const inline = steppers === 'horizontal'

  return (
    <RACNumberField
      isDisabled={isDisabled}
      isInvalid={error !== undefined}
      validationBehavior={FIELD_VALIDATION_BEHAVIOR}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox floatingLabel={floatingLabel} label={label}>
        <div {...stylex.props(styles.row, inline && styles.rowInline)}>
          <FieldInput numeric={numeric} />
          <div
            {...stylex.props(styles.steppers, inline && styles.steppersInline)}
          >
            {inline ? (
              <>
                <IconButton
                  aria-label={decrementLabel}
                  size="xs"
                  slot="decrement"
                >
                  <MinusGlyph />
                </IconButton>
                <IconButton
                  aria-label={incrementLabel}
                  size="xs"
                  slot="increment"
                >
                  <PlusGlyph />
                </IconButton>
              </>
            ) : (
              <>
                <StackedStepper label={incrementLabel} slot="increment">
                  <PlusGlyph {...stylex.props(styles.stepperGlyph)} />
                </StackedStepper>
                <StackedStepper label={decrementLabel} slot="decrement">
                  <MinusGlyph {...stylex.props(styles.stepperGlyph)} />
                </StackedStepper>
              </>
            )}
          </div>
        </div>
      </FieldBox>
      <FieldMessage description={description} error={error} />
    </RACNumberField>
  )
}

function StackedStepper({
  children,
  label,
  slot,
}: {
  children: ReactNode
  label: string
  slot: 'decrement' | 'increment'
}) {
  return (
    <RACButton
      aria-label={label}
      slot={slot}
      {...mergeStatefulStyles(stepperStyles(slot === 'increment'), {})}
    >
      {children}
    </RACButton>
  )
}

// A stacked stepper: React Aria's button with the slot the field's context
// looks for, drawn from its render state. Built by a call rather than
// written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after.
function stepperStyles(top: boolean) {
  return (state: ButtonRenderProps) =>
    stylex.props(
      styles.stepper,
      top && styles.stepperTop,
      state.isHovered && !state.isDisabled && styles.stepperHovered,
      state.isPressed && !state.isDisabled && styles.stepperPressed,
      state.isFocusVisible && styles.stepperFocused,
      state.isDisabled && styles.stepperDisabled,
    )
}

export type { NumberFieldProps }

export default NumberField
