import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Feed from '.'

// Hoisted out of the JSX below for react-perf's no-jsx-as-prop, the same way
// the other suites hoist their `render` templates.
const FEED_SECTION = <section aria-label="Feed" />

// Cached per width for no-new-object-as-prop. A fresh object literal in the
// JSX is a new prop identity every render, which is what the rule is after —
// and there are only ever a handful of distinct widths here.
const widths = new Map<string, { inlineSize: string }>()

/** The resolved column tracks, which is what the layout comes down to. */
function columnsOf(feed: HTMLElement) {
  return getComputedStyle(feed)
    .gridTemplateColumns.split(' ')
    .map(Number.parseFloat)
}

// A width on the wrapper rather than on the viewport, which is the whole
// distinction this layout draws against ListDetail and SupportingPane: it
// answers to the room it is given, so a test can give it that room directly
// and never touch `page.viewport()`.
function renderAtWidth(
  width: string,
  itemCount: number,
  minItemWidth?: string,
) {
  const view = render(
    <div style={widthOf(width)}>
      <Feed minItemWidth={minItemWidth}>
        {Array.from({ length: itemCount }, (_, index) => (
          <div key={index}>{`Item ${index}`}</div>
        ))}
      </Feed>
    </div>,
  )
  const feed = view.container.firstElementChild?.firstElementChild
  if (!(feed instanceof HTMLElement)) {
    throw new Error('expected the feed to render an element')
  }
  return { feed, view }
}

function widthOf(inlineSize: string) {
  const existing = widths.get(inlineSize)
  if (existing) {
    return existing
  }
  const style = { inlineSize }
  widths.set(inlineSize, style)
  return style
}

describe('columns', () => {
  // M3 describes an adaptive grid by its cell rather than by a column count
  // per breakpoint: every column is at least `minItemWidth`, and the grid
  // fits as many as the space allows.
  it('fits as many columns as the width allows', () => {
    const cases = [
      { columns: 1, width: '300px' },
      { columns: 2, width: '600px' },
      { columns: 4, width: '1200px' },
    ]

    for (const { columns, width } of cases) {
      const { feed, view } = renderAtWidth(width, 8, '260px')

      expect(columnsOf(feed)).toHaveLength(columns)
      view.unmount()
    }
  })

  it('drops to a single column when only one fits', () => {
    const { feed } = renderAtWidth('200px', 6, '260px')

    expect(columnsOf(feed)).toHaveLength(1)
  })

  it('never lets a column fall below the minimum', () => {
    const { feed } = renderAtWidth('900px', 6, '260px')

    for (const column of columnsOf(feed)) {
      expect(column).toBeGreaterThanOrEqual(260)
    }
  })

  // The cell minimum reaches the compiled class through a custom property,
  // since StyleX fixes its classes ahead of time and this value comes from the
  // call site. Two different minimums therefore have to produce two different
  // grids, or the value never arrived.
  it('honours the minimum it is given', () => {
    const narrow = renderAtWidth('900px', 6, '200px')
    const narrowColumns = columnsOf(narrow.feed).length
    narrow.view.unmount()

    const wide = renderAtWidth('900px', 6, '400px')
    const wideColumns = columnsOf(wide.feed).length

    expect(narrowColumns).toBeGreaterThan(wideColumns)
  })

  it('falls back to M3’s own example minimum', () => {
    const { feed } = renderAtWidth('900px', 6)

    for (const column of columnsOf(feed)) {
      expect(column).toBeGreaterThanOrEqual(180)
    }
  })
})

describe('short rows', () => {
  // auto-fill rather than auto-fit, matching how Compose lays a feed out: a
  // row with room to spare keeps its empty tracks rather than stretching what
  // is in it.
  //
  // The two assertions below are what actually tell the keywords apart, and
  // they were chosen by measuring rather than by guessing. Two items in
  // 1200px resolve to `282 282 282 282` under auto-fill and `588 588 0 0`
  // under auto-fit — so the tells are a track collapsing to nothing, and the
  // surviving tracks no longer matching each other. A threshold on the track
  // width does not tell them apart at all: 588px sits under most of the
  // round numbers one would reach for.
  it('keeps every track at the cell minimum rather than collapsing the spares', () => {
    const { feed } = renderAtWidth('1200px', 2, '260px')

    for (const column of columnsOf(feed)) {
      expect(column).toBeGreaterThanOrEqual(260)
    }
  })

  it('keeps the tracks equal rather than stretching the occupied ones', () => {
    const { feed } = renderAtWidth('1200px', 2, '260px')
    const columns = columnsOf(feed)

    expect(columns.length).toBeGreaterThan(2)
    expect(new Set(columns).size).toBe(1)
  })
})

describe('children', () => {
  // No wrapper per child, unlike the pane layouts. Here the grid making an
  // item out of each child is exactly right — that is what a feed is — so
  // wrapping would add a layer that does nothing.
  it('makes a grid item of each child directly', () => {
    const { feed } = renderAtWidth('1200px', 5, '260px')

    expect(feed.children).toHaveLength(5)
    expect(feed.firstElementChild?.textContent).toBe('Item 0')
  })
})

describe('element', () => {
  it('renders a div by default', () => {
    const { feed } = renderAtWidth('600px', 2)

    expect(feed.tagName).toBe('DIV')
  })

  it('renders the element given to `render` instead', () => {
    const view = render(
      <Feed render={FEED_SECTION}>
        <div>Item 0</div>
      </Feed>,
    )

    expect(view.getByRole('region', { name: 'Feed' })).toBeInTheDocument()
  })
})
