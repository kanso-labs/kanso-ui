import type { CalendarDate } from '@internationalized/date'
import type { ReactElement } from 'react'
import type {
  DateValue,
  RangeCalendarProps as RACRangeCalendarProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  CalendarCell as RACCalendarCell,
  CalendarGrid as RACCalendarGrid,
  CalendarGridBody as RACCalendarGridBody,
  RangeCalendar as RACRangeCalendar,
} from 'react-aria-components'

import { CalendarGridHeader, CalendarHeader } from '../../calendar'
import { monthOffsets } from '../../calendar/months'
import { calendarStyles } from '../../calendar/styles'
import { mergeStatefulStyles } from '../../styles/merge'

// The date pickers page's calendar again, picking two dates rather than one.
// Every part it draws is Calendar's, from `src/calendar` — the container, the
// grid, the weekday row, the chevrons and the date circle — so the two cannot
// come apart.
//
// What a range adds is the band between its two ends, and the page tokenises
// no such thing: its token set covers the docked calendar's selected date and
// stops there. So the band is the library's own, and its reasons are in
// `src/calendar/styles.ts` where it is defined — the secondary container, one
// step down from the primary the two ends take.
//
// Two things follow from drawing a band across a grid whose cells are spaced
// apart.
//
// **The band is square and the ends are round.** A range of consecutive days
// reads as one shape rather than a row of circles, and the first and last day
// round only their outer edge, which is what makes the band begin and end at
// a circle.
//
// **The band reaches across the grid's own spacing.** A negative inline
// margin of half that spacing on each side closes the gap between one day and
// the next without moving either. Without it the band arrives as a dashed run
// of separate blocks.

type RangeCalendarProps<T extends DateValue> = Omit<
  RACRangeCalendarProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the calendar's render state. */
  className?: RACRangeCalendarProps<T>['className']
  /** A function may compute the style from the calendar's render state. */
  style?: RACRangeCalendarProps<T>['style']
}

// A date's classes, from React Aria's render state. StyleX cannot target
// `[data-selected]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order is what makes a range read as one shape. Every selected day takes
// the band; the two ends then take the circle over it, and round the outer
// edge the band does not continue past. `disabled` is last of all, and StyleX
// replaces a property whole, so it takes the branches above it with it.
function cellClassName(state: {
  isDisabled: boolean
  isSelected: boolean
  isSelectionEnd: boolean
  isSelectionStart: boolean
  isToday: boolean
}) {
  const isEnd =
    state.isSelected && (state.isSelectionStart || state.isSelectionEnd)

  return (
    stylex.props(
      calendarStyles.cell,
      state.isToday && calendarStyles.cellToday,
      state.isSelected && calendarStyles.cellInRange,
      state.isSelected &&
        state.isSelectionStart &&
        calendarStyles.cellRangeStart,
      state.isSelected && state.isSelectionEnd && calendarStyles.cellRangeEnd,
      isEnd && calendarStyles.cellSelected,
      state.isDisabled && calendarStyles.cellDisabled,
    ).className ?? ''
  )
}

function gridCell(date: CalendarDate): ReactElement {
  return <RACCalendarCell className={cellClassName} date={date} />
}

/**
 * A calendar for picking a range of dates. The value is React Aria's: pass
 * `value` with `onChange` to control it, or `defaultValue` to let it keep its
 * own, both as a `{ start, end }` pair of `@internationalized/date` values
 * from this package's `./date` subpath.
 *
 * ```tsx
 * import { CalendarDate } from '@kanso-labs/kanso-ui/date'
 *
 * <RangeCalendar
 *   aria-label="Label"
 *   defaultValue={{
 *     start: new CalendarDate(2026, 9, 8),
 *     end: new CalendarDate(2026, 9, 15),
 *   }}
 * />
 * ```
 *
 * The two ends take the circle a selected date takes in `Calendar`, and the
 * days between them a band in the secondary container. `minValue`,
 * `maxValue`, `isDateUnavailable` and `visibleDuration` are the same props
 * `Calendar` takes, and `allowsNonContiguousRanges` lets a range skip the
 * dates ruled out inside it rather than stopping at the first.
 *
 * The call site's `className` and `style` land on the container, which is the
 * element a layout positions.
 */
function RangeCalendar<T extends DateValue>(props: RangeCalendarProps<T>) {
  return (
    <RACRangeCalendar<T>
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
    </RACRangeCalendar>
  )
}

export type { RangeCalendarProps }

export default RangeCalendar
