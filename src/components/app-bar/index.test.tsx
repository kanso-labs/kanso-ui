import type { CSSProperties } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, render } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'

import type { AppBarProps } from '.'

import AppBar from '.'
import { useAppBarScroll } from '../../hooks/useAppBarScroll'
import { spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

// Material Design's documented heights for the three sizes this ships, and
// the second column is the whole point of the flexible bars: they grow for a
// subtitle rather than fitting it into a fixed box.
const HEIGHTS = {
  lg: { plain: 120, withSubtitle: 152 },
  md: { plain: 112, withSubtitle: 136 },
  sm: { plain: 64, withSubtitle: 64 },
} as const

const SIZES = ['sm', 'md', 'lg'] as const

// A scheme that widens the spacing scale's `lg` step, which the default inset
// is drawn from.
const wideSpacing = stylex.createTheme(spacing, { lg: '20px' })

const NARROW = { inlineSize: '280px' }

// Wider than any measure under test, so what is being read is the row's own
// limit rather than the room it was given.
const WIDE = { inlineSize: '1000px' }

// One word with no space to break at, wider than a narrow bar's headline.
const LONG_WORD = 'Unterstützungszeilenüberschrift'

const LEADING = <button type="button">Back</button>

// A glyph at the 24dp the app bar's tokens give an icon.
const GLYPH = (
  <svg
    aria-hidden="true"
    data-glyph=""
    height="24"
    viewBox="0 0 24 24"
    width="24"
  />
)

const ICON_LEADING = <IconButton aria-label="Back">{GLYPH}</IconButton>

const ICON_TRAILING = (
  <>
    <IconButton aria-label="Edit">{GLYPH}</IconButton>
    <IconButton aria-label="More">{GLYPH}</IconButton>
  </>
)
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

/** The box of the glyph at `index` among those the sample drew. */
function glyphAt(container: HTMLElement, index: number) {
  const glyph = container.querySelectorAll('[data-glyph]').item(index)
  if (!(glyph instanceof SVGElement)) {
    throw new Error(`expected a glyph at ${index}`)
  }
  return glyph.getBoundingClientRect()
}

/** The resolved minimum height, which is what the size tokens come down to. */
function minHeightOf(bar: HTMLElement) {
  return Number.parseFloat(getComputedStyle(bar).minBlockSize)
}

/**
 * How far the first glyph and the headline start from the bar's own edge,
 * read off their drawn boxes.
 */
function offsetsOf(view: ReturnType<typeof render>) {
  const barLeft = barIn(view.container).getBoundingClientRect().left
  const hasGlyph = view.container.querySelector('[data-glyph]') !== null

  return {
    glyph: hasGlyph ? glyphAt(view.container, 0).left - barLeft : undefined,
    headline:
      view.getByRole('heading', { level: 1 }).getBoundingClientRect().left -
      barLeft,
  }
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
  it('takes Material Design’s height for each size', () => {
    for (const size of SIZES) {
      const view = render(<AppBar headline="Headline" size={size} />)

      expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS[size].plain)
      view.unmount()
    }
  })

  // The flexible bars "hug the text contents" in Material Design's words, so a
  // subtitle makes them taller rather than being squeezed in.
  it('grows the flexible sizes for a subtitle', () => {
    for (const size of ['md', 'lg'] as const) {
      const view = render(
        <AppBar headline="Headline" size={size} subtitle="Supporting line" />,
      )

      expect(minHeightOf(barIn(view.container))).toBe(
        HEIGHTS[size].withSubtitle,
      )
      view.unmount()
    }
  })

  // Material Design publishes a second height for each flexible bar and none
  // for small, so small keeps its 64px. A headline and a subtitle at their type
  // roles come to exactly that, which is presumably why the spec needed no
  // second figure.
  it('leaves the small bar at its height with a subtitle', () => {
    const view = render(
      <AppBar headline="Headline" size="sm" subtitle="Supporting line" />,
    )
    const bar = barIn(view.container)

    expect(minHeightOf(bar)).toBe(HEIGHTS.sm.plain)
    expect(bar.getBoundingClientRect().height).toBe(HEIGHTS.sm.plain)
  })

  // A minimum rather than a fixed height, because the spec gives the flexible
  // bars multi-line support and wrapping. A bar that could not grow would clip
  // exactly the case the flexible variants exist for, so this measures a
  // headline forced to wrap rather than reading the CSS keyword back —
  // computed `block-size` reports the used height, so it says `120px` either
  // way.
  it('grows past its minimum for a headline that wraps', () => {
    const view = render(
      <div style={NARROW}>
        <AppBar
          headline="A headline long enough that it has to wrap onto several lines inside a narrow bar"
          size="lg"
        />
      </div>,
    )
    const bar = view.container.firstElementChild?.firstElementChild
    if (!(bar instanceof HTMLElement)) {
      throw new Error('expected the app bar to render an element')
    }

    expect(minHeightOf(bar)).toBe(HEIGHTS.lg.plain)
    expect(bar.getBoundingClientRect().height).toBeGreaterThan(HEIGHTS.lg.plain)
  })

  it('defaults to small', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.sm.plain)
  })

  it('takes its steps from the size scale', () => {
    expectTypeOf<AppBarProps['size']>().toEqualTypeOf<
      'lg' | 'md' | 'sm' | undefined
    >()
  })
})

describe('headline', () => {
  // Material Design's own tokens alias the type scale rather than carrying
  // sizes, so each size has to reach a different role. Compared against each
  // other rather than against a figure, which pins the ordering without
  // pinning the scale.
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

  // A bar drawn beside another bar, or under a page heading of its own, needs
  // to sit below it in the outline rather than beside it.
  it('takes the level the call site asks for', () => {
    const view = render(<AppBar headingLevel={2} headline="Headline" />)

    expect(view.getByRole('heading', { level: 2 }).textContent).toBe('Headline')
    expect(view.queryByRole('heading', { level: 1 })).toBeNull()
  })

  // The headline is the only heading the bar draws, at every level. It is the
  // heading's children rather than the heading, so a call site handing it one
  // of its own nests that inside this one instead of replacing it.
  it('draws one heading and no more', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const view = render(
        <AppBar headingLevel={level} headline="Headline" size="lg" />,
      )

      expect(view.getAllByRole('heading')).toHaveLength(1)
      expect(view.getByRole('heading', { level })).not.toBeNull()
      view.unmount()
    }
  })

  // A line breaks between words, so a word wider than the room held its line
  // at its own width: it ran under the trailing slot and widened the page.
  // Without a language to hyphenate in, the break is the one that holds.
  it.each(SIZES)(
    'breaks a word wider than the room inside the %s bar',
    (size) => {
      const view = render(
        <div style={NARROW}>
          <AppBar
            headline={LONG_WORD}
            leading={LEADING}
            size={size}
            trailing={TRAILING}
          />
        </div>,
      )
      const heading = view.getByRole('heading', { level: 1 })
      const room = view.container.firstElementChild!.getBoundingClientRect()

      expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth)
      expect(
        view.getByRole('button', { name: 'More' }).getBoundingClientRect()
          .right,
      ).toBeLessThanOrEqual(room.right)
    },
  )

  // `h7` is a custom element as far as React is concerned, so it would render
  // silently and leave the outline worse than the default.
  it('draws a real heading for a level outside the six', () => {
    const view = render(<AppBar headingLevel={9} headline="Headline" />)

    expect(view.getByRole('heading', { level: 6 }).textContent).toBe('Headline')
  })
})

describe('scrolled', () => {
  // Material Design replaced the drop shadow it once gave a scrolled bar with
  // a colour fill, so the separation is a different surface rather than an
  // elevation.
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

// A pinned large bar over a page of 40px lines in a 320px panel, wired the
// way the docs wire it. The bar is 152px expanded and gives back 88, so a
// page of `lines` overflows by 152 + 40 × lines − 320.
function ScrollPage({ lines }: { lines: number }) {
  const { collapsed, onScroll, ref, scrolled } = useAppBarScroll({
    collapseAfter: COLLAPSE_AFTER,
  })

  return (
    <div onScroll={onScroll} style={PANEL}>
      <AppBar
        collapsed={collapsed}
        headline="Headline"
        ref={ref}
        scrolled={scrolled}
        size="lg"
        style={PINNED}
        subtitle="Supporting line"
      />
      {Array.from({ length: lines }, (_, index) => (
        <p key={index} style={LINE}>
          Supporting line
        </p>
      ))}
    </div>
  )
}

const COLLAPSE_AFTER = 24
const PANEL = {
  blockSize: '320px',
  overflowAnchor: 'none',
  overflowY: 'auto',
} satisfies CSSProperties
const PINNED = {
  insetBlockStart: 0,
  position: 'sticky',
} satisfies CSSProperties
const LINE = { blockSize: '40px', margin: 0 } satisfies CSSProperties

/** How many times a run of heights changes from one step to the next. */
function changesIn(heights: number[]) {
  return heights.filter(
    (height, index) => index > 0 && height !== heights[index - 1],
  ).length
}

/**
 * The bar's height once the page is scrolled to `top`, its transition
 * finished, and every scroll that answers it reported.
 */
async function heightAt(bar: HTMLElement, scroller: HTMLElement, top: number) {
  await act(async () => {
    scroller.scrollTop = top
    await nextFrame()
    await nextFrame()
  })
  for (const animation of bar.getAnimations()) {
    animation.finish()
  }
  await act(async () => {
    await nextFrame()
    await nextFrame()
  })
  return bar.getBoundingClientRect().height
}

/**
 * The bar's height after each of `steps` scrolls 20px further down, with its
 * transition finished each time and every scroll that answers it reported.
 */
async function heightsWhileScrolling(
  view: ReturnType<typeof render>,
  steps: number,
) {
  const bar = view.getByRole('banner')
  const scroller = bar.parentElement
  if (scroller === null) {
    throw new Error('expected the bar to sit in its scroll container')
  }

  const heights: number[] = []
  for (let step = 1; step <= steps; step += 1) {
    // oxlint-disable-next-line no-await-in-loop -- inherently sequential
    heights.push(await heightAt(bar, scroller, step * 20))
  }
  return heights
}

async function nextFrame() {
  await new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

describe('useAppBarScroll', () => {
  // The reported loop: 32px of range, under the 24 + 88 a collapse needs to
  // keep the page scrolled past the threshold. Collapsing clamped the offset
  // back under it, the bar expanded, and the two alternated on every step.
  it('keeps the bar steady on a page too short to stay collapsed', async () => {
    const view = render(<ScrollPage lines={5} />)
    const heights = await heightsWhileScrolling(view, 6)

    expect(changesIn(heights)).toBe(0)
    expect(new Set(heights)).toEqual(new Set([152]))
  })

  // 112px of range is exactly the threshold plus what the bar gives back,
  // which a collapsed page could only reach by sitting on the threshold
  // itself, where the bar expands.
  it('leaves the bar expanded at the boundary', async () => {
    const view = render(<ScrollPage lines={7} />)

    expect(new Set(await heightsWhileScrolling(view, 6))).toEqual(
      new Set([152]),
    )
  })

  it('collapses once, and stays, on a page long enough', async () => {
    const view = render(<ScrollPage lines={8} />)
    const heights = await heightsWhileScrolling(view, 6)

    expect(changesIn(heights)).toBe(1)
    expect(heights.at(-1)).toBe(64)
  })

  it('expands again at the threshold', async () => {
    const view = render(<ScrollPage lines={12} />)
    await heightsWhileScrolling(view, 3)
    const bar = view.getByRole('banner')
    const scroller = bar.parentElement
    if (scroller === null) {
      throw new Error('expected the bar to sit in its scroll container')
    }

    expect(await heightAt(bar, scroller, COLLAPSE_AFTER)).toBe(152)
  })
})

describe('collapsed', () => {
  // The whole point: a pinned large bar costs 152px of the viewport for as
  // long as the page is open unless it can give the space back.
  it('takes the small bar’s height on the flexible sizes', () => {
    for (const size of ['md', 'lg'] as const) {
      const view = render(
        <AppBar
          collapsed
          headline="Headline"
          size={size}
          subtitle="Supporting line"
        />,
      )

      expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.sm.plain)
      view.unmount()
    }
  })

  // Material Design does not describe a collapsed large bar as a state of its
  // own. It describes it as becoming the small bar, so the headline takes the
  // small bar's type role along with its height.
  it('takes the small bar’s headline too', () => {
    const small = render(<AppBar headline="Headline" />)
    const smallSize = getComputedStyle(
      small.getByRole('heading', { level: 1 }),
    ).fontSize
    small.unmount()

    const large = render(<AppBar collapsed headline="Headline" size="lg" />)

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
        size="lg"
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
        size="lg"
        subtitle="Supporting line"
      />,
    )
    view.rerender(
      <AppBar headline="Headline" size="lg" subtitle="Supporting line" />,
    )

    expect(view.getByText('Supporting line')).not.toBeNull()
    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.lg.withSubtitle)
  })

  // `sm` is already the height the flexible bars collapse to, so a call
  // site choosing its size from a breakpoint does not have to guard the prop.
  it('leaves the small bar alone', () => {
    const view = render(
      <AppBar collapsed headline="Headline" subtitle="Supporting line" />,
    )

    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.sm.plain)
    expect(view.getByText('Supporting line')).not.toBeNull()
  })

  it('stays expanded by default', () => {
    const view = render(
      <AppBar headline="Headline" size="lg" subtitle="Supporting line" />,
    )

    expect(minHeightOf(barIn(view.container))).toBe(HEIGHTS.lg.withSubtitle)
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

  // A bar drawn flush — a drawer's header, a full-bleed band — asks for
  // less than the room a glyph keeps inside its target, which once clamped
  // every inset below 12px up to 12.
  it.each(['0', '0px', '8px'])(
    'starts the headline at an inset of %s with nothing before it',
    (contentInset) => {
      const view = render(
        <AppBar contentInset={contentInset} headline="Headline" />,
      )

      expect(offsetsOf(view).headline).toBe(Number.parseFloat(contentInset))
    },
  )

  // Material Design's tokens: 4dp from the edge to the button's 48dp target,
  // a 24dp icon centred in it, and the headline 4dp past the target — the
  // glyph on the page's 16dp margin and the headline at 56.
  it('puts a leading glyph on the inset and the headline past its target', () => {
    const view = render(<AppBar headline="Headline" leading={ICON_LEADING} />)
    const offsets = offsetsOf(view)

    expect(offsets.glyph).toBe(16)
    expect(offsets.headline).toBe(56)
  })

  it('follows the inset it is given with a leading slot', () => {
    const view = render(
      <AppBar contentInset="24px" headline="Headline" leading={ICON_LEADING} />,
    )
    const offsets = offsetsOf(view)

    expect(offsets.glyph).toBe(24)
    expect(offsets.headline).toBe(64)
  })

  // The row cannot be padded less than nothing, so an inset smaller than a
  // glyph's own room puts the target against the edge rather than the
  // padding being thrown away.
  it('puts the target against the edge for an inset of 0', () => {
    const view = render(
      <AppBar contentInset="0" headline="Headline" leading={ICON_LEADING} />,
    )

    expect(offsetsOf(view).glyph).toBe(12)
  })

  // The same at the far end, and the targets of two actions edge to edge,
  // which is the space the tokens give between icon buttons.
  it('puts the last trailing glyph on the inset, targets edge to edge', () => {
    const view = render(<AppBar headline="Headline" trailing={ICON_TRAILING} />)
    const barRight = barIn(view.container).getBoundingClientRect().right
    const first = glyphAt(view.container, 0)
    const last = glyphAt(view.container, 1)

    expect(barRight - last.right).toBe(16)
    expect(last.left - first.left).toBe(48)
  })

  it('takes Material Design’s own margin as the default inset', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(offsetsOf(view).headline).toBe(16)
  })

  // The default is the spacing token rather than its figure, so a scheme
  // that changes the scale moves the bar with the page beneath it.
  it('follows the spacing scale for its default inset', () => {
    const view = render(
      <div {...stylex.props(wideSpacing)}>
        <AppBar headline="Headline" />
      </div>,
    )
    const bar = barInWrapper(view.container)
    const heading = view.getByRole('heading', { level: 1 })

    expect(
      heading.getBoundingClientRect().left - bar.getBoundingClientRect().left,
    ).toBe(20)
  })
})

describe('align', () => {
  it('starts the text at the leading edge by default', () => {
    const view = render(<AppBar headline="Headline" />)
    const text = textBlockOf(barIn(view.container))

    expect(getComputedStyle(text).textAlign).toBe('start')
  })

  // Material Design folded the old center-aligned variant into a configuration,
  // so this is available at every size rather than only on small.
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
