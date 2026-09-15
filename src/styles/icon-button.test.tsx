import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Calendar from '../components/calendar'
import DatePicker from '../components/date-picker'
import RangeCalendar from '../components/range-calendar'
import { iconButton } from './icon-button'

// The chrome is shared, and each place composes it at its own `stylex.props`
// call — StyleX cannot share a declaration inside `create`, so composition is
// what carries it. Dropping that argument is silent: the button still renders
// and still works, it simply stops being a 40dp square with a state layer.
//
// Nothing caught that before. Removing it from the calendar's chevrons left
// that component's own suite green at 17 passed.
const CHROME = (stylex.props(iconButton.chrome).className ?? '')
  .split(' ')
  .filter(Boolean)

const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <Calendar aria-label="Label" />, name: "Calendar's chevrons" },
  {
    element: <RangeCalendar aria-label="Label" />,
    name: "RangeCalendar's chevrons",
  },
  { element: <DatePicker label="Label" />, name: "DatePicker's trigger" },
]

describe('the shared icon-button chrome', () => {
  it('compiles to classes at all', () => {
    // An empty list would make every case below pass over nothing.
    expect(CHROME.length).toBeGreaterThan(0)
  })

  // Selected on the whole class list rather than one name: StyleX emits a
  // class per declaration, so the one for `box-sizing` sits on most of the
  // page and would match the wrong element.
  it.each(CASES)('reaches $name', ({ element }) => {
    const view = render(element)
    const selector = CHROME.map((name) => `.${name}`).join('')

    expect(view.container.querySelector(selector)).not.toBeNull()
  })
})
