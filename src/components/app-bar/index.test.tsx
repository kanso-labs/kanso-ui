import type { CSSProperties } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, render } from '@testing-library/react'
import { createPortal } from 'react-dom'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import type { AppBarProps } from '.'

import AppBar from '.'
import { useAppBarScroll } from '../../hooks/useAppBarScroll'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
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

// The strip the slots sit in, which is the small bar's height and the first of
// the flexible bars' two rows.
const STRIP = 64

// The target an icon button in the strip is pressed on, centred in it.
const TARGET = 48

// Material Design's type roles for the flexible bars, in font size and line
// height, and the small bar's, which a collapsed bar takes.
const ROLES = {
  lg: { headline: ['36px', '44px'], subtitle: ['16px', '24px'] },
  md: { headline: ['28px', '36px'], subtitle: ['14px', '20px'] },
  sm: { headline: ['22px', '28px'], subtitle: ['12px', '16px'] },
} as const

// How far above its bottom edge each flexible bar sets its text's last
// baseline, as Material Design measures it.
const BASELINE_FROM_END = { lg: 28, md: 24 } as const

// A scheme that widens the spacing scale's `lg` step, which the default inset
// is drawn from.
const wideSpacing = stylex.createTheme(spacing, { lg: '20px' })

const NARROW = { inlineSize: '280px' }

// A phone's width, where a back button and three actions leave a headline
// beside them a third of the bar.
const PHONE = { inlineSize: '360px' }

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

const DISABLED_LEADING = (
  <IconButton aria-label="Back" isDisabled>
    {GLYPH}
  </IconButton>
)

const ICON_TRAILING = (
  <>
    <IconButton aria-label="Edit">{GLYPH}</IconButton>
    <IconButton aria-label="More">{GLYPH}</IconButton>
  </>
)
const TRAILING = <button type="button">More</button>

const THREE_ACTIONS = (
  <>
    <IconButton aria-label="Edit">{GLYPH}</IconButton>
    <IconButton aria-label="Search">{GLYPH}</IconButton>
    <IconButton aria-label="More">{GLYPH}</IconButton>
  </>
)

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

/**
 * Where an element's last line sits: the bottom of an empty inline-block
 * appended to it, which is that line's baseline.
 */
function baselineOf(element: HTMLElement) {
  const probe = document.createElement('span')
  probe.style.display = 'inline-block'
  element.append(probe)
  const baseline = probe.getBoundingClientRect().bottom
  probe.remove()
  return baseline
}

/**
 * Expects a line to be drawn where another was, at its size: the same place
 * to within half a pixel, and the same type size once its scale is applied.
 * The size rather than the box's height, since the browser rounds a font's
 * ascent and descent to whole pixels at each size, so a box scaled from one
 * size to another can be a pixel off with every glyph where it was.
 */
function expectSameLine(
  actual: ReturnType<typeof glyphsIn>,
  expected: ReturnType<typeof glyphsIn>,
) {
  expect(actual.left).toBeCloseTo(expected.left, 0)
  expect(actual.top).toBeCloseTo(expected.top, 0)
  expect(actual.size).toBeCloseTo(expected.size, 1)
}

/** The box of the glyph at `index` among those the sample drew. */
function glyphAt(container: HTMLElement, index: number) {
  const glyph = container.querySelectorAll('[data-glyph]').item(index)
  if (!(glyph instanceof SVGElement)) {
    throw new Error(`expected a glyph at ${index}`)
  }
  return glyph.getBoundingClientRect()
}

/**
 * Where the glyphs of an element's first line are drawn, from the bar's own
 * corner, and how large: the box of the text itself rather than of its line,
 * which is what the reader sees move, and the type size times the scale the
 * element is drawn at.
 */
function glyphsIn(bar: HTMLElement, element: Element) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const first = range.getClientRects().item(0)
  if (first === null) {
    throw new Error('expected the element to draw a line of text')
  }
  const frame = bar.getBoundingClientRect()
  const style = getComputedStyle(element)
  return {
    height: first.height,
    left: first.left - frame.left,
    right: first.right - frame.left,
    size:
      Number.parseFloat(style.fontSize) *
      new DOMMatrixReadOnly(style.transform).a,
    top: first.top - frame.top,
  }
}

/** The resolved minimum height, which is what the size tokens come down to. */
function minHeightOf(bar: HTMLElement) {
  return Number.parseFloat(getComputedStyle(bar).minBlockSize)
}

/** Every animation the bar and its contents are running. */
function motionIn(bar: HTMLElement) {
  return bar.getAnimations({ subtree: true })
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

/** Where `element` is drawn, from the bar's own corner, and how tall. */
function placeIn(bar: HTMLElement, element: Element) {
  const frame = bar.getBoundingClientRect()
  const box = element.getBoundingClientRect()
  return {
    height: box.height,
    left: box.left - frame.left,
    top: box.top - frame.top,
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

/** Moves every animation in the bar to `ms` in, leaving it running. */
function seek(bar: HTMLElement, ms: number) {
  for (const animation of motionIn(bar)) {
    animation.currentTime = ms
  }
}

/** Plays every animation under way in the bar out to its end. */
function settle(bar: HTMLElement) {
  for (const animation of motionIn(bar)) {
    animation.finish()
  }
}

/** The text block, narrowed so a structural change fails here rather than later. */
function textBlockOf(bar: HTMLElement) {
  const text = rowOf(bar).firstElementChild
  if (!(text instanceof HTMLElement)) {
    throw new Error('expected the app bar to render a text block')
  }
  return text
}

// A scroll container with a positioned block in it taller than it is, for a
// pinned bar to stay over.
const pinnedStyles = stylex.create({
  block: {
    backgroundColor: 'rgb(1, 2, 3)',
    blockSize: '600px',
    position: 'relative',
  },
  scroller: {
    blockSize: '240px',
    overflowY: 'auto',
  },
})

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

  // Material Design's flexible bars are two rows: the small bar's strip with
  // the slots at either end, and the text under it, starting on the inset
  // the leading glyph sits on rather than after the glyph's target.
  it.each(['md', 'lg'] as const)(
    'lays the %s bar out as a strip of slots with the text under it',
    (size) => {
      const view = render(
        <AppBar
          headline="Headline"
          leading={ICON_LEADING}
          size={size}
          trailing={ICON_TRAILING}
        />,
      )
      const bar = barIn(view.container)

      for (const name of ['Back', 'Edit', 'More']) {
        const button = view.getByRole('button', { name })
        const { top } = placeIn(bar, button)
        expect(top + button.getBoundingClientRect().height / 2).toBe(STRIP / 2)
      }
      // The line's leading may run up into the strip, as Material Design's
      // heights need it to, but no further than the bottom of the targets.
      const heading = placeIn(bar, view.getByRole('heading', { level: 1 }))
      expect(heading.top).toBeGreaterThanOrEqual((STRIP + TARGET) / 2)
      expect(heading.left).toBe(16)
      expect(offsetsOf(view).glyph).toBe(16)
    },
  )

  // Measured to the baseline, as Material Design measures it, rather than to
  // the bottom of the line box — which is what keeps the bars at their
  // heights. The same figures as padding would make a plain large bar 128px.
  it.each(['md', 'lg'] as const)(
    'sets the %s bar’s last baseline its distance above the bottom edge',
    (size) => {
      for (const subtitle of [undefined, 'Supporting line']) {
        const view = render(
          <AppBar headline="Headline" size={size} subtitle={subtitle} />,
        )
        const bar = barIn(view.container)
        const last =
          subtitle === undefined
            ? view.getByRole('heading', { level: 1 })
            : view.getByText(subtitle)
        const frame = bar.getBoundingClientRect()

        expect(frame.bottom - baselineOf(last)).toBe(BASELINE_FROM_END[size])
        expect(frame.height).toBe(
          subtitle === undefined
            ? HEIGHTS[size].plain
            : HEIGHTS[size].withSubtitle,
        )
        view.unmount()
      }
    },
  )

  // Under the slots rather than between them, so a long headline wraps
  // against the bar's width. Beside a back button and three actions at a
  // phone's width it had a third of that, and four lines.
  it('gives a long headline the width of the bar, not what the slots leave', () => {
    const view = render(
      <div style={PHONE}>
        <AppBar
          headline="A headline long enough to need more than one line"
          leading={ICON_LEADING}
          size="lg"
          subtitle="Supporting line"
          trailing={THREE_ACTIONS}
        />
      </div>,
    )
    const bar = barInWrapper(view.container)
    const heading = view.getByRole('heading', { level: 1 })

    expect(heading.getBoundingClientRect().width).toBe(
      bar.getBoundingClientRect().width - 2 * 16,
    )
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
  // Material Design's own tokens alias the type scale, and the flexible bars
  // take a step up from its other medium and large bars: headlineMedium and
  // displaySmall rather than headlineSmall and headlineMedium. The subtitle
  // has a role per size too, rather than one at every size.
  it.each(SIZES)('sets the %s bar in its type roles', (size) => {
    const view = render(
      <AppBar headline="Headline" size={size} subtitle="Supporting line" />,
    )
    const lines = {
      headline: getComputedStyle(view.getByRole('heading', { level: 1 })),
      subtitle: getComputedStyle(view.getByText('Supporting line')),
    }

    for (const line of ['headline', 'subtitle'] as const) {
      expect([lines[line].fontSize, lines[line].lineHeight]).toEqual(
        ROLES[size][line],
      )
    }
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
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
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

  // The type is the six levels, so a level outside them is a compile error
  // rather than a heading rounded or clamped into one of them.
  it('takes the six heading levels and nothing else', () => {
    // @ts-expect-error -- there is no heading level 0
    expect(render(<AppBar headingLevel={0} />).container).not.toBeNull()
    // @ts-expect-error -- `h7` is a custom element, not a heading
    expect(render(<AppBar headingLevel={9} />).container).not.toBeNull()
  })

  // A value from a call site the type does not reach still draws a heading.
  // `NaN` rounded and clamped to no element at all, which took the headline
  // out of the outline without a word.
  it.each([Number.NaN, 0, 2.5, 9])(
    'falls back to an h1 for a level of %s',
    (level) => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the untyped call site under test
      const untyped = level as 1
      const view = render(<AppBar headingLevel={untyped} headline="Headline" />)

      expect(view.getByRole('heading', { level: 1 }).textContent).toBe(
        'Headline',
      )
    },
  )
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

  // Material Design keeps the subtitle in the collapsed bar, in the small
  // bar's own role, and the two lines fit its 64px as they fit the small bar.
  it.each(['md', 'lg'] as const)(
    'keeps the %s bar’s subtitle when collapsed',
    (size) => {
      const view = render(
        <AppBar
          collapsed
          headline="Headline"
          size={size}
          subtitle="Supporting line"
        />,
      )
      const bar = barIn(view.container)
      const subtitle = getComputedStyle(view.getByText('Supporting line'))

      expect([subtitle.fontSize, subtitle.lineHeight]).toEqual(
        ROLES.sm.subtitle,
      )
      expect(bar.getBoundingClientRect().height).toBe(STRIP)
    },
  )

  it('gives the subtitle its own role back on expanding', () => {
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
    const bar = barIn(view.container)
    settle(bar)
    const subtitle = getComputedStyle(view.getByText('Supporting line'))

    expect([subtitle.fontSize, subtitle.lineHeight]).toEqual(ROLES.lg.subtitle)
    expect(minHeightOf(bar)).toBe(HEIGHTS.lg.withSubtitle)
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

  // Collapsing moves the text up into the strip the slots never leave, so
  // they stay where they are through the whole change, both ways: at its
  // start, half-way, and once it has settled.
  it.each(['md', 'lg'] as const)(
    'keeps the %s bar’s slots where they are as it collapses and expands',
    (size) => {
      const props = {
        headline: 'Headline',
        leading: ICON_LEADING,
        size,
        subtitle: 'Supporting line',
        trailing: ICON_TRAILING,
      }
      const view = render(<AppBar {...props} />)
      const bar = barIn(view.container)
      const slots = () =>
        ['Back', 'Edit', 'More'].map(
          (name) => placeIn(bar, view.getByRole('button', { name })).top,
        )
      const resting = slots()

      for (const collapsed of [true, false]) {
        view.rerender(<AppBar {...props} collapsed={collapsed} />)
        expect(slots()).toEqual(resting)
        seek(bar, 125)
        expect(slots()).toEqual(resting)
        settle(bar)
        expect(slots()).toEqual(resting)
      }
    },
  )

  // A change of layout rather than of a value, so each line is moved and
  // scaled by a transform that starts from where and how large its glyphs
  // were drawn and ends at none, and the bar's height is animated from the
  // one it had. Both ways: the second row is laid out at the height the bar
  // is heading for, so an expanding bar, squeezed to the strip at first, has
  // its text where it will end.
  it('moves both lines between the second row and the strip', () => {
    const props = {
      headline: 'Headline',
      leading: ICON_LEADING,
      size: 'lg',
      subtitle: 'Supporting line',
    } as const
    const view = render(<AppBar {...props} />)
    const bar = barIn(view.container)
    const lines = () => [
      glyphsIn(bar, view.getByRole('heading', { level: 1 })),
      glyphsIn(bar, view.getByText('Supporting line')),
    ]
    const expanded = lines()

    view.rerender(<AppBar {...props} collapsed />)
    expect(motionIn(bar).length).toBeGreaterThan(0)
    seek(bar, 0)
    lines().forEach((line, index) => {
      expectSameLine(line, expanded[index])
    })
    expect(bar.getBoundingClientRect().height).toBe(HEIGHTS.lg.withSubtitle)

    settle(bar)
    const collapsed = lines()
    expect(placeIn(bar, view.getByRole('heading', { level: 1 })).left).toBe(56)
    collapsed.forEach((line, index) => {
      expect(line.left).toBe(collapsed[0].left)
      expect(line.top + line.height).toBeLessThan(STRIP)
      expect(line.height).toBeLessThan(expanded[index].height)
    })
    expect(bar.getBoundingClientRect().height).toBe(STRIP)

    view.rerender(<AppBar {...props} />)
    seek(bar, 0)
    lines().forEach((line, index) => {
      expectSameLine(line, collapsed[index])
    })
    expect(bar.getBoundingClientRect().height).toBe(STRIP)

    settle(bar)
    expect(lines()).toEqual(expanded)
  })

  // The measurement holds still the edge the text hangs from, which is the
  // right edge in a right-to-left page and the middle in a centred bar: the
  // headline's box is wider in the second row than between the slots, so
  // its left edge says nothing about where the text is in either. A centred
  // headline is on the bar's middle in both rows, so its middle moves only
  // where a wide slot pushes it off that in the strip: three actions against
  // a back button, at a phone's width.
  it.each([
    {
      align: 'start',
      dir: 'rtl',
      edge: (box: { left: number; right: number }) => box.right,
      name: 'the right edge of a right-to-left',
      trailing: ICON_TRAILING,
    },
    {
      align: 'center',
      dir: 'ltr',
      edge: (box: { left: number; right: number }) =>
        (box.left + box.right) / 2,
      name: 'the middle of a centred',
      trailing: THREE_ACTIONS,
    },
  ] as const)(
    'moves the headline from $name bar’s second row',
    ({ align, dir, edge, trailing }) => {
      const props = {
        align,
        headline: 'Headline',
        leading: ICON_LEADING,
        size: 'lg',
        trailing,
      } as const
      const view = render(
        <div dir={dir} style={PHONE}>
          <AppBar {...props} />
        </div>,
      )
      const bar = barInWrapper(view.container)
      const headline = () => {
        const glyphs = glyphsIn(bar, view.getByRole('heading', { level: 1 }))
        return { edge: edge(glyphs), top: glyphs.top }
      }
      const expanded = headline()

      view.rerender(
        <div dir={dir} style={PHONE}>
          <AppBar {...props} collapsed />
        </div>,
      )
      seek(bar, 0)
      expect(headline().edge).toBeCloseTo(expanded.edge, 0)
      expect(headline().top).toBeCloseTo(expanded.top, 0)

      settle(bar)
      expect(headline().edge).not.toBeCloseTo(expanded.edge, 0)
    },
  )

  // Turned round half-way, it starts back from where it has got to rather
  // than from the end it was heading for.
  it('turns round from where it has got to', () => {
    const props = {
      headline: 'Headline',
      leading: ICON_LEADING,
      size: 'lg',
      subtitle: 'Supporting line',
    } as const
    const view = render(<AppBar {...props} />)
    const bar = barIn(view.container)
    const lines = () => [
      glyphsIn(bar, view.getByRole('heading', { level: 1 })),
      glyphsIn(bar, view.getByText('Supporting line')),
    ]

    view.rerender(<AppBar {...props} collapsed />)
    seek(bar, 125)
    const halfway = lines()
    const height = bar.getBoundingClientRect().height
    expect(height).toBeLessThan(HEIGHTS.lg.withSubtitle)
    expect(height).toBeGreaterThan(STRIP)

    view.rerender(<AppBar {...props} />)
    seek(bar, 0)
    lines().forEach((line, index) => {
      expectSameLine(line, halfway[index])
    })
    expect(bar.getBoundingClientRect().height).toBeCloseTo(height, 0)
  })

  // Read when the state changes, as useRipple reads it at a press. The
  // stylesheet's own reduced-motion rules are pinned in
  // src/styles/reduced-motion.test.tsx; this is the half they cannot reach.
  it('moves nothing under reduced motion', () => {
    const matchMedia = window.matchMedia.bind(window)
    const spy = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query) =>
        matchMedia(query.includes('prefers-reduced-motion') ? 'all' : query),
      )
    try {
      const props = { headline: 'Headline', size: 'lg' } as const
      const view = render(<AppBar {...props} />)
      view.rerender(<AppBar {...props} collapsed />)

      expect(motionIn(barIn(view.container))).toHaveLength(0)
    } finally {
      spy.mockRestore()
    }
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

// The colours the page gives a bar's icons, read off probes drawn in them.
const roleStyles = stylex.create({
  onSurface: { color: colors.onSurface },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
})

function colourOf(role: keyof typeof roleStyles) {
  const probe = document.createElement('span')
  probe.className = stylex.props(roleStyles[role]).className ?? ''
  document.body.append(probe)
  const colour = getComputedStyle(probe).color
  probe.remove()
  return colour
}

/** The middle of the text a heading draws, across the bar. */
function inkMiddleOf(heading: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(heading)
  const box = range.getBoundingClientRect()
  return (box.left + box.right) / 2
}

/** The middle of an element's box, across the bar. */
function middleOf(element: Element) {
  const box = element.getBoundingClientRect()
  return (box.left + box.right) / 2
}

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

  // Material Design centres the text on the bar rather than in the room the
  // slots leave, which differs whenever the two sides do: one slot and no
  // other, or a back button against three actions.
  describe.each([
    ['a leading slot alone', ICON_LEADING, undefined],
    ['the trailing slot alone', undefined, ICON_TRAILING],
    ['both slots', ICON_LEADING, ICON_TRAILING],
    ['a leading slot against three actions', ICON_LEADING, THREE_ACTIONS],
    ['no slots', undefined, undefined],
  ])('with %s', (_name, leading, trailing) => {
    it.each(['sm', 'md', 'lg', 'collapsed'] as const)(
      'centres the headline on the bar at %s',
      (size) => {
        const view = render(
          <div style={WIDE}>
            <AppBar
              align="center"
              collapsed={size === 'collapsed'}
              headline="Headline"
              leading={leading}
              size={size === 'collapsed' ? 'lg' : size}
              trailing={trailing}
            />
          </div>,
        )
        const bar = barInWrapper(view.container)

        expect(
          inkMiddleOf(view.getByRole('heading', { level: 1 })),
        ).toBeCloseTo(middleOf(bar), 0)
      },
    )
  })

  // The slots stay where a bar at the start has them: the leading glyph and
  // the last trailing one on the inset. Each is as wide as what it holds,
  // rather than stretching across the share of the row its column takes.
  it('keeps the slots on the inset', () => {
    const view = render(
      <AppBar
        align="center"
        headline="Headline"
        leading={ICON_LEADING}
        trailing={THREE_ACTIONS}
      />,
    )
    const bar = barIn(view.container).getBoundingClientRect()
    const leading = view
      .getByRole('button', { name: 'Back' })
      .parentElement!.getBoundingClientRect()
    const trailing = view
      .getByRole('button', { name: 'Edit' })
      .parentElement!.getBoundingClientRect()

    expect(glyphAt(view.container, 0).left - bar.left).toBe(16)
    expect(bar.right - glyphAt(view.container, 3).right).toBe(16)
    // Half of what a 48 target leaves around a 24 glyph.
    expect(leading.right - glyphAt(view.container, 0).right).toBe(12)
    expect(glyphAt(view.container, 1).left - trailing.left).toBe(12)
  })

  // Where the text is wider than a side's share, it moves off the middle as
  // far as the wider slot needs and no further, rather than running under
  // it, and wraps against the room left.
  it('moves a long headline off the middle rather than under a slot', () => {
    const view = render(
      <div style={PHONE}>
        <AppBar
          align="center"
          headline="A headline long enough to need more than one line"
          leading={ICON_LEADING}
          trailing={THREE_ACTIONS}
        />
      </div>,
    )
    const bar = barInWrapper(view.container)
    const heading = view.getByRole('heading', { level: 1 })
    const text = heading.parentElement
    const leadingSlot = rowOf(bar).firstElementChild
    const trailingSlot = rowOf(bar).lastElementChild
    if (text === null || leadingSlot === null || trailingSlot === null) {
      throw new Error('expected the slots either side of the text')
    }

    expect(text.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      leadingSlot.getBoundingClientRect().right,
    )
    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
      trailingSlot.getBoundingClientRect().left,
    )
    expect(Math.abs(middleOf(text) - middleOf(bar))).toBeGreaterThan(1)
    expect(heading.getBoundingClientRect().height).toBeGreaterThan(28)
  })

  // A headline too long for the middle takes the whole room between the
  // leading slot and the inset, as a bar at the start gives it, and an edge
  // with no slot keeps it off by the inset.
  it('gives a long headline the room up to the inset where there is no slot', () => {
    const view = render(
      <div style={NARROW}>
        <AppBar
          align="center"
          headline="A headline long enough to need more than one line"
          leading={ICON_LEADING}
        />
      </div>,
    )
    const bar = barInWrapper(view.container)
    const text = view.getByRole('heading', { level: 1 }).parentElement

    expect(
      text!.getBoundingClientRect().left - bar.getBoundingClientRect().left,
    ).toBeCloseTo(56, 0)
    expect(
      bar.getBoundingClientRect().right - text!.getBoundingClientRect().right,
    ).toBeCloseTo(16, 0)
  })
})

// The page gives a bar's leading icon on surface, and its trailing icons the
// on surface variant a standard icon button draws in anyway.
describe('slot colours', () => {
  it('draws the leading icon on surface and the trailing on surface variant', () => {
    const view = render(
      <AppBar
        headline="Headline"
        leading={ICON_LEADING}
        trailing={ICON_TRAILING}
      />,
    )
    const [back, edit, more] = view.getAllByRole('button')

    expect(colourOf('onSurface')).not.toBe(colourOf('onSurfaceVariant'))
    expect(getComputedStyle(back).color).toBe(colourOf('onSurface'))
    expect(getComputedStyle(back.parentElement!).color).toBe(
      colourOf('onSurface'),
    )
    for (const button of [edit, more]) {
      expect(getComputedStyle(button).color).toBe(colourOf('onSurfaceVariant'))
      expect(getComputedStyle(button.parentElement!).color).toBe(
        colourOf('onSurfaceVariant'),
      )
    }
  })

  it('keeps a disabled leading icon faded', () => {
    const view = render(
      <>
        <AppBar headline="Headline" leading={DISABLED_LEADING} />
        <IconButton aria-label="Elsewhere" isDisabled>
          {GLYPH}
        </IconButton>
      </>,
    )

    expect(
      getComputedStyle(view.getByRole('button', { name: 'Back' })).color,
    ).toBe(
      getComputedStyle(view.getByRole('button', { name: 'Elsewhere' })).color,
    )
  })

  // The leading colour reaches what the slot holds on the page, not what it
  // holds in the component tree: a menu or a sheet opened from the slot is
  // portalled out of it, and its buttons keep their own colour.
  it('leaves an icon button portalled out of the slot its own colour', () => {
    const view = render(
      <AppBar
        headline="Headline"
        leading={createPortal(
          <IconButton aria-label="Close">{GLYPH}</IconButton>,
          document.body,
        )}
      />,
    )

    expect(
      getComputedStyle(view.getByRole('button', { name: 'Close' })).color,
    ).toBe(colourOf('onSurfaceVariant'))
  })
})

// A pinned bar is held at the top of its scroll container, and painted over
// the content that scrolls under it — most of the library's controls are
// positioned, and with no layer of its own the bar was painted under them.
describe('pinned', () => {
  it('sticks to the top of its scroll container, on the bar layer', () => {
    const view = render(<AppBar headline="Headline" pinned />)
    const style = getComputedStyle(barIn(view.container))

    expect(style.position).toBe('sticky')
    expect(style.insetBlockStart).toBe('0px')
    expect(style.zIndex).toBe('10')
  })

  it('stays in the flow, on no layer, when not pinned', () => {
    const view = render(<AppBar headline="Headline" />)
    const style = getComputedStyle(barIn(view.container))

    expect(style.position).toBe('static')
    expect(style.zIndex).toBe('auto')
  })

  it('stays over positioned content scrolled beneath it', () => {
    const view = render(
      <div data-testid="scroller" {...stylex.props(pinnedStyles.scroller)}>
        <AppBar headline="Headline" pinned />
        <div {...stylex.props(pinnedStyles.block)} />
      </div>,
    )
    const scroller = view.getByTestId('scroller')
    act(() => {
      scroller.scrollTop = 120
    })
    const bar = barIn(scroller)
    const box = bar.getBoundingClientRect()

    expect(box.top).toBe(scroller.getBoundingClientRect().top)
    expect(
      bar.contains(
        document.elementFromPoint(box.left + box.width / 2, box.bottom - 4),
      ),
    ).toBe(true)
  })
})

describe('element', () => {
  it('renders a header by default', () => {
    const view = render(<AppBar headline="Headline" />)

    expect(barIn(view.container).tagName).toBe('HEADER')
  })
})
