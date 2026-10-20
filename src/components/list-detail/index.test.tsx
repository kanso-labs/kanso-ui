import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { afterAll, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import ListDetail from '.'

// Widths for the layout itself, one pixel either side of each Material Design
// breakpoint it changes at, so a query written with the wrong comparison fails
// here rather than passing on a round number that both readings agree on. The
// lower bounds are Material Design's own: expanded from 840 and extra-large
// from 1600, with compact and medium below the first.
const COMPACT = 500
const MEDIUM = 700
const BELOW_EXPANDED = 839
const EXPANDED = 840
const LARGE = 1300
const BELOW_EXTRA_LARGE = 1599
const EXTRA_LARGE = 1600

// Storybook and the other specs share this browser, so the viewport has to go
// back to something ordinary or whatever runs next inherits another width.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

function gapOf(container: HTMLElement) {
  return Number.parseFloat(getComputedStyle(rootOf(container)).columnGap)
}

/** The width of every pane that is laid out, in DOM order, rounded. */
function paneWidths(container: HTMLElement) {
  return [...rootOf(container).children]
    .filter((pane) => getComputedStyle(pane).display !== 'none')
    .map((pane) => Math.round(pane.getBoundingClientRect().width))
}

/**
 * Renders the layout as the only thing in a block this many pixels wide, which
 * is the width its breakpoints are compared against. React Testing Library
 * removes the block from the body again when it cleans up.
 */
function renderIn(width: number, element: ReactElement) {
  const host = document.createElement('div')
  host.style.inlineSize = `${width}px`
  document.body.append(host)
  return render(element, { container: host })
}

function rootOf(container: HTMLElement) {
  const root = container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the layout to render an element')
  }
  return root
}

// Hoisted so it is one stable element per render rather than a fresh one,
// which is what react-perf's no-jsx-as-prop is after.
const MAIN = <main />

const PANES = { detail: 'Detail pane', list: 'List pane' }

// One word longer than any pane is wide, which a pane with an automatic
// minimum would widen to hold.
const UNBROKEN = 'x'.repeat(400)

afterAll(async () => {
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

describe('panes across the breakpoints', () => {
  // Material Design puts one pane on screen at compact and medium, and two
  // from expanded up. Measured rather than inferred from the class list,
  // because StyleX decides the order the overlapping min-width queries are
  // emitted in and that ordering is what makes the wider rule win.
  it.each([COMPACT, MEDIUM, BELOW_EXPANDED])(
    'shows one pane, the whole width, at %ipx',
    (width) => {
      const view = renderIn(width, <ListDetail {...PANES} />)

      expect(paneWidths(view.container)).toEqual([width])
    },
  )

  it.each([EXPANDED, LARGE, BELOW_EXTRA_LARGE, EXTRA_LARGE])(
    'shows both panes at %ipx',
    (width) => {
      const view = renderIn(width, <ListDetail {...PANES} />)

      expect(paneWidths(view.container)).toHaveLength(2)
    },
  )

  // Material Design's recommended snap widths for a fixed pane. The list takes
  // the fixed width and the detail pane absorbs the rest, which is the spec's
  // rule that every layout carry at least one flexible pane.
  it.each([EXPANDED, LARGE, BELOW_EXTRA_LARGE])(
    'gives the list pane 360px at %ipx',
    (width) => {
      const view = renderIn(width, <ListDetail {...PANES} />)

      expect(paneWidths(view.container)[0]).toBe(360)
    },
  )

  it('widens the list pane to 412px at extra-large', () => {
    const view = renderIn(EXTRA_LARGE, <ListDetail {...PANES} />)

    expect(paneWidths(view.container)[0]).toBe(412)
  })

  it('leaves the detail pane the rest of the row', () => {
    const view = renderIn(EXPANDED, <ListDetail {...PANES} />)
    const [list, detail] = paneWidths(view.container)

    expect(detail).toBe(EXPANDED - list - gapOf(view.container))
    expect(detail).toBeGreaterThan(list)
  })

  it('keeps an unbroken word from widening the detail pane', () => {
    const view = renderIn(
      EXPANDED,
      <ListDetail detail={UNBROKEN} list={PANES.list} />,
    )

    expect(paneWidths(view.container)).toEqual([
      360,
      EXPANDED - 360 - gapOf(view.container),
    ])
  })
})

// The breakpoints are the layout's own width rather than the window's, which
// is what lets one beside a drawer or inside a sheet keep to one pane. Each
// case sets the window to the arrangement the layout must not follow.
describe('the width it answers to', () => {
  it('shows one pane in a narrow block on a wide window', async () => {
    await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    const view = renderIn(520, <ListDetail {...PANES} />)

    expect(paneWidths(view.container)).toEqual([520])
    expect(view.getByText('Detail pane')).not.toBeVisible()
  })

  it('shows two panes in a wide block on a narrow window', async () => {
    await page.viewport(COMPACT, 900)
    const view = renderIn(900, <ListDetail {...PANES} />)

    expect(paneWidths(view.container)).toEqual([
      360,
      900 - 360 - gapOf(view.container),
    ])
    await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
  })
})

describe('showing', () => {
  it('shows the list by default', () => {
    const view = renderIn(COMPACT, <ListDetail {...PANES} />)

    expect(view.getByText('List pane')).toBeVisible()
    expect(view.queryByText('Detail pane')).not.toBeVisible()
  })

  it('swaps to the detail when asked', () => {
    const view = renderIn(COMPACT, <ListDetail {...PANES} showing="detail" />)

    expect(view.getByText('Detail pane')).toBeVisible()
    expect(view.queryByText('List pane')).not.toBeVisible()
  })

  // display:none rather than a visual-only hide, so a pane there is no room
  // for is out of the accessibility tree too.
  it('takes the hidden pane out of the accessibility tree', () => {
    const view = renderIn(COMPACT, <ListDetail {...PANES} showing="detail" />)
    const hidden = view.getByText('List pane')

    expect(getComputedStyle(hidden).display).toBe('none')
  })

  it('is ignored once both panes fit', () => {
    const view = renderIn(EXPANDED, <ListDetail {...PANES} showing="detail" />)

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

  // Material Design asks that focus order match the arrangement on screen for
  // co-planar panes, which for a left-to-right row means the list has to come
  // first in the DOM rather than being placed by `order`.
  it('writes the panes in the order they are shown', () => {
    const view = renderIn(EXPANDED, <ListDetail {...PANES} />)
    const root = view.container.firstElementChild

    expect(root?.children[0]?.textContent).toBe('List pane')
    expect(root?.children[1]?.textContent).toBe('Detail pane')
  })
})
