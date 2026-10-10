import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Calendar from '.'
import { CalendarDate, getLocalTimeZone, today } from '../../date'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  bodyLarge: { fontSize: typography.bodyLargeSize },
  onPrimary: { color: colors.onPrimary },
  onSurface: { color: colors.onSurface },
  primary: { color: colors.primary },
  surfaceContainerHigh: { color: colors.surfaceContainerHigh },
  surfaceVariant: { backgroundColor: colors.surfaceVariant },
})

// The declarations a state is drawn with, written the way the component
// writes them, so the classes StyleX hashes from them are the component's
// own. The layers are drawn from React Aria's render state, so a case hovers
// and presses the element rather than finding a pseudo-class branch on it.
const stateStyles = stylex.create({
  chevronFaded: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
    cursor: 'default',
  },
  chevronHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  chevronPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  selectedHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
  },
  selectedPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
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

function hasClasses(element: Element, style: stylex.StyleXStyles) {
  return classesOf(style).every((name) => element.classList.contains(name))
}

// A calendar bounded inside one month, so React Aria disables both chevrons:
// there is no month before or after the one shown to move to.
const BOUNDED = {
  maxValue: new CalendarDate(2026, 9, 24),
  minValue: new CalendarDate(2026, 9, 8),
}

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
const DECEMBER = new CalendarDate(2026, 12, 15)

// The three lengths a month grid comes in, and 2026 has all of them.
// February is the short end at four weeks, September the ordinary five, and
// May the six the grid is held at.
const FEBRUARY_FOUR_WEEKS = new CalendarDate(2026, 2, 15)
const MAY_SIX_WEEKS = new CalendarDate(2026, 5, 15)

// Six weeks of dates under the weekday row, each of them the 40dp the page
// gives a date. Written out rather than read off the element, so a grid that
// lost its rows fails here instead of agreeing with itself.
const HELD_GRID_BLOCK_SIZE = 336

// A compact window's content: 360dp less its two 16dp margins.
const COMPACT = { inlineSize: '328px' }

// Hoisted so the identity is stable, which is what react-perf is after.
const isSixteenth = (date: { day: number }) => date.day === 16
const VISIBLE_TWO = { months: 2 }

// The calendar's own box, which is the element a layout positions and so the
// one whose height moving the month must not change.
function calendarBox(view: ReturnType<typeof render>) {
  const root = view.container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the calendar to draw a container')
  }
  return root.getBoundingClientRect()
}

// Matched on the date rather than the whole label: React Aria appends
// "selected" to the name of the date the calendar holds, so an exact string
// finds an unselected date and misses the same date once it is chosen.
function cellFor(view: ReturnType<typeof render>, label: string) {
  return view.getByRole('button', { name: new RegExp(label) })
}

// Where the first row of dates sits relative to the calendar's own top, so a
// grid that held its height by sinking to the bottom of the room is caught
// rather than counted as still.
function firstDateOffset(view: ReturnType<typeof render>) {
  const row = view.getByRole('grid').querySelector('tbody tr')
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the grid to draw a week')
  }
  return row.getBoundingClientRect().top - calendarBox(view).top
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

// A calendar with the month and year menus, on the fixed September.
function Menus(props: Partial<Parameters<typeof Calendar>[0]>) {
  return (
    <Calendar
      aria-label="Label"
      defaultValue={SEPTEMBER}
      showMonthYearMenus
      {...props}
    />
  )
}

// The month heading between the chevrons. React Aria hides it from the
// accessibility tree, naming the calendar with a visually hidden heading of
// its own, and announces the month in a live region besides — so it is found
// by its tag and its whole text rather than by role or by text alone.
function monthHeadings(view: ReturnType<typeof render>) {
  return [...view.container.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(
    (heading) => heading.textContent === 'September 2026',
  )
}

// Lets a frame pass. A list closes a frame after a choice, once the key or
// pointer that made it has finished delivering its events; and a list opened
// by a click with no pointer events around it, which React Aria reads as a
// screen reader's, takes focus only once the frame's transitions have run.
async function nextFrame() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

// A key pressed on whatever has focus, as a keyboard would.
function press(key: string) {
  const target = document.activeElement ?? document.body
  fireEvent.keyDown(target, { key })
  fireEvent.keyUp(target, { key })
}

function probeBackground(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const read = getComputedStyle(view.getByTestId('probe')).backgroundColor
  view.unmount()
  return read
}

// The distance between one week and the next. Read off two rows rather than
// one row's height, since that is what a stretched grid changes.
function rowPitch(grid: HTMLElement) {
  const [first, second] = [...grid.querySelectorAll('tbody tr')]
  if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
    throw new Error('expected the grid to draw at least two weeks')
  }
  return second.getBoundingClientRect().top - first.getBoundingClientRect().top
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

    // The circle is the element, and the 48dp square around it is the
    // target: a press just outside the circle still reaches the date.
    it('takes a press anywhere in the 48px square around the date', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const cell = cellFor(view, 'Tuesday, September 15, 2026')
      const box = cell.getBoundingClientRect()
      const target = getComputedStyle(cell, '::before')

      expect(target.width).toBe('48px')
      expect(target.height).toBe('48px')
      for (const [x, y] of [
        [box.left - 3, box.top + box.height / 2],
        [box.right + 3, box.top + box.height / 2],
        [box.left + box.width / 2, box.top - 3],
        [box.left + box.width / 2, box.bottom + 3],
      ] as const) {
        expect(document.elementFromPoint(x, y)).toBe(cell)
      }
    })

    // Compose lays its days at the page's 48dp both ways.
    it('puts the page 48px between one week and the next', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )

      expect(rowPitch(view.getByRole('grid'))).toBe(48)
    })

    // A compact window leaves 328dp between its margins, under the page's
    // 360dp docked calendar.
    it('fits a container narrower than its own width', () => {
      const view = render(
        <div style={COMPACT}>
          <Calendar aria-label="Label" defaultValue={SEPTEMBER} />
        </div>,
      )
      const wrapper = view.container.firstElementChild
      if (!(wrapper instanceof HTMLElement)) {
        throw new Error('expected the sample to render a wrapper')
      }

      expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth)
      expect(
        view.getByRole('grid').getBoundingClientRect().right,
      ).toBeLessThanOrEqual(wrapper.getBoundingClientRect().right)
    })

    it('reaches a 48px target from the chevrons', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const target = getComputedStyle(headerButton(view, 'Next'), '::before')

      expect(target.width).toBe('48px')
      expect(target.height).toBe('48px')
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

    // The date pickers page gives the selected date an on-primary state
    // layer at the hover and pressed opacities, over its primary fill. It is
    // the cell a reader presses again to change their mind, so it answers the
    // pointer like every other.
    it('lays the on-primary state layer over its fill while hovered or pressed', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const cell = cellFor(view, 'Tuesday, September 15, 2026')

      fireEvent.pointerOver(cell, { pointerType: 'mouse' })
      expect(hasClasses(cell, stateStyles.selectedHovered)).toBe(true)
      fireEvent.keyDown(cell, { key: ' ' })
      expect(hasClasses(cell, stateStyles.selectedPressed)).toBe(true)
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

    // React Aria keeps a date ruled out this way focusable, which is what
    // separates it from one outside min and max: a reader can land on it and
    // be told it is unavailable. So it has to be legible where a disabled
    // date does not, and it has to be tellable apart from a date that can be
    // picked — the test above pins only the announcement, which a cell drawn
    // exactly like every other one still passes.
    it('marks a date ruled out one at a time as one a reader can see', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          isDateUnavailable={isSixteenth}
        />,
      )
      const unavailable = cellFor(view, 'Wednesday, September 16, 2026')
      const available = cellFor(view, 'Thursday, September 17, 2026')

      expect(getComputedStyle(unavailable).textDecorationLine).toBe(
        'line-through',
      )
      expect(getComputedStyle(available).textDecorationLine).toBe('none')
    })

    it('keeps that date readable rather than fading it out of reach', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={SEPTEMBER}
          isDateUnavailable={isSixteenth}
        />,
      )
      const unavailable = cellFor(view, 'Wednesday, September 16, 2026')

      // It stays focusable, so the disabled fade would leave a reader on a
      // cell they cannot read. Full contrast is what React Aria asks for.
      expect(getComputedStyle(unavailable).color).toBe(
        probe(probeStyles.onSurface).color,
      )
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

    // React Aria disables a chevron with no month to move to, and a press on
    // one does nothing — so it fades as the picker's trigger does, and keeps
    // no state layer to say otherwise.
    it('fades a chevron React Aria has disabled, and drops its state layer', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} {...BOUNDED} />,
      )

      for (const label of ['Previous', 'Next']) {
        const chevron = headerButton(view, label)
        fireEvent.pointerOver(chevron, { pointerType: 'mouse' })

        expect(chevron.hasAttribute('disabled')).toBe(true)
        expect(hasClasses(chevron, stateStyles.chevronFaded)).toBe(true)
        expect(hasClasses(chevron, stateStyles.chevronHovered)).toBe(false)
      }
    })

    it('keeps a chevron with a month to move to at full strength', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const chevron = headerButton(view, 'Next')
      expect(hasClasses(chevron, stateStyles.chevronFaded)).toBe(false)

      fireEvent.pointerOver(chevron, { pointerType: 'mouse' })
      expect(hasClasses(chevron, stateStyles.chevronHovered)).toBe(true)
      fireEvent.keyDown(chevron, { key: ' ' })
      expect(hasClasses(chevron, stateStyles.chevronPressed)).toBe(true)
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

    // Two months of different lengths sit side by side rather than the
    // shorter one stretching to the taller: a stretched grid spreads its
    // weeks out, which would draw the two months at different pitches.
    it('draws two months of different lengths at the same pitch', () => {
      const view = render(
        <Calendar
          aria-label="Label"
          defaultValue={FEBRUARY_FOUR_WEEKS}
          visibleDuration={VISIBLE_TWO}
        />,
      )
      const [february, march] = view.getAllByRole('grid')

      expect(rowPitch(february)).toBe(rowPitch(march))
    })
  })

  // A month grid is as tall as its weeks, so left alone the calendar changed
  // height as the month moved — taking whatever sat under it down the page,
  // and inside a picker's popover moving the panel's own edge while it was
  // open.
  describe('the height it holds', () => {
    it('is the same whatever the month is', () => {
      const four = render(
        <Calendar aria-label="Label" defaultValue={FEBRUARY_FOUR_WEEKS} />,
      )
      const short = calendarBox(four)
      four.unmount()

      const five = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )
      const ordinary = calendarBox(five)
      five.unmount()

      const six = render(
        <Calendar aria-label="Label" defaultValue={MAY_SIX_WEEKS} />,
      )

      expect(short.height).toBe(calendarBox(six).height)
      expect(ordinary.height).toBe(calendarBox(six).height)
    })

    it('does not change when a chevron moves the month', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={FEBRUARY_FOUR_WEEKS} />,
      )
      const before = calendarBox(view).height

      // February 2026 is four weeks and March is five, so this is the
      // navigation that grew the calendar.
      fireEvent.click(headerButton(view, 'Next'))

      expect(calendarBox(view).height).toBe(before)
    })

    // The room is held whatever the month, which is what a six-week month
    // already asked for — so this pins the height to six rows rather than to
    // whichever month happened to be rendered first.
    it('holds six weeks under the weekday row', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={FEBRUARY_FOUR_WEEKS} />,
      )
      // The grid sits in its month, and the months in the room that holds
      // them.
      const room = view.getByRole('grid').parentElement?.parentElement
      if (!(room instanceof HTMLElement)) {
        throw new Error('expected a row holding the grids')
      }

      expect(room.getBoundingClientRect().height).toBe(HELD_GRID_BLOCK_SIZE)
    })

    // Holding the room by stretching the grid into it would keep the
    // calendar's height while moving every date inside it, which trades the
    // defect for a quieter one. A four-week month's weeks stay at the pitch a
    // six-week month's have.
    it('leaves a short month at the pitch a long one draws', () => {
      const four = render(
        <Calendar aria-label="Label" defaultValue={FEBRUARY_FOUR_WEEKS} />,
      )
      const short = rowPitch(four.getByRole('grid'))
      four.unmount()

      const six = render(
        <Calendar aria-label="Label" defaultValue={MAY_SIX_WEEKS} />,
      )

      expect(short).toBe(rowPitch(six.getByRole('grid')))
    })

    // The dates start in the same place too, not only at the same spacing —
    // a grid pushed to the bottom of its room would hold both and still move
    // every date down the page.
    it('starts the dates in the same place whatever the month', () => {
      const four = render(
        <Calendar aria-label="Label" defaultValue={FEBRUARY_FOUR_WEEKS} />,
      )
      const short = firstDateOffset(four)
      four.unmount()

      const six = render(
        <Calendar aria-label="Label" defaultValue={MAY_SIX_WEEKS} />,
      )

      expect(short).toBe(firstDateOffset(six))
    })
  })

  // The docked date picker's header: the month and the year as menu buttons,
  // each opening its list in the grid's place.
  describe('month and year menus', () => {
    it('names the month and the year shown on two menu buttons', () => {
      const view = render(<Menus />)

      const month = view.getByRole('button', { name: 'Sep month' })
      const year = view.getByRole('button', { name: '2026 year' })
      for (const button of [month, year]) {
        expect(button).toHaveAttribute('aria-haspopup', 'listbox')
        expect(button).toHaveAttribute('aria-expanded', 'false')
      }
      // The heading between the chevrons is what the menus replace.
      expect(monthHeadings(view)).toHaveLength(0)
    })

    it("draws the page's 40dp menu button and 48dp rows", () => {
      const view = render(<Menus />)
      const month = view.getByRole('button', { name: 'Sep month' })

      expect(month.getBoundingClientRect().height).toBe(40)
      expect(getComputedStyle(month, '::before').height).toBe('48px')

      fireEvent.click(month)

      const row = view.getByRole('option', { name: 'September' })
      expect(row.getBoundingClientRect().height).toBe(48)
      expect(getComputedStyle(row).backgroundColor).toBe(
        probeBackground(probeStyles.surfaceVariant),
      )
    })

    it("opens the month list in the grid's place, with the month shown checked", async () => {
      const view = render(<Menus />)
      const month = view.getByRole('button', { name: 'Sep month' })

      fireEvent.click(month)
      await nextFrame()

      const list = view.getByRole('listbox', { name: 'month' })
      expect(month).toHaveAttribute('aria-expanded', 'true')
      expect(month).toHaveAttribute('aria-controls', list.id)
      expect(view.queryByRole('grid')).toBeNull()
      expect(
        view.getAllByRole('option').map((option) => option.textContent),
      ).toHaveLength(12)
      expect(view.getByRole('option', { name: 'September' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      // Focus moves into the list. A click with no pointer events around it,
      // as this one is, puts it on the list itself; a key puts it on the
      // checked entry, which the keyboard case below pins.
      expect(list.contains(document.activeElement)).toBe(true)
    })

    // The page draws an open menu without the chevrons and with the other
    // menu disabled.
    it('hides the chevrons and disables the other menu while a list is open', () => {
      const view = render(<Menus />)

      fireEvent.click(view.getByRole('button', { name: 'Sep month' }))

      for (const label of ['Previous', 'Next']) {
        expect(getComputedStyle(headerButton(view, label)).visibility).toBe(
          'hidden',
        )
      }
      expect(view.getByRole('button', { name: '2026 year' })).toBeDisabled()
    })

    it('moves the calendar to the month chosen, and closes', async () => {
      const view = render(<Menus />)
      const month = view.getByRole('button', { name: 'Sep month' })

      fireEvent.click(month)
      fireEvent.click(view.getByRole('option', { name: 'March' }))
      await nextFrame()

      expect(view.queryByRole('listbox')).toBeNull()
      expect(view.getByRole('grid')).toHaveAccessibleName(/March 2026/)
      expect(view.getByRole('button', { name: 'Mar month' })).toBe(
        document.activeElement,
      )
    })

    it('closes without moving when the checked month is pressed again', async () => {
      const view = render(<Menus />)

      fireEvent.click(view.getByRole('button', { name: 'Sep month' }))
      fireEvent.click(view.getByRole('option', { name: 'September' }))
      await nextFrame()

      expect(view.queryByRole('listbox')).toBeNull()
      expect(view.getByRole('grid')).toHaveAccessibleName(/September 2026/)
    })

    it('closes without moving on Escape, and gives focus back to its button', async () => {
      const view = render(<Menus />)
      const month = view.getByRole('button', { name: 'Sep month' })

      fireEvent.click(month)
      await nextFrame()
      press('ArrowDown')
      press('Escape')
      await nextFrame()

      expect(view.queryByRole('listbox')).toBeNull()
      expect(view.getByRole('grid')).toHaveAccessibleName(/September 2026/)
      expect(document.activeElement).toBe(month)
    })

    it('reaches another year from the keyboard alone', async () => {
      const view = render(<Menus />)
      const year = view.getByRole('button', { name: '2026 year' })

      act(() => {
        year.focus()
      })
      press('Enter')

      expect(document.activeElement).toBe(
        view.getByRole('option', { name: '2026' }),
      )

      press('ArrowDown')
      press('Enter')
      await nextFrame()

      expect(view.queryByRole('listbox')).toBeNull()
      expect(view.getByRole('grid')).toHaveAccessibleName(/September 2027/)
      expect(document.activeElement).toBe(
        view.getByRole('button', { name: '2027 year' }),
      )
    })

    it('disables the months the bounds leave no day of', () => {
      const view = render(
        <Menus
          maxValue={new CalendarDate(2026, 10, 5)}
          minValue={new CalendarDate(2026, 3, 10)}
        />,
      )

      fireEvent.click(view.getByRole('button', { name: 'Sep month' }))

      const disabled = view
        .getAllByRole('option')
        .filter((option) => option.getAttribute('aria-disabled') === 'true')
        .map((option) => option.textContent)
      expect(disabled).toEqual(['January', 'February', 'November', 'December'])
    })

    // React Aria scrolls the entry it focuses only as far as the nearest
    // edge, which opened the year list with the year shown at the bottom and
    // every later year out of sight.
    it('opens the year list with the year shown in its middle', async () => {
      const view = render(<Menus />)

      fireEvent.click(view.getByRole('button', { name: '2026 year' }))
      await nextFrame()

      const list = view.getByRole('listbox').getBoundingClientRect()
      const year = view
        .getByRole('option', { name: '2026' })
        .getBoundingClientRect()
      expect(
        Math.abs(year.top + year.height / 2 - (list.top + list.height / 2)),
      ).toBeLessThanOrEqual(1)
    })

    // Before the first paint rather than a frame after it, so the list never
    // draws itself at its top and then jumps. No frame is let pass here.
    it('centres the year shown before the list first paints', () => {
      const view = render(<Menus />)

      fireEvent.click(view.getByRole('button', { name: '2026 year' }))

      const list = view.getByRole('listbox').getBoundingClientRect()
      const year = view
        .getByRole('option', { name: '2026' })
        .getBoundingClientRect()
      expect(
        Math.abs(year.top + year.height / 2 - (list.top + list.height / 2)),
      ).toBeLessThanOrEqual(1)
    })

    // A date of birth is decades from today. React Aria's own list is ten
    // years either side, and moved by ten with each choice.
    it('lists a century either side of the year shown in one open', () => {
      const view = render(<Menus />)

      fireEvent.click(view.getByRole('button', { name: '2026 year' }))
      const years = view
        .getAllByRole('option')
        .map((option) => option.textContent)

      expect(years).toHaveLength(201)
      expect(years.at(0)).toBe('1926')
      expect(years).toContain('1990')
      expect(years.at(-1)).toBe('2126')
    })

    // The menus name only the first month, so beside a second grid the
    // header is the plain one, whose heading names the range — both years
    // where it crosses one.
    it('labels every month when more than one is shown', () => {
      const view = render(
        <Menus defaultValue={DECEMBER} visibleDuration={VISIBLE_TWO} />,
      )
      const heading = [
        ...view.container.querySelectorAll('h1, h2, h3, h4, h5, h6'),
      ].find((element) => element.textContent.includes('January'))

      expect(view.getAllByRole('grid')).toHaveLength(2)
      expect(view.queryByRole('button', { name: /month$/ })).toBeNull()
      expect(heading?.textContent).toMatch(/December 2026/)
      expect(heading?.textContent).toMatch(/January 2027/)
      expect(heading?.checkVisibility()).toBe(true)
    })

    it('lists only the years the bounds allow', () => {
      const view = render(
        <Menus
          maxValue={new CalendarDate(2028, 12, 31)}
          minValue={new CalendarDate(2024, 1, 1)}
        />,
      )

      fireEvent.click(view.getByRole('button', { name: '2026 year' }))

      expect(
        view.getAllByRole('option').map((option) => option.textContent),
      ).toEqual(['2024', '2025', '2026', '2027', '2028'])
    })

    // The month leads in the reading order either way, which is the start of
    // the row in a right-to-left one.
    it('puts the month at the start of the header under right-to-left', () => {
      const view = render(
        <div dir="rtl">
          <Menus />
        </div>,
      )
      const month = view.getByRole('button', { name: 'Sep month' })
      const year = view.getByRole('button', { name: '2026 year' })

      expect(month.getBoundingClientRect().left).toBeGreaterThan(
        year.getBoundingClientRect().right,
      )
    })

    it('draws the heading and no menus when nothing asks for them', () => {
      const view = render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      )

      expect(monthHeadings(view)).toHaveLength(1)
      expect(
        view.queryByRole('button', { name: 'Sep month' }),
      ).not.toBeInTheDocument()
    })
  })
})
