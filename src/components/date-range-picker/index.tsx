'use client'

import type { DateDuration } from '@internationalized/date'
import type { ReactNode, RefAttributes } from 'react'
import type {
  DateValue,
  DateRangePickerProps as RACDateRangePickerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useLayoutEffect, useState } from 'react'
import {
  Button as RACButton,
  DateInput as RACDateInput,
  DateRangePicker as RACDateRangePicker,
  Dialog as RACDialog,
  Group as RACGroup,
  Popover as RACPopover,
} from 'react-aria-components'

import type { FieldVariant } from '../../field'

import { FieldBox, FieldMessage, FieldSegments } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { CalendarGlyph } from '../../glyphs'
import { useDockedMonths } from '../../hooks/useDockedMonths'
import { renderSegment } from '../../segments'
import { segmentStyles } from '../../segments/styles'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import {
  datePopoverClassName,
  picker,
  triggerClassName,
} from '../../styles/picker'
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
//
// **The end date takes a line of its own where the two do not fit on one.**
// The line the segments sit on clips them, as an input clips its text, and
// two dates and the dash are wider than a phone's field: at 328px the empty
// field showed 212px of the 281px its placeholders take, so most of the end
// date was out of sight until it was typed in. Every segment is a place to
// type, so none can be hidden, and shortening the placeholders would not hold
// for a locale whose dates are longer. So the two groups wrap, the dash stays
// after the start date, and the box grows by a line, as a text area's does,
// from the page's 56dp. Where both fit, nothing moves: the box is 56dp and
// the dates share their line.
//
// The wrap is decided by the line's width, and typing never undoes it. A date
// is narrower filled than empty — `9` where `mm` was — so a field between the
// two widths, which is where a 375 to 400px phone puts it, would otherwise
// lift the end date back up beside the start and shrink the box while the
// start date was being typed. So the end date goes onto its own line whenever
// the three stop fitting, and comes back only when the line's width changes
// or a font arrives — see `useEndDateWrap`.

const styles = stylex.create({
  // The two segment groups and the dash, with the end date on a line of its
  // own — see the header. No gap between the lines, which are the segments'
  // own line height apart, as a text area's are.
  groupWrapped: {
    flexWrap: 'wrap',
    rowGap: 0,
  },
  // What keeps the end date on that line while it would fit beside the start
  // again, since a wrap alone moves it down only while it does not. A line of
  // its own, full width and no height, so the end date starts the next.
  lineBreak: {
    blockSize: 0,
    boxSizing: 'border-box',
    flexBasis: '100%',
  },
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

type DateRangePickerProps<T extends DateValue = DateValue> = Omit<
  RACDateRangePickerProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the picker's render state. */
  className?: RACDateRangePickerProps<T>['className']
  /**
   * Where to portal the calendar. Defaults to the container of the `ThemeScope`
   * around it, which keeps the calendar on that scope's tokens, or to the end
   * of `<body>` where there is none. A subtree themed through the `themeScope`
   * class has no container of its own, so point this inside it, or the calendar
   * renders outside and keeps the page's tokens.
   */
  container?: Element
  /** Supporting text under the field. */
  description?: string
  /**
   * The message shown instead of the description, which also marks the
   * field invalid.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
   */
  error?: string
  /**
   * Whether the label floats into the box's top once the field holds a
   * value, rather than sitting above it.
   * @default true
   */
  floatingLabel?: boolean
  /** What the field is for. Always rendered; never a placeholder. */
  label: string
  /**
   * An icon at the box's leading end, in the page's 24dp size. An icon drawn
   * in `em` takes that size from the slot.
   */
  leadingIcon?: ReactNode
  /**
   * What is drawn between the two segment groups. Decoration — a screen
   * reader is told which group is which by React Aria.
   * @default '–'
   */
  separator?: string
  /**
   * Whether the calendar's header draws the month and the year as menu
   * buttons, each opening a list of them in the grid's place — see
   * `RangeCalendar`.
   * @default false
   */
  showMonthYearMenus?: boolean
  /** A function may compute the style from the picker's render state. */
  style?: RACDateRangePickerProps<T>['style']
  /**
   * What the button that opens the calendar is called, for a screen reader.
   * Left out, React Aria names it in the reader's locale — "Calendar" in
   * English, followed by the field's own label.
   */
  triggerLabel?: string
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: FieldVariant
  /**
   * How much of the calendar shows at once: `{ months: 2 }` draws two
   * months side by side, which is what a range is usually picked from.
   * Below the expanded breakpoint, where two do not fit, they stack instead
   * — see `RangeCalendar` — in the modal; docked, above the medium
   * breakpoint, the calendar shows one month at a time there, since two
   * stacked are taller than the room under the field.
   * @default { months: 1 }
   */
  visibleDuration?: DateDuration
}

// Built by a call rather than written inline at the prop, which is what
// react-perf's no-jsx-as-prop is after — the same reason Select builds its
// chevron this way.
function calendarTrigger(triggerLabel: string | undefined) {
  return (
    <RACButton aria-label={triggerLabel} className={triggerClassName}>
      <CalendarGlyph {...stylex.props(picker.triggerGlyph)} />
    </RACButton>
  )
}

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
  container,
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  separator = '–',
  showMonthYearMenus = false,
  triggerLabel,
  variant = 'filled',
  visibleDuration,
  ...props
}: DateRangePickerProps<T> & RefAttributes<HTMLDivElement>) {
  const validationBehavior = useFieldValidationBehavior()
  const months = useDockedMonths(visibleDuration)
  const [group, setGroup] = useState<HTMLDivElement | null>(null)
  const wrapped = useEndDateWrap(group)

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
        isRequired={props.isRequired}
        label={label}
        leading={leadingIcon}
        // Grows by a line while the end date is on one of its own, and is
        // the page's 56dp otherwise — see the header.
        multiline
        // In the chrome's trailing slot rather than on the segments' line —
        // see the same prop on DatePicker for what that slot does and why
        // the trigger still opens from there.
        trailing={calendarTrigger(triggerLabel)}
        variant={variant}
      >
        <FieldSegments>
          <RACGroup
            ref={setGroup}
            {...stylex.props(picker.group, wrapped && styles.groupWrapped)}
          >
            <RACDateInput slot="start" {...stylex.props(segmentStyles.input)}>
              {renderSegment}
            </RACDateInput>
            <span aria-hidden="true" {...stylex.props(styles.separator)}>
              {separator}
            </span>
            {wrapped && (
              <span aria-hidden="true" {...stylex.props(styles.lineBreak)} />
            )}
            <RACDateInput slot="end" {...stylex.props(segmentStyles.input)}>
              {renderSegment}
            </RACDateInput>
          </RACGroup>
        </FieldSegments>
      </FieldBox>
      <FieldMessage description={description} error={error} />
      <RACPopover
        className={datePopoverClassName}
        // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
        UNSTABLE_portalContainer={container}
      >
        <RACDialog {...stylex.props(overlay.popupDialog, focus.ring)}>
          <RangeCalendar
            aria-label={label}
            showMonthYearMenus={showMonthYearMenus}
            visibleDuration={months}
          />
        </RACDialog>
      </RACPopover>
    </RACDateRangePicker>
  )
}

/**
 * Whether the end date takes a line of its own: whenever the start date, the
 * dash and the end date are wider together than the line they sit on.
 *
 * Decided afresh when the line's width changes or a font finishes loading,
 * and otherwise only ever turned on, so a date narrowing as it is typed
 * never moves the end date back up mid-entry — see the header. Read off the
 * three parts' own widths rather than the line's overflow, since a wrapped
 * line overflows nothing.
 */
function useEndDateWrap(group: HTMLElement | null) {
  const [wrapped, setWrapped] = useState(false)

  useLayoutEffect(() => {
    if (group === null) {
      return undefined
    }
    let decidedAt: null | number = null
    const measure = () => {
      const room = group.getBoundingClientRect().width
      // React Aria's hidden inputs sit in the group too, and so does the
      // break while the end date is held down. Neither takes a line's height,
      // and neither is a part the line has to hold.
      const parts = [...group.children].filter(
        (part) => part.getBoundingClientRect().height > 0,
      )
      const gap = Number.parseFloat(getComputedStyle(group).columnGap) || 0
      const needs = parts.reduce(
        (sum, part) => sum + part.getBoundingClientRect().width,
        gap * (parts.length - 1),
      )
      const fits = needs <= room + 0.5
      if (room !== decidedAt) {
        decidedAt = room
        setWrapped(!fits)
      } else if (!fits) {
        setWrapped(true)
      }
    }
    const redecide = () => {
      decidedAt = null
      measure()
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(group)
    for (const part of group.children) {
      resize.observe(part)
    }
    document.fonts.addEventListener('loadingdone', redecide)
    return () => {
      resize.disconnect()
      document.fonts.removeEventListener('loadingdone', redecide)
    }
  }, [group])

  return wrapped
}

export type { DateRangePickerProps }

export default DateRangePicker
