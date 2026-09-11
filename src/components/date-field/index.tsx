import type { ReactNode } from 'react'
import type {
  DateValue,
  DateFieldProps as RACDateFieldProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  DateField as RACDateField,
  DateInput as RACDateInput,
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

// A date typed a segment at a time, rather than picked from a calendar. The
// box, label and message are the field chrome in `src/field`, shared with
// every other field, so a date field on a form is the same box as the text
// field beside it — which is what the date pickers page means by a date in a
// text field.
//
// Three things are this component's own.
//
// **Each segment is its own focus stop, and React Aria decides how many.**
// The order and the count come from the locale rather than from here: a
// reader under `I18nProvider` with a British locale gets day before month,
// and `granularity` of `minute` adds two more. So the segments are rendered
// from what React Aria hands the input, never written out.
//
// **A segment not yet filled is muted, and the field still counts as
// empty.** The placeholder text is the segment's own — `mm`, `dd`, `yyyy` —
// and it takes the muted role so a half-typed date reads as half-typed. The
// floating label stays down until a segment holds a real value.
//
// **A focused segment is a filled shape rather than a ring.** A caret cannot
// show which of three spinbuttons has focus, since React Aria hides it — the
// segment is what has to say so, and it does it the way a selected row does.

type DateFieldProps<T extends DateValue> = Omit<
  RACDateFieldProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the field's render state. */
  className?: RACDateFieldProps<T>['className']
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
  style?: RACDateFieldProps<T>['style']
  /** An icon at the box's trailing end. */
  trailingIcon?: ReactNode
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined'
}

/**
 * A date typed rather than picked: one segment per part, each its own focus
 * stop. The value is React Aria's — pass `value` with `onChange` to control
 * it, or `defaultValue` — as an `@internationalized/date` value from this
 * package's `./date` subpath.
 *
 * ```tsx
 * import { CalendarDate } from '@kanso-labs/kanso-ui/date'
 *
 * <DateField defaultValue={new CalendarDate(2026, 9, 15)} label="Label" />
 * ```
 *
 * How many segments there are and what order they come in is the reader's
 * locale, through React Aria's `I18nProvider` — `granularity` adds time
 * segments, and `minValue` and `maxValue` bound what may be typed.
 *
 * The box, label and message are the field chrome in `src/field`, shared
 * with every other field. The call site's `className` and `style` land on
 * the field as a whole, which is the element a layout positions.
 */
function DateField<T extends DateValue>({
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  trailingIcon,
  variant = 'filled',
  ...props
}: DateFieldProps<T>) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACDateField<T>
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox
        floatingLabel={floatingLabel}
        // Always populated, which buys the outlined notch. The box decides
        // populated twice over — in CSS for the label's type, and in React
        // for the notch, since CSS cannot cut an outline to a width it has
        // no way to measure. React Aria renders a hidden
        // `<input type="date">` carrying no placeholder, so the CSS half
        // reads as populated on its own; the React half reads React Aria's
        // input context, which a date field does not provide. Without this
        // the notch stays shut across segments already showing `mm/dd/yyyy`.
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
    </RACDateField>
  )
}

export type { DateFieldProps }

export default DateField
