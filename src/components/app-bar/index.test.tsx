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

const LEADING = <button type="button">Back</button>
const TRAILING = <button type="button">More</button>

function barIn(container: HTMLElement) {
  const bar = container.firstElementChild
  if (!(bar instanceof HTMLElement)) {
    throw new Error('expected the app bar to render an element')
  }
  return bar
}

/** The resolved minimum height, which is what the size tokens come down to. */
function minHeightOf(bar: HTMLElement) {
  return Number.parseFloat(getComputedStyle(bar).minBlockSize)
}

/** The text block, narrowed so a structural change fails here rather than later. */
function textBlockOf(bar: HTMLElement) {
  const text = bar.firstElementChild
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

describe('collapsed', () => {
  // The whole point: a pinned large bar costs 152px of the viewport for as
  // long as the page is open unless it can give the space back.
  it('takes the small bar’s height on the flexible sizes', () => {
    for (const size of ['medium', 'large'] as const) {
      const view = render(
        <AppBar
          collapsed
          headline="Headline"
          size={size}
          subtitle="Supporting line"
        />,
      )

      expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.small.plain)
      view.unmount()
    }
  })

  // M3 does not describe a collapsed large bar as a state of its own. It
  // describes it as becoming the small bar, so the headline takes the small
  // bar's type role along with its height.
  it('takes the small bar’s headline too', () => {
    const small = render(<AppBar headline="Headline" />)
    const smallSize = getComputedStyle(
      small.getByRole('heading', { level: 1 }),
    ).fontSize
    small.unmount()

    const large = render(<AppBar collapsed headline="Headline" size="large" />)

    expect(
      getComputedStyle(large.getByRole('heading', { level: 1 })).fontSize,
    ).toBe(smallSize)
  })

  // There is no second line in a 64px bar, so the subtitle goes with the
  // height rather than being squeezed alongside the headline.
  it('drops the subtitle', () => {
    const view = render(
      <AppBar
        collapsed
        headline="Headline"
        size="large"
        subtitle="Supporting line"
      />,
    )

    expect(view.queryByText('Supporting line')).toBeNull()
  })

  it('brings the subtitle back on expanding', () => {
    const view = render(
      <AppBar
        collapsed
        headline="Headline"
        size="large"
        subtitle="Supporting line"
      />,
    )
    view.rerender(
      <AppBar headline="Headline" size="large" subtitle="Supporting line" />,
    )

    expect(view.getByText('Supporting line')).not.toBeNull()
    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.large.withSubtitle)
  })

  // `small` is already the height the flexible bars collapse to, so a call
  // site choosing its size from a breakpoint does not have to guard the prop.
  it('leaves the small bar alone', () => {
    const view = render(
      <AppBar collapsed headline="Headline" subtitle="Supporting line" />,
    )

    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.small.plain)
    expect(view.getByText('Supporting line')).not.toBeNull()
  })

  it('stays expanded by default', () => {
    const view = render(
      <AppBar headline="Headline" size="large" subtitle="Supporting line" />,
    )

    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.large.withSubtitle)
  })
})

describe('slots', () => {
  it('renders the leading and trailing slots around the text', () => {
    const view = render(
      <AppBar headline="Headline" leading={LEADING} trailing={TRAILING} />,
    )
    const bar = barIn(view.container)

    expect(bar.children).toHaveLength(3)
    expect(bar.firstElementChild?.textContent).toBe('Back')
    expect(bar.lastElementChild?.textContent).toBe('More')
  })

  // No empty wrapper for a slot nobody filled, so a bar with only a headline
  // has nothing between its edge and its text but the padding.
  it('renders no wrapper for a slot it was not given', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(barIn(view.container).children).toHaveLength(1)
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
