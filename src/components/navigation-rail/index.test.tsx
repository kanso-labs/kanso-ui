import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import NavigationRail from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import { colors, typography } from '../../tokens/design.tokens.stylex'

const FORCED_COLORS = 'forced-colors: active'

const probeStyles = stylex.create({
  labelLarge: { fontSize: typography.labelLargeSize },
  labelMedium: { fontSize: typography.labelMediumSize },
  onSecondaryContainer: { color: colors.onSecondaryContainer },
  secondaryContainer: { backgroundColor: colors.secondaryContainer },
  surface: { backgroundColor: colors.surface },
})

function Icon() {
  return <svg aria-hidden="true" height="1em" viewBox="0 0 24 24" width="1em" />
}

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const ICON = <Icon />
const HEADER = <button type="button">Menu</button>

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

    it('starts the destinations 44dp down, 4dp apart', () => {
      const view = render(<Rail />)
      const rail = view.getByRole('navigation').getBoundingClientRect()
      const [first, second] = view
        .getAllByRole('link')
        .map((link) => link.getBoundingClientRect())

      expect(first.top - rail.top).toBe(44)
      expect(second.top - first.bottom).toBe(4)
    })

    it('puts a header above the destinations, 8dp clear of the first', () => {
      const view = render(<Rail header={HEADER} />)
      const header = view.getByRole('button', { name: 'Menu' })
      const first = view.getAllByRole('link')[0].getBoundingClientRect()

      expect(header.getBoundingClientRect().bottom).toBeLessThan(first.top)
      expect(
        first.top - (header.parentElement?.getBoundingClientRect().bottom ?? 0),
      ).toBe(8)
    })
  })

  describe('expanded', () => {
    it('keeps a header 8dp clear of the first destination too', () => {
      const view = render(<Rail header={HEADER} isExpanded />)
      const header = view.getByRole('button', { name: 'Menu' }).parentElement
      const first = view.getAllByRole('link')[0].getBoundingClientRect()

      expect(first.top - (header?.getBoundingClientRect().bottom ?? 0)).toBe(8)
    })

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
