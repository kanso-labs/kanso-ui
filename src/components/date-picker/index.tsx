import type { ReactNode } from 'react'
import type {
  DateValue,
  DatePickerProps as RACDatePickerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  DateInput as RACDateInput,
  DatePicker as RACDatePicker,
  Dialog as RACDialog,
  Group as RACGroup,
  Popover as RACPopover,
} from 'react-aria-components'

import { FieldBox, FieldMessage, FieldValue } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { CalendarGlyph } from '../../glyphs'
import { renderSegment } from '../../segments'
import { segmentStyles } from '../../segments/styles'
import { mergeStatefulStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import { picker, triggerClassName } from '../../styles/picker'
import Calendar from '../calendar'

// The date pickers page's picker: the date field a date is typed into, with
// a calendar behind a button for picking it instead. Both halves already
// exist — the segments are `DateField`'s, from `src/segments`, and the
// calendar is `Calendar` — so what this adds is the button between them and
// the surface the calendar opens on.
//
// Two things are this component's own.
//
// **The picker is one field, not a field beside a button.** React Aria's
// `Group` is what holds the segments and the trigger together, so the box
// draws once around both and a reader tabs through the segments and reaches
// the button at the end of them rather than as a separate control.
//
// **It is docked above the medium breakpoint and modal below it**, which is
// the pairing the page draws and the same swap `Sheet` makes. It is done in
// CSS rather than by rendering a different tree: a 360dp calendar anchored
// to a field is unreachable at 375px, and a modal that stayed centred on a
// desktop would cover a form for no reason. `Sheet` settles this the same
// way, and doing it twice in two different ways is how the two would drift.

type DatePickerProps<T extends DateValue> = Omit<
  RACDatePickerProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the picker's render state. */
  className?: RACDatePickerProps<T>['className']
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
  /** A function may compute the style from the picker's render state. */
  style?: RACDatePickerProps<T>['style']
  /**
   * What the button that opens the calendar is called, for a screen reader.
   * @default 'Choose a date'
   */
  triggerLabel?: string
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined'
}

/**
 * A date typed into a field, or picked from a calendar behind a button. The
 * value is React Aria's — pass `value` with `onChange` to control it, or
 * `defaultValue` — as an `@internationalized/date` value from this package's
 * `./date` subpath.
 *
 * ```tsx
 * import { CalendarDate } from '@kanso-labs/kanso-ui/date'
 *
 * <DatePicker defaultValue={new CalendarDate(2026, 9, 15)} label="Label" />
 * ```
 *
 * The segments are `DateField`'s and the calendar is `Calendar`, so
 * `granularity`, `minValue`, `maxValue` and `isDateUnavailable` all behave
 * as they do there. Above the medium breakpoint the calendar is docked to
 * the field; below it, it opens centred, which is the page's modal picker.
 *
 * The call site's `className` and `style` land on the picker as a whole,
 * which is the element a layout positions.
 */
function DatePicker<T extends DateValue>({
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  triggerLabel = 'Choose a date',
  variant = 'filled',
  ...props
}: DatePickerProps<T>) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACDatePicker<T>
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox
        floatingLabel={floatingLabel}
        // Always populated, which buys exactly one thing: the outlined
        // notch. The box decides populated twice over — in CSS for the
        // label's type, and in React for the notch, since CSS cannot cut an
        // outline to a width it has no way to measure. React Aria renders a
        // hidden `<input type="date">` carrying no placeholder, so the CSS
        // half reads as populated on its own; the React half reads React
        // Aria's input context, which a picker does not provide. Without
        // this the notch stays shut across segments already showing
        // `mm/dd/yyyy`.
        isPopulated
        label={label}
        leading={leadingIcon}
        variant={variant}
      >
        <FieldValue>
          <RACGroup {...stylex.props(picker.group)}>
            <RACDateInput {...stylex.props(segmentStyles.input)}>
              {renderSegment}
            </RACDateInput>
            <RACButton aria-label={triggerLabel} className={triggerClassName}>
              <CalendarGlyph {...stylex.props(picker.triggerGlyph)} />
            </RACButton>
          </RACGroup>
        </FieldValue>
      </FieldBox>
      <FieldMessage description={description} error={error} />
      <RACPopover {...stylex.props(overlay.popup, picker.popover)}>
        <RACDialog {...stylex.props(overlay.popupDialog)}>
          <Calendar aria-label={label} />
        </RACDialog>
      </RACPopover>
    </RACDatePicker>
  )
}

export type { DatePickerProps }

export default DatePicker
