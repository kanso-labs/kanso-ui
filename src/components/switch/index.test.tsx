import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Switch from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each state reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabledLabel: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  disabledTrack: {
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  handleOff: { backgroundColor: colors.outline },
  handleOn: { backgroundColor: colors.onPrimary },
  hoverLayer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  trackOff: { backgroundColor: colors.surfaceContainerHighest },
  trackOn: { backgroundColor: colors.primary },
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
  disabledLabel: classesOf(stylex.props(probeStyles.disabledLabel)),
  disabledTrack: classesOf(stylex.props(probeStyles.disabledTrack)),
  handleOff: classesOf(stylex.props(probeStyles.handleOff)),
  handleOn: classesOf(stylex.props(probeStyles.handleOn)),
  hoverLayer: classesOf(stylex.props(probeStyles.hoverLayer)),
  trackOff: classesOf(stylex.props(probeStyles.trackOff)),
  trackOn: classesOf(stylex.props(probeStyles.trackOn)),
}

/**
 * The control around the track. React Aria wraps the input in a visually
 * hidden element, and the control is what follows it in the label.
 */
function controlOf(input: HTMLElement) {
  const control = input.parentElement?.nextElementSibling
  if (!(control instanceof HTMLElement)) {
    throw new Error('expected the control to follow the input')
  }
  return control
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The track, the seat the handle travels in, the state layer and the handle. */
function partsOf(input: HTMLElement) {
  const track = controlOf(input).firstElementChild
  const seat = track?.firstElementChild
  const layer = seat?.firstElementChild
  const handle = seat?.lastElementChild
  if (
    !(track instanceof HTMLElement) ||
    !(seat instanceof HTMLElement) ||
    !(layer instanceof HTMLElement) ||
    !(handle instanceof HTMLElement)
  ) {
    throw new Error(
      'expected the track to hold the seat, the layer and the handle',
    )
  }
  return { handle, layer, seat, track }
}

function setup(props: Partial<Parameters<typeof Switch>[0]> = {}) {
  const view = render(<Switch {...props}>Label</Switch>)
  return {
    ...view,
    input: view.getByRole('switch', { name: 'Label' }),
  }
}

describe('switch', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself, and the role is
    // what separates a switch from a checkbox to a screen reader.
    it('renders a switch named by its label', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('role')).toBe('switch')
    })

    it('describes the switch with its description', () => {
      const view = render(<Switch description="Supporting line">Label</Switch>)
      const input = view.getByRole('switch')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    it('marks the switch invalid and describes it with the error', () => {
      const view = render(<Switch error="Turn this on.">Label</Switch>)
      const input = view.getByRole('switch')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Turn this on.').id,
      )
    })

    it('has no accessible name of its own without a label', () => {
      const view = render(<Switch aria-label="Label" />)
      expect(view.getByRole('switch', { name: 'Label' })).not.toBeNull()
      expect(view.container.querySelector('label')?.textContent).toBe('')
    })
  })

  describe('state', () => {
    it('keeps its own state when uncontrolled', () => {
      const { input } = setup()
      expect(input).toHaveProperty('checked', false)
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })

    it('starts on when told to', () => {
      const { input } = setup({ defaultSelected: true })
      expect(input).toHaveProperty('checked', true)
    })

    // Controlled means the call site owns the state: a click reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(selected: boolean) => void>()
      const { input } = setup({ isSelected: false, onChange })
      fireEvent.click(input)
      expect(onChange).toHaveBeenCalledWith(true)
      expect(input).toHaveProperty('checked', false)
    })

    it('is disabled through the input', () => {
      const { input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
    })

    it('does not change while read-only', () => {
      const { input } = setup({ defaultSelected: true, isReadOnly: true })
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })
  })

  // Every state is a class chosen from React Aria's render state rather than
  // a selector, so each is pinned to the role it reaches for.
  describe('appearance', () => {
    it('draws an off switch as an outlined track with a small handle', () => {
      const { input } = setup()
      const { handle, track } = partsOf(input)
      expect(hasClasses(track, CLASSES.trackOff)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleOff)).toBe(true)
      expect(getComputedStyle(handle).width).toBe('16px')
    })

    it('draws an on switch as a primary track with a larger handle', () => {
      const { input } = setup({ defaultSelected: true })
      const { handle, track } = partsOf(input)
      expect(hasClasses(track, CLASSES.trackOn)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleOn)).toBe(true)
      expect(getComputedStyle(handle).width).toBe('24px')
    })

    it('moves the handle to the other end when flipped', () => {
      const { input } = setup()
      const { seat } = partsOf(input)
      const before = getComputedStyle(seat).insetInlineStart
      fireEvent.click(input)
      // The travel is a transition, and a computed value read while it runs
      // is partway along it, so the animations are finished first.
      for (const animation of seat.getAnimations()) {
        animation.finish()
      }
      expect(getComputedStyle(seat).insetInlineStart).not.toBe(before)
      expect(getComputedStyle(seat).insetInlineStart).toBe('22px')
    })

    it('draws the check in the handle only while on and asked for', () => {
      const off = setup({ icon: true })
      expect(partsOf(off.input).handle.querySelector('svg')).toBeNull()
      off.unmount()

      const on = setup({ defaultSelected: true, icon: true })
      expect(partsOf(on.input).handle.querySelector('svg')).not.toBeNull()
      on.unmount()

      const plain = setup({ defaultSelected: true })
      expect(partsOf(plain.input).handle.querySelector('svg')).toBeNull()
    })

    it('dims the track and the label while disabled', () => {
      const view = render(<Switch isDisabled>Label</Switch>)
      const input = view.getByRole('switch')
      expect(hasClasses(partsOf(input).track, CLASSES.disabledTrack)).toBe(true)
      expect(hasClasses(view.getByText('Label'), CLASSES.disabledLabel)).toBe(
        true,
      )
    })

    // React derives `onPointerEnter` from the bubbling `pointerover`, which
    // is what React Aria's hover tracking listens for.
    it('lays the on surface state layer over the handle while hovered', () => {
      const { input } = setup()
      const { layer } = partsOf(input)
      act(() => {
        fireEvent.pointerOver(layer, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(true)

      act(() => {
        fireEvent.pointerOut(layer, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(false)
    })
  })

  describe('measurements', () => {
    it('draws a 52 by 32 track with a 2dp rule and a 40 state layer', () => {
      const { input } = setup()
      const { layer, track } = partsOf(input)
      const trackStyle = getComputedStyle(track)
      expect(trackStyle.width).toBe('52px')
      expect(trackStyle.height).toBe('32px')
      expect(trackStyle.borderTopWidth).toBe('2px')
      expect(getComputedStyle(layer).width).toBe('40px')
    })
  })
})
