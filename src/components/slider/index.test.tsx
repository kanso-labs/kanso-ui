import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Slider from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  active: { backgroundColor: colors.primary },
  disabledActive: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  inactive: { backgroundColor: colors.secondaryContainer },
  indicator: { backgroundColor: colors.inverseSurface },
  stop: { backgroundColor: colors.onSecondaryContainer },
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
  disabledActive: classesOf(stylex.props(probeStyles.disabledActive)),
  inactive: classesOf(stylex.props(probeStyles.inactive)),
  indicator: classesOf(stylex.props(probeStyles.indicator)),
  stop: classesOf(stylex.props(probeStyles.stop)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// Hoisted so each is one stable array per render rather than a fresh one,
// which is what react-perf's no-new-array-as-prop is after.
const RANGE = [20, 60]
const THUMB_LABELS = ['Start', 'End']

/**
 * The track's parts, in order, and the handle around `input`. React Aria
 * wraps the range input in a visually hidden element inside the handle.
 */
function partsOf(input: HTMLElement) {
  const thumb = input.parentElement?.parentElement
  const track = thumb?.parentElement
  if (!(thumb instanceof HTMLElement) || !(track instanceof HTMLElement)) {
    throw new Error('expected the input to sit in a handle on the track')
  }
  const segments = [...track.children].filter(
    (child) => child.tagName === 'SPAN' && !child.contains(input),
  )
  return { segments, thumb, track }
}

function setup(props: Partial<Parameters<typeof Slider>[0]> = {}) {
  const view = render(<Slider defaultValue={40} label="Label" {...props} />)
  return {
    ...view,
    input: view.getByRole('slider', { name: 'Label' }),
  }
}

describe('slider', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself.
    it('renders a slider named by its label', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('type')).toBe('range')
    })

    // React Aria names a handle by its own label and then the slider's, so
    // the first handle here is "Start Label".
    it('names each handle of a range', () => {
      const view = render(
        <Slider
          defaultValue={RANGE}
          label="Label"
          thumbLabels={THUMB_LABELS}
        />,
      )
      expect(view.getByRole('slider', { name: /^Start/ })).toHaveProperty(
        'value',
        '20',
      )
      expect(view.getByRole('slider', { name: /^End/ })).toHaveProperty(
        'value',
        '60',
      )
    })

    it('runs along the block axis when vertical', () => {
      const { input } = setup({ orientation: 'vertical' })
      expect(input.getAttribute('aria-orientation')).toBe('vertical')
    })
  })

  describe('value', () => {
    it('keeps its own value when uncontrolled and moves it a step at a time', () => {
      const { input } = setup({ step: 5 })
      expect(input).toHaveProperty('value', '40')
      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(input).toHaveProperty('value', '45')
      fireEvent.keyDown(input, { key: 'End' })
      expect(input).toHaveProperty('value', '100')
    })

    // Controlled means the call site owns the value: a key reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(value: number | number[]) => void>()
      const { input } = setup({ onChange, value: 40 })
      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(onChange).toHaveBeenCalledWith(41)
      expect(input).toHaveProperty('value', '40')
    })

    it('keeps the handles of a range in order', () => {
      const view = render(
        <Slider
          defaultValue={RANGE}
          label="Label"
          thumbLabels={THUMB_LABELS}
        />,
      )
      const start = view.getByRole('slider', { name: /^Start/ })
      for (let step = 0; step < 50; step += 1) {
        fireEvent.keyDown(start, { key: 'ArrowRight' })
      }
      expect(start).toHaveProperty('value', '60')
    })

    it('is disabled through the input', () => {
      const { input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
    })
  })

  // Every state is a class chosen from React Aria's render state rather than
  // a selector, so each is pinned to the role it reaches for.
  describe('appearance', () => {
    it('draws the active part in primary and the inactive part in secondary container, with the stop', () => {
      const { input } = setup()
      const { segments } = partsOf(input)
      expect(segments).toHaveLength(2)
      expect(hasClasses(segments[0], CLASSES.active)).toBe(true)
      expect(hasClasses(segments[1], CLASSES.inactive)).toBe(true)
      expect(hasClasses(segments[1].firstElementChild!, CLASSES.stop)).toBe(
        true,
      )
    })

    it('draws a range as an inactive part on each side of the active one', () => {
      const view = render(
        <Slider
          defaultValue={RANGE}
          label="Label"
          thumbLabels={THUMB_LABELS}
        />,
      )
      const { segments } = partsOf(view.getByRole('slider', { name: /^Start/ }))
      expect(segments).toHaveLength(3)
      expect(hasClasses(segments[0], CLASSES.inactive)).toBe(true)
      expect(hasClasses(segments[1], CLASSES.active)).toBe(true)
      expect(hasClasses(segments[2], CLASSES.inactive)).toBe(true)
    })

    it('dims the parts while disabled', () => {
      const { input } = setup({ isDisabled: true })
      const { segments } = partsOf(input)
      expect(hasClasses(segments[0], CLASSES.disabledActive)).toBe(true)
    })

    // The indicator is the page's value label, and React Aria's output, so
    // what it shows is what the slider announces. Keyboard focus is what
    // brings it up here: React Aria treats focus as visible once a key has
    // been pressed anywhere on the page.
    it('shows the value over the handle while it has keyboard focus', () => {
      const { input, queryByRole } = setup()
      expect(queryByRole('status')).toBeNull()

      fireEvent.keyDown(document.body, { key: 'Tab' })
      act(() => {
        input.focus()
      })
      const output = document.querySelector('output')
      expect(output).not.toBeNull()
      expect(output?.textContent).toBe('40')
      expect(hasClasses(output!, CLASSES.indicator)).toBe(true)
    })
  })

  describe('measurements', () => {
    it("draws a 16 track in the handle's 44, with the parts 8 clear of the handle's centre", () => {
      const { input } = setup()
      const { segments, thumb, track } = partsOf(input)
      const active = segments[0].getBoundingClientRect()
      const inactive = segments[1].getBoundingClientRect()
      const centre =
        thumb.getBoundingClientRect().x +
        thumb.getBoundingClientRect().width / 2

      expect(getComputedStyle(track).height).toBe('44px')
      expect(active.height).toBe(16)
      expect(getComputedStyle(thumb).width).toBe('4px')
      expect(getComputedStyle(thumb).height).toBe('44px')
      expect(centre - active.right).toBeCloseTo(8, 0)
      expect(inactive.left - centre).toBeCloseTo(8, 0)
    })
  })
})
