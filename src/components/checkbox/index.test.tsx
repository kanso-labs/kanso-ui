import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Checkbox from '.'
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
  disabledRule: {
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  errorFill: { backgroundColor: colors.error },
  errorRule: { borderColor: colors.error },
  hoverLayer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  markedFill: { backgroundColor: colors.primary },
  restingRule: { borderColor: colors.onSurfaceVariant },
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
  disabledRule: classesOf(stylex.props(probeStyles.disabledRule)),
  errorFill: classesOf(stylex.props(probeStyles.errorFill)),
  errorRule: classesOf(stylex.props(probeStyles.errorRule)),
  hoverLayer: classesOf(stylex.props(probeStyles.hoverLayer)),
  markedFill: classesOf(stylex.props(probeStyles.markedFill)),
  restingRule: classesOf(stylex.props(probeStyles.restingRule)),
}

/** The 18dp box inside the control. */
function boxOf(input: HTMLElement) {
  const box = controlOf(input).firstElementChild
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the control to hold the box')
  }
  return box
}

/**
 * The 40dp control around the box. React Aria wraps the input in a visually
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

function setup(props: Partial<Parameters<typeof Checkbox>[0]> = {}) {
  const view = render(<Checkbox {...props}>Label</Checkbox>)
  return {
    ...view,
    input: view.getByRole('checkbox', { name: 'Label' }),
  }
}

describe('checkbox', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself.
    it('renders a checkbox named by its label', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('type')).toBe('checkbox')
    })

    it('describes the checkbox with its description', () => {
      const view = render(
        <Checkbox description="Supporting line">Label</Checkbox>,
      )
      const input = view.getByRole('checkbox')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    it('marks the checkbox invalid and describes it with the error', () => {
      const view = render(<Checkbox error="Choose one.">Label</Checkbox>)
      const input = view.getByRole('checkbox')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Choose one.').id,
      )
    })

    // The description and the error occupy the same line, so showing both
    // would move the checkbox's neighbours as an error appears and clears.
    it('replaces the description with the error rather than stacking them', () => {
      const view = render(
        <Checkbox description="Supporting line" error="Choose one.">
          Label
        </Checkbox>,
      )
      expect(view.queryByText('Supporting line')).toBeNull()
      expect(view.getByText('Choose one.')).not.toBeNull()
    })

    it('has no accessible name of its own without a label', () => {
      const view = render(<Checkbox aria-label="Label" />)
      expect(view.getByRole('checkbox', { name: 'Label' })).not.toBeNull()
      expect(view.container.querySelector('label')?.textContent).toBe('')
    })
  })

  describe('selection', () => {
    it('keeps its own state when uncontrolled', () => {
      const { input } = setup()
      expect(input).toHaveProperty('checked', false)
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })

    it('starts selected when told to', () => {
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

    it('stands for a partly selected set while indeterminate', () => {
      const { input } = setup({ isIndeterminate: true })
      expect(input).toHaveProperty('indeterminate', true)
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
    it('draws an unselected box as a rule in on surface variant', () => {
      const { input } = setup()
      const box = boxOf(input)
      expect(hasClasses(box, CLASSES.restingRule)).toBe(true)
      expect(hasClasses(box, CLASSES.markedFill)).toBe(false)
      expect(box.querySelector('svg')).toBeNull()
    })

    it('fills a selected box with primary and draws the check', () => {
      const { input } = setup({ defaultSelected: true })
      const box = boxOf(input)
      expect(hasClasses(box, CLASSES.markedFill)).toBe(true)
      expect(box.querySelector('svg')).not.toBeNull()
    })

    it('fills an indeterminate box the same way, with the dash', () => {
      const { input } = setup({ isIndeterminate: true })
      const box = boxOf(input)
      expect(hasClasses(box, CLASSES.markedFill)).toBe(true)
      expect(box.querySelector('svg path')?.getAttribute('d')).toBe(
        'M19 13H5v-2h14v2z',
      )
    })

    it('moves to the filled box when clicked', () => {
      const { input } = setup()
      fireEvent.click(input)
      expect(hasClasses(boxOf(input), CLASSES.markedFill)).toBe(true)
    })

    it('takes the error pair while invalid', () => {
      const unselected = setup({ error: 'Choose one.' })
      expect(hasClasses(boxOf(unselected.input), CLASSES.errorRule)).toBe(true)
      unselected.unmount()

      const selected = setup({ defaultSelected: true, error: 'Choose one.' })
      expect(hasClasses(boxOf(selected.input), CLASSES.errorFill)).toBe(true)
    })

    it('dims the rule and the label while disabled', () => {
      const view = render(<Checkbox isDisabled>Label</Checkbox>)
      const input = view.getByRole('checkbox')
      expect(hasClasses(boxOf(input), CLASSES.disabledRule)).toBe(true)
      expect(hasClasses(view.getByText('Label'), CLASSES.disabledLabel)).toBe(
        true,
      )
    })

    // React derives `onPointerEnter` from the bubbling `pointerover`, which
    // is what React Aria's hover tracking listens for.
    it('lays the on surface state layer over the control while hovered', () => {
      const { input } = setup()
      const control = controlOf(input)
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)

      act(() => {
        fireEvent.pointerOver(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(true)

      act(() => {
        fireEvent.pointerOut(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)
    })

    it('shows no state layer while disabled', () => {
      const { input } = setup({ isDisabled: true })
      const control = controlOf(input)
      act(() => {
        fireEvent.pointerOver(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)
    })
  })

  describe('measurements', () => {
    it('draws an 18 box inside a 40 state layer', () => {
      const { input } = setup()
      const control = getComputedStyle(controlOf(input))
      const box = getComputedStyle(boxOf(input))
      expect(control.width).toBe('40px')
      expect(control.height).toBe('40px')
      expect(box.width).toBe('18px')
      expect(box.height).toBe('18px')
      expect(box.borderTopLeftRadius).toBe('2px')
      expect(box.borderTopWidth).toBe('2px')
    })
  })
})
