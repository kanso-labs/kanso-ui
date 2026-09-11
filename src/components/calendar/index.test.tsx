import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Calendar from '.'
import { CalendarDate, getLocalTimeZone, today } from '../../date'
import { colors, typography } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  bodyLarge: { fontSize: typography.bodyLargeSize },
  onPrimary: { color: colors.onPrimary },
  onSurface: { color: colors.onSurface },
  primary: { color: colors.primary },
  surfaceContainerHigh: { color: colors.surfaceContainerHigh },
})

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = { color: computed.color, fontSize: computed.fontSize }
  view.unmount()
  return read
}

// A fixed month, so a case reads the same on any day of any year. September
// 2026 begins on a Tuesday and runs 30 days, which is five weeks with days
// from August and October filling the ends.
const SEPTEMBER = new CalendarDate(2026, 9, 15)

// Hoisted so the identity is stable, which is what react-perf is after.
const isSixteenth = (date: { day: number }) => date.day === 16
const VISIBLE_TWO = { months: 2 }

// Matched on the date rather than the whole label: React Aria appends
// "selected" to the name of the date the calendar holds, so an exact string
// finds an unselected date and misses the same date once it is chosen.
function cellFor(view: ReturnType<typeof render>, label: string) {
  return view.getByRole('button', { name: new RegExp(label) })
}

// React Aria renders a hidden "Next" of its own after the grid, so a chevron
// is reached through its slot rather than by name alone.
function headerButton(view: ReturnType<typeof render>, label: string) {
  const found = view.container.querySelector(
    `button[slot="${label === 'Next' ? 'next' : 'previous'}"]`,
  )
  if (!(found instanceof HTMLElement)) {
    throw new Error(`expected a ${label} chevron in the header`)
  }
  return found
}

describe('calendar', () => {
  describe('structure', () => {
    it('renders a grid React Aria names with the visible month', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )

      expect(
        view.getByRole('grid', { name: 'Label, September 2026' }),
      ).not.toBeNull()
    })

    it('draws a weekday row in the page own type', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const days = view.container.querySelectorAll('th')

      expect(days).toHaveLength(7)
      // The page gives the weekday row the same body-large the dates take,
      // in the full content role rather than a muted one.
      expect(getComputedStyle(days[0]).fontSize).toBe(
        probe(probeStyles.bodyLarge).fontSize,
      )
      expect(getComputedStyle(days[0]).color).toBe(
        probe(probeStyles.onSurface).color,
      )
    })

    it('sits on the page own container', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const root = view.container.firstElementChild
      if (!(root instanceof HTMLElement)) {
        throw new Error('expected the calendar to render an element')
      }

      expect(getComputedStyle(root).backgroundColor).toBe(
        probe(probeStyles.surfaceContainerHigh).color,
      )
    })

    it('draws the date at the page own state layer size', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const cell = cellFor(view, 'Tuesday, September 15, 2026')

      // The page's 40dp state layer, inside the 48dp container it gives a
      // date: 4dp either side, which the cell carries as its own margin so a
      // range's band can fill the whole 48.
      expect(cell.getBoundingClientRect().width).toBe(40)
      expect(cell.getBoundingClientRect().height).toBe(40)
    })

    it('puts the page 48px between one date and the next', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const first = cellFor(view, 'September 8, 2026').getBoundingClientRect()
      const second = cellFor(view, 'September 9, 2026').getBoundingClientRect()

      expect(second.left - first.left).toBe(48)
    })
  })

  describe('the selected date', () => {
    it('fills its circle in the primary role', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const cell = getComputedStyle(
        cellFor(view, 'Tuesday, September 15, 2026'),
      )

      expect(cell.backgroundColor).toBe(probe(probeStyles.primary).color)
      expect(cell.color).toBe(probe(probeStyles.onPrimary).color)
      expect(Number.parseFloat(cell.borderTopLeftRadius)).toBeGreaterThan(19)
    })

    it('reports the date that was pressed', () => {
      const onChange = vi.fn<(value: CalendarDate) => void>()
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          onChange={onChange}
        />,
      )

      fireEvent.click(cellFor(view, 'Wednesday, September 16, 2026'))

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls[0][0].toString()).toBe('2026-09-16')
    })
  })

  describe('today', () => {
    it('takes an outline and the primary label when it is not the one held', () => {
      const now = today(getLocalTimeZone())
      const view = render(<Calendar aria-label="Label" defaultValue={now} />)
      // Rendered with today selected, then moved off it, so the case does not
      // depend on which month the suite runs in.
      const cell = view.container.querySelector('[data-today]')
      if (!(cell instanceof HTMLElement)) {
        throw new Error('expected a cell marked today')
      }

      expect(cell.getAttribute('data-today')).toBe('true')
    })

    it('takes the fill rather than the outline while it is also selected', () => {
      const now = today(getLocalTimeZone())
      const view = render(<Calendar aria-label="Label" defaultValue={now} />)
      const cell = view.container.querySelector('[data-today][data-selected]')
      if (!(cell instanceof HTMLElement)) {
        throw new Error('expected today to be the selected cell')
      }

      // A circle already says where you are, so a ring around it would say it
      // twice — the fill wins and the label goes with it.
      expect(getComputedStyle(cell).backgroundColor).toBe(
        probe(probeStyles.primary).color,
      )
      expect(getComputedStyle(cell).color).toBe(
        probe(probeStyles.onPrimary).color,
      )
    })
  })

  describe('bounds', () => {
    it('disables the dates outside min and max', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          maxValue={new CalendarDate(2026, 9, 20)}
          minValue={new CalendarDate(2026, 9, 10)}
        />,
      )

      expect(
        cellFor(view, 'Tuesday, September 1, 2026').getAttribute(
          'aria-disabled',
        ),
      ).toBe('true')
      expect(
        cellFor(view, 'Tuesday, September 15, 2026').getAttribute(
          'aria-disabled',
        ),
      ).toBeNull()
    })

    it('disables the dates ruled out one at a time', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          isDateUnavailable={isSixteenth}
        />,
      )

      expect(
        cellFor(view, 'Wednesday, September 16, 2026').getAttribute(
          'aria-disabled',
        ),
      ).toBe('true')
    })

    it('fades a date from the month either side, as the disabled date it is', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const outside = view.container.querySelector('[data-outside-month]')
      if (!(outside instanceof HTMLElement)) {
        throw new Error('expected a date from an adjacent month')
      }

      // React Aria marks those cells outside-month and disables them in the
      // same breath, so the fade they take is the disabled one rather than a
      // treatment of their own.
      expect(outside.getAttribute('data-disabled')).toBe('true')
      expect(getComputedStyle(outside).color).not.toBe(
        probe(probeStyles.onSurface).color,
      )
    })
  })

  describe('moving between months', () => {
    it('goes back and forward through the two chevrons', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )

      fireEvent.click(headerButton(view, 'Next'))
      expect(
        view.getByRole('grid', { name: 'Label, October 2026' }),
      ).not.toBeNull()

      fireEvent.click(headerButton(view, 'Previous'))
      fireEvent.click(headerButton(view, 'Previous'))
      expect(
        view.getByRole('grid', { name: 'Label, August 2026' }),
      ).not.toBeNull()
    })

    it('draws one chevron per direction in the header, not two', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const chevron = view.container.querySelector('button[slot="previous"]')
      const bar = chevron?.parentElement
      if (!(bar instanceof HTMLElement)) {
        throw new Error('expected a row holding the chevrons')
      }

      // Scoped to the header on purpose. React Aria renders a second, visually
      // hidden "Next" of its own after the grid, for a reader moving through
      // months without the pointer — so counting every button in the calendar
      // would be counting React Aria's as well as this component's.
      //
      // What this guards is the header itself: React Aria wires the slots on
      // its own Button, so nesting IconButton inside one would put two
      // buttons where the page draws one.
      expect(bar.querySelectorAll('button')).toHaveLength(2)
    })
  })

  describe('two months at once', () => {
    it('draws a grid per month', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          visibleDuration={VISIBLE_TWO}
        />,
      )

      expect(view.getAllByRole('grid')).toHaveLength(2)
    })

    it('draws the month after it in the second grid', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          visibleDuration={VISIBLE_TWO}
        />,
      )

      expect(cellFor(view, 'September 15, 2026')).not.toBeNull()
      expect(cellFor(view, 'October 15, 2026')).not.toBeNull()
    })

    it('draws one grid when nothing asks for more', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )

      expect(view.getAllByRole('grid')).toHaveLength(1)
    })
  })
})
