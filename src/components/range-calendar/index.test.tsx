import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RangeCalendar from '.'
import { CalendarDate } from '../../date'
import { colors } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  onPrimary: { color: colors.onPrimary },
  onSecondaryContainer: { color: colors.onSecondaryContainer },
  primary: { color: colors.primary },
  secondaryContainer: { color: colors.secondaryContainer },
})

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const read = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return read
}

// A fixed range inside a fixed month, so a case reads the same whenever it
// runs. The 8th to the 15th of September 2026 is eight days across two weeks.
const RANGE = {
  end: new CalendarDate(2026, 9, 15),
  start: new CalendarDate(2026, 9, 8),
}

// Matched on the date rather than the whole label: React Aria appends
// "selected" to the name of a date inside the range.
function cellFor(view: ReturnType<typeof render>, label: string) {
  return view.getByRole('button', { name: new RegExp(label) })
}

// The two ends cannot be told apart by name — React Aria gives each of them
// the whole range's description, so both carry every date in it. They are
// reached by the state React Aria marks them with instead.
function endFor(view: ReturnType<typeof render>, which: 'end' | 'start') {
  const found = view.container.querySelector(`[data-selection-${which}]`)
  if (!(found instanceof HTMLElement)) {
    throw new Error(`expected a ${which} of the range`)
  }
  return found
}

describe('range calendar', () => {
  describe('the range', () => {
    it('marks every day from the first to the last', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )

      // Eight days, ends included.
      expect(view.container.querySelectorAll('[data-selected]')).toHaveLength(8)
    })

    it('draws the two ends as the circle a selected date takes', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const start = getComputedStyle(endFor(view, 'start'))
      const end = getComputedStyle(endFor(view, 'end'))

      expect(start.backgroundColor).toBe(probe(probeStyles.primary))
      expect(start.color).toBe(probe(probeStyles.onPrimary))
      expect(end.backgroundColor).toBe(probe(probeStyles.primary))
    })

    it('draws the days between as a band one step down', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const middle = getComputedStyle(cellFor(view, 'September 11, 2026'))

      // The page tokenises no band, so this is the library's own: the
      // secondary container, one step down from the primary the ends take.
      expect(middle.backgroundColor).toBe(probe(probeStyles.secondaryContainer))
      expect(middle.color).toBe(probe(probeStyles.onSecondaryContainer))
      expect(middle.backgroundColor).not.toBe(probe(probeStyles.primary))
    })

    it('squares the band so consecutive days join', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const middle = getComputedStyle(cellFor(view, 'September 11, 2026'))

      expect(Number.parseFloat(middle.borderTopLeftRadius)).toBe(0)
      expect(Number.parseFloat(middle.borderTopRightRadius)).toBe(0)
    })

    it('rounds each end on its outer edge only', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const start = getComputedStyle(endFor(view, 'start'))
      const end = getComputedStyle(endFor(view, 'end'))

      // The first day rounds where the band begins and stays square where it
      // continues; the last day is the mirror of that.
      expect(Number.parseFloat(start.borderTopLeftRadius)).toBeGreaterThan(19)
      expect(Number.parseFloat(start.borderTopRightRadius)).toBe(0)
      expect(Number.parseFloat(end.borderTopRightRadius)).toBeGreaterThan(19)
      expect(Number.parseFloat(end.borderTopLeftRadius)).toBe(0)
    })

    it('reaches across the grid own spacing, so the band has no seams', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const days = [...view.container.querySelectorAll('[data-selected]')]
      const week = days
        .map((day) => day.getBoundingClientRect())
        .filter((rect) => rect.top === days[1].getBoundingClientRect().top)

      // Measured rather than asserted off the margin: a negative margin moves
      // a box without widening it, so an earlier version had the margin and
      // still drew the band as a dashed run of separate blocks.
      expect(week.length).toBeGreaterThan(1)
      for (let index = 1; index < week.length; index += 1) {
        expect(week[index].left).toBeLessThanOrEqual(week[index - 1].right)
      }
    })
  })

  describe('picking', () => {
    it('reports the range once both ends are chosen', () => {
      const onChange =
        vi.fn<(value: { end: CalendarDate; start: CalendarDate }) => void>()
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          onChange={onChange}
        />,
      )

      fireEvent.click(cellFor(view, 'September 3, 2026'))
      fireEvent.click(cellFor(view, 'September 6, 2026'))

      expect(onChange).toHaveBeenCalled()
      const last = onChange.mock.calls.at(-1)?.[0]
      expect(last?.start.toString()).toBe('2026-09-03')
      expect(last?.end.toString()).toBe('2026-09-06')
    })
  })

  describe('shared with Calendar', () => {
    it('draws the same chevrons, one per direction', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const chevron = view.container.querySelector('button[slot="previous"]')
      const bar = chevron?.parentElement
      if (!(bar instanceof HTMLElement)) {
        throw new Error('expected a row holding the chevrons')
      }

      expect(bar.querySelectorAll('button')).toHaveLength(2)
    })

    it('draws a grid per visible month', () => {
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          visibleDuration={VISIBLE_TWO}
        />,
      )

      expect(view.getAllByRole('grid')).toHaveLength(2)
    })

    it('bounds the same way a Calendar does', () => {
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          minValue={new CalendarDate(2026, 9, 5)}
        />,
      )

      expect(
        cellFor(view, 'September 1, 2026').getAttribute('aria-disabled'),
      ).toBe('true')
    })
  })
})

const VISIBLE_TWO = { months: 2 }
