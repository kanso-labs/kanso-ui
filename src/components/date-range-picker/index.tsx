import type { ReactNode } from 'react'
import type {
  DateValue,
  DateRangePickerProps as RACDateRangePickerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  DateInput as RACDateInput,
  DateRangePicker as RACDateRangePicker,
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
import { colors, typography } from '../../tokens/design.tokens.stylex'
import RangeCalendar from '../range-calendar'

// `DatePicker` picking two dates rather than one. Every part it draws is
// already here — the segments from `src/segments`, the trigger and the
// overlay from `src/styles/picker`, the calendar from `RangeCalendar` — so
// the two pickers cannot come apart. What a range adds is a second segment
// group and the dash between them.
//
// The date pickers page draws a range as a configuration of the *modal*
// picker: a full-screen selector with a header and two text fields, plus a
// modal date input variant. It carries no docked range picker and no range
// token of its own — its token set is `docked.*` and `modal.*`, and neither
// names a range. So the docked shape here follows the docked single picker,
// the same choice `RangeCalendar` records for the band it draws.
//
// Two things are this component's own.
//
// **The dash is decoration, not content.** It reads as a range to someone
// looking, and React Aria has already told a screen reader which group is
// which — every segment is named "Start Date" or "End Date" — so repeating
// it aloud would be a third telling. It is `aria-hidden` and takes the muted
// role, which is what keeps it quieter than the dates either side.
//
// **Both segment groups and the trigger sit in one React Aria `Group`.** The
// box draws once around all three, so a reader tabs start, end, trigger
// rather than meeting three controls in a row.

const styles = stylex.create({
  // The dash between the two segment groups. Body-large so it sits on the
  // segments' own line, muted so the dates either side stay the thing being
  // read.
  separator: {
    color: colors.onSurfaceVariant,
    flexShrink: 0,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    lineHeight: typography.bodyLargeLineHeight,
  },
})

type DateRangePickerProps<T extends DateValue> = {
  /** A function may compute the class from the picker's render state. */
  className?: RACDateRangePickerProps<T>['className']
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
  /**
   * What is drawn between the two segment groups. Decoration — a screen
   * reader is told which group is which by React Aria.
   * @default '–'
   */
  separator?: string
  /** A function may compute the style from the picker's render state. */
  style?: RACDateRangePickerProps<T>['style']
  /**
   * What the button that opens the calendar is called, for a screen reader.
   * @default 'Choose a date range'
   */
  triggerLabel?: string
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined'
} & Omit<RACDateRangePickerProps<T>, 'children' | 'className' | 'style'>

/**
 * A date range typed into a field, or picked from a calendar behind a
 * button. The value is React Aria's — pass `value` with `onChange` to
 * control it, or `defaultValue` — as a `{ start, end }` pair of
 * `@internationalized/date` values from this package's `./date` subpath.
 *
 * ```tsx
 * import { CalendarDate } from '@kanso-labs/kanso-ui/date'
 *
 * <DateRangePicker
 *   defaultValue={{
 *     end: new CalendarDate(2026, 9, 20),
 *     start: new CalendarDate(2026, 9, 15),
 *   }}
 *   label="Label"
 * />
 * ```
 *
 * The segments are `DateField`'s and the calendar is `RangeCalendar`, so
 * `granularity`, `minValue`, `maxValue` and `isDateUnavailable` all behave
 * as they do there. Above the medium breakpoint the calendar is docked to
 * the field; below it, it opens centred, the same swap `DatePicker` makes.
 *
 * The call site's `className` and `style` land on the picker as a whole,
 * which is the element a layout positions.
 */
function DateRangePicker<T extends DateValue>({
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  separator = '–',
  triggerLabel = 'Choose a date range',
  variant = 'filled',
  ...props
}: DateRangePickerProps<T>) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACDateRangePicker<T>
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
        // hidden input per segment group, neither carrying a placeholder, so
        // the CSS half reads as populated on its own; the React half reads
        // React Aria's input context, which a picker does not provide.
        // Without this the notch stays shut across segments already showing
        // `mm/dd/yyyy`.
        isPopulated
        label={label}
        leading={leadingIcon}
        variant={variant}
      >
        <FieldValue>
          <RACGroup {...stylex.props(picker.group)}>
            <RACDateInput slot="start" {...stylex.props(segmentStyles.input)}>
              {renderSegment}
            </RACDateInput>
            <span aria-hidden="true" {...stylex.props(styles.separator)}>
              {separator}
            </span>
            <RACDateInput slot="end" {...stylex.props(segmentStyles.input)}>
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
        <RACDialog>
          <RangeCalendar aria-label={label} />
        </RACDialog>
      </RACPopover>
    </RACDateRangePicker>
  )
}

export type { DateRangePickerProps }

export default DateRangePicker
