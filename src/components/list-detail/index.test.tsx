import { render } from '@testing-library/react'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import ListDetail from '.'

// One pixel either side of each Material 3 breakpoint, so a query written
// with the wrong comparison fails here rather than passing on a round number
// that both readings agree on. The lower bounds are M3's own: compact below
// 600, medium from 600, expanded from 840, large from 1200, extra-large from
// 1600.
const COMPACT = 500
const MEDIUM = 700
const EXPANDED = 900
const LARGE = 1300
const EXTRA_LARGE = 1700

// Storybook and the other specs share this browser, so the viewport has to go
// back to something ordinary or whatever runs next inherits 1700px.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

/** The resolved `grid-template-columns`, which is what the layout comes down to. */
function columnsOf(container: HTMLElement) {
  const root = container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the layout to render an element')
  }
  return getComputedStyle(root).gridTemplateColumns
}

async function renderAt(width: number, element: Parameters<typeof render>[0]) {
  await page.viewport(width, 900)
  return render(element)
}

/** How many of the two panes are actually laid out at this width. */
function visiblePanes(container: HTMLElement) {
  const root = container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the layout to render an element')
  }
  return [...root.children].filter(
    (pane) => getComputedStyle(pane).display !== 'none',
  ).length
}

// Hoisted so it is one stable element per render rather than a fresh one,
// which is what react-perf's no-jsx-as-prop is after.
const MAIN = <main />

const PANES = { detail: 'Detail pane', list: 'List pane' }

afterAll(async () => {
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

describe('panes across the breakpoints', () => {
  // M3 puts one pane on screen at compact and medium, and two from expanded
  // up. Measured rather than inferred from the class list, because StyleX
  // decides the order the overlapping min-width queries are emitted in and
  // that ordering is what makes the wider rule win.
  it('shows one pane below expanded', async () => {
    for (const width of [COMPACT, MEDIUM]) {
      // The window has one width, so resizing is sequential by nature and
      // cannot be raced with Promise.all the way the rule assumes.
      // oxlint-disable-next-line no-await-in-loop -- inherently sequential
      const view = await renderAt(width, <ListDetail {...PANES} />)

      expect(visiblePanes(view.container)).toBe(1)
      expect(columnsOf(view.container).split(' ')).toHaveLength(1)
      view.unmount()
    }
  })

  it('shows both panes from expanded up', async () => {
    for (const width of [EXPANDED, LARGE, EXTRA_LARGE]) {
      // The window has one width, so resizing is sequential by nature and
      // cannot be raced with Promise.all the way the rule assumes.
      // oxlint-disable-next-line no-await-in-loop -- inherently sequential
      const view = await renderAt(width, <ListDetail {...PANES} />)

      expect(visiblePanes(view.container)).toBe(2)
      expect(columnsOf(view.container).split(' ')).toHaveLength(2)
      view.unmount()
    }
  })

  // M3's recommended snap widths for a fixed pane. The list takes the fixed
  // track and the detail pane absorbs the rest, which is the spec's rule that
  // every layout carry at least one flexible pane.
  it('gives the list pane 360px at expanded and large', async () => {
    for (const width of [EXPANDED, LARGE]) {
      // The window has one width, so resizing is sequential by nature and
      // cannot be raced with Promise.all the way the rule assumes.
      // oxlint-disable-next-line no-await-in-loop -- inherently sequential
      const view = await renderAt(width, <ListDetail {...PANES} />)

      expect(columnsOf(view.container).startsWith('360px')).toBe(true)
      view.unmount()
    }
  })

  it('widens the list pane to 412px at extra-large', async () => {
    const view = await renderAt(EXTRA_LARGE, <ListDetail {...PANES} />)

    expect(columnsOf(view.container).startsWith('412px')).toBe(true)
  })

  it('leaves the detail pane wider than the list it sits beside', async () => {
    const view = await renderAt(EXPANDED, <ListDetail {...PANES} />)
    const [list, detail] = columnsOf(view.container)
      .split(' ')
      .map(Number.parseFloat)

    expect(detail).toBeGreaterThan(list)
  })
})

describe('showing', () => {
  beforeEach(async () => {
    await page.viewport(COMPACT, 900)
  })

  it('shows the list by default', () => {
    const view = render(<ListDetail {...PANES} />)

    expect(view.getByText('List pane')).toBeVisible()
    expect(view.queryByText('Detail pane')).not.toBeVisible()
  })

  it('swaps to the detail when asked', () => {
    const view = render(<ListDetail {...PANES} showing="detail" />)

    expect(view.getByText('Detail pane')).toBeVisible()
    expect(view.queryByText('List pane')).not.toBeVisible()
  })

  // display:none rather than a visual-only hide, so a pane the window has no
  // room for is out of the accessibility tree too.
  it('takes the hidden pane out of the accessibility tree', () => {
    const view = render(<ListDetail {...PANES} showing="detail" />)
    const hidden = view.getByText('List pane')

    expect(getComputedStyle(hidden).display).toBe('none')
  })

  it('is ignored once both panes fit', async () => {
    await page.viewport(EXPANDED, 900)
    const view = render(<ListDetail {...PANES} showing="detail" />)

    expect(view.getByText('List pane')).toBeVisible()
    expect(view.getByText('Detail pane')).toBeVisible()
  })
})

describe('element', () => {
  it('renders a div by default', () => {
    const view = render(<ListDetail {...PANES} />)

    expect(view.container.firstElementChild?.tagName).toBe('DIV')
  })

  it('renders the element given to `render` instead', () => {
    const view = render(<ListDetail {...PANES} render={MAIN} />)

    expect(view.getByRole('main')).toBeInTheDocument()
  })

  // M3 asks that focus order match the arrangement on screen for co-planar
  // panes, which for a left-to-right grid means the list has to come first in
  // the DOM rather than being placed by grid-column.
  it('writes the panes in the order they are shown', async () => {
    await page.viewport(EXPANDED, 900)
    const view = render(<ListDetail {...PANES} />)
    const root = view.container.firstElementChild

    expect(root?.children[0]?.textContent).toBe('List pane')
    expect(root?.children[1]?.textContent).toBe('Detail pane')
  })
})
