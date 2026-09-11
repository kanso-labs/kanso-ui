import type { CalendarDate } from '@internationalized/date'
import type { ReactElement } from 'react'
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

import { CalendarGridHeader, CalendarHeader } from '../../calendar'
import { monthOffsets } from '../../calendar/months'
import { calendarStyles } from '../../calendar/styles'
import { mergeStatefulStyles } from '../../styles/merge'

// The date pickers page's docked calendar: a month grid with a circle on the
// selected date and an outline on today. Its values are that page's — a
// 360dp container on the high surface container, 48dp date cells with a 40dp
// state layer inside them, body-large for both the weekday row and the dates,
// primary for the selected circle and for today's outline.
//
// The page's container is 456dp tall, which this does not fix: that height is
// a picker's, counting a headline and an action row the calendar itself does
// not draw. A month grid is as tall as its weeks, and six-week months are
// taller than five-week ones — pinning 456 would crop one or pad the other.
//
// Three things are this component's own.
//
// **The cell is a circle in a square.** The page gives the date a 48dp
// container and a 40dp state layer, which is a 40dp circle with 4dp of room
// around it. The grid's `border-spacing` is what supplies that room, so the
// circle is the element and the square is the space between circles — rather
// than a 48dp box with a 40dp box inside it.
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

type CalendarProps<T extends DateValue> = Omit<
  RACCalendarProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the calendar's render state. */
  className?: RACCalendarProps<T>['className']
  /** A function may compute the style from the calendar's render state. */
  style?: RACCalendarProps<T>['style']
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
 * by side. Name it with `aria-label` or `aria-labelledby`; React Aria
 * composes the visible month into that name itself.
 *
 * The call site's `className` and `style` land on the container, which is the
 * element a layout positions.
 */
function Calendar<T extends DateValue>(props: CalendarProps<T>) {
  return (
    <RACCalendar<T>
      {...props}
      {...mergeStatefulStyles(stylex.props(calendarStyles.root), props)}
    >
      <CalendarHeader />
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
    </RACCalendar>
  )
}

// A date's classes, from React Aria's render state. StyleX cannot target
// `[data-selected]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order matters. `selected` is applied after `today`, so a selected today
// takes the fill rather than the outline — a circle already says where you
// are, and two rings would say it twice. `disabled` is last of all, and
// StyleX replaces a property whole, so it takes the hover branches with it.
function cellClassName(state: {
  isDisabled: boolean
  isSelected: boolean
  isToday: boolean
}) {
  return (
    stylex.props(
      calendarStyles.cell,
      state.isToday && calendarStyles.cellToday,
      state.isSelected && calendarStyles.cellSelected,
      state.isDisabled && calendarStyles.cellDisabled,
    ).className ?? ''
  )
}

function gridCell(date: CalendarDate): ReactElement {
  return <RACCalendarCell className={cellClassName} date={date} />
}

export type { CalendarProps }

export default Calendar
