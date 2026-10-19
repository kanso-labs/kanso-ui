'use client'

import type { CalendarDate } from '@internationalized/date'
import type { ReactElement, RefAttributes } from 'react'
import type {
  CalendarCellRenderProps,
  CalendarRenderProps,
  DateValue,
  CalendarProps as RACCalendarProps,
} from 'react-aria-components'

import { isSameDay } from '@internationalized/date'
import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import {
  CalendarStateContext,
  Calendar as RACCalendar,
  CalendarCell as RACCalendarCell,
  CalendarGrid as RACCalendarGrid,
  CalendarGridBody as RACCalendarGridBody,
  Text as RACText,
} from 'react-aria-components'

import { CalendarFrame, CalendarGridHeader } from '../../calendar'
import { monthOffsets } from '../../calendar/months'
import { calendarStyles, dateLayers } from '../../calendar/styles'
import { invalidFrom } from '../../field/root'
import { fieldChromeStyles } from '../../field/styles'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'

// The date pickers page's docked calendar: a month grid with a circle on the
// selected date and an outline on today. Its values are that page's — a
// 360dp container on the high surface container, 48dp date cells with a 40dp
// state layer inside them, body-large for both the weekday row and the dates,
// primary for the selected circle and for today's outline.
//
// The page's container is 456dp tall, which this does not take: that height
// is a picker's, counting a headline and an action row the calendar itself
// does not draw. What is held instead is the grid, at six weeks — the most
// any month occupies — so the calendar keeps its height as the month moves
// and a shorter month leaves its last rows empty. `months` in
// `src/calendar/styles.ts` is where the room is reserved.
//
// `showMonthYearMenus` draws the page's docked header instead of one heading:
// the month's menu button between the chevrons that step it and the year's
// after them, each opening its list where the grid was. The parts are in
// `src/calendar`, shared with RangeCalendar.
//
// The calendar's own disabled, read-only and invalid states are drawn on its
// dates, from React Aria's calendar state rather than each date's, since
// that is the one place all three are known:
//
// - **Disabled** fades every date, the weekday row, the chevrons and the
//   menu buttons to the page's 38%, and keeps the date it holds as a
//   disabled filled circle — React Aria stops calling a disabled date
//   selected, which left the calendar looking empty.
// - **Read-only** keeps every date at full strength, since it still reports
//   a value, but drops the pointer and the state layers from the dates, which
//   a press no longer changes. The chevrons and the menus still move the
//   month, so they keep theirs.
// - **Invalid** draws the date held in the error container roles, and
//   `error` writes the reason under the months in the field's supporting
//   type and error colour. Each date React Aria marks invalid points
//   `aria-describedby` at it, so a screen reader hears why as well as that.
//
// Five things are this component's own.
//
// **The year menu has no chevrons of its own.** The page draws a pair either
// side of it that step a year, which would need two names React Aria has no
// message for — the library writes a word of its own only behind a prop that
// can replace it, and it would take a pair on four components. The year list
// reaches any year within a century of the one shown in one press, or any
// the bounds allow where they are closer, and Shift with Page Up or Page
// Down steps a year from the keyboard.
//
// **The cell is a circle in a square.** The page gives the date a 48dp
// container and a 40dp state layer, which is a 40dp circle with 4dp of room
// around it. The circle is the element, centred in a 48dp column and a 48dp
// row — the pitch Compose lays its days at — and a transparent box reaching
// the 4dp past it on every side makes the whole square the press target,
// rather than a 48dp box with a 40dp box inside it. The chevrons and the
// month and year menu buttons reach a 48dp target the same way.
//
// **It narrows to its container.** The page's docked calendar is 360dp, and
// a compact window leaves 328dp between its margins, so the calendar is 360
// at most and the columns share whatever is left below that. Under about
// 304dp of content a column is narrower than its 40dp circle, and the
// circles of neighbouring dates meet.
//
// **A date from the month either side is faded because it is disabled, not
// because it is outside.** React Aria marks those cells `data-outside-month`
// and disables them in the same breath, so a treatment keyed on the first
// would never draw anything the second had not already drawn. The disabled
// fade is the page's 38% either way.
//
// **Today reads as today whether or not it is selected.** The page gives it
// an outline and the primary label; selected gives it a filled circle and the
// on-primary label. A selected today takes the fill, since a circle already
// says where you are and two rings would say it twice.
//
// **The month is moved by IconButton's shape rather than by IconButton.**
// React Aria wires `slot="previous"` and `slot="next"` on its own `Button`,
// and IconButton renders React Aria's `Button` too — so nesting one inside
// the slot would put two buttons where the page draws one. The chevrons take
// the standard icon button's 40dp square and its state layer instead.

type CalendarProps<T extends DateValue = DateValue> = {
  /** A function may compute the class from the calendar's render state. */
  className?: RACCalendarProps<T>['className']
  /**
   * The message shown under the months, which also marks the calendar
   * invalid: the date it holds turns to the error container colours, and
   * React Aria points that date's description at the message. `isInvalid`
   * on its own marks the date with no message.
   */
  error?: string
  /**
   * Whether the header draws the month and the year as menu buttons, each
   * opening a list of them in the grid's place, as the docked date picker's
   * header does, rather than one heading between the chevrons. For a date
   * far from the one shown, such as a date of birth: the year list runs a
   * century either side of the year shown, or to `minValue` and `maxValue`
   * where they are closer.
   *
   * For one visible month. With `visibleDuration` of more than one, the
   * header is the plain one, whose heading names every month shown — the
   * menus name only the first, which would leave the others unlabelled.
   * @default false
   */
  showMonthYearMenus?: boolean
  /** A function may compute the style from the calendar's render state. */
  style?: RACCalendarProps<T>['style']
} & Omit<RACCalendarProps<T>, 'children' | 'className' | 'style'>

/** What a date's classes read off the calendar around it. */
type CalendarStates = {
  /**
   * Whether this date is the one a disabled calendar holds, inside its
   * bounds. A copy of it in a neighbouring month's grid is told apart by
   * React Aria's own `isOutsideMonth`.
   */
  isHeldWhileDisabled: boolean
  isReadOnly: boolean
}

/**
 * A month calendar for picking a date. The value is React Aria's: pass
 * `value` with `onChange` to control it, or `defaultValue` to let it keep its
 * own, both as an `@internationalized/date` value from this package's
 * `./date` subpath.
 *
 * ```tsx
 * import { today, getLocalTimeZone } from '@kanso-labs/kanso-ui/date'
 *
 * <Calendar aria-label="Label" defaultValue={today(getLocalTimeZone())} />
 * ```
 *
 * `minValue` and `maxValue` bound it, `isDateUnavailable` rules individual
 * dates out, and `visibleDuration` of `{ months: 2 }` draws two months side
 * by side, stacked below the expanded breakpoint. Name it with `aria-label`
 * or `aria-labelledby`; React Aria composes the visible month into that name
 * itself.
 *
 * The call site's `className` and `style` land on the container, which is the
 * element a layout positions.
 */
function Calendar<T extends DateValue>({
  error,
  showMonthYearMenus = false,
  ...props
}: CalendarProps<T> & RefAttributes<HTMLDivElement>) {
  return (
    <RACCalendar<T>
      isInvalid={invalidFrom(error)}
      {...props}
      {...mergeStatefulStyles(stylex.props(calendarStyles.root), props)}
    >
      {({ isInvalid }: CalendarRenderProps) => (
        <>
          <CalendarFrame
            months={props.visibleDuration?.months ?? 1}
            showMonthYearMenus={showMonthYearMenus}
          >
            <div {...stylex.props(calendarStyles.months)}>
              {monthOffsets(props.visibleDuration?.months ?? 1).map(
                (offset) => (
                  <div
                    key={offset.months}
                    {...stylex.props(calendarStyles.month)}
                  >
                    <RACCalendarGrid
                      offset={offset}
                      {...stylex.props(calendarStyles.grid)}
                    >
                      <CalendarGridHeader />
                      <RACCalendarGridBody>{gridCell}</RACCalendarGridBody>
                    </RACCalendarGrid>
                  </div>
                ),
              )}
            </div>
          </CalendarFrame>
          {/*
           * Through React Aria's error slot, which gives it the id an
           * invalid date's `aria-describedby` names. Drawn only while the
           * calendar is invalid: React Aria looks for the element when
           * `isInvalid` changes, which is when this appears and goes.
           */}
          {isInvalid && error !== undefined ? (
            <RACText
              slot="errorMessage"
              {...stylex.props(
                fieldChromeStyles.message,
                fieldChromeStyles.messageError,
              )}
            >
              {error}
            </RACText>
          ) : null}
        </>
      )}
    </RACCalendar>
  )
}

// A date's classes, from React Aria's render state and the calendar's.
// StyleX cannot target `[data-selected]` on the element it is styling, so the
// state comes from what React Aria hands the className.
//
// The order matters. `selected` is applied after `today`, so a selected today
// takes the fill rather than the outline — a circle already says where you
// are, and two rings would say it twice — and `invalid` after `selected`,
// which it repaints. The hover and pressed layers come next, over whichever
// ground the date has, a press over a hover. A read-only calendar takes no
// hover layer, and React Aria reports no press there to draw one for.
// `unavailable` and `disabled` come last, and StyleX replaces a property
// whole, so they take the layers with them; the date a disabled calendar
// holds then puts its disabled circle back.
function cellClassName(
  state: CalendarCellRenderProps,
  calendar: CalendarStates,
) {
  return (
    stylex.props(
      calendarStyles.cell,
      focus.ring,
      state.isToday && calendarStyles.cellToday,
      state.isSelected && calendarStyles.cellSelected,
      state.isSelected && state.isInvalid && calendarStyles.cellInvalid,
      calendar.isReadOnly && calendarStyles.cellReadOnly,
      !calendar.isReadOnly && state.isHovered && hoveredLayer(state),
      state.isPressed && pressedLayer(state),
      state.isUnavailable && calendarStyles.cellUnavailable,
      state.isDisabled && calendarStyles.cellDisabled,
      calendar.isHeldWhileDisabled &&
        !state.isOutsideMonth &&
        calendarStyles.cellSelectedDisabled,
    ).className ?? ''
  )
}

// The calendar's part of a date's classes, bound once per date. Built by a
// call rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after.
function cellClassNameIn(calendar: CalendarStates) {
  return (state: CalendarCellRenderProps) => cellClassName(state, calendar)
}

/**
 * One date. React Aria's cell, with what its classes need from the calendar
 * read from React Aria's calendar state: whether it is read-only, and the
 * date it holds, which React Aria hides from the cell itself once the
 * calendar is disabled.
 *
 * Held means what React Aria would have called selected with the calendar
 * enabled: the value, inside the bounds, and in its own month's grid rather
 * than a neighbour's, which the classes check.
 */
function DateCell({ date }: { date: CalendarDate }): ReactElement {
  const calendar = useContext(CalendarStateContext)
  const isHeldWhileDisabled =
    calendar !== null &&
    calendar.isDisabled &&
    !calendar.isInvalid(date) &&
    holds(calendar.value, date)

  return (
    <RACCalendarCell
      className={cellClassNameIn({
        isHeldWhileDisabled,
        isReadOnly: calendar?.isReadOnly ?? false,
      })}
      date={date}
    />
  )
}

function gridCell(date: CalendarDate): ReactElement {
  return <DateCell date={date} />
}

// Whether a calendar's value includes a date: one date, or several where the
// calendar takes more than one.
function holds(
  value: CalendarDate | null | readonly (CalendarDate | null)[],
  date: CalendarDate,
) {
  const held = value !== null && 'length' in value ? value : [value]
  return held.some((entry) => entry !== null && isSameDay(entry, date))
}

function hoveredLayer(state: CalendarCellRenderProps) {
  if (!state.isSelected) {
    return dateLayers.plainHovered
  }
  return state.isInvalid
    ? dateLayers.invalidHovered
    : dateLayers.selectedHovered
}

function pressedLayer(state: CalendarCellRenderProps) {
  if (!state.isSelected) {
    return dateLayers.plainPressed
  }
  return state.isInvalid
    ? dateLayers.invalidPressed
    : dateLayers.selectedPressed
}

export type { CalendarProps }

export default Calendar
