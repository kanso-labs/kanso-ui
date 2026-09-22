import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { afterAll, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import ColorPicker from '../components/color-picker'
import DatePicker from '../components/date-picker'
import DateRangePicker from '../components/date-range-picker'
import { colors, shadows } from '../tokens/design.tokens.stylex'

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
  elevation: { boxShadow: shadows.elevation2 },
  scrim: { color: `color-mix(in srgb, ${colors.scrim} 32%, transparent)` },
})

// The surface's own elevation, which it casts at every width.
function elevation() {
  const view = render(<span {...stylex.props(probeStyles.elevation)} />)
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

// The surface each picker opens its content on. React Aria nests a dialog
// inside it, so the surface is the dialog's parent.
function surfaceOf(element: ReactElement) {
  const view = render(element)
  const surface = view.getByRole('dialog').parentElement
  if (surface === null) {
    throw new Error('expected the dialog to sit on a surface')
  }
  return surface
}

// The three pickers share one surface style, which is the point: the swap
// from docked to modal is written once for all of them.
const PICKERS: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <DatePicker defaultOpen label="Label" />, name: 'DatePicker' },
  {
    element: <DateRangePicker defaultOpen label="Label" />,
    name: 'DateRangePicker',
  },
  {
    element: <ColorPicker defaultOpen defaultValue="#6750A4" label="Label" />,
    name: 'ColorPicker',
  },
]

describe('a picker opened below the medium breakpoint', () => {
  // The date pickers page puts the picker in a dialog on a compact window,
  // and the dialogs page draws a dialog over a scrim — the same one Sheet
  // and Dialog paint.
  it.each(PICKERS)('dims the page behind $name', async ({ element }) => {
    await page.viewport(COMPACT, 900)
    const shadow = getComputedStyle(surfaceOf(element)).boxShadow

    expect(shadow).toContain(scrimColour())
    // The scrim is added to the surface's elevation rather than put in its
    // place, so the surface still lifts off the dimmed page.
    expect(shadow.startsWith(elevation())).toBe(true)
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

describe('a picker opened at the medium breakpoint and above', () => {
  // Docked to its field, the picker is a menu-like surface rather than a
  // dialog, and a page dimmed behind a dropdown would be a modal nobody
  // asked for.
  it.each(PICKERS)(
    'leaves the page behind $name undimmed',
    async ({ element }) => {
      await page.viewport(MEDIUM, 900)

      // Its elevation and nothing else, as it was before the scrim existed.
      expect(getComputedStyle(surfaceOf(element)).boxShadow).toBe(elevation())
    },
  )
})
