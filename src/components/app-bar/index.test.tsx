import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppBar from '.'

// M3's documented heights for the three sizes this ships, and the second
// column is the whole point of the flexible bars: they grow for a subtitle
// rather than fitting it into a fixed box.
const HEIGHTS = {
  large: { plain: 120, withSubtitle: 152 },
  medium: { plain: 112, withSubtitle: 136 },
  small: { plain: 64, withSubtitle: 64 },
} as const

const SIZES = ['small', 'medium', 'large'] as const

const NARROW = { inlineSize: '280px' }

// Wider than any measure under test, so what is being read is the row's own
// limit rather than the room it was given.
const WIDE = { inlineSize: '1000px' }

const LEADING = <button type="button">Back</button>
const TRAILING = <button type="button">More</button>

function barIn(container: HTMLElement) {
  const bar = container.firstElementChild
  if (!(bar instanceof HTMLElement)) {
    throw new Error('expected the app bar to render an element')
  }
  return bar
}

/** The bar inside a wrapper the sample rendered to give it a known width. */
function barInWrapper(container: HTMLElement) {
  const wrapper = container.firstElementChild
  if (!(wrapper instanceof HTMLElement)) {
    throw new Error('expected the sample to render a wrapper')
  }
  return barIn(wrapper)
}

/** The resolved minimum height, which is what the size tokens come down to. */
function minHeightOf(bar: HTMLElement) {
  return Number.parseFloat(getComputedStyle(bar).minBlockSize)
}

/** The measured row the bar's contents sit in. */
function rowOf(bar: HTMLElement) {
  const row = bar.firstElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the app bar to render a content row')
  }
  return row
}

/** The text block, narrowed so a structural change fails here rather than later. */
function textBlockOf(bar: HTMLElement) {
  const text = rowOf(bar).firstElementChild
  if (!(text instanceof HTMLElement)) {
    throw new Error('expected the app bar to render a text block')
  }
  return text
}

describe('size', () => {
  it('takes M3’s height for each size', () => {
    for (const size of SIZES) {
      const view = render(<AppBar headline="Headline" size={size} />)

      expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS[size].plain)
      view.unmount()
    }
  })

  // The flexible bars "hug the text contents" in M3's words, so a subtitle
  // makes them taller rather than being squeezed in.
  it('grows the flexible sizes for a subtitle', () => {
    for (const size of ['medium', 'large'] as const) {
      const view = render(
        <AppBar headline="Headline" size={size} subtitle="Supporting line" />,
      )

      expect(minHeightOf(barIn(view.container))).toBe(
        HEIGHTS[size].withSubtitle,
      )
      view.unmount()
    }
  })

  // M3 publishes a second height for each flexible bar and none for small, so
  // small keeps its 64px. A headline and a subtitle at their type roles come
  // to exactly that, which is presumably why the spec needed no second figure.
  it('leaves the small bar at its height with a subtitle', () => {
    const view = render(
      <AppBar headline="Headline" size="small" subtitle="Supporting line" />,
    )
    const bar = barIn(view.container)

    expect(minHeightOf(bar)).toBe(HEIGHTS.small.plain)
    expect(bar.getBoundingClientRect().height).toBe(HEIGHTS.small.plain)
  })

  // A minimum rather than a fixed height, because Expressive added multi-line
  // support and wrapping. A bar that could not grow would clip exactly the
  // case the flexible variants exist for, so this measures a headline forced
  // to wrap rather than reading the CSS keyword back — computed `block-size`
  // reports the used height, so it says `120px` either way.
  it('grows past its minimum for a headline that wraps', () => {
    const view = render(
      <div style={NARROW}>
        <AppBar
          headline="A headline long enough that it has to wrap onto several lines inside a narrow bar"
          size="large"
        />
      </div>,
    )
    const bar = view.container.firstElementChild?.firstElementChild
    if (!(bar instanceof HTMLElement)) {
      throw new Error('expected the app bar to render an element')
    }

    expect(minHeightOf(bar)).toBe(HEIGHTS.large.plain)
    expect(bar.getBoundingClientRect().height).toBeGreaterThan(
      HEIGHTS.large.plain,
    )
  })

  it('defaults to small', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.small.plain)
  })
})

describe('headline', () => {
  // M3's own tokens alias the type scale rather than carrying sizes, so each
  // size has to reach a different role. Compared against each other rather
  // than against a figure, which pins the ordering without pinning the scale.
  it('gives each size a larger headline than the one below', () => {
    const sizes = SIZES.map((size) => {
      const view = render(<AppBar headline="Headline" size={size} />)
      const heading = view.getByRole('heading', { level: 1 })
      const fontSize = Number.parseFloat(getComputedStyle(heading).fontSize)
      view.unmount()
      return fontSize
    })

    expect(sizes[1]).toBeGreaterThan(sizes[0])
    expect(sizes[2]).toBeGreaterThan(sizes[1])
  })

  // The bar is the page's header, so its headline is the page's heading.
  it('renders the headline as the page heading', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('Headline')
  })

  it('renders no heading at all without one', () => {
    const view = render(<AppBar />)

    expect(view.queryByRole('heading')).toBeNull()
  })
})

describe('scrolled', () => {
  // M3 replaced M2's drop shadow with a colour fill, so the separation is a
  // different surface rather than an elevation.
  it('changes the surface rather than casting a shadow', () => {
    const resting = render(<AppBar headline="Headline" />)
    const restingStyle = getComputedStyle(barIn(resting.container))
    const restingColor = restingStyle.backgroundColor
    expect(restingStyle.boxShadow).toBe('none')
    resting.unmount()

    const scrolled = render(<AppBar headline="Headline" scrolled />)
    const scrolledStyle = getComputedStyle(barIn(scrolled.container))

    expect(scrolledStyle.backgroundColor).not.toBe(restingColor)
    expect(scrolledStyle.boxShadow).toBe('none')
  })
})

describe('slots', () => {
  it('renders the leading and trailing slots around the text', () => {
    const view = render(
      <AppBar headline="Headline" leading={LEADING} trailing={TRAILING} />,
    )
    const row = rowOf(barIn(view.container))

    expect(row.children).toHaveLength(3)
    expect(row.firstElementChild?.textContent).toBe('Back')
    expect(row.lastElementChild?.textContent).toBe('More')
  })

  // No empty wrapper for a slot nobody filled, so a bar with only a headline
  // has nothing between its edge and its text but the padding.
  it('renders no wrapper for a slot it was not given', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(rowOf(barIn(view.container)).children).toHaveLength(1)
  })
})

describe('content measure', () => {
  // The reported problem: a bar painting edge to edge could not put its
  // contents where the page below put its own, so a headline and the text
  // under it never lined up.
  it('centres the row at the measure while the bar paints full bleed', () => {
    const view = render(
      <div style={WIDE}>
        <AppBar contentMaxInlineSize="600px" headline="Headline" />
      </div>,
    )
    const bar = barInWrapper(view.container)
    const barBox = bar.getBoundingClientRect()
    const rowBox = rowOf(bar).getBoundingClientRect()

    expect(barBox.width).toBe(1000)
    expect(rowBox.width).toBe(600)
    expect(rowBox.left - barBox.left).toBeCloseTo(
      barBox.right - rowBox.right,
      1,
    )
  })

  it('runs the row the full width of the bar without a measure', () => {
    const view = render(
      <div style={WIDE}>
        <AppBar headline="Headline" />
      </div>,
    )
    const bar = barInWrapper(view.container)

    expect(rowOf(bar).getBoundingClientRect().width).toBe(1000)
  })

  // What the prop names: the inset is measured to the headline, which is the
  // thing a page's own text has to line up with.
  it('starts the headline at the inset it is given', () => {
    const view = render(<AppBar contentInset="24px" headline="Headline" />)
    const heading = view.getByRole('heading', { level: 1 })

    expect(
      heading.getBoundingClientRect().left -
        barIn(view.container).getBoundingClientRect().left,
    ).toBe(24)
  })

  // The reason the inset is split between the row and the text block rather
  // than sitting entirely on one. A leading slot starts before the headline by
  // the room an icon button's own padding fills, so a bar with an icon and one
  // without put their text in the same place.
  it('leaves a leading slot the room an icon button pads with', () => {
    const view = render(
      <AppBar contentInset="24px" headline="Headline" leading={LEADING} />,
    )
    const barLeft = barIn(view.container).getBoundingClientRect().left

    expect(view.getByText('Back').getBoundingClientRect().left - barLeft).toBe(
      12,
    )
  })

  it('takes M3’s own margin as the default inset', () => {
    const view = render(<AppBar headline="Headline" />)
    const heading = view.getByRole('heading', { level: 1 })

    expect(
      heading.getBoundingClientRect().left -
        barIn(view.container).getBoundingClientRect().left,
    ).toBe(16)
  })
})

describe('align', () => {
  it('starts the text at the leading edge by default', () => {
    const view = render(<AppBar headline="Headline" />)
    const text = textBlockOf(barIn(view.container))

    expect(getComputedStyle(text).textAlign).toBe('start')
  })

  // M3 folded the old center-aligned variant into a configuration, so this is
  // available at every size rather than only on small.
  it('centres the text at every size when asked', () => {
    for (const size of SIZES) {
      const view = render(
        <AppBar align="center" headline="Headline" size={size} />,
      )
      const text = textBlockOf(barIn(view.container))

      expect(getComputedStyle(text).textAlign).toBe('center')
      view.unmount()
    }
  })
})

describe('element', () => {
  it('renders a header by default', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(barIn(view.container).tagName).toBe('HEADER')
  })
})
