import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  CalendarGridHeader as RACCalendarGridHeader,
  CalendarHeaderCell as RACCalendarHeaderCell,
  Heading as RACHeading,
} from 'react-aria-components'

import { ChevronEndGlyph } from '../glyphs'
import { calendarStyles } from './styles'

// The parts Calendar and RangeCalendar both render: the row that moves the
// month, the weekday header, and the offsets that put more than one month
// side by side. Apart from either component so the two cannot drift, and
// outside `src/components` for the reason ./styles.ts gives.

function CalendarGridHeader(): ReactElement {
  return <RACCalendarGridHeader>{calendarHeaderCell}</RACCalendarGridHeader>
}

/**
 * The two chevrons with the month between them. React Aria wires
 * `slot="previous"` and `slot="next"` on its own `Button`, and `IconButton`
 * renders React Aria's `Button` too — so nesting one inside a slot would put
 * two buttons where the date pickers page draws one. The chevrons take the
 * icon buttons page's 40dp square and its state layer instead.
 *
 * A plain element rather than a `<header>`: a header is a banner landmark,
 * landmarks may not nest, and React Aria puts a calendar in
 * `role="application"` — axe fails the page on it.
 */
function CalendarHeader(): ReactElement {
  return (
    <div {...stylex.props(calendarStyles.header)}>
      <RACButton className={chevronClassName} slot="previous">
        <ChevronEndGlyph
          {...stylex.props(
            calendarStyles.chevronGlyph,
            calendarStyles.chevronGlyphPrevious,
          )}
        />
      </RACButton>
      <RACHeading {...stylex.props(calendarStyles.heading)} />
      <RACButton className={chevronClassName} slot="next">
        <ChevronEndGlyph {...stylex.props(calendarStyles.chevronGlyph)} />
      </RACButton>
    </div>
  )
}

/** The weekday row, in the type the page gives both it and the dates. */
function calendarHeaderCell(day: string): ReactElement {
  return (
    <RACCalendarHeaderCell {...stylex.props(calendarStyles.headerCell)}>
      {day}
    </RACCalendarHeaderCell>
  )
}

function chevronClassName() {
  return stylex.props(calendarStyles.chevron).className ?? ''
}

export { CalendarGridHeader, CalendarHeader }
