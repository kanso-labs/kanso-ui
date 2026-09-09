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

/**
 * A drag across the seat, in device pixels from where it was grabbed. The
 * pointer events go to the seat, which is what carries the drag; a real
 * pointer would be captured by it, and a synthetic one is dispatched there
 * directly. `release` is left to the caller so a test can read the handle
 * mid-drag.
 */
function dragBy(seat: HTMLElement, distance: number) {
  fireEvent.pointerDown(seat, { button: 0, clientX: 100, pointerId: 1 })
  fireEvent.pointerMove(seat, { clientX: 100 + distance, pointerId: 1 })
  return {
    release: () => {
      fireEvent.pointerUp(seat, { clientX: 100 + distance, pointerId: 1 })
      // The label's own click is what flips the switch, and a drag decides
      // whether to let it through — so the click has to be sent too.
      fireEvent.click(seat)
    },
  }
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

/** Finishes the seat's travel, so a computed inset is where it came to rest. */
function settled(seat: HTMLElement) {
  for (const animation of seat.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(seat).insetInlineStart
}

function setup(props: Partial<Parameters<typeof Switch>[0]> = {}) {
  const view = render(<Switch {...props}>Label</Switch>)
  return {
    ...view,
    input: view.getByRole('switch', { name: 'Label' }),
  }
}

/** Finishes the handle's growth, so a computed size is the settled one. */
function sized(handle: HTMLElement) {
  for (const animation of handle.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(handle).width
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
      expect(getComputedStyle(seat).insetInlineStart).toBe('20px')
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

  describe('drag', () => {
    // The page's pressed switch has the handle following the pointer, and
    // the flip decided by where it is let go rather than by the press.
    it('follows the pointer across the track while dragging', () => {
      const { input } = setup()
      const { seat } = partsOf(input)
      expect(settled(seat)).toBe('0px')

      const drag = dragBy(seat, 12)
      expect(getComputedStyle(seat).insetInlineStart).toBe('12px')

      drag.release()
      expect(input).toHaveProperty('checked', true)
      expect(settled(seat)).toBe('20px')
    })

    it('keeps the handle inside the two ends of the track', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 200)
      expect(getComputedStyle(seat).insetInlineStart).toBe('20px')

      fireEvent.pointerMove(seat, { clientX: -200, pointerId: 1 })
      expect(getComputedStyle(seat).insetInlineStart).toBe('0px')
    })

    it('flips the switch when the handle is let go past the middle', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 11).release()
      expect(input).toHaveProperty('checked', true)
    })

    it('springs back when the handle is let go before the middle', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 9).release()
      expect(input).toHaveProperty('checked', false)
      expect(settled(seat)).toBe('0px')
    })

    it('turns an on switch off by dragging back past the middle', () => {
      const { input } = setup({ defaultSelected: true })
      const { seat } = partsOf(input)
      expect(settled(seat)).toBe('20px')

      dragBy(seat, -11).release()
      expect(input).toHaveProperty('checked', false)
      expect(settled(seat)).toBe('0px')
    })

    it('leaves an on switch on when the handle does not cross back', () => {
      const { input } = setup({ defaultSelected: true })
      const { seat } = partsOf(input)

      dragBy(seat, -9).release()
      expect(input).toHaveProperty('checked', true)
      expect(settled(seat)).toBe('20px')
    })

    // A press that never moves is a tap, which the label flips as it always
    // did — the drag has to keep out of its way.
    it('still flips on a tap that never moves', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      fireEvent.pointerDown(seat, { button: 0, clientX: 100, pointerId: 1 })
      fireEvent.pointerUp(seat, { clientX: 100, pointerId: 1 })
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })

    it('reports a drag on a controlled switch without moving', () => {
      const onChange = vi.fn<(selected: boolean) => void>()
      const { input } = setup({ isSelected: false, onChange })
      const { seat } = partsOf(input)

      dragBy(seat, 15).release()
      expect(onChange).toHaveBeenCalledWith(true)
      expect(input).toHaveProperty('checked', false)
    })

    // The page grows the handle to 28 while it is pressed, and a drag is a
    // press that lasts.
    it('grows the handle while it is being dragged', () => {
      const { input } = setup()
      const { handle, seat } = partsOf(input)
      expect(sized(handle)).toBe('16px')

      dragBy(seat, 8)
      expect(sized(handle)).toBe('28px')
    })

    // React Aria flips the switch from its own press, which ends on the
    // pointer being released wherever the handle has been dragged to — so a
    // drag ends that press before releasing, and settles the switch itself.
    // Synthetic pointer events do not start a React Aria press, so what a
    // browser would show is not reachable here; this pins the cancel, which
    // is the part a browser needs and a reader would otherwise delete.
    it('ends the press before settling, so nothing flips twice', () => {
      const { input } = setup()
      const { seat } = partsOf(input)
      const cancelled = vi.fn<(event: Event) => void>()
      seat.addEventListener('pointercancel', cancelled)

      dragBy(seat, 14).release()
      expect(cancelled).toHaveBeenCalledTimes(1)
      expect(input).toHaveProperty('checked', true)
    })

    it('does not drag while disabled or read-only', () => {
      const disabled = setup({ isDisabled: true })
      dragBy(partsOf(disabled.input).seat, 15).release()
      expect(disabled.input).toHaveProperty('checked', false)
      disabled.unmount()

      const readOnly = setup({ isReadOnly: true })
      dragBy(partsOf(readOnly.input).seat, 15).release()
      expect(readOnly.input).toHaveProperty('checked', false)
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
