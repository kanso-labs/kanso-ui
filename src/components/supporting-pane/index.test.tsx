import { render } from '@testing-library/react'
import { page } from '@vitest/browser/context'
import { afterAll, describe, expect, it } from 'vitest'

import SupportingPane from '.'

// One pixel either side of each Material 3 breakpoint, so a query written
// with the wrong comparison fails here rather than passing on a round number
// both readings agree on. M3's lower bounds: compact below 600, medium from
// 600, expanded from 840, large from 1200, extra-large from 1600.
const COMPACT = 500
const MEDIUM = 700
const EXPANDED = 900
const LARGE = 1300
const EXTRA_LARGE = 1700

// Storybook and the other specs share this browser, so the viewport has to go
// back to something ordinary or whatever runs next inherits 1700px.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

// The ratio is what M3 specifies, so it is what these assert. Comparing the
// resolved pixel widths against a fixed number instead would pin the viewport
// arithmetic rather than the spec, and would have to be rewritten every time
// the gutter moved.
const EXPANDED_RATIO = 2
const RATIO_TOLERANCE = 0.02

// Hoisted so it is one stable element per render rather than a fresh one,
// which is what react-perf's no-jsx-as-prop is after.
const MAIN = <main />

const PANES = { main: 'Main pane', supporting: 'Supporting pane' }

async function columnsAt(width: number) {
  await page.viewport(width, 900)
  const view = render(<SupportingPane {...PANES} />)
  const root = view.container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the layout to render an element')
  }
  const columns = getComputedStyle(root)
    .gridTemplateColumns.split(' ')
    .map(Number.parseFloat)
  view.unmount()
  return columns
}

afterAll(async () => {
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

describe('proportions across the breakpoints', () => {
  // M3's compact treatment is reflow: the supporting pane moves under the
  // main one rather than being dismissed, so it stays reachable by scrolling.
  it('stacks into a single column at compact', async () => {
    expect(await columnsAt(COMPACT)).toHaveLength(1)
  })

  it('splits evenly at medium', async () => {
    const [main, supporting] = await columnsAt(MEDIUM)

    expect(main).toBeCloseTo(supporting, 1)
  })

  it('gives the main pane two thirds from expanded up', async () => {
    for (const width of [EXPANDED, LARGE, EXTRA_LARGE]) {
      // The window has one width, so resizing is sequential by nature and
      // cannot be raced with Promise.all the way the rule assumes.
      // oxlint-disable-next-line no-await-in-loop -- inherently sequential
      const [main, supporting] = await columnsAt(width)

      expect(main / supporting).toBeCloseTo(EXPANDED_RATIO, RATIO_TOLERANCE)
    }
  })

  // Guards the two assertions above against agreeing by accident: an even
  // split is not a two-thirds one, so a single rule serving both breakpoints
  // would have to fail one of them.
  it('is a different shape at medium than at expanded', async () => {
    const [mediumMain, mediumSupporting] = await columnsAt(MEDIUM)
    const [expandedMain, expandedSupporting] = await columnsAt(EXPANDED)

    expect(mediumMain / mediumSupporting).not.toBeCloseTo(
      expandedMain / expandedSupporting,
      RATIO_TOLERANCE,
    )
  })
})

describe('panes', () => {
  // Both panes are on screen at every width — unlike list-detail, the
  // supporting content means nothing on its own, so there is no state that
  // would hide one of them.
  it('keeps both panes present at every breakpoint', async () => {
    for (const width of [COMPACT, MEDIUM, EXPANDED, LARGE, EXTRA_LARGE]) {
      // The window has one width, so resizing is sequential by nature and
      // cannot be raced with Promise.all the way the rule assumes.
      // oxlint-disable-next-line no-await-in-loop -- inherently sequential
      await page.viewport(width, 900)
      const view = render(<SupportingPane {...PANES} />)

      expect(view.getByText('Main pane')).toBeVisible()
      expect(view.getByText('Supporting pane')).toBeVisible()
      view.unmount()
    }
  })

  // Each pane is wrapped in an element of its own. Dropped straight into the
  // grid, multi-element content would be spread across a track per child, so
  // this pane of two would make the layout three columns wide at medium and
  // the proportions would stop meaning anything.
  it('keeps a pane of several elements to a single track', async () => {
    await page.viewport(MEDIUM, 900)
    const view = render(
      <SupportingPane
        main={
          <>
            <h2>Headline</h2>
            <p>Supporting line</p>
          </>
        }
        supporting="Supporting pane"
      />,
    )
    const root = view.container.firstElementChild
    if (!(root instanceof HTMLElement)) {
      throw new Error('expected the layout to render an element')
    }

    expect(getComputedStyle(root).gridTemplateColumns.split(' ')).toHaveLength(
      2,
    )
    expect(root.children).toHaveLength(2)
  })

  // M3 asks that focus order match the arrangement on screen for co-planar
  // panes, and it is also what puts the supporting pane *below* the main one
  // when the layout stacks.
  it('writes the main pane before the supporting one', () => {
    const view = render(<SupportingPane {...PANES} />)
    const root = view.container.firstElementChild

    expect(root?.textContent).toBe('Main paneSupporting pane')
  })
})

describe('element', () => {
  it('renders a div by default', () => {
    const view = render(<SupportingPane {...PANES} />)

    expect(view.container.firstElementChild?.tagName).toBe('DIV')
  })

  it('renders the element given to `render` instead', () => {
    const view = render(<SupportingPane {...PANES} render={MAIN} />)

    expect(view.getByRole('main')).toBeInTheDocument()
  })
})
