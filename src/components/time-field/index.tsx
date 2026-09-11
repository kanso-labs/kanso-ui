import type { ReactNode } from 'react'
import type {
  TimeFieldProps as RACTimeFieldProps,
  TimeValue,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  DateInput as RACDateInput,
  TimeField as RACTimeField,
} from 'react-aria-components'

import { FieldBox, FieldMessage, FieldValue } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { renderSegment } from '../../segments'
import { segmentStyles } from '../../segments/styles'
import { mergeStatefulStyles } from '../../styles/merge'

// A time typed a segment at a time. Every part of it is DateField's, from
// `src/segments` — the segment treatment, the muted placeholder, the filled
// focus and the punctuation between — so a time on a form and a date on the
// same form cannot come apart.
//
// What differs is the value it holds and nothing else. The time pickers page
// gives its input the text field's own box, which is what the shared field
// chrome already draws, so there is no measurement here that the date field's
// comment does not already name.
//
// **Twelve or twenty-four hours is the reader's locale, not a prop.** React
// Aria decides from the locale whether there is a day-period segment at all,
// so a field under `I18nProvider` with `en-GB` shows a 24-hour clock and the
// same field under `en-US` shows AM and PM. Nothing here overrides it, and
// `hourCycle` is React Aria's own for a page that has to.

type TimeFieldProps<T extends TimeValue> = Omit<
  RACTimeFieldProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the field's render state. */
  className?: RACTimeFieldProps<T>['className']
  /** Supporting text under the field. */
  description?: string
  /** The message shown instead of the description, which also marks the field invalid. */
  error?: string
  /**
   * Whether the label floats into the box's top once the field holds a
   * value, rather than sitting above it.
   * @default true
   */
  floatingLabel?: boolean
  /** What the field is for. Always rendered; never a placeholder. */
  label: string
  /** An icon at the box's leading end. */
  leadingIcon?: ReactNode
  /** A function may compute the style from the field's render state. */
  style?: RACTimeFieldProps<T>['style']
  /** An icon at the box's trailing end. */
  trailingIcon?: ReactNode
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined'
}

/**
 * A time typed rather than picked: one segment per part, each its own focus
 * stop. The value is React Aria's — pass `value` with `onChange` to control
 * it, or `defaultValue` — as a `Time` from this package's `./date` subpath.
 *
 * ```tsx
 * import { Time } from '@kanso-labs/kanso-ui/date'
 *
 * <TimeField defaultValue={new Time(9, 30)} label="Label" />
 * ```
 *
 * Whether it shows a twelve or twenty-four hour clock is the reader's
 * locale, through React Aria's `I18nProvider`. `granularity` takes it down
 * to seconds, and `minValue` and `maxValue` bound what may be typed.
 *
 * The segments are `DateField`'s, and the box, label and message are the
 * field chrome in `src/field`. The call site's `className` and `style` land
 * on the field as a whole, which is the element a layout positions.
 */
function TimeField<T extends TimeValue>({
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  trailingIcon,
  variant = 'filled',
  ...props
}: TimeFieldProps<T>) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACTimeField<T>
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox
        floatingLabel={floatingLabel}
        // Always populated, for the reason DateField's own comment gives: the
        // box reads an `<input>` to decide, and a segmented field has none —
        // its segments hold the value's line from the first render.
        isPopulated
        label={label}
        leading={leadingIcon}
        trailing={trailingIcon}
        variant={variant}
      >
        <FieldValue>
          <RACDateInput {...stylex.props(segmentStyles.input)}>
            {renderSegment}
          </RACDateInput>
        </FieldValue>
      </FieldBox>
      <FieldMessage description={description} error={error} />
    </RACTimeField>
  )
}

export type { TimeFieldProps }

export default TimeField
