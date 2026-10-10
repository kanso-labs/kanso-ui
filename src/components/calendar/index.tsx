'use client'

import type { CalendarDate } from '@internationalized/date'
import type { ReactElement, RefAttributes } from 'react'
import type {
  DateValue,
  CalendarProps as RACCalendarProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Calendar as RACCalendar,
  CalendarCell as RACCalendarCell,
  CalendarGrid as RACCalendarGrid,
  CalendarGridBody as RACCalendarGridBody,
} from 'react-aria-components'

import { CalendarFrame, CalendarGridHeader } from '../../calendar'
import { monthOffsets } from '../../calendar/months'
import { calendarStyles, dateLayers } from '../../calendar/styles'
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
// around it. Each date's own inline margin supplies that room, with the
// grid's `border-spacing` left at zero, so the circle is the element and the
// square is the room around it — rather than a 48dp box with a 40dp box
// inside it.
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
  showMonthYearMenus = false,
  ...props
}: CalendarProps<T> & RefAttributes<HTMLDivElement>) {
  return (
    <RACCalendar<T>
      {...props}
      {...mergeStatefulStyles(stylex.props(calendarStyles.root), props)}
    >
      <CalendarFrame
        months={props.visibleDuration?.months ?? 1}
        showMonthYearMenus={showMonthYearMenus}
      >
        <div {...stylex.props(calendarStyles.months)}>
          {monthOffsets(props.visibleDuration?.months ?? 1).map((offset) => (
            <RACCalendarGrid
              key={offset.months}
              offset={offset}
              {...stylex.props(calendarStyles.grid)}
            >
              <CalendarGridHeader />
              <RACCalendarGridBody>{gridCell}</RACCalendarGridBody>
            </RACCalendarGrid>
          ))}
        </div>
      </CalendarFrame>
    </RACCalendar>
  )
}

// A date's classes, from React Aria's render state. StyleX cannot target
// `[data-selected]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order matters. `selected` is applied after `today`, so a selected today
// takes the fill rather than the outline — a circle already says where you
// are, and two rings would say it twice. The hover and pressed layers come
// next, over whichever ground the date has, a press over a hover.
// `unavailable` and `disabled` come last, and StyleX replaces a property
// whole, so they take the layers with them.
function cellClassName(state: {
  isDisabled: boolean
  isHovered: boolean
  isPressed: boolean
  isSelected: boolean
  isToday: boolean
  isUnavailable: boolean
}) {
  return (
    stylex.props(
      calendarStyles.cell,
      focus.ring,
      state.isToday && calendarStyles.cellToday,
      state.isSelected && calendarStyles.cellSelected,
      state.isHovered &&
        (state.isSelected
          ? dateLayers.selectedHovered
          : dateLayers.plainHovered),
      state.isPressed &&
        (state.isSelected
          ? dateLayers.selectedPressed
          : dateLayers.plainPressed),
      state.isUnavailable && calendarStyles.cellUnavailable,
      state.isDisabled && calendarStyles.cellDisabled,
    ).className ?? ''
  )
}

function gridCell(date: CalendarDate): ReactElement {
  return <RACCalendarCell className={cellClassName} date={date} />
}

export type { CalendarProps }

export default Calendar
