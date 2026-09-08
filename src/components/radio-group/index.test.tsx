import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RadioGroup, { Radio } from '.'
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
  disabledTone: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  errorText: { color: colors.error },
  hoverLayer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  restingTone: { color: colors.onSurfaceVariant },
  selectedTone: { color: colors.primary },
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
  disabledTone: classesOf(stylex.props(probeStyles.disabledTone)),
  errorText: classesOf(stylex.props(probeStyles.errorText)),
  hoverLayer: classesOf(stylex.props(probeStyles.hoverLayer)),
  restingTone: classesOf(stylex.props(probeStyles.restingTone)),
  selectedTone: classesOf(stylex.props(probeStyles.selectedTone)),
}

/**
 * The 40dp control around the ring. React Aria wraps the input in a visually
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

/** The 20dp ring inside the control. */
function ringOf(input: HTMLElement) {
  const ring = controlOf(input).firstElementChild
  if (!(ring instanceof HTMLElement)) {
    throw new Error('expected the control to hold the ring')
  }
  return ring
}

function setup(props: Partial<Parameters<typeof RadioGroup>[0]> = {}) {
  const view = render(
    <RadioGroup label="Label" {...props}>
      <Radio value="first">First item</Radio>
      <Radio description="Supporting line" value="second">
        Second item
      </Radio>
      <Radio value="third">Third item</Radio>
    </RadioGroup>,
  )
  return {
    ...view,
    first: view.getByRole('radio', { name: 'First item' }),
    group: view.getByRole('radiogroup', { name: 'Label' }),
    second: view.getByRole('radio', { name: 'Second item' }),
    third: view.getByRole('radio', { name: 'Third item' }),
  }
}

describe('radio group', () => {
  describe('semantics', () => {
    // The roles are the reason this wraps React Aria rather than stacking
    // inputs in a div: a radio group is introduced by its name before its
    // options are read, and each option is a radio of that group.
    it('renders a radio group of radios, named by their labels', () => {
      const { first, group } = setup()
      expect(group.getAttribute('role')).toBe('radiogroup')
      expect(first.getAttribute('type')).toBe('radio')
    })

    it('describes the group with its description', () => {
      const view = setup({ description: 'Group line' })
      expect(view.group.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Group line').id,
      )
    })

    it('describes an option with its own description', () => {
      const view = setup()
      expect(
        view.second.getAttribute('aria-describedby')?.split(' '),
      ).toContain(view.getByText('Supporting line').id)
    })

    // Unlike a checkbox group, a radio group is one control with one value,
    // so the invalid mark and the message both land on the group.
    it('marks the group invalid and describes it with the error', () => {
      const view = setup({ error: 'Choose one.' })
      expect(view.group.getAttribute('aria-invalid')).toBe('true')
      expect(view.group.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Choose one.').id,
      )
      expect(hasClasses(view.getByText('Choose one.'), CLASSES.errorText)).toBe(
        true,
      )
    })

    it('lays the options along a line when horizontal', () => {
      const { first, group, second } = setup({ orientation: 'horizontal' })
      expect(group.getAttribute('aria-orientation')).toBe('horizontal')
      expect(first.getBoundingClientRect().top).toBeCloseTo(
        second.getBoundingClientRect().top,
        0,
      )
    })
  })

  describe('selection', () => {
    it('keeps its own value when uncontrolled, one option at a time', () => {
      const { first, second } = setup({ defaultValue: 'first' })
      expect(first).toHaveProperty('checked', true)

      fireEvent.click(second)
      expect(second).toHaveProperty('checked', true)
      expect(first).toHaveProperty('checked', false)
    })

    // Controlled means the call site owns the value: a click reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(value: string) => void>()
      const { first, second } = setup({ onChange, value: 'first' })
      fireEvent.click(second)
      expect(onChange).toHaveBeenCalledWith('second')
      expect(first).toHaveProperty('checked', true)
      expect(second).toHaveProperty('checked', false)
    })

    // Arrow keys are React Aria's rather than the browser's, so a key event
    // reaches them: the selection follows focus to the next option.
    it('moves the selection with the arrow keys', () => {
      const { first, second } = setup({ defaultValue: 'first' })
      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'ArrowDown' })
      expect(second).toHaveProperty('checked', true)
      expect(document.activeElement).toBe(second)
    })

    it('disables every option from the group', () => {
      const { first, second } = setup({ isDisabled: true })
      expect(first).toHaveProperty('disabled', true)
      expect(second).toHaveProperty('disabled', true)
    })

    it('holds the selection still while read-only', () => {
      const { first, second } = setup({
        defaultValue: 'first',
        isReadOnly: true,
      })
      fireEvent.click(second)
      expect(first).toHaveProperty('checked', true)
    })
  })

  // Every state is a class chosen from React Aria's render state rather than
  // a selector, so each is pinned to the role it reaches for.
  describe('appearance', () => {
    it('draws an unselected ring in on surface variant, with no dot', () => {
      const { first } = setup()
      expect(hasClasses(controlOf(first), CLASSES.restingTone)).toBe(true)
      expect(ringOf(first).childElementCount).toBe(0)
    })

    it('draws a selected ring and its dot in primary', () => {
      const { first } = setup({ defaultValue: 'first' })
      expect(hasClasses(controlOf(first), CLASSES.selectedTone)).toBe(true)
      expect(ringOf(first).childElementCount).toBe(1)
    })

    it('moves the dot when the selection changes', () => {
      const { first, second } = setup({ defaultValue: 'first' })
      fireEvent.click(second)
      expect(ringOf(second).childElementCount).toBe(1)
      expect(ringOf(first).childElementCount).toBe(0)
    })

    it('dims the ring and the label while disabled', () => {
      const view = setup({ isDisabled: true })
      expect(hasClasses(controlOf(view.first), CLASSES.disabledTone)).toBe(true)
      expect(
        hasClasses(view.getByText('First item'), CLASSES.disabledLabel),
      ).toBe(true)
    })

    // React derives `onPointerEnter` from the bubbling `pointerover`, which
    // is what React Aria's hover tracking listens for.
    it('lays the on surface state layer over the control while hovered', () => {
      const { first } = setup()
      const control = controlOf(first)
      act(() => {
        fireEvent.pointerOver(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(true)

      act(() => {
        fireEvent.pointerOut(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)
    })
  })

  describe('measurements', () => {
    it('draws a 20 ring with a 2dp rule and a 10 dot inside a 40 state layer', () => {
      const { first } = setup({ defaultValue: 'first' })
      const control = getComputedStyle(controlOf(first))
      const ring = getComputedStyle(ringOf(first))
      const dot = ringOf(first).firstElementChild
      expect(control.width).toBe('40px')
      expect(control.height).toBe('40px')
      expect(ring.width).toBe('20px')
      expect(ring.height).toBe('20px')
      expect(ring.borderTopWidth).toBe('2px')
      expect(dot instanceof HTMLElement && getComputedStyle(dot).width).toBe(
        '10px',
      )
    })
  })
})
