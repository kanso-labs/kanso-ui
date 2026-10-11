import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { RouterProvider } from 'react-aria-components'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import NavigationBar from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The width every spec in this browser runs at unless it says otherwise —
// see src/styles/picker.test.tsx — and a compact one under the 600px the bar
// changes form at.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }
const COMPACT_WIDTH = 400

const FORCED_COLORS = 'forced-colors: active'

const probeStyles = stylex.create({
  focusedOverCurrent: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
  },
  hoveredOverCurrent: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
  },
  labelMedium: { fontSize: typography.labelMediumSize },
  onSecondaryContainer: { color: colors.onSecondaryContainer },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  secondary: { color: colors.secondary },
  secondaryContainer: { backgroundColor: colors.secondaryContainer },
  surfaceContainer: { backgroundColor: colors.surfaceContainer },
})

function Icon() {
  return <svg aria-hidden="true" height="1em" viewBox="0 0 24 24" width="1em" />
}

// Hoisted so it is one stable element per render, which is what react-perf's
// no-jsx-as-prop is after.
const ICON = <Icon />

function Bar(props: Partial<Parameters<typeof NavigationBar>[0]>) {
  return (
    <NavigationBar aria-label="Label" selectedRoute="#second" {...props}>
      <NavigationBar.Item href="#first" icon={ICON}>
        First item
      </NavigationBar.Item>
      <NavigationBar.Item
        aria-label="Second item, 3 new"
        badge={3}
        href="#second"
        icon={ICON}
      >
        Second item
      </NavigationBar.Item>
      <NavigationBar.Item href="#third" icon={ICON}>
        Third item
      </NavigationBar.Item>
    </NavigationBar>
  )
}

/** A bar whose second destination carries a count badge of `count`. */
function Counted({ count }: { count: number }) {
  return (
    <NavigationBar aria-label="Label">
      <NavigationBar.Item href="#first" icon={ICON}>
        First item
      </NavigationBar.Item>
      <NavigationBar.Item
        aria-label={`Second item, ${count} new`}
        badge={count}
        href="#second"
        icon={ICON}
      >
        Second item
      </NavigationBar.Item>
    </NavigationBar>
  )
}

// Focus as a keyboard brings it, which is what React Aria reports as
// focus-visible and what the layer and the ring are drawn from.
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' })
  act(() => {
    element.focus()
  })
}

// The indicator a destination draws its icon in, which is the first thing
// it renders.
function indicatorOf(link: HTMLElement) {
  const indicator = link.firstElementChild
  if (!(indicator instanceof HTMLElement)) {
    throw new Error('expected the destination to draw an indicator')
  }
  return indicator
}

function labelOf(link: HTMLElement) {
  const label = link.lastElementChild
  if (!(label instanceof HTMLElement) || label === indicatorOf(link)) {
    throw new Error('expected the destination to draw a label')
  }
  return label
}

/** A count badge's mark: the badge's own span, hidden from the tree. */
function markOf(link: HTMLElement) {
  const mark = link.querySelector('span[aria-hidden="true"]')
  if (!(mark instanceof HTMLElement)) {
    throw new Error('expected the destination to draw a badge')
  }
  return mark
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    background: computed.backgroundColor,
    color: computed.color,
    fontSize: computed.fontSize,
  }
  view.unmount()
  return read
}

// Five labels long enough that their horizontal destinations need more than
// a medium window's first few hundred pixels, as five translated labels do.
const LONG_LABELS = [
  'First destination',
  'Second destination',
  'Third destination',
  'Fourth destination',
  'Fifth destination',
]

/** Whether any label in the bar is cut short. */
function anyCut(links: HTMLElement[]) {
  return links.some((link) => {
    const label = labelOf(link)
    return label.scrollWidth > label.clientWidth
  })
}

function LongLabels() {
  return (
    <NavigationBar aria-label="Label">
      {LONG_LABELS.map((label) => (
        <NavigationBar.Item href={`#${label}`} icon={ICON} key={label}>
          {label}
        </NavigationBar.Item>
      ))}
    </NavigationBar>
  )
}

afterAll(async () => {
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

describe('navigation bar', () => {
  describe('structure', () => {
    it('is a named navigation landmark of links', () => {
      const view = render(<Bar />)
      const bar = view.getByRole('navigation', { name: 'Label' })

      expect(bar.tagName).toBe('NAV')
      expect(view.getAllByRole('link')).toHaveLength(3)
    })

    it('marks the destination selectedRoute names as the current page', () => {
      const view = render(<Bar />)

      expect(
        view.getByRole('link', { name: 'Second item, 3 new' }),
      ).toHaveAttribute('aria-current', 'page')
      for (const name of ['First item', 'Third item']) {
        expect(view.getByRole('link', { name })).not.toHaveAttribute(
          'aria-current',
        )
      }
    })

    it('marks none when selectedRoute names no destination', () => {
      const view = render(<Bar selectedRoute="#elsewhere" />)

      for (const link of view.getAllByRole('link')) {
        expect(link).not.toHaveAttribute('aria-current')
      }
    })

    // A destination is React Aria's Link, so a press goes through the app's
    // router rather than reloading the page. The click stands in for Enter
    // too: on a native link React Aria leaves that key to the browser, whose
    // activation is this same click.
    it("routes through the app's RouterProvider", () => {
      const navigate = vi.fn<(path: string) => void>()
      const view = render(
        <RouterProvider navigate={navigate}>
          <Bar />
        </RouterProvider>,
      )

      fireEvent.click(view.getByRole('link', { name: 'Third item' }))

      expect(navigate).toHaveBeenCalledWith('#third', undefined)
    })

    // The badge is hidden from assistive technology, so the name the call
    // site gives is what a reader hears.
    it('draws a badge on the icon, leaving the name to the destination', () => {
      const view = render(<Bar />)
      const link = view.getByRole('link', { name: 'Second item, 3 new' })
      const mark = indicatorOf(link).querySelector(
        '[aria-hidden="true"]:not(svg)',
      )

      expect(mark?.textContent).toBe('3')
    })
  })

  describe('in a compact window', () => {
    beforeAll(async () => {
      await page.viewport(COMPACT_WIDTH, DEFAULT_VIEWPORT.height)
    })

    afterAll(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    // The label is under the icon here, so the badge places its own mark on
    // the icon's corner, out of the flow.
    it('leaves a count badge where the badge puts it', () => {
      const view = render(<Counted count={99} />)
      const link = view.getByRole('link', { name: 'Second item, 99 new' })

      expect(getComputedStyle(markOf(link)).position).toBe('absolute')
    })

    it("is the page's 64dp bar on the surface container", () => {
      const view = render(<Bar />)
      const bar = view.getByRole('navigation')

      expect(bar.getBoundingClientRect().height).toBe(64)
      expect(getComputedStyle(bar).backgroundColor).toBe(
        probe(probeStyles.surfaceContainer).background,
      )
    })

    it('shares the width equally between the destinations', () => {
      const view = render(<Bar />)
      const widths = view
        .getAllByRole('link')
        .map((link) => link.getBoundingClientRect().width)

      // A third of 400px is not a whole number of device pixels, so the three
      // are equal to within the rounding of it.
      expect(widths).toHaveLength(3)
      for (const width of widths) {
        expect(width).toBeCloseTo(COMPACT_WIDTH / 3, 1)
      }
    })

    it('puts the label under a 56dp by 32dp indicator, in label medium', () => {
      const view = render(<Bar />)
      const link = view.getByRole('link', { name: 'First item' })
      const indicator = indicatorOf(link).getBoundingClientRect()
      const label = labelOf(link)

      expect([indicator.width, indicator.height]).toEqual([56, 32])
      expect(label.getBoundingClientRect().top - indicator.bottom).toBe(4)
      expect(getComputedStyle(label).fontSize).toBe(
        probe(probeStyles.labelMedium).fontSize,
      )
    })

    it('fills the current indicator, with its icon and label in their roles', () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })
      const other = view.getByRole('link', { name: 'First item' })

      expect(getComputedStyle(indicatorOf(current)).backgroundColor).toBe(
        probe(probeStyles.secondaryContainer).background,
      )
      expect(getComputedStyle(indicatorOf(current)).color).toBe(
        probe(probeStyles.onSecondaryContainer).color,
      )
      expect(getComputedStyle(labelOf(current)).color).toBe(
        probe(probeStyles.secondary).color,
      )
      expect(getComputedStyle(indicatorOf(other)).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
      expect(getComputedStyle(labelOf(other)).color).toBe(
        probe(probeStyles.onSurfaceVariant).color,
      )
    })

    it('lays the hover layer on the indicator', () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })

      fireEvent.pointerOver(current, { pointerType: 'mouse' })

      expect(getComputedStyle(indicatorOf(current)).backgroundColor).toBe(
        probe(probeStyles.hoveredOverCurrent).background,
      )
    })

    it('lays the focus layer and the ring on the indicator for a keyboard', () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })

      focusByKeyboard(current)
      const indicator = getComputedStyle(indicatorOf(current))

      expect(indicator.backgroundColor).toBe(
        probe(probeStyles.focusedOverCurrent).background,
      )
      expect(indicator.outlineStyle).toBe('solid')
      expect(getComputedStyle(current).outlineStyle).toBe('none')
    })

    it('starts the destinations at the leading edge under right-to-left', () => {
      const view = render(
        <div dir="rtl">
          <Bar />
        </div>,
      )
      const [first, , third] = view.getAllByRole('link')

      expect(first.getBoundingClientRect().left).toBeGreaterThan(
        third.getBoundingClientRect().left,
      )
    })
  })

  describe('in a medium or wider window', () => {
    // Inside the pill the current label takes on secondary container, the
    // pair every scheme holds to 4.5:1, where secondary over the pill is not.
    it('sets the current label inside the pill in on secondary container', () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })

      expect(getComputedStyle(labelOf(current)).color).toBe(
        probe(probeStyles.onSecondaryContainer).color,
      )
    })

    it("draws each destination as the page's 40dp horizontal pill", () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })
      const indicator = indicatorOf(current).getBoundingClientRect()
      const label = labelOf(current).getBoundingClientRect()

      expect(current.getBoundingClientRect().height).toBe(40)
      expect(getComputedStyle(current).backgroundColor).toBe(
        probe(probeStyles.secondaryContainer).background,
      )
      expect(label.left - indicator.right).toBe(4)
      expect(indicator.left - current.getBoundingClientRect().left).toBe(16)
    })

    it('lays the focus layer and the ring on the pill for a keyboard', () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })

      focusByKeyboard(current)
      const pill = getComputedStyle(current)

      expect(pill.backgroundColor).toBe(
        probe(probeStyles.focusedOverCurrent).background,
      )
      expect(pill.outlineStyle).toBe('solid')
      expect(getComputedStyle(indicatorOf(current)).outlineStyle).toBe('none')
    })

    it('centres the destinations, as wide as their pills', () => {
      const view = render(<Bar />)
      const bar = view.getByRole('navigation').getBoundingClientRect()
      const links = view.getAllByRole('link')
      const first = links[0].getBoundingClientRect()
      const last = links[links.length - 1].getBoundingClientRect()

      expect(
        Math.abs(first.left - bar.left - (bar.right - last.right)),
      ).toBeLessThanOrEqual(1)
    })

    // A count overhangs the icon on the label's side by up to 22dp, against
    // the 4dp between the two: 99 covered the label's first letter.
    it.each([3, 99, 1000])(
      'starts the label after a count badge of %i',
      (count) => {
        const view = render(<Counted count={count} />)
        const link = view.getByRole('link', {
          name: `Second item, ${count} new`,
        })
        const mark = markOf(link).getBoundingClientRect()
        const icon = indicatorOf(link).getBoundingClientRect()

        expect(labelOf(link).getBoundingClientRect().left).toBeGreaterThan(
          mark.right,
        )
        // Still where the badge puts it: 2dp above the icon and 12dp back
        // over its trailing edge.
        expect(mark.top).toBeCloseTo(icon.top - 2, 0)
        expect(mark.left).toBeCloseTo(icon.left + 24 - 12, 0)
      },
    )

    // The pill is the page's 40dp, and a press 3px above or below it still
    // lands on the destination: the pages' 48dp target, and no further.
    it('takes a press across the 48dp target around the pill', () => {
      const view = render(<Bar />)
      const link = view.getByRole('link', { name: 'Second item, 3 new' })
      const pill = link.getBoundingClientRect()
      const x = pill.left + pill.width / 2
      const hits = (y: number) => link.contains(document.elementFromPoint(x, y))

      expect(hits(pill.top - 3)).toBe(true)
      expect(hits(pill.bottom + 3)).toBe(true)
      expect(hits(pill.top - 6)).toBe(false)
      expect(hits(pill.bottom + 6)).toBe(false)
    })
  })

  // Five horizontal destinations need more than the 600px the form starts
  // at, and drawn there anyway every label was cut short. The bar keeps the
  // vertical form until it is wide enough.
  describe('with labels the horizontal form has no room for', () => {
    it.each([600, 640])('stays vertical at %ipx', async (width) => {
      await page.viewport(width, DEFAULT_VIEWPORT.height)
      const view = render(<LongLabels />)

      for (const link of view.getAllByRole('link')) {
        expect(getComputedStyle(link).flexDirection).toBe('column')
      }
      expect(getComputedStyle(view.getByRole('navigation')).columnGap).toBe(
        '0px',
      )
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it('turns horizontal once the window has room, with no label cut', async () => {
      await page.viewport(600, DEFAULT_VIEWPORT.height)
      const view = render(<LongLabels />)
      const links = view.getAllByRole('link')
      expect(getComputedStyle(links[0]).flexDirection).toBe('column')

      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)

      await expect
        .poll(() => getComputedStyle(links[0]).flexDirection)
        .toBe('row')
      expect(anyCut(links)).toBe(false)
    })

    // Labels that fit keep the page's horizontal form from the breakpoint.
    it('leaves short labels horizontal at 600px', async () => {
      await page.viewport(600, DEFAULT_VIEWPORT.height)
      const view = render(<Bar />)

      for (const link of view.getAllByRole('link')) {
        expect(getComputedStyle(link).flexDirection).toBe('row')
      }
      expect(anyCut(view.getAllByRole('link'))).toBe(false)
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })
  })

  describe('under forced colours', () => {
    // The mode paints the secondary container over in its background, which
    // left the current destination looking like every other.
    it('rings the current indicator in Highlight', () => {
      const view = render(<Bar />)
      const current = view.getByRole('link', { name: 'Second item, 3 new' })
      const rules = declarationsHeld(indicatorOf(current), FORCED_COLORS)

      expect(rules.get('border-top-color')).toBe('highlight')
      expect(rules.get('border-top-width')).toBe('2px')
    })
  })
})
