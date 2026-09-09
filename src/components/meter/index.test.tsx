import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Meter from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  active: { backgroundColor: colors.primary },
  negative: { backgroundColor: colors.negative },
  positive: { backgroundColor: colors.positive },
  track: { backgroundColor: colors.secondaryContainer },
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
  negative: classesOf(stylex.props(probeStyles.negative)),
  positive: classesOf(stylex.props(probeStyles.positive)),
  track: classesOf(stylex.props(probeStyles.track)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The three parts of the line, in the order the page draws them. */
function partsOf(meter: HTMLElement) {
  const row = meter.lastElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the meter to draw a row')
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

function setup(props: Partial<Parameters<typeof Meter>[0]> = {}) {
  const view = render(<Meter label="Label" value={40} {...props} />)
  return { ...view, meter: view.getByRole('meter', { name: 'Label' }) }
}

describe('meter', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the meter this way is the label association itself.
    it('renders a meter named by its label', () => {
      const { meter } = setup()
      expect(meter.getAttribute('aria-valuenow')).toBe('40')
      expect(meter.getAttribute('aria-valuemin')).toBe('0')
      expect(meter.getAttribute('aria-valuemax')).toBe('100')
    })

    // The role is the whole difference between this and ProgressIndicator:
    // one says how full something is, the other how far along it is.
    it('is a meter rather than a progress bar', () => {
      const view = setup()
      expect(view.queryByRole('progressbar')).toBeNull()
    })

    it('takes a name from aria-label instead', () => {
      const view = render(<Meter aria-label="Storage" value={40} />)
      expect(view.getByRole('meter', { name: 'Storage' })).not.toBeNull()
    })

    it('reads the value on the range it is given', () => {
      const { meter } = setup({ maxValue: 5, minValue: 1, value: 4 })
      expect(meter.getAttribute('aria-valuenow')).toBe('4')
      expect(meter.getAttribute('aria-valuemin')).toBe('1')
      expect(meter.getAttribute('aria-valuemax')).toBe('5')
    })
  })

  describe('value', () => {
    // A meter is the number, so it is shown without being asked for —
    // the opposite default from ProgressIndicator's.
    it('shows the value beside the label', () => {
      const view = setup()
      expect(view.getByText('40%')).not.toBeNull()
    })

    it('hides the value when asked', () => {
      const view = setup({ showValue: false })
      expect(view.queryByText('40%')).toBeNull()
      expect(view.getByText('Label')).not.toBeNull()
    })

    it('formats the value the way it is told', () => {
      const view = setup({
        formatOptions: { style: 'unit', unit: 'gigabyte' },
        maxValue: 512,
        value: 318,
      })
      expect(view.getByText(/318/)).not.toBeNull()
    })

    it('draws no label row when there is neither a label nor a value', () => {
      const view = render(
        <Meter aria-label="Storage" showValue={false} value={40} />,
      )
      const meter = view.getByRole('meter', { name: 'Storage' })
      expect(meter.children).toHaveLength(1)
    })
  })

  describe('appearance', () => {
    it('draws the parts in the page colour roles', () => {
      const { meter } = setup()
      const { active, stop, track } = partsOf(meter)
      expect(hasClasses(active, CLASSES.active)).toBe(true)
      expect(hasClasses(stop, CLASSES.active)).toBe(true)
      expect(hasClasses(track, CLASSES.track)).toBe(true)
    })

    // A tone recolours the two indicator parts and leaves the track, so a
    // column of meters still reads as one scale.
    it('recolours the indicator alone for a tone', () => {
      const { meter } = setup({ tone: 'negative' })
      const { active, stop, track } = partsOf(meter)
      expect(hasClasses(active, CLASSES.negative)).toBe(true)
      expect(hasClasses(stop, CLASSES.negative)).toBe(true)
      expect(hasClasses(track, CLASSES.track)).toBe(true)
      expect(hasClasses(active, CLASSES.active)).toBe(false)
    })

    it('draws a positive tone in the positive role', () => {
      const { meter } = setup({ tone: 'positive' })
      expect(hasClasses(partsOf(meter).active, CLASSES.positive)).toBe(true)
    })
  })

  describe('geometry', () => {
    // The page draws the line at 4dp with 4dp between the parts, and the
    // stop indicator as a 4dp dot at the end.
    it('draws the page line thickness, gap and stop', () => {
      const { meter } = setup()
      const { row, stop } = partsOf(meter)
      const style = getComputedStyle(row)

      expect(style.blockSize).toBe('4px')
      expect(style.columnGap).toBe('4px')
      expect(stop.getBoundingClientRect().width).toBe(4)
    })

    // The active indicator and the track share the line: whatever the value
    // does not take, the track does.
    it('gives the track what the active indicator leaves', () => {
      const { meter } = setup({ value: 25 })
      const { active, row, track } = partsOf(meter)
      const room = row.getBoundingClientRect().width
      const activeWidth = active.getBoundingClientRect().width

      expect(activeWidth).toBeCloseTo(room * 0.25, 0)
      // Two 4dp gaps and the 4dp stop sit between them.
      expect(track.getBoundingClientRect().width).toBeCloseTo(
        room - activeWidth - 4 * 3,
        0,
      )
    })
  })
})
