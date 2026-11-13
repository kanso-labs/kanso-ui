import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import RangeCalendar from '.'
import { CalendarDate } from '../../date'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

const FORCED_COLORS = 'forced-colors: active'

// The colour a cell names for itself under forced colours, if any.
function forcedColourOf(cell: Element) {
  return declarationsHeld(cell, FORCED_COLORS).get('color')
}

const probeStyles = stylex.create({
  onPrimary: { color: colors.onPrimary },
  onSecondaryContainer: { color: colors.onSecondaryContainer },
  primary: { color: colors.primary },
  secondaryContainer: { color: colors.secondaryContainer },
})

// The band's state layers, written the way the component writes them, so
// the classes StyleX hashes from them are the component's own. They are
// drawn from React Aria's render state, so a case hovers and presses a day
// rather than finding a pseudo-class branch on it.
const bandLayers = stylex.create({
  hovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
  },
  pressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
  },
})

// An empty list would make the `every` below vacuously true, so it is a
// broken assertion rather than a passing one.
function classesOf(style: stylex.StyleXStyles) {
  const classes = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
  if (classes.length === 0) {
    throw new Error('expected the style to generate at least one class')
  }
  return classes
}

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

// February 2026 is four weeks and May is six, which are the two ends of what
// a month grid can be.
const FOUR_WEEK_RANGE = {
  end: new CalendarDate(2026, 2, 15),
  start: new CalendarDate(2026, 2, 8),
}
const SIX_WEEK_RANGE = {
  end: new CalendarDate(2026, 5, 15),
  start: new CalendarDate(2026, 5, 8),
}

// Hoisted so the identity is stable, which is what react-perf is after.
const isTenth = (date: { day: number }) => date.day === 10

// The calendar's own box, which is the element a layout positions.
function calendarBox(view: ReturnType<typeof render>) {
  const root = view.container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the calendar to draw a container')
  }
  return root.getBoundingClientRect()
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

// Lets a frame pass, which is when a month or year list closes after a
// choice — see src/calendar/index.tsx.
async function nextFrame() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

// How far below the first of two months the second one's grid starts, for a
// range calendar opening on the given range.
function spaceBetweenMonths(defaultValue: typeof RANGE) {
  const view = render(
    <RangeCalendar
      aria-label="Label"
      defaultValue={defaultValue}
      visibleDuration={VISIBLE_TWO}
    />,
  )
  const [first, second] = view
    .getAllByRole('grid')
    .map((grid) => grid.getBoundingClientRect())
  view.unmount()
  return second.top - first.bottom
}

// What the stacked months leave under the second one's last week, inside the
// box that holds them both.
function spaceUnderMonths(defaultValue: typeof RANGE) {
  const view = render(
    <RangeCalendar
      aria-label="Label"
      defaultValue={defaultValue}
      visibleDuration={VISIBLE_TWO}
    />,
  )
  const grids = view.getAllByRole('grid')
  const months = grids.at(-1)?.parentElement?.parentElement
  if (months == null || grids.length !== 2) {
    throw new Error('expected two months in one container')
  }
  const space =
    months.getBoundingClientRect().bottom -
    grids[1].getBoundingClientRect().bottom
  view.unmount()
  return space
}

// The height of a calendar showing two months from `defaultValue` on.
function stackedHeight(defaultValue: typeof RANGE) {
  const view = render(
    <RangeCalendar
      aria-label="Label"
      defaultValue={defaultValue}
      visibleDuration={VISIBLE_TWO}
    />,
  )
  const height = calendarBox(view).height
  view.unmount()
  return height
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

      // The modal date picker's range-selection container: the secondary
      // container, one step down from the primary the ends take.
      expect(middle.backgroundColor).toBe(probe(probeStyles.secondaryContainer))
      expect(middle.color).toBe(probe(probeStyles.onSecondaryContainer))
      expect(middle.backgroundColor).not.toBe(probe(probeStyles.primary))
    })

    // A day inside a range is one a reader presses to move an end, so it
    // answers the pointer. The layer is the modal date picker's range
    // selection token, on primary container over the band's own container.
    it('lays a state layer over the band while hovered or pressed', () => {
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )
      const middle = cellFor(view, 'September 11, 2026')
      const has = (style: stylex.StyleXStyles) =>
        classesOf(style).every((name) => middle.classList.contains(name))

      fireEvent.pointerOver(middle, { pointerType: 'mouse' })
      expect(has(bandLayers.hovered)).toBe(true)
      fireEvent.keyDown(middle, { key: ' ' })
      expect(has(bandLayers.pressed)).toBe(true)
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
    // The same menus Calendar draws, from the same prop, so a range calendar
    // moves a year on with one choice from the year list.
    it('draws the month and year menus Calendar does, and moves by them', async () => {
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          showMonthYearMenus
        />,
      )

      fireEvent.click(view.getByRole('button', { name: '2026 year' }))
      fireEvent.click(view.getByRole('option', { name: '2028' }))
      await nextFrame()

      expect(view.queryByRole('listbox')).toBeNull()
      expect(view.getByRole('grid')).toHaveAccessibleName(/September 2028/)
    })

    // The `Bounded` story rules weekends out to show a range stopping at one,
    // and until the cell drew something a reader could see it showed nothing
    // at all. A date inside the range that is ruled out has to be tellable
    // from the days either side of it.
    it('marks a date ruled out one at a time inside the range', () => {
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          isDateUnavailable={isTenth}
        />,
      )
      const unavailable = cellFor(view, 'September 10, 2026')
      const available = cellFor(view, 'September 11, 2026')

      expect(getComputedStyle(unavailable).textDecorationLine).toBe(
        'line-through',
      )
      expect(getComputedStyle(available).textDecorationLine).toBe('none')
    })

    // The disabled dates in GrayText under forced colours, as Calendar's
    // are: a range started on a date outside the bounds fails, and with
    // every date in CanvasText nothing said why.
    it('draws the dates it disables in GrayText under forced colours', () => {
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          minValue={new CalendarDate(2026, 9, 5)}
        />,
      )
      const outside = view.container.querySelector('[data-outside-month]')
      if (!(outside instanceof HTMLElement)) {
        throw new Error('expected a date from an adjacent month')
      }

      expect(forcedColourOf(cellFor(view, 'September 1, 2026'))).toBe(
        'graytext',
      )
      expect(forcedColourOf(outside)).toBe('graytext')
      expect(
        forcedColourOf(cellFor(view, 'September 16, 2026')),
      ).toBeUndefined()
    })

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

    // The room the grid is held at is the shared module's, so this asks the
    // same question calendar/index.test.tsx asks: a range calendar inside a
    // layout must not resize as its month moves.
    it('holds its height whatever the month is', () => {
      const four = render(
        <RangeCalendar aria-label="Label" defaultValue={FOUR_WEEK_RANGE} />,
      )
      const short = calendarBox(four).height
      four.unmount()

      const six = render(
        <RangeCalendar aria-label="Label" defaultValue={SIX_WEEK_RANGE} />,
      )

      expect(short).toBe(calendarBox(six).height)
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

  // Below the expanded breakpoint two months stack, and the heading between
  // the chevrons names them only together, so each month carries its own
  // name over its grid. 360 is a phone's width; 1280 sits past the expanded
  // breakpoint, where the two sit side by side under the one heading.
  describe('two months stacked', () => {
    afterAll(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it('names each month over its own grid', async () => {
      await page.viewport(PHONE, 900)
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          visibleDuration={VISIBLE_TWO}
        />,
      )
      const [first, second] = view
        .getAllByRole('grid')
        .map((grid) => grid.getBoundingClientRect())
      const september = view.getByText('September 2026')
      const october = view.getByText('October 2026')

      expect(september).toBeVisible()
      expect(october).toBeVisible()
      expect(september.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        first.top,
      )
      expect(october.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        first.bottom,
      )
      expect(october.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        second.top,
      )
    })

    it('names no month while the two sit side by side', async () => {
      await page.viewport(WIDE, 900)
      const view = render(
        <RangeCalendar
          aria-label="Label"
          defaultValue={RANGE}
          visibleDuration={VISIBLE_TWO}
        />,
      )

      expect(view.getByText('September 2026')).not.toBeVisible()
      expect(view.getByText('October 2026')).not.toBeVisible()
    })

    // The heading between the chevrons already names a month shown alone.
    it('adds no name to a month shown alone', async () => {
      await page.viewport(PHONE, 900)
      const view = render(
        <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
      )

      expect(view.getAllByText('September 2026')).toHaveLength(1)
    })

    // February 2026 runs four weeks and May six. Named, the month under each
    // starts right after its last week, rather than after six weeks of room
    // whatever the month held.
    it('starts the second month right after the first one ends', async () => {
      await page.viewport(PHONE, 900)
      const afterFour = spaceBetweenMonths(FOUR_WEEK_RANGE)

      expect(afterFour).toBe(spaceBetweenMonths(SIX_WEEK_RANGE))
      expect(afterFour).toBe(GAP + ROW)
    })

    // The stack takes the months' own heights, so it ends right after the
    // second month's last week whichever two show: February and March 2026
    // fill nine weeks, the fewest any two months do, and May and June 2026
    // eleven, the most.
    it('ends right after the last week of the months it shows', async () => {
      await page.viewport(PHONE, 900)

      expect(spaceUnderMonths(FOUR_WEEK_RANGE)).toBe(0)
      expect(spaceUnderMonths(SIX_WEEK_RANGE)).toBe(0)
    })

    it('grows by the weeks the months shown differ by', async () => {
      await page.viewport(PHONE, 900)
      const nine = stackedHeight(FOUR_WEEK_RANGE)

      expect(stackedHeight(SIX_WEEK_RANGE) - nine).toBe(ROW * 2)
    })

    // Side by side the two keep one month's six weeks of room, as a single
    // month does, so they page without moving the calendar's edge.
    it('holds its height side by side whatever the months are', async () => {
      await page.viewport(WIDE, 900)
      const short = stackedHeight(FOUR_WEEK_RANGE)

      expect(stackedHeight(SIX_WEEK_RANGE)).toBe(short)
    })
  })
})

// Storybook and the other specs share this browser, so the viewport goes
// back to something ordinary once the stacked cases are done.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

// The gap between two stacked months and the row a month's name sits in.
const GAP = 24
const ROW = 48

const PHONE = 360
const VISIBLE_TWO = { months: 2 }
const WIDE = 1280
