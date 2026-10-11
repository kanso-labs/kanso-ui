import type { RenderResult } from '@testing-library/react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { RouterProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import NavigationRail from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

const FORCED_COLORS = 'forced-colors: active'

const probeStyles = stylex.create({
  focusedOverCurrent: {
    backgroundColor: `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
  },
  labelLarge: { fontSize: typography.labelLargeSize },
  labelMedium: { fontSize: typography.labelMediumSize },
  onSecondaryContainer: { color: colors.onSecondaryContainer },
  secondaryContainer: { backgroundColor: colors.secondaryContainer },
  surface: { backgroundColor: colors.surface },
})

// The frames the layout cases put the rail in: a row beside a page far wider
// than the window, and a column shorter than ten destinations.
const frameStyles = stylex.create({
  row: { display: 'flex' },
  short: { blockSize: '440px', display: 'flex' },
  wide: { flexShrink: 0, inlineSize: '3000px' },
})

function Icon() {
  return <svg aria-hidden="true" height="1em" viewBox="0 0 24 24" width="1em" />
}

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const ICON = <Icon />
const HEADER = <button type="button">Menu</button>
const MENU_BUTTON = (
  <IconButton aria-label="Menu">
    <Icon />
  </IconButton>
)

// Ten destinations, more than a 440px rail holds in either form.
const TEN = Array.from({ length: 10 }, (_, index) => (
  <NavigationRail.Item href={`#${index}`} icon={ICON} key={index}>
    {`Item ${String(index + 1).padStart(2, '0')}`}
  </NavigationRail.Item>
))

/** The block the rail scrolls its destinations in: what holds the links. */
function destinationsOf(view: RenderResult) {
  const block = view.getAllByRole('link')[0].parentElement
  if (block === null) {
    throw new Error('expected the destinations to sit in a block')
  }
  return block
}

// Focus as a keyboard brings it, which is what React Aria reports as
// focus-visible and what the layer and the ring are drawn from.
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' })
  act(() => {
    element.focus()
  })
}

// The box the rail draws its header in, around the call site's element.
function headerBoxOf(view: RenderResult) {
  const box = view.getByRole('button', { name: 'Menu' }).parentElement
  if (!box) {
    throw new Error('expected the header to sit in a box')
  }
  return box.getBoundingClientRect()
}

/** The box of the icon inside `element`. */
function iconIn(element: HTMLElement) {
  const icon = element.querySelector('svg')
  if (icon === null) {
    throw new Error('expected an icon')
  }
  return icon.getBoundingClientRect()
}

// The indicator a destination draws its icon in, and the label after it.
function partsOf(link: HTMLElement) {
  const indicator = link.firstElementChild
  const label = link.lastElementChild
  if (
    !(indicator instanceof HTMLElement) ||
    !(label instanceof HTMLElement) ||
    indicator === label
  ) {
    throw new Error('expected the destination to draw an indicator and a label')
  }
  return { indicator, label }
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

function Rail(props: Partial<Parameters<typeof NavigationRail>[0]>) {
  return (
    <NavigationRail aria-label="Label" selectedRoute="#second" {...props}>
      <NavigationRail.Item href="#first" icon={ICON}>
        First item
      </NavigationRail.Item>
      <NavigationRail.Item href="#second" icon={ICON}>
        Second item
      </NavigationRail.Item>
      <NavigationRail.Item href="#third" icon={ICON}>
        Third item
      </NavigationRail.Item>
    </NavigationRail>
  )
}

describe('navigation rail', () => {
  describe('structure', () => {
    it('is a named navigation landmark of links', () => {
      const view = render(<Rail />)

      expect(view.getByRole('navigation', { name: 'Label' }).tagName).toBe(
        'NAV',
      )
      expect(view.getAllByRole('link')).toHaveLength(3)
    })

    it('marks the destination selectedRoute names as the current page', () => {
      const view = render(<Rail />)

      expect(view.getByRole('link', { name: 'Second item' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(
        view.getByRole('link', { name: 'First item' }),
      ).not.toHaveAttribute('aria-current')
    })

    // A destination is React Aria's Link, so a press goes through the app's
    // router rather than reloading the page — see the bar's test for why a
    // click stands in for Enter.
    it("routes through the app's RouterProvider", () => {
      const navigate = vi.fn<(path: string) => void>()
      const view = render(
        <RouterProvider navigate={navigate}>
          <Rail />
        </RouterProvider>,
      )

      fireEvent.click(view.getByRole('link', { name: 'Third item' }))

      expect(navigate).toHaveBeenCalledWith('#third', undefined)
    })
  })

  describe('collapsed', () => {
    it("is the page's 96dp column on the surface", () => {
      const view = render(<Rail />)
      const rail = view.getByRole('navigation')

      expect(rail.getBoundingClientRect().width).toBe(96)
      expect(getComputedStyle(rail).backgroundColor).toBe(
        probe(probeStyles.surface).background,
      )
    })

    it('puts the label under a 56dp by 32dp indicator, in label medium', () => {
      const view = render(<Rail />)
      const { indicator, label } = partsOf(
        view.getByRole('link', { name: 'Second item' }),
      )
      const box = indicator.getBoundingClientRect()

      expect([box.width, box.height]).toEqual([56, 32])
      expect(getComputedStyle(indicator).backgroundColor).toBe(
        probe(probeStyles.secondaryContainer).background,
      )
      expect(label.getBoundingClientRect().top - box.bottom).toBe(4)
      expect(getComputedStyle(label).fontSize).toBe(
        probe(probeStyles.labelMedium).fontSize,
      )
    })

    it('lays the focus layer and the ring on the indicator for a keyboard', () => {
      const view = render(<Rail />)
      const current = view.getByRole('link', { name: 'Second item' })
      const { indicator } = partsOf(current)

      focusByKeyboard(current)

      expect(getComputedStyle(indicator).backgroundColor).toBe(
        probe(probeStyles.focusedOverCurrent).background,
      )
      expect(getComputedStyle(indicator).outlineStyle).toBe('solid')
      expect(getComputedStyle(current).outlineStyle).toBe('none')
    })

    it('draws 64dp destinations 4dp apart, starting 44dp down', () => {
      const view = render(<Rail />)
      const rail = view.getByRole('navigation').getBoundingClientRect()
      const [first, second] = view
        .getAllByRole('link')
        .map((link) => link.getBoundingClientRect())

      expect(first.top - rail.top).toBe(44)
      expect(first.height).toBe(64)
      expect(second.top - first.bottom).toBe(4)
    })

    it('puts a header 44dp down, 40dp clear of the first destination', () => {
      const view = render(<Rail header={HEADER} />)
      const rail = view.getByRole('navigation').getBoundingClientRect()
      const header = headerBoxOf(view)
      const first = view.getAllByRole('link')[0].getBoundingClientRect()

      expect(header.top - rail.top).toBe(44)
      expect(first.top - header.bottom).toBe(40)
    })
  })

  describe('expanded', () => {
    it('puts a header 44dp down, 40dp clear of the first destination too', () => {
      const view = render(<Rail header={HEADER} isExpanded />)
      const rail = view.getByRole('navigation').getBoundingClientRect()
      const header = headerBoxOf(view)
      const first = view.getAllByRole('link')[0].getBoundingClientRect()

      expect(header.top - rail.top).toBe(44)
      expect(first.top - header.bottom).toBe(40)
    })

    // The header spans the rail, so a menu button sits at its leading edge
    // as the pills do, with its icon over theirs rather than in the middle.
    // The leading edge is the left under left-to-right and the right under
    // right-to-left.
    it.each([
      { dir: 'ltr', edge: 'left' },
      { dir: 'rtl', edge: 'right' },
    ] as const)(
      'lines the header button icon up with the destination icons, $dir',
      ({ dir, edge }) => {
        const view = render(
          <div dir={dir}>
            <Rail header={MENU_BUTTON} isExpanded />
          </div>,
        )

        expect(iconIn(view.getByRole('button', { name: 'Menu' }))[edge]).toBe(
          iconIn(view.getAllByRole('link')[0])[edge],
        )
      },
    )

    it('is between 220dp and 360dp wide', () => {
      const view = render(<Rail isExpanded />)
      const width = view.getByRole('navigation').getBoundingClientRect().width

      expect(width).toBeGreaterThanOrEqual(220)
      expect(width).toBeLessThanOrEqual(360)
    })

    it("draws each destination as the page's 56dp pill, its label beside the icon", () => {
      const view = render(<Rail isExpanded />)
      const current = view.getByRole('link', { name: 'Second item' })
      const { indicator, label } = partsOf(current)

      expect(current.getBoundingClientRect().height).toBe(56)
      expect(getComputedStyle(current).backgroundColor).toBe(
        probe(probeStyles.secondaryContainer).background,
      )
      expect(
        label.getBoundingClientRect().left -
          indicator.getBoundingClientRect().right,
      ).toBe(8)
      expect(getComputedStyle(label).fontSize).toBe(
        probe(probeStyles.labelLarge).fontSize,
      )
      // Inside the pill, the pair every scheme holds to 4.5:1.
      expect(getComputedStyle(label).color).toBe(
        probe(probeStyles.onSecondaryContainer).color,
      )
    })

    it('lays the focus layer and the ring on the pill for a keyboard', () => {
      const view = render(<Rail isExpanded />)
      const current = view.getByRole('link', { name: 'Second item' })

      focusByKeyboard(current)

      expect(getComputedStyle(current).backgroundColor).toBe(
        probe(probeStyles.focusedOverCurrent).background,
      )
      expect(getComputedStyle(current).outlineStyle).toBe('solid')
      expect(getComputedStyle(partsOf(current).indicator).outlineStyle).toBe(
        'none',
      )
    })

    it('sets the pills 20dp in from the leading edge', () => {
      const view = render(<Rail isExpanded />)
      const rail = view.getByRole('navigation').getBoundingClientRect()
      const first = view.getAllByRole('link')[0].getBoundingClientRect()

      expect(first.left - rail.left).toBe(20)
    })

    it('keeps the pills at the leading edge under right-to-left', () => {
      const view = render(
        <div dir="rtl">
          <Rail isExpanded />
        </div>,
      )
      const rail = view.getByRole('navigation').getBoundingClientRect()
      const first = view.getAllByRole('link')[0].getBoundingClientRect()

      expect(rail.right - first.right).toBe(20)
    })

    // A count overhangs the icon on the label's side by up to 22dp, against
    // the 8dp between the two, so the mark joins the flow beside the icon
    // and the label starts after it.
    it.each([3, 99, 1000])(
      'starts the label after a count badge of %i',
      (count) => {
        const view = render(
          <NavigationRail aria-label="Label" isExpanded>
            <NavigationRail.Item
              aria-label={`First item, ${count} new`}
              badge={count}
              href="#first"
              icon={ICON}
            >
              First item
            </NavigationRail.Item>
          </NavigationRail>,
        )
        const link = view.getByRole('link', {
          name: `First item, ${count} new`,
        })
        const mark = link.querySelector('span[aria-hidden="true"]')
        if (mark === null) {
          throw new Error('expected the destination to draw a badge')
        }

        expect(
          partsOf(link).label.getBoundingClientRect().left,
        ).toBeGreaterThan(mark.getBoundingClientRect().right)
      },
    )
  })

  describe('layout', () => {
    // A flex item shrinks by default, and beside a wide page the collapsed
    // rail came to 85dp.
    it('keeps its width beside a page wider than the window', () => {
      const view = render(
        <div {...stylex.props(frameStyles.row)}>
          <Rail />
          <div {...stylex.props(frameStyles.wide)} />
        </div>,
      )

      expect(view.getByRole('navigation').getBoundingClientRect().width).toBe(
        96,
      )
    })

    // Ten destinations in a 440px rail: they keep their height and scroll in
    // their own block, rather than squashing below the target when expanded
    // or running past the rail's surface when collapsed.
    it.each([
      { height: 64, isExpanded: false, name: 'collapsed' },
      { height: 56, isExpanded: true, name: 'expanded' },
    ])(
      'scrolls ten destinations at $height dp each, $name',
      ({ height, isExpanded }) => {
        const view = render(
          <div {...stylex.props(frameStyles.short)}>
            <NavigationRail
              aria-label="Label"
              header={HEADER}
              isExpanded={isExpanded}
            >
              {TEN}
            </NavigationRail>
          </div>,
        )
        const rail = view.getByRole('navigation').getBoundingClientRect()
        const block = destinationsOf(view)

        for (const link of view.getAllByRole('link')) {
          expect(link.getBoundingClientRect().height).toBe(height)
        }
        expect(getComputedStyle(block).overflowY).toBe('auto')
        expect(block.scrollHeight).toBeGreaterThan(block.clientHeight)
        expect(block.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          rail.bottom,
        )

        // The header stays put while the destinations scroll under it.
        const header = headerBoxOf(view).top
        block.scrollTop = 200
        expect(block.scrollTop).toBe(200)
        expect(headerBoxOf(view).top).toBe(header)
        expect(header - rail.top).toBe(44)
      },
    )
  })

  describe('under forced colours', () => {
    it('rings the current destination in Highlight, collapsed or expanded', () => {
      const collapsed = render(<Rail />)
      const indicator = partsOf(
        collapsed.getByRole('link', { name: 'Second item' }),
      ).indicator
      expect(
        declarationsHeld(indicator, FORCED_COLORS).get('border-top-color'),
      ).toBe('highlight')
      collapsed.unmount()

      const expanded = render(<Rail isExpanded />)
      expect(
        declarationsHeld(
          expanded.getByRole('link', { name: 'Second item' }),
          FORCED_COLORS,
        ).get('border-top-color'),
      ).toBe('highlight')
    })
  })
})
