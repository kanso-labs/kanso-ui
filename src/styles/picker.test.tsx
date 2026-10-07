import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { afterAll, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import ColorPicker from '../components/color-picker'
import DatePicker from '../components/date-picker'
import DateRangePicker from '../components/date-range-picker'
import { CalendarDate } from '../date'
import { colors, shadows } from '../tokens/design.tokens.stylex'
import { atFootOfWindow, originOf } from './overlay.testing'

// One pixel either side of the medium breakpoint the three pickers swap at,
// so a query written with the wrong comparison fails here rather than passing
// on the round number both readings agree on.
const COMPACT = 599
const MEDIUM = 601

// Storybook and the other specs share this browser, so the viewport has to go
// back to something ordinary or whatever runs next inherits 599px.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

afterAll(async () => {
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

// The scrim role at the strength Sheet and Dialog paint it, resolved the way
// the page resolves it, so a case compares computed colour with computed
// colour.
const probeStyles = stylex.create({
  elevation2: { boxShadow: shadows.elevation2 },
  elevation3: { boxShadow: shadows.elevation3 },
  scrim: { color: `color-mix(in srgb, ${colors.scrim} 32%, transparent)` },
  surfaceContainerHigh: { backgroundColor: colors.surfaceContainerHigh },
})

// A surface's own elevation, which it casts at every width.
function elevation(level: 'elevation2' | 'elevation3') {
  const view = render(<span {...stylex.props(probeStyles[level])} />)
  const shadow = getComputedStyle(view.container.firstElementChild!).boxShadow
  view.unmount()
  return shadow
}

function scrimColour() {
  const view = render(<span {...stylex.props(probeStyles.scrim)} />)
  const colour = getComputedStyle(view.container.firstElementChild!).color
  view.unmount()
  return colour
}

// The surface each picker opens its content on, settled. React Aria nests a
// dialog inside it, so the surface is the dialog's parent.
//
// Its entry animation is finished before anything is read, and that is not
// a nicety. The animation drives `transform`, so while it runs it replaces
// whatever transform the surface rests with — a surface measured mid-entry
// is one that has not been placed yet. `finish()` jumps to the end at once,
// which is deterministic where waiting for it would not be.
function surfaceOf(element: ReactElement, container?: HTMLElement) {
  const view = render(element, { baseElement: document.body, container })
  const surface = view.getByRole('dialog').parentElement
  if (surface === null) {
    throw new Error('expected the dialog to sit on a surface')
  }
  for (const animation of surface.getAnimations()) {
    animation.finish()
  }
  return surface
}

// The three pickers share one surface style, which is the point: the swap
// from docked to modal is written once for all of them. The date pickers
// raise theirs to the docked container's level 3; the colour picker's stays
// at the menu surface's 2.
const PICKERS: ReadonlyArray<{
  element: ReactElement
  level: 'elevation2' | 'elevation3'
  name: string
}> = [
  {
    element: <DatePicker defaultOpen label="Label" />,
    level: 'elevation3',
    name: 'DatePicker',
  },
  {
    element: <DateRangePicker defaultOpen label="Label" />,
    level: 'elevation3',
    name: 'DateRangePicker',
  },
  {
    element: <ColorPicker defaultOpen defaultValue="#6750A4" label="Label" />,
    level: 'elevation2',
    name: 'ColorPicker',
  },
]

describe('a picker opened below the medium breakpoint', () => {
  // The date pickers page puts the picker in a dialog on a compact window,
  // and the dialogs page draws a dialog over a scrim — the same one Sheet
  // and Dialog paint.
  it.each(PICKERS)('dims the page behind $name', async ({ element, level }) => {
    await page.viewport(COMPACT, 900)
    const shadow = getComputedStyle(surfaceOf(element)).boxShadow

    expect(shadow).toContain(scrimColour())
    // The scrim is added to the surface's elevation rather than put in its
    // place, so the surface still lifts off the dimmed page.
    expect(shadow.startsWith(elevation(level))).toBe(true)
  })

  // A scrim that stopped at the surface's edge would dim nothing but a
  // ring. The spread has to reach past the viewport's longer side from
  // wherever the surface sits.
  it.each(PICKERS)(
    'reaches every edge of the window for $name',
    async ({ element }) => {
      await page.viewport(COMPACT, 900)
      const surface = surfaceOf(element)
      const box = surface.getBoundingClientRect()
      const spreads = [
        ...getComputedStyle(surface).boxShadow.matchAll(
          /(-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px/g,
        ),
      ].map((match) => Number.parseFloat(match[4]))
      const reach = Math.max(...spreads)

      expect(box.left - reach).toBeLessThanOrEqual(0)
      expect(box.top - reach).toBeLessThanOrEqual(0)
      expect(box.right + reach).toBeGreaterThanOrEqual(COMPACT)
      expect(box.bottom + reach).toBeGreaterThanOrEqual(900)
    },
  )
})

// The half the scrim depends on. React Aria positions a popover with inline
// `left`, `top` and `position`, which beat any class, so below the breakpoint
// the surface was placed by the field and then shifted by the centring
// transform — half its own size up and left, with most of the calendar off
// the screen. A scrim behind that would dim a page the picker cannot be used
// on.
describe('a picker opened below the medium breakpoint, placed', () => {
  it.each(PICKERS)('centres $name in the window', async ({ element }) => {
    await page.viewport(COMPACT, 900)
    const box = surfaceOf(element).getBoundingClientRect()

    expect(Math.abs(box.left + box.width / 2 - COMPACT / 2)).toBeLessThan(1)
    expect(Math.abs(box.top + box.height / 2 - 900 / 2)).toBeLessThan(1)
  })

  // Pinned to all four edges, a surface with no size of its own stretches to
  // fill them and is centred only in the sense that it covers everything.
  it.each(PICKERS)(
    'sizes $name to its content, not the window',
    async ({ element }) => {
      await page.viewport(COMPACT, 900)
      const box = surfaceOf(element).getBoundingClientRect()
      // What the surface may grow to: the window less 16 on each side.
      const room = 2 * 16

      expect(box.width).toBeLessThan(COMPACT - room)
      expect(box.height).toBeLessThan(900 - room)
    },
  )

  it.each(PICKERS)('keeps all of $name on the screen', async ({ element }) => {
    await page.viewport(COMPACT, 900)
    const box = surfaceOf(element).getBoundingClientRect()

    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.top).toBeGreaterThanOrEqual(0)
    expect(box.right).toBeLessThanOrEqual(COMPACT)
    expect(box.bottom).toBeLessThanOrEqual(900)
  })
})

describe('a picker opened at the medium breakpoint and above', () => {
  // Docked, the surface is React Aria's to place against what opened it.
  // The compact rules take the position from it with `!important`, and none
  // of that may reach a window this wide.
  it.each(PICKERS)('leaves React Aria to place $name', async ({ element }) => {
    await page.viewport(MEDIUM, 900)

    expect(getComputedStyle(surfaceOf(element)).position).toBe('absolute')
  })

  // Docked to its field, the picker is a menu-like surface rather than a
  // dialog, and a page dimmed behind a dropdown would be a modal nobody
  // asked for.
  it.each(PICKERS)(
    'leaves the page behind $name undimmed',
    async ({ element, level }) => {
      await page.viewport(MEDIUM, 900)

      // Its elevation and nothing else, as it was before the scrim existed.
      expect(getComputedStyle(surfaceOf(element)).boxShadow).toBe(
        elevation(level),
      )
    },
  )
})

// Docked, a surface grows out of its field from the edge it is anchored by,
// as every anchored overlay does: down from its top edge under the field, and
// up from its bottom edge when there is no room under the field and React Aria
// opens it above. Modal, it sits in the middle of the window anchored to
// nothing, so it grows from its own centre rather than from an edge facing a
// field it is no longer beside.
describe("where a picker's surface grows from", () => {
  it.each(PICKERS)(
    'grows $name down from its top edge under the field',
    async ({ element }) => {
      await page.viewport(MEDIUM, 900)
      const surface = surfaceOf(element)

      expect(surface.getAttribute('data-placement')).toBe('bottom')
      expect(originOf(surface).y).toBeCloseTo(0)
    },
  )

  it.each(PICKERS)(
    'grows $name up from its bottom edge above the field',
    async ({ element }) => {
      await page.viewport(MEDIUM, 900)
      const surface = surfaceOf(element, atFootOfWindow())

      expect(surface.getAttribute('data-placement')).toBe('top')
      expect(originOf(surface).y).toBeCloseTo(1)
    },
  )

  it.each(PICKERS)(
    'grows $name from its centre once it is modal',
    async ({ element }) => {
      await page.viewport(COMPACT, 900)
      const origin = originOf(surfaceOf(element))

      expect(origin.x).toBeCloseTo(0.5)
      expect(origin.y).toBeCloseTo(0.5)
    },
  )
})

// A date picker's surface is the calendar's own, the page's docked
// container: one fill and one corner, so the surface clips nothing of the
// calendar and no second surface shows at its corners.
describe("a date picker's surface", () => {
  it.each(PICKERS.slice(0, 2))(
    'takes the fill and the corner of the calendar in $name',
    async ({ element }) => {
      await page.viewport(MEDIUM, 900)
      const surface = surfaceOf(element)
      const calendar = surface.querySelector('[role="dialog"] > *')
      if (calendar === null) {
        throw new Error('expected a calendar inside the dialog')
      }
      const outer = getComputedStyle(surface)
      const inner = getComputedStyle(calendar)

      expect(outer.backgroundColor).toBe(inner.backgroundColor)
      expect(outer.borderTopLeftRadius).toBe(inner.borderTopLeftRadius)
      expect(outer.borderTopLeftRadius).toBe('16px')
    },
  )

  it('leaves the colour picker on the menu surface', async () => {
    await page.viewport(MEDIUM, 900)
    const surface = surfaceOf(
      <ColorPicker defaultOpen defaultValue="#6750A4" label="Label" />,
    )
    const probe = render(
      <span {...stylex.props(probeStyles.surfaceContainerHigh)} />,
    )
    const high = getComputedStyle(
      probe.container.firstElementChild!,
    ).backgroundColor
    probe.unmount()

    expect(getComputedStyle(surface).backgroundColor).not.toBe(high)
    expect(getComputedStyle(surface).borderTopLeftRadius).toBe('12px')
  })
})

// `visibleDuration` reaches each date picker's calendar, which draws its
// months side by side from the expanded breakpoint up and stacks them below
// it: two side by side come to 720 with the calendar's padding. One pixel
// either side of that breakpoint, as of the medium one above.
const BELOW_EXPANDED = 839
const EXPANDED = 841
const TWO_MONTHS = { months: 2 }

// Hoisted so it is one stable object, which is what react-perf's
// no-new-object-as-prop is after: a range in February 2026.
const FEBRUARY = {
  end: new CalendarDate(2026, 2, 5),
  start: new CalendarDate(2026, 2, 3),
}

const TWO_MONTH_PICKERS: ReadonlyArray<{
  element: ReactElement
  name: string
}> = [
  {
    element: (
      <DatePicker defaultOpen label="Label" visibleDuration={TWO_MONTHS} />
    ),
    name: 'DatePicker',
  },
  {
    element: (
      <DateRangePicker defaultOpen label="Label" visibleDuration={TWO_MONTHS} />
    ),
    name: 'DateRangePicker',
  },
]

// The month grids a surface holds, as their boxes.
function monthsIn(surface: HTMLElement) {
  return [...surface.querySelectorAll('[role="grid"]')].map((grid) =>
    grid.getBoundingClientRect(),
  )
}

describe('a date picker showing two months', () => {
  it.each(TWO_MONTH_PICKERS)(
    'draws the months of $name side by side from the expanded breakpoint',
    async ({ element }) => {
      await page.viewport(EXPANDED, 900)
      const [first, second, ...rest] = monthsIn(surfaceOf(element))

      expect(rest).toHaveLength(0)
      expect(second.top).toBe(first.top)
      expect(second.left).toBeGreaterThan(first.right)
    },
  )

  // Docked still, at a medium width, but with no room for both.
  it.each(TWO_MONTH_PICKERS)(
    'stacks the months of $name below it, inside the window',
    async ({ element }) => {
      await page.viewport(BELOW_EXPANDED, 900)
      const surface = surfaceOf(element)
      const [first, second] = monthsIn(surface)
      const box = surface.getBoundingClientRect()

      expect(second.left).toBe(first.left)
      expect(second.top).toBeGreaterThan(first.bottom)
      expect(box.right).toBeLessThanOrEqual(BELOW_EXPANDED)
    },
  )

  it.each(TWO_MONTH_PICKERS)(
    'stacks the months of $name once it is modal, inside the window',
    async ({ element }) => {
      await page.viewport(COMPACT, 900)
      const surface = surfaceOf(element)
      const [first, second] = monthsIn(surface)
      const box = surface.getBoundingClientRect()

      expect(second.left).toBe(first.left)
      expect(second.top).toBeGreaterThan(first.bottom)
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(COMPACT)
    },
  )

  // February 2026 runs four weeks and March five. Stacked, each month still
  // sits in six weeks of room, so March is where it would be under a
  // six-week February: the weekday row and six weeks of 40, then the gap.
  it('keeps the room of six weeks for each stacked month', async () => {
    await page.viewport(COMPACT, 900)
    const [first, second] = monthsIn(
      surfaceOf(
        <DateRangePicker
          defaultOpen
          defaultValue={FEBRUARY}
          label="Label"
          visibleDuration={TWO_MONTHS}
        />,
      ),
    )

    expect(first.height).toBe(200)
    expect(second.top - first.top).toBe(7 * 40 + 24)
  })
})
