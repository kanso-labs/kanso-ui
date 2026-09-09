import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ProgressIndicator from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  active: { backgroundColor: colors.primary },
  // The arcs are drawn with a stroke rather than filled, so their roles
  // hash to different classes from the linear parts'.
  activeArc: { stroke: colors.primary },
  track: { backgroundColor: colors.secondaryContainer },
  trackArc: { stroke: colors.secondaryContainer },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  active: classesOf(stylex.props(probeStyles.active)),
  activeArc: classesOf(stylex.props(probeStyles.activeArc)),
  track: classesOf(stylex.props(probeStyles.track)),
  trackArc: classesOf(stylex.props(probeStyles.trackArc)),
}

/** The two arcs of a circular indicator: the track, then the active one. */
function arcsOf(bar: HTMLElement) {
  const svg = bar.querySelector('svg')
  const [track, active] = [...(svg?.children ?? [])]
  if (
    !(svg instanceof SVGElement) ||
    !(track instanceof SVGElement) ||
    !(active instanceof SVGElement)
  ) {
    throw new Error('expected the indicator to draw two arcs')
  }
  return { active, svg, track }
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The three parts of a linear indicator, in the order the page draws them. */
function linearPartsOf(bar: HTMLElement) {
  const row = bar.lastElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the indicator to draw a row')
  }
  const [active, track, stop] = [...row.children]
  if (
    !(active instanceof HTMLElement) ||
    !(track instanceof HTMLElement) ||
    !(stop instanceof HTMLElement)
  ) {
    throw new Error('expected the active indicator, the track and the stop')
  }
  return { active, row, stop, track }
}

function setup(props: Partial<Parameters<typeof ProgressIndicator>[0]> = {}) {
  const view = render(<ProgressIndicator label="Label" value={40} {...props} />)
  return { ...view, bar: view.getByRole('progressbar', { name: 'Label' }) }
}

describe('progress indicator', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the bar this way is the label association itself.
    it('renders a progress bar named by its label', () => {
      const { bar } = setup()
      expect(bar.getAttribute('aria-valuenow')).toBe('40')
      expect(bar.getAttribute('aria-valuemin')).toBe('0')
      expect(bar.getAttribute('aria-valuemax')).toBe('100')
    })

    it('takes a name from aria-label instead', () => {
      const view = render(<ProgressIndicator aria-label="Loading" value={40} />)
      expect(view.getByRole('progressbar', { name: 'Loading' })).not.toBeNull()
    })

    // An indeterminate bar has no value at all, which is what a screen
    // reader reads as work of unknown length.
    it('carries no value while indeterminate', () => {
      const view = render(<ProgressIndicator isIndeterminate label="Label" />)
      const bar = view.getByRole('progressbar', { name: 'Label' })
      expect(bar.getAttribute('aria-valuenow')).toBeNull()
    })

    it('shows the value beside the label when asked', () => {
      const view = setup({ showValue: true })
      expect(view.getByText('40%')).not.toBeNull()
    })

    it('shows no value while indeterminate, even when asked', () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" showValue />,
      )
      expect(view.queryByText('0%')).toBeNull()
    })

    // The value reads in the page's locale, which is the runner's en-US.
    it('reads the value in the format it is given', () => {
      const view = setup({
        formatOptions: { style: 'decimal' },
        showValue: true,
      })
      expect(view.getByText('40')).not.toBeNull()
    })
  })

  describe('linear', () => {
    // The page's anatomy: the active indicator, the track, and the stop
    // indicator at the end, in primary, secondary container and primary.
    it("draws the three parts in the page's roles", () => {
      const { bar } = setup()
      const { active, stop, track } = linearPartsOf(bar)

      expect(hasClasses(active, CLASSES.active)).toBe(true)
      expect(hasClasses(track, CLASSES.track)).toBe(true)
      expect(hasClasses(stop, CLASSES.active)).toBe(true)
    })

    // The page's measurements: 4dp thick, with 4dp between the parts and a
    // 4dp stop indicator.
    it("is 4 thick with the page's 4 between its parts", () => {
      const { bar } = setup()
      const { row, stop } = linearPartsOf(bar)

      expect(row.getBoundingClientRect().height).toBe(4)
      expect(getComputedStyle(row).columnGap).toBe('4px')
      expect(stop.getBoundingClientRect().width).toBe(4)
      expect(stop.getBoundingClientRect().height).toBe(4)
    })

    it("gives the active indicator the value's share of the row", () => {
      const { bar } = setup({ value: 25 })
      const { active, row } = linearPartsOf(bar)
      const width = row.getBoundingClientRect().width

      expect(active.getBoundingClientRect().width).toBeCloseTo(width * 0.25, 0)
    })

    it('leaves the track what the value has not taken', () => {
      const full = setup({ value: 100 })
      expect(
        linearPartsOf(full.bar).track.getBoundingClientRect().width,
      ).toBeCloseTo(0, 0)
      full.unmount()

      const empty = setup({ value: 0 })
      const { active, row, track } = linearPartsOf(empty.bar)
      expect(active.getBoundingClientRect().width).toBe(0)
      // The row's width, less the stop indicator and the two gaps.
      expect(track.getBoundingClientRect().width).toBeCloseTo(
        row.getBoundingClientRect().width - 4 - 8,
        0,
      )
    })
  })

  describe('circular', () => {
    it("draws a 40 ring with two arcs in the page's roles", () => {
      const { bar } = setup({ variant: 'circular' })
      const { active, svg, track } = arcsOf(bar)

      expect(svg.getBoundingClientRect().width).toBe(40)
      expect(svg.getBoundingClientRect().height).toBe(40)
      expect(active.getAttribute('stroke-width')).toBe('4')
      expect(hasClasses(active, CLASSES.activeArc)).toBe(true)
      expect(hasClasses(track, CLASSES.trackArc)).toBe(true)
    })

    // The arcs are cut from one circle: the active one runs from the top for
    // the value's share, and the track picks up 4 past it.
    it("cuts the arcs to the value, with the page's gap between them", () => {
      const { bar } = setup({ value: 50, variant: 'circular' })
      const { active, track } = arcsOf(bar)
      const circumference = 2 * Math.PI * 18
      const half = circumference / 2

      expect(
        Number.parseFloat(active.getAttribute('stroke-dasharray') ?? ''),
      ).toBeCloseTo(half, 1)
      expect(
        Number.parseFloat(track.getAttribute('stroke-dasharray') ?? ''),
      ).toBeCloseTo(circumference - half - 8, 1)
      expect(
        Number.parseFloat(track.getAttribute('stroke-dashoffset') ?? ''),
      ).toBeCloseTo(-(half + 4), 1)
    })

    // Indeterminate, the ring is one arc that grows and shrinks while its
    // start travels the circle, with the whole thing turning — Material's
    // three composed effects, on the same circle the determinate ring uses.
    it('composes the three effects while indeterminate', () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" variant="circular" />,
      )
      const bar = view.getByRole('progressbar', { name: 'Label' })
      const svg = bar.querySelector('svg')
      const arc = svg?.firstElementChild
      if (!(svg instanceof SVGElement) || !(arc instanceof SVGElement)) {
        throw new Error('expected the ring to draw one arc')
      }

      // One arc, not the determinate pair.
      expect(svg.children).toHaveLength(1)
      // The dash lengths are percentages of a path normalised to 100.
      expect(arc.getAttribute('pathLength')).toBe('100')
      // Material's own timings: the arc, four of them to a cycle, and the
      // rotation scaled by 360/306.
      expect(getComputedStyle(arc).animationDuration).toBe('1.333s, 5.332s')
      expect(getComputedStyle(svg).animationDuration).toBe('1.568s')
    })
  })

  describe('buffer', () => {
    // Material Web's buffer: the track is solid up to it and dotted beyond,
    // and the dots scroll by one pitch of their pattern.
    it('splits the track at the buffer and dots the rest', () => {
      const { bar } = setup({ buffer: 70, value: 20 })
      const { track } = linearPartsOf(bar)
      const [solid, dots] = [...track.children]
      if (!(solid instanceof HTMLElement) || !(dots instanceof HTMLElement)) {
        throw new Error('expected the track to hold the buffer and the dots')
      }

      // 70 of the way along, with 20 already taken, is five eighths of the
      // track that is left.
      const width = track.getBoundingClientRect().width
      expect(solid.getBoundingClientRect().width).toBeCloseTo(width * 0.625, 0)
      expect(dots.getBoundingClientRect().width).toBeCloseTo(width * 0.375, 0)
      expect(getComputedStyle(dots).animationName).not.toBe('none')
    })

    it('leaves the track solid without one', () => {
      const { bar } = setup()
      const { track } = linearPartsOf(bar)
      expect(track.children).toHaveLength(0)
      expect(hasClasses(track, CLASSES.track)).toBe(true)
    })

    it('ignores a buffer while indeterminate', () => {
      const view = render(
        <ProgressIndicator buffer={70} isIndeterminate label="Label" />,
      )
      const bar = view.getByRole('progressbar', { name: 'Label' })
      expect(bar.querySelectorAll('[class]')).not.toHaveLength(0)
      expect(bar.textContent).toBe('Label')
    })
  })

  describe('motion', () => {
    // Material Web's indeterminate line is two bars, each translated and
    // scaled at once over 2s; a determinate one only moves when its value
    // does.
    it('animates only while indeterminate', () => {
      const still = setup()
      expect(
        getComputedStyle(linearPartsOf(still.bar).active).animationName,
      ).toBe('none')
      still.unmount()

      const moving = render(<ProgressIndicator isIndeterminate label="Label" />)
      const row = moving.getByRole('progressbar', {
        name: 'Label',
      }).lastElementChild
      const [, primary, secondary] = [...(row?.children ?? [])]
      if (
        !(primary instanceof HTMLElement) ||
        !(secondary instanceof HTMLElement)
      ) {
        throw new Error('expected the two bars')
      }

      for (const bar of [primary, secondary]) {
        expect(getComputedStyle(bar).animationName).not.toBe('none')
        expect(getComputedStyle(bar).animationDuration).toBe('2s')
        const inner = bar.firstElementChild
        if (!(inner instanceof HTMLElement)) {
          throw new Error('expected each bar to hold its inner bar')
        }
        expect(getComputedStyle(inner).animationName).not.toBe('none')
      }
    })
  })
})
