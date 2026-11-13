'use client'

import type { DateDuration } from '@internationalized/date'
import type { ReactNode, RefAttributes } from 'react'
import type {
  DateValue,
  DatePickerProps as RACDatePickerProps,
} from 'react-aria-components'

import { toCalendarDate } from '@internationalized/date'
import * as stylex from '@stylexjs/stylex'
import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useDateFormatter } from 'react-aria'
import {
  CalendarContext,
  DatePickerStateContext,
  Button as RACButton,
  DateInput as RACDateInput,
  DatePicker as RACDatePicker,
  Dialog as RACDialog,
  Group as RACGroup,
  Popover as RACPopover,
  useSlottedContext,
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
import { useMessages } from '../../i18n'
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
import {
  colors,
  media,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import Button from '../button'
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
// the pairing the page draws: below the breakpoint the picker is a dialog,
// centred over a scrim, and `Sheet` changes presentation at the same width.
// It is done in CSS rather than by rendering a different tree: a 360dp
// calendar anchored to a field is unreachable at 375px, and a modal that
// stayed centred on a desktop would cover a form for no reason. `Sheet`
// settles its own swap the same way, and doing it twice in two different
// ways is how the two would drift. The styles are in `src/styles/picker.ts`.
//
// **The modal is the page's modal picker, not the docked calendar centred.**
// Below the breakpoint the calendar opens under the modal's header — the
// `Select date` supporting text in label-large over the date held in
// headline-large, both on surface variant, in a 120dp header padded 24dp at
// its start, 12dp at its end, 16dp above and 12dp below, with an outline
// variant divider under it — and over the Cancel and OK text buttons at the
// actions' end. A date picked there is a draft: it moves the headline and
// the selection and nothing else, OK writes it into the field, and Cancel,
// Escape or a press on the scrim close the modal with the field as it was.
// Docked, the header and the actions are not drawn and a pick is the answer.
//
// The header and the actions are hidden above the breakpoint by the same
// media query that moves the surface, and a pick asks whether the actions
// are on screen to know which of the two it was made in. That keeps the
// breakpoint in the stylesheet alone, rather than spelled again for
// `matchMedia`, so what is drawn and what a pick does cannot disagree about
// which picker is showing.
//
// Two departures from the page's modal. It draws no button switching the
// modal to a text input, since the field under the scrim is that input. And
// with nothing yet picked the headline is left empty rather than holding
// words of its own, the header keeping its height.

// The page's height for the modal picker's header.
const HEADER_BLOCK_SIZE = '120px'

const styles = stylex.create({
  // Cancel and OK at the actions' end, 8dp apart, with the calendar's own
  // inline padding after them and 8dp under them.
  actions: {
    boxSizing: 'border-box',
    display: { default: 'none', [media.belowMedium]: 'flex' },
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingBlockEnd: spacing.sm,
    paddingInlineEnd: spacing.md,
  },
  header: {
    blockSize: HEADER_BLOCK_SIZE,
    borderBlockEndColor: colors.outlineVariant,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: { default: 'none', [media.belowMedium]: 'flex' },
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBlockEnd: spacing.md,
    paddingBlockStart: spacing.lg,
    paddingInlineEnd: spacing.md,
    paddingInlineStart: spacing.xl,
  },
  headline: {
    fontFamily: typography.headlineLargeFont,
    fontSize: typography.headlineLargeSize,
    fontWeight: typography.headlineLargeWeight,
    letterSpacing: typography.headlineLargeTracking,
    lineHeight: typography.headlineLargeLineHeight,
    minBlockSize: typography.headlineLargeLineHeight,
  },
  supportingText: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
})

type DatePickerProps<T extends DateValue = DateValue> = Omit<
  RACDatePickerProps<T>,
  'children' | 'className' | 'style'
> & {
  /**
   * What the modal's dismissing action says. Left out, it is the word for
   * it in the I18nProvider's locale — "Cancel" in English.
   */
  cancelLabel?: string
  /** A function may compute the class from the picker's render state. */
  className?: RACDatePickerProps<T>['className']
  /**
   * What the modal's confirming action says. Left out, it is the word for
   * it in the I18nProvider's locale — "OK" in English.
   */
  confirmLabel?: string
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
   * The modal's supporting text, above the date it holds. Left out, it is
   * the I18nProvider's locale's — "Select date" in English.
   */
  selectDateLabel?: string
  /**
   * Whether the calendar's header draws the month and the year as menu
   * buttons, each opening a list of them in the grid's place — see
   * `Calendar`.
   * @default false
   */
  showMonthYearMenus?: boolean
  /** A function may compute the style from the picker's render state. */
  style?: RACDatePickerProps<T>['style']
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
   * months side by side. Below the expanded breakpoint, where two do not
   * fit, they stack instead — see `Calendar` — in the modal; docked, above
   * the medium breakpoint, the calendar shows one month at a time there,
   * since two stacked are taller than the room under the field.
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
 * the field and a pick is the answer; below it, it opens centred as the
 * page's modal picker, under a headline holding the date picked, and only
 * its OK writes that date into the field.
 *
 * The call site's `className` and `style` land on the picker as a whole,
 * which is the element a layout positions.
 */
function DatePicker<T extends DateValue>({
  cancelLabel,
  confirmLabel,
  container,
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  selectDateLabel,
  showMonthYearMenus = false,
  triggerLabel,
  variant = 'filled',
  visibleDuration,
  ...props
}: DatePickerProps<T> & RefAttributes<HTMLDivElement>) {
  const validationBehavior = useFieldValidationBehavior()
  const messages = useMessages()
  const months = useDockedMonths(visibleDuration)

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
        isRequired={props.isRequired}
        label={label}
        leading={leadingIcon}
        // In the chrome's trailing slot rather than on the segments' line,
        // which is where Select and ComboBox put their chevron. The slot
        // cancels the box's top padding and stretches to its full height, so
        // it centres the 40dp trigger in the box; on the line the trigger
        // was taller than the row that held it and hung past the underline,
        // and the segments centred on it rather than on their own line.
        //
        // React Aria's `DatePicker` is what gives the trigger its press
        // behaviour, through context, so the slot reaches it as well as the
        // group did.
        trailing={calendarTrigger(triggerLabel)}
        variant={variant}
      >
        <FieldSegments>
          <RACGroup {...stylex.props(picker.group)}>
            <RACDateInput {...stylex.props(segmentStyles.input)}>
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
        <DatePickerDialog
          cancelLabel={cancelLabel ?? messages.cancel}
          confirmLabel={confirmLabel ?? messages.confirm}
          label={label}
          selectDateLabel={selectDateLabel ?? messages.selectDate}
          showMonthYearMenus={showMonthYearMenus}
          visibleDuration={months}
        />
      </RACPopover>
    </RACDatePicker>
  )
}

/**
 * The surface's content, mounted each time the calendar opens: the date it
 * was opened on is its draft, which a pick in the docked calendar writes
 * straight through and a pick in the modal holds until OK.
 */
function DatePickerDialog({
  cancelLabel,
  confirmLabel,
  label,
  selectDateLabel,
  showMonthYearMenus,
  visibleDuration,
}: {
  cancelLabel: string
  confirmLabel: string
  label: string
  selectDateLabel: string
  showMonthYearMenus: boolean
  visibleDuration: DateDuration | undefined
}) {
  // What React Aria's picker hands its calendar — the bounds, the date it
  // holds, and an `onChange` that writes a date into the field and closes
  // the surface — and the picker's state, which holds the date and writes
  // one the same way. The calendar is handed the same props with the draft
  // in place of the date and of `onChange`, so the picker stays the one
  // owner of its value and its `onChange` stays React Aria's own.
  const calendar = useSlottedContext(CalendarContext)
  const state = useContext(DatePickerStateContext)
  const [draft, setDraft] = useState(() => state?.dateValue ?? null)
  const actions = useRef<HTMLDivElement>(null)
  const formatter = useDateFormatter({
    calendar: draft?.calendar.identifier,
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    weekday: 'short',
  })

  // A calendar's `onChange` is typed for a calendar selecting several dates
  // as well as one; the picker's selects one, so a list never arrives.
  const pick = useCallback(
    (date: DateValue | readonly DateValue[]) => {
      if (!('calendar' in date)) {
        return
      }
      setDraft(date)
      if (actions.current?.checkVisibility() !== true) {
        state?.setDateValue(date)
      }
    },
    [state],
  )

  // OK writes the draft through the picker's state, and its `slot` closes
  // the surface after, which is all Cancel does.
  const confirm = useCallback(() => {
    if (draft !== null) {
      state?.setDateValue(draft)
    }
  }, [draft, state])

  const drafted = useMemo(
    () => ({ ...calendar, onChange: pick, value: draft }),
    [calendar, draft, pick],
  )

  return (
    <RACDialog {...stylex.props(overlay.popupDialog, focus.ring)}>
      <div {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.supportingText)}>{selectDateLabel}</div>
        <div {...stylex.props(styles.headline)}>
          {draft === null
            ? null
            : formatter.format(toCalendarDate(draft).toDate('UTC'))}
        </div>
      </div>
      <CalendarContext.Provider value={drafted}>
        <Calendar
          aria-label={label}
          showMonthYearMenus={showMonthYearMenus}
          visibleDuration={visibleDuration}
        />
      </CalendarContext.Provider>
      <div ref={actions} {...stylex.props(styles.actions)}>
        <Button slot="close" variant="text">
          {cancelLabel}
        </Button>
        <Button onPress={confirm} slot="close" variant="text">
          {confirmLabel}
        </Button>
      </div>
    </RACDialog>
  )
}

export type { DatePickerProps }

export default DatePicker
